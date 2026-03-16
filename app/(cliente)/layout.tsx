import { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import {
  MessageSquare,
  GalleryHorizontal,
  PlusCircle,
  Settings,
} from "lucide-react"
import { Logo } from "@/components/ui/Logo"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { NavLink } from "@/components/ui/NavLink"
import { SidebarLogoutButton } from "@/components/ui/SidebarLogoutButton"
import { ConversaItem } from "@/components/chat/ConversaItem"
import Link from "next/link"

const navItems = [
  { label: "Chat",    href: "/chat",    icon: MessageSquare },
  { label: "Ensaios", href: "/ensaios", icon: GalleryHorizontal },
]

export default async function ClienteLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Buscar dados do cliente (nome do estúdio, plano)
  let nomeStudio = user?.user_metadata?.nome_studio || user?.email || "Meu Estúdio"
  let plano = "—"

  if (user) {
    const { data: cliente } = await supabase
      .from("clientes")
      .select("nome_studio, plano")
      .eq("user_id", user.id)
      .single()

    if (cliente) {
      nomeStudio = cliente.nome_studio
      plano = cliente.plano.charAt(0).toUpperCase() + cliente.plano.slice(1)
    }
  }

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">

      {/* ─── Sidebar Desktop ─── */}
      <aside className="hidden md:flex flex-col w-[260px] border-r border-[var(--photo-border)] bg-[var(--bg-secondary)] sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--photo-border)]">
          <Logo />
        </div>

        {/* Botão novo ensaio */}
        <div className="px-4 pt-5 pb-2">
          <Link
            href="/chat"
            className="flex items-center justify-center gap-2 w-full bg-[var(--photo-accent)] hover:bg-[var(--photo-accent)]/90 text-black font-bold rounded-xl h-11 text-sm shadow-lg shadow-[var(--photo-accent)]/10 transition-all group"
          >
            <PlusCircle size={18} className="group-hover:rotate-90 transition-transform duration-300" />
            Novo Ensaio
          </Link>
        </div>

        {/* Nav principal */}
        <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-4 mb-2 mt-2">
            Menu Principal
          </p>
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}

          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-4 mb-2 mt-6">
            Histórico Recente
          </p>
          <div className="px-2 space-y-1">
            <ConversaItem id="mock-1" titulo="Casamento Mariana e Pedro" criado_em={new Date("2024-05-15").toISOString()} />
            <ConversaItem id="mock-2" titulo="Ensaio Gestante Júlia" criado_em={new Date("2024-05-12").toISOString()} />
            <ConversaItem id="mock-3" titulo="Newborn Arthur" criado_em={new Date("2024-05-08").toISOString()} />
          </div>
        </nav>

        {/* Rodapé */}
        <div className="p-4 border-t border-[var(--photo-border)]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <UserAvatar name={nomeStudio} className="w-9 h-9" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-[var(--text-primary)]">
                {nomeStudio}
              </span>
              <span className="text-[10px] text-[var(--photo-accent)] uppercase tracking-wider font-medium">
                Plano {plano}
              </span>
            </div>
          </div>
          <Link
            href="/configuracoes"
            className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)] transition-all text-sm font-medium mb-1"
          >
            <Settings size={16} />
            Configurações
          </Link>
          <SidebarLogoutButton />
        </div>
      </aside>

      {/* ─── Conteúdo Principal ─── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Header mobile */}
        <header className="h-16 border-b border-[var(--photo-border)] bg-[var(--bg-secondary)]/90 backdrop-blur-md flex items-center justify-between px-5 md:hidden sticky top-0 z-30">
          <Logo />
          <UserAvatar name={nomeStudio} className="w-8 h-8" />
        </header>

        <div className="p-5 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ─── Bottom Nav Mobile ─── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-t border-[var(--photo-border)] flex items-center justify-around px-4 md:hidden z-50">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} mobile />
        ))}
        <Link
          href="/chat"
          className="flex flex-col items-center gap-1 text-[var(--photo-accent)]"
        >
          <PlusCircle size={20} />
          <span className="text-[10px] uppercase font-bold tracking-widest">Novo</span>
        </Link>
        <SidebarLogoutButton variant="mobile" />
      </nav>
    </div>
  )
}
