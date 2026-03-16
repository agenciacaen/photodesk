"use client"

import { useRouter } from "next/navigation"
import { LogOut } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { useAuthStore } from "@/store/authStore"

interface SidebarLogoutButtonProps {
  variant?: "sidebar" | "mobile"
}

export function SidebarLogoutButton({ variant = "sidebar" }: SidebarLogoutButtonProps) {
  const router = useRouter()
  const logout = useAuthStore((state) => state.logout)

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    logout()
    router.push("/login")
  }

  if (variant === "mobile") {
    return (
      <button
        onClick={handleLogout}
        className="flex flex-col items-center gap-1 text-[var(--error)] hover:opacity-70 transition-opacity"
      >
        <LogOut size={20} />
        <span className="text-[10px] uppercase font-bold tracking-widest">Sair</span>
      </button>
    )
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[var(--error)] hover:bg-[var(--error)]/10 transition-all text-sm font-medium"
    >
      <LogOut size={16} />
      Sair
    </button>
  )
}
