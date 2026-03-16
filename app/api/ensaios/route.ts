import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

// GET /api/ensaios
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const categoria = searchParams.get("categoria")

    const { data: cliente } = await supabase
      .from("clientes")
      .select("id")
      .eq("user_id", user.id)
      .single()

    if (!cliente) {
      return NextResponse.json({ error: "Perfil não encontrado" }, { status: 404 })
    }

    let query = supabase
      .from("ensaios")
      .select("id, titulo, slug, categoria, capa_url, status, total_fotos, criado_em")
      .eq("cliente_id", cliente.id)
      .neq("status", "removido") // Esconde "soft deleted"
      .order("criado_em", { ascending: false })

    if (categoria && categoria !== "Todos") {
      query = query.eq("categoria", categoria.toLowerCase())
    }

    const { data: ensaios, error } = await query

    if (error) throw error

    return NextResponse.json({ ensaios })
  } catch (error: any) {
    console.error("Erro ao buscar ensaios:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}

// DELETE /api/ensaios?id=XYZ
export async function DELETE(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID não fornecido" }, { status: 400 })
    }

    // Soft Delete: Apenas altera o status no RLS associado ao dono
    const { error } = await supabase
      .from("ensaios")
      .update({ status: "removido" })
      .eq("id", id)

    if (error) throw error

    return NextResponse.json({ sucesso: true })
  } catch (error: any) {
    console.error("Erro ao deletar ensaio:", error)
    return NextResponse.json({ error: "Erro interno" }, { status: 500 })
  }
}
