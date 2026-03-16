"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Users, Presentation, HardDrive, ArrowUpRight, Loader2 } from "lucide-react"
import { PageHeader } from "@/components/ui/PageHeader"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface DBStats {
   totalClientes: number
   totalEnsaios: number
   totalFotos: number
}

export default function AdminDashboardPage() {
  const supabase = createClient()
  const [stats, setStats] = useState<DBStats>({ totalClientes: 0, totalEnsaios: 0, totalFotos: 0 })
  const [recentes, setRecentes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [errorDesc, setErrorDesc] = useState("")

  useEffect(() => {
    async function loadDashboard() {
      try {
        // Validação básica extra para view
        const { data: usuario } = await supabase.auth.getUser()
        if (usuario.user?.user_metadata?.role !== 'admin') {
           setErrorDesc("Você não tem acesso a este painel.")
           setLoading(false)
           return
        }

        // Estatísticas: Multiplas Queries em Promisse.All ()
        const [cliRes, ensRes, fotRes, cliList] = await Promise.all([
          supabase.from("clientes").select("id", { count: "exact", head: true }),
          supabase.from("ensaios").select("id", { count: "exact", head: true }).eq("status", "publicado"),
          supabase.from("fotos").select("tamanho_bytes"), // Storage sum (gambiarra performática ideal é query sum sql level)
          supabase.from("clientes").select("id, nome_studio, plano, ativo, criado_em").order("criado_em", { ascending: false }).limit(6)
        ])

        const sizeInGb = fotRes.data?.reduce((acc, curr) => acc + (curr.tamanho_bytes || 0), 0) / (1024 * 1024 * 1024)

        setStats({
          totalClientes: cliRes.count || 0,
          totalEnsaios: ensRes.count || 0,
          totalFotos: sizeInGb || 0
        })

        setRecentes(cliList.data || [])
      } catch (err: any) {
        console.error(err)
        setErrorDesc("Ocorreu um erro ao carregar o dashboard")
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [supabase])

  if (loading) return (
     <div className="flex-1 flex justify-center items-center"><Loader2 size={40} className="animate-spin text-[var(--photo-accent)]" /></div>
  )

  if (errorDesc) return (
     <div className="flex-1 p-6 text-red-400 bg-red-400/10 text-center mx-auto my-auto p-12 mt-12 w-full max-w-2xl rounded-2xl border border-red-500/20">{errorDesc}</div>
  )

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
       <PageHeader 
          title="Overview do Sistema" 
          subtitle="Acompanhe o crescimento da plataforma e recursos consumidos pelos estúdios."
       />

       {/* Top Metrics Cards */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 mt-2">
         {/* Card 1 Clientes */}
         <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--photo-text-secondary)] font-medium text-sm">Estúdios Ativos</span>
              <div className="w-10 h-10 rounded-full bg-[var(--photo-accent)]/10 text-[var(--photo-accent)] flex items-center justify-center">
                 <Users size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold font-['Playfair_Display'] text-[var(--photo-text-primary)]">
               {stats.totalClientes}
            </div>
            <p className="text-xs text-[var(--photo-text-muted)] mt-2 flex items-center gap-1 text-emerald-400">
               <ArrowUpRight size={14} /> Em crescimento
            </p>
         </div>

         {/* Card 2 Ensaios */}
         <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--photo-text-secondary)] font-medium text-sm">Ensaios Publicados</span>
              <div className="w-10 h-10 rounded-full bg-[var(--photo-accent)]/10 text-[var(--photo-accent)] flex items-center justify-center">
                 <Presentation size={20} />
              </div>
            </div>
            <div className="text-3xl font-bold font-['Playfair_Display'] text-[var(--photo-text-primary)]">
               {stats.totalEnsaios}
            </div>
         </div>

         {/* Card 3 Storage */}
         <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-2xl p-5 shadow-sm md:col-span-2 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[var(--photo-text-secondary)] font-medium text-sm">Armazenamento Fotográfico Total</span>
              <div className="w-10 h-10 rounded-full bg-[var(--photo-accent)]/10 text-[var(--photo-accent)] flex items-center justify-center">
                 <HardDrive size={20} />
              </div>
            </div>
            <div className="flex items-end gap-3">
               <div className="text-3xl font-bold font-['Playfair_Display'] text-[var(--photo-text-primary)]">
                  {stats.totalFotos.toFixed(2)}
               </div>
               <span className="text-lg text-[var(--photo-text-muted)] mb-1 font-medium">GB Hospedados</span>
            </div>
            
            {/* Barra Visual de Consumo Fake/Estimada */}
            <div className="mt-4 pt-4 border-t border-[var(--photo-border)]">
               <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-2">
                  <div className="bg-[var(--photo-accent)] h-2 rounded-full shadow-[0_0_10px_var(--photo-accent)]" style={{ width: `${Math.min((stats.totalFotos / 100) * 100, 100)}%` }}></div>
               </div>
               <p className="text-xs text-right mt-1.5 text-[var(--photo-text-muted)]">Medição Global</p>
            </div>
         </div>
       </div>

       {/* Painel Inferior: Últimos Clientes */}
       <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-2xl overflow-hidden shadow-sm">
          <div className="p-5 border-b border-[var(--photo-border)] flex justify-between items-center">
             <h3 className="font-semibold text-[var(--photo-text-primary)]">Novos Assinantes Recentes</h3>
             <a href="/clientes" className="text-sm font-medium text-[var(--photo-accent)] hover:underline">Ver Tabela Completa →</a>
          </div>
          
          <div className="overflow-x-auto">
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--photo-text-secondary)] uppercase bg-[var(--bg-tertiary)]">
                   <tr>
                      <th className="px-6 py-4 font-medium">Estúdio</th>
                      <th className="px-6 py-4 font-medium">Plano Contratado</th>
                      <th className="px-6 py-4 font-medium">Status da Conta</th>
                      <th className="px-6 py-4 font-medium text-right">Data de Ingresso</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--photo-border)]">
                   {recentes.length === 0 ? (
                      <tr><td colSpan={4} className="text-center py-8 text-[var(--photo-text-muted)]">Nenhum estúdio ingressado.</td></tr>
                   ) : (
                      recentes.map(cli => (
                         <tr key={cli.id} className="hover:bg-[var(--bg-tertiary)]/50 transition-colors">
                            <td className="px-6 py-4 font-medium text-[var(--photo-text-primary)]">{cli.nome_studio}</td>
                            <td className="px-6 py-4">
                               <span className="bg-white/5 border border-white/10 px-2.5 py-1 rounded capitalize text-xs">{cli.plano}</span>
                            </td>
                            <td className="px-6 py-4">
                               <div className="flex items-center">
                                  <div className={`h-2.5 w-2.5 rounded-full mr-2 ${cli.ativo ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                                  {cli.ativo ? 'Em Funcionamento' : 'Suspenso'}
                               </div>
                            </td>
                            <td className="px-6 py-4 text-right text-[var(--photo-text-secondary)] truncate">
                               {format(new Date(cli.criado_em), "dd MMM, yyyy", { locale: ptBR })}
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </div>

    </div>
  )
}
