import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import crypto from "crypto"

// Helper genérico para slugs textuais no backend simples
const slugify = (text: string) =>
  text
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")

// Criamos o Admin Auth Service Bypassing (Ignora RLS das policies locais)
// ATENÇÃO: Nunca expor supabase-service-role no Frontend
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const LIMITES_PLANOS: Record<string, number> = {
  basico: 200,
  pro: 500,
  ilimitado: 99999,
}

// POST /api/admin/clientes
export async function POST(req: NextRequest) {
  try {
    // 1. Validando autenticação do requerente Admin (via headers ou cookies do SSR Client padrão)
    const supabaseUser = await (await import("@/lib/supabase/server")).createClient()
    const { data: { session } } = await supabaseUser.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Requisitante não autenticado" }, { status: 401 })
    }

    // Opcional: Validar se session.user.user_metadata.role === 'admin'
    if (session.user.user_metadata?.role !== "admin") {
      return NextResponse.json({ error: "Permissões insuficientes" }, { status: 403 })
    }

    const body = await req.json()
    const { email, senha, nome_studio, url_site, webhook_url, plano } = body

    if (!email || !senha || !nome_studio) {
      return NextResponse.json({ error: "Campos obrigatórios ausentes" }, { status: 400 })
    }

    const planoSelecionado = plano || "basico"
    const limite = LIMITES_PLANOS[planoSelecionado] || LIMITES_PLANOS["basico"]

    // 2. Criar usuário no Supabase Auth
    const { data: newUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: senha,
      user_metadata: { role: "cliente", nome_studio },
      email_confirm: true,
    })

    if (authError || !newUser?.user) {
      console.error("Erro Auth.Admin:", authError)
      return NextResponse.json({ error: authError?.message || "Erro na Criação de Usuário" }, { status: 400 })
    }

    // 3. Registrar o perfil na tabela `clientes` do public
    const { data: cliente, error: dbError } = await supabaseAdmin
      .from("clientes")
      .insert({
        user_id: newUser.user.id,
        nome_studio,
        slug: slugify(nome_studio),
        url_site,
        webhook_url,
        webhook_secret: crypto.randomUUID(), // Secret para HMAC-SHA256
        plano: planoSelecionado,
        limite_fotos_mes: limite,
        ativo: true,
      })
      .select()
      .single()

    if (dbError) {
      // Rollback limpo caso der erro de FK ou Uniques
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id)
      console.error("Erro ao inserir perfil do Cliente na DB:", dbError)
      return NextResponse.json({ error: "Erro banco de dados: " + dbError.message }, { status: 500 })
    }

    return NextResponse.json({ cliente }, { status: 201 })
  } catch (err: any) {
    console.error("Internal Error on Admin POST Client:", err)
    return NextResponse.json({ error: err.message || "Erro Crítico" }, { status: 500 })
  }
}
