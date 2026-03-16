import { NextRequest } from "next/server"
import { createClient } from "@/lib/supabase/server"
import OpenAI from "openai"
import { dispararWebhook } from "@/lib/webhook"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const TOOLS_DEFINITION = [{
  type: "function" as const,
  function: {
    name: "publish_ensaio",
    description: "Publica o ensaio após confirmação do usuário",
    parameters: {
      type: "object",
      properties: {
        titulo:       { type: "string" },
        slug:         { type: "string" },
        categoria:    { type: "string", enum: ["casamento", "newborn", "familia", "gestante", "aniversario", "corporativo", "outro"] },
        descricao:    { type: "string" },
        foto_ids:     { type: "array", items: { type: "string" } },
        capa_foto_id: { type: "string" },
      },
      required: ["titulo", "slug", "categoria", "foto_ids", "capa_foto_id"]
    }
  }
}]

function buildSystemPrompt(c: any) {
  return `Você é o assistente do ${c.nome_studio}.
Guie o fotógrafo para publicar ensaios no site ${c.url_site || "do seu estúdio"}.
Fluxo: título → categoria → descrição (opcional) → upload → capa → confirmar → publicar.
Sempre confirme antes de chamar publish_ensaio. Use emojis com moderação.`
}

async function processToolCall(toolCall: any, cliente: any, supabase: any) {
  try {
    const args = JSON.parse(toolCall.function.arguments)
    
    // Inserir ensaio como publicando
    const { data: ensaio, error: ensaioError } = await supabase
      .from("ensaios")
      .insert({
        cliente_id: cliente.id,
        titulo: args.titulo,
        slug: args.slug,
        categoria: args.categoria,
        descricao: args.descricao,
        status: "publicando",
        total_fotos: args.foto_ids?.length || 0
      })
      .select()
      .single()

    if (ensaioError) throw ensaioError

    // Lógica para marcar capa e associar fotos ao ensaio
    if (args.capa_foto_id) {
      await supabase
        .from("fotos")
        .update({ eh_capa: true })
        .eq("id", args.capa_foto_id)
        .eq("cliente_id", cliente.id)

      const { data: capaFoto } = await supabase
        .from("fotos")
        .select("url_publica")
        .eq("id", args.capa_foto_id)
        .single()
      
      if (capaFoto) {
        await supabase.from("ensaios").update({ capa_url: capaFoto.url_publica }).eq("id", ensaio.id)
      }
    }

    if (args.foto_ids && args.foto_ids.length > 0) {
      await supabase
        .from("fotos")
        .update({ ensaio_id: ensaio.id })
        .in("id", args.foto_ids)
        .eq("cliente_id", cliente.id)
    }

    // Preparar dados do Webhook
    const { data: fotosData } = await supabase
      .from("fotos")
      .select("url_publica, url_thumb, largura, altura, tamanho_bytes, storage_path")
      .in("id", args.foto_ids || [])

    let publicacaoStatus = "publicado"

    if (cliente.webhook_url && cliente.webhook_secret) {
      const payload = {
        evento: "ensaio.publicado",
        ensaio: {
          id: ensaio.id,
          titulo: ensaio.titulo,
          slug: ensaio.slug,
          categoria: ensaio.categoria,
          descricao: ensaio.descricao,
          fotos: fotosData || []
        }
      }

      const webhookResult = await dispararWebhook(cliente.webhook_url, cliente.webhook_secret, payload)
      
      await supabase.from("ensaios").update({
        webhook_status: webhookResult.sucesso ? "success" : "failed",
        webhook_response: { status: webhookResult.status }
      }).eq("id", ensaio.id)

      if (!webhookResult.sucesso) {
         publicacaoStatus = "erro" // Opcionalmente falha o ensaio se webhook falhar
      }
    }

    // Atualiza status final
    await supabase.from("ensaios").update({
      status: publicacaoStatus,
      publicado_em: new Date().toISOString()
    }).eq("id", ensaio.id)

    return { 
      sucesso: publicacaoStatus === "publicado", 
      ensaioId: ensaio.id, 
      url: cliente.url_site ? `${cliente.url_site}/ensaios/${ensaio.slug}` : `/ensaios/${ensaio.slug}`
    }

  } catch (error: any) {
    console.error("Erro no processamento da tool:", error)
    return { sucesso: false, error: error.message }
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401 })
    }

    const { data: cliente } = await supabase
      .from("clientes")
      .select("*")
      .eq("user_id", user.id)
      .single()

    if (!cliente) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), { status: 404 })
    }

    const { mensagens, conversaId } = await req.json()

    // Formatação de mensagens para remover campos customizados
    const formattedMessages = mensagens.map((m: any) => ({
      role: m.role,
      content: m.content
    }))

    const stream = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: buildSystemPrompt(cliente) }, ...formattedMessages],
      stream: true, 
      temperature: 0.4,
      tools: TOOLS_DEFINITION, 
      tool_choice: "auto",
    })

    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        let fullContent = ""
        let toolCalls: Array<{ function: { name: string, arguments: string } }> = []

        for await (const chunk of stream) {
          const delta = chunk.choices[0]?.delta
          
          if (delta?.content) {
            fullContent += delta.content
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ content: delta.content })}\n\n`
            ))
          }
          
          if (delta?.tool_calls) {
            const call = delta.tool_calls[0]
            if (!toolCalls[0]) toolCalls[0] = { function: { arguments: "", name: "" } }
            if (call.function?.name) toolCalls[0].function.name = call.function.name
            if (call.function?.arguments) toolCalls[0].function.arguments += call.function.arguments
          }
        }

        if (toolCalls.length > 0 && toolCalls[0].function.name === "publish_ensaio") {
          const result = await processToolCall(toolCalls[0], cliente, supabase)
          controller.enqueue(encoder.encode(
            `data: ${JSON.stringify({ tool_result: result })}\n\n`
          ))
        }

        // Salvar mensagem assistant (ou tool execution) no histórico DB
        if (conversaId) {
          await supabase.from("mensagens").insert({
            conversa_id: conversaId,
            role: "assistant",
            content: fullContent || (toolCalls.length > 0 ? "[Realizou publicação do ensaio]" : "Sem resposta textual")
          })
        }

        controller.enqueue(encoder.encode("data: [DONE]\n\n"))
        controller.close()
      }
    })

    return new Response(readable, {
      headers: { 
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive"
      }
    })

  } catch (error: any) {
    console.error("Chat API Erro:", error)
    return new Response(JSON.stringify({ error: error.message }), { status: 500 })
  }
}
