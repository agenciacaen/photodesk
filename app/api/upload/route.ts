import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { Jimp } from "jimp"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    // Busca cliente para criar path usando o slug e id
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, slug")
      .eq("user_id", user.id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: "Perfil de cliente não encontrado" }, { status: 404 })
    }

    const formData = await req.formData()
    const files = formData.getAll("files") as File[]
    const ensaioId = (formData.get("ensaio_id") as string) || uuidv4() 

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    const sessionId = uuidv4()
    const fotosProcessadas = []

    for (const file of files) {
      try {
         const buffer = Buffer.from(await file.arrayBuffer())
         const ext = file.name.split(".").pop() || "jpg"
         const fileName = `${uuidv4()}.${ext}`

         // Caminhos no Storage
         const basePath = `${cliente.slug}/${sessionId}`
         const originalPath = `${basePath}/original/${fileName}`
         const thumbPath = `${basePath}/thumbs/${fileName}`

         // Gerar Thumb com Jimp
         let thumbBuffer
         const metadata = { width: 0, height: 0 }

         if (file.type.startsWith("image/")) {
           const image = await Jimp.read(buffer)
           metadata.width = image.bitmap.width
           metadata.height = image.bitmap.height
           
           image.cover({ w: 400, h: 400 })
           thumbBuffer = await image.getBuffer("image/jpeg")
         }

         // Upload do Arquivo Original
         const { error: origUploadError } = await supabase.storage
           .from("fotos-ensaios")
           .upload(originalPath, buffer, {
             contentType: file.type,
             upsert: false
           })

         if (origUploadError) throw new Error(`Falha no upload original: ${origUploadError.message}`)

         // Public URL Original
         const { data: { publicUrl: originalUrl } } = supabase.storage
           .from("fotos-ensaios")
           .getPublicUrl(originalPath)

         // Upload do Thumb e Public URL
         let thumbUrl = null
         if (thumbBuffer) {
           const { error: thumbUploadError } = await supabase.storage
             .from("fotos-ensaios")
             .upload(thumbPath, thumbBuffer, {
               contentType: "image/jpeg",
               upsert: false
             })

           if (!thumbUploadError) {
              const { data: { publicUrl: tUrl } } = supabase.storage
               .from("fotos-ensaios")
               .getPublicUrl(thumbPath)
              thumbUrl = tUrl
           }
         }

         // Registrar no PostgreSQL Tabela 'fotos'
         const novaFoto = {
            cliente_id: cliente.id,
            storage_path: originalPath,
            url_publica: originalUrl,
            url_thumb: thumbUrl || originalUrl, 
            tamanho_bytes: file.size,
            largura: metadata.width,
            altura: metadata.height
         }

         const { data: fotoRecord, error: dbError } = await supabase
           .from("fotos")
           .insert(novaFoto)
           .select()
           .single()

         if (dbError) throw dbError

         fotosProcessadas.push(fotoRecord)
      } catch (fileErr) {
        console.error(`Erro ao processar arquivo ${file.name}:`, fileErr)
      }
    }

    return NextResponse.json({ 
      sucesso: true, 
      ensaioTempId: ensaioId,
      fotos: fotosProcessadas 
    })

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Falha no sistema de upload"
    console.error("Erro geral na API Upload:", error)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
