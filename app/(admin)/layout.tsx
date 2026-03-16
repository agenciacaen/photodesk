import { ReactNode } from "react"
import { createClient } from "@/lib/supabase/server"
import {
  LayoutDashboard,
  Users,
} from "lucide-react"
import { Logo } from "@/components/ui/Logo"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { NavLink } from "@/components/ui/NavLink"
import { SidebarLogoutButton } from "@/components/ui/SidebarLogoutButton"

const navItems = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Clientes",  href: "/admin/clientes",  icon: Users },
]

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userName = user?.user_metadata?.nome_studio || user?.email || "Admin"

  return (
    <div className="flex min-h-screen bg-[var(--bg-primary)]">

      {/* ─── Sidebar Desktop ─── */}
      <aside className="hidden md:flex flex-col w-[260px] border-r border-[var(--photo-border)] bg-[var(--bg-secondary)] sticky top-0 h-screen">
        {/* Logo */}
        <div className="p-6 border-b border-[var(--photo-border)]">
          <Logo />
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          <p className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-widest px-4 mb-2">
            Administração
          </p>
          {navItems.map((item) => (
            <NavLink key={item.href} {...item} />
          ))}
        </nav>

        {/* Rodapé do Sidebar */}
        <div className="p-4 border-t border-[var(--photo-border)]">
          <div className="flex items-center gap-3 px-2 mb-3">
            <UserAvatar name={userName} className="w-9 h-9" />
            <div className="flex flex-col min-w-0">
              <span className="text-sm font-bold truncate text-[var(--text-primary)]">
                {userName}
              </span>
              <span className="text-[10px] text-[var(--photo-accent)] uppercase tracking-wider font-medium">
                Administrador
              </span>
            </div>
          </div>
          <SidebarLogoutButton />
        </div>
      </aside>

      {/* ─── Conteúdo Principal ─── */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {/* Header mobile */}
        <header className="h-16 border-b border-[var(--photo-border)] bg-[var(--bg-secondary)]/90 backdrop-blur-md flex items-center justify-between px-5 md:hidden sticky top-0 z-30">
          <Logo />
          <UserAvatar name={userName} className="w-8 h-8" />
        </header>

        <div className="p-5 md:p-10 max-w-7xl mx-auto">
          {children}
        </div>
      </main>

      {/* ─── Bottom Nav Mobile ─── */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--bg-secondary)] border-t border-[var(--photo-border)] flex items-center justify-around px-4 md:hidden z-50 safe-area-pb">
        {navItems.map((item) => (
          <NavLink key={item.href} {...item} mobile />
        ))}
        <SidebarLogoutButton variant="mobile" />
      </nav>
    </div>
  )
}
