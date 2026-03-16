"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Logo } from "@/components/ui/Logo"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { useAuthStore } from "@/store/authStore"

export default function LoginPage() {
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()
  const setUser = useAuthStore((state) => state.setUser)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password })

      if (error) throw error

      if (data.user) {
        setUser(data.user)
        const role = data.user.user_metadata?.role
        router.push(role === "admin" ? "/admin/dashboard" : "/chat")
      }
    } catch (err: any) {
      const msg = err.message || "Credenciais inválidas. Verifique e tente novamente."
      setError(
        msg.includes("Invalid login") || msg.includes("invalid_grant")
          ? "E-mail ou senha incorretos."
          : msg
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-primary)] p-4 relative overflow-hidden">
      {/* Gradientes de fundo */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[var(--photo-accent)]/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[var(--photo-accent)]/3 blur-[150px] rounded-full pointer-events-none" />

      <div className="w-full max-w-md relative">
        {/* Card */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          {/* Borda dourada topo */}
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--photo-accent)]/60 to-transparent" />

          {/* Logo e título */}
          <div className="flex flex-col items-center text-center mb-8">
            <Logo size="lg" className="mb-6" />
            <h2 className="text-2xl font-bold font-['Playfair_Display'] text-[var(--text-primary)]">
              Acesse sua conta
            </h2>
            <p className="text-[var(--text-secondary)] mt-2 text-sm leading-relaxed">
              Entre para gerenciar seus ensaios fotográficos.
            </p>
          </div>

          {/* Formulário */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* E-mail */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                E-mail
              </label>
              <input
                type="email"
                placeholder="exemplo@estudio.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-[var(--bg-tertiary)] border border-[var(--photo-border)] focus:border-[var(--photo-accent)] rounded-xl h-12 px-4 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
              />
            </div>

            {/* Senha */}
            <div>
              <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-[var(--bg-tertiary)] border border-[var(--photo-border)] focus:border-[var(--photo-accent)] rounded-xl h-12 px-4 pr-12 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)]"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Mensagem de erro inline */}
            {error && (
              <div className="flex items-center gap-2 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-xl px-4 py-3">
                <span className="text-[var(--error)] text-sm">{error}</span>
              </div>
            )}

            {/* Botão de entrar */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-[var(--photo-accent)] hover:bg-[var(--photo-accent)]/90 text-black font-bold h-12 rounded-xl transition-all shadow-lg shadow-[var(--photo-accent)]/20 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar no PhotoDesk"
              )}
            </button>
          </form>

          {/* Rodapé */}
          <p className="text-center text-[var(--text-muted)] text-xs mt-6">
            Ainda não tem conta?{" "}
            <span className="text-[var(--photo-accent)] cursor-pointer hover:underline">
              Entre em contato
            </span>
          </p>
        </div>

        {/* Crédito */}
        <p className="text-center text-[var(--text-muted)] text-[11px] mt-4">
          © {new Date().getFullYear()} PhotoDesk. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
