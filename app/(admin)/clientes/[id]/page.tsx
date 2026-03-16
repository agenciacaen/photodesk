"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/PageHeader"
import { ArrowLeft, Loader2, Copy, RefreshCw, EyeOff, Eye, CheckCircle2, ShieldAlert } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClienteDetalhe {
   id: string
   nome_studio: string
   email: string
   plano: string
   url_site: string
   webhook_url: string
   webhook_secret: string
   ativo: boolean
   limite_fotos_mes: number
   criado_em: string
}

export default function ClienteInfoPage() {
   const { id } = useParams()
   const router = useRouter()
   const supabase = createClient()

   const [cliente, setCliente] = useState<ClienteDetalhe | null>(null)
   const [ensaios, setEnsaios] = useState<any[]>([])
   const [loading, setLoading] = useState(true)

   // Interagiveis Webhook
   const [showSecret, setShowSecret] = useState(false)
   const [copied, setCopied] = useState(false)
   const [regenerating, setRegenerating] = useState(false)
   
   // Toggle Ban
   const [togglingStatus, setTogglingStatus] = useState(false)

   useEffect(() => {
      async function loadData() {
         try {
            // Verificar Auth Admin
            const { data: usuario } = await supabase.auth.getUser()
            if (usuario.user?.user_metadata?.role !== 'admin') {
               router.push('/login')
               return
            }

            // JOIN não é ideal aqui pois emails ficam no Auth, mas podemos suprir com o que a view armazena ou customizar
            // Por hora baseando na Tabela Clientes Profile
            const { data: cliData, error: cliErr } = await supabase
               .from("clientes")
               .select("*")
               .eq("id", id)
               .single()
            if (cliErr) throw cliErr
            setCliente(cliData)

            const { data: ensData, error: ensErr } = await supabase
               .from("ensaios")
               .select("id, titulo, categoria, status, total_fotos, criado_em")
               .eq("cliente_id", id)
               .order("criado_em", { ascending: false })
            if (ensErr) throw ensErr
            setEnsaios(ensData || [])

         } catch (err) {
            console.error("Erro leitura:", err)
         } finally {
            setLoading(false)
         }
      }
      loadData()
   }, [id, supabase, router])

   const toggleStatusUsuario = async () => {
      if(!cliente) return
      setTogglingStatus(true)
      try {
         const newStatus = !cliente.ativo
         const { error } = await supabase.from('clientes').update({ ativo: newStatus }).eq('id', cliente.id)
         if (error) throw error
         setCliente({ ...cliente, ativo: newStatus })
      } catch (err) {
         alert("Erro ao mudar o status da conta.")
      } finally {
         setTogglingStatus(false)
      }
   }

   const handleCopyClick = async () => {
      if(!cliente?.webhook_secret) return
      await navigator.clipboard.writeText(cliente.webhook_secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
   }

   const regenerateSecret = async () => {
      if(!cliente || !confirm("Isso quebrará integrações de site existentes até atualizar a chave no WordPress/Vercel deles. Proceder?")) return
      setRegenerating(true)
      try {
         const newSecret = crypto.randomUUID()
         const { error } = await supabase.from('clientes').update({ webhook_secret: newSecret }).eq('id', cliente.id)
         if (error) throw error
         setCliente({...cliente, webhook_secret: newSecret})
      } catch (err) {
         alert("Erro ao regravar secret")
      } finally {
         setRegenerating(false)
      }
   }

   if (loading) return <div className="flex-1 flex justify-center items-center"><Loader2 size={40} className="animate-spin text-[var(--photo-accent)]" /></div>
   if (!cliente) return <div className="flex-1 p-6 text-center text-red-400">Cliente inexistente.</div>

   return (
      <div className="flex-1 flex flex-col p-6 max-w-5xl mx-auto w-full animate-in fade-in duration-500">
         <Link href="/clientes" className="inline-flex items-center text-[var(--photo-text-muted)] hover:text-[var(--photo-text-primary)] transition-colors mb-4 text-sm font-medium w-fit">
            <ArrowLeft size={16} className="mr-1.5" /> Voltar para o Diretório
         </Link>

         <div className="flex flex-col md:flex-row gap-6 mb-8 w-full items-start justify-between bg-[var(--bg-secondary)] border border-[var(--photo-border)] p-6 md:p-8 rounded-2xl shadow-sm relative overflow-hidden">
            {/* Decoração bg */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--photo-accent)]/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />

            {/* Infor Primária */}
            <div className="z-10">
               <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold font-['Playfair_Display'] text-[var(--photo-text-primary)]">{cliente.nome_studio}</h1>
                  <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${cliente.ativo ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" : "text-red-400 border-red-500/30 bg-red-500/10"}`}>
                     {cliente.ativo ? "Normal" : "Suspenso por Admin"}
                  </span>
               </div>
               <p className="text-sm text-[var(--photo-text-secondary)] mb-4">Ingressado em {format(new Date(cliente.criado_em), "dd 'de' MMMM yyyy", { locale: ptBR })}</p>
               
               <div className="flex flex-wrap gap-4 text-sm mt-4">
                  <div className="bg-[var(--bg-tertiary)] px-4 py-2 rounded-xl border border-[var(--photo-border)] border-l-2 border-l-[var(--photo-accent)] shadow-sm">
                     <span className="block text-[10px] uppercase text-[var(--photo-text-muted)] font-bold tracking-wider mb-0.5">Plano Vigente</span>
                     <span className="font-semibold text-[var(--photo-text-primary)] capitalize">{cliente.plano}</span>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] px-4 py-2 rounded-xl border border-[var(--photo-border)] shadow-sm">
                     <span className="block text-[10px] uppercase text-[var(--photo-text-muted)] font-bold tracking-wider mb-0.5">Limite de Fotos (Mês)</span>
                     <span className="font-semibold text-[var(--photo-text-primary)]">{cliente.limite_fotos_mes}</span>
                  </div>
                  <div className="bg-[var(--bg-tertiary)] px-4 py-2 rounded-xl border border-[var(--photo-border)] shadow-sm">
                     <span className="block text-[10px] uppercase text-[var(--photo-text-muted)] font-bold tracking-wider mb-0.5">Domínio Vínculado</span>
                     <span className="font-semibold text-[var(--photo-text-primary)]">{cliente.url_site ? new URL(cliente.url_site).hostname : "Nenhum"}</span>
                  </div>
               </div>
            </div>

            {/* Ações Painel */}
            <div className="z-10 flex flex-col gap-3 w-full md:w-auto h-full justify-between items-end">
               <button 
                  onClick={toggleStatusUsuario}
                  disabled={togglingStatus}
                  className={`w-full md:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm border ${cliente.ativo ? "bg-red-500/10 border-red-500/30 text-red-500 hover:bg-red-500/20" : "bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20"}`}
               >
                  {togglingStatus ? <Loader2 size={16} className="animate-spin" /> : <ShieldAlert size={16} />}
                  {cliente.ativo ? "Suspender Estúdio" : "Restaurar Acesso"}
               </button>
            </div>
         </div>

         {/* Webhooks Config */}
         <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] p-6 md:p-8 rounded-2xl shadow-sm mb-6">
            <h2 className="text-xl font-semibold font-['Playfair_Display'] text-[var(--photo-text-primary)] mb-1">Assinatura de Webhooks</h2>
            <p className="text-sm text-[var(--photo-text-secondary)] mb-6">Esta chave secreta é utilizada para assinar os Payloads (HMAC-SHA256) garantindo ao site de destino que a instrução provém verdadeiramente do nosso servidor PhotoDesk.</p>
            
            <div className="space-y-4 max-w-2xl">
               <div className="space-y-1.5">
                  <label className="text-xs text-[var(--photo-text-muted)] font-bold uppercase tracking-wider">URL do Webhook Receptor</label>
                  <div className="bg-[var(--bg-tertiary)] border border-[var(--photo-border)] rounded-lg px-4 py-2.5 text-sm font-mono text-[var(--photo-text-primary)] opacity-80 break-all">
                     {cliente.webhook_url || "Não configurado neste cliente."}
                  </div>
               </div>

               <div className="space-y-1.5">
                  <label className="text-xs text-[var(--photo-text-muted)] font-bold uppercase tracking-wider">Secret Key (Cofre)</label>
                  <div className="flex items-center gap-2">
                     <div className="relative flex-1 group">
                        <div className={`w-full bg-black/60 border border-[var(--photo-accent)]/30 rounded-lg px-4 py-3 text-sm font-mono text-[var(--photo-accent)] w-full transition-all duration-300 ${!showSecret ? "blur-md select-none" : ""}`}>
                           {cliente.webhook_secret}
                        </div>
                        <button onClick={() => setShowSecret(!showSecret)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--photo-text-muted)] hover:text-white transition-colors bg-[var(--bg-tertiary)] rounded-md shadow">
                           {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                     </div>
                     
                     <div className="flex gap-2">
                        <button onClick={handleCopyClick} className="p-3 bg-[var(--bg-tertiary)] border border-[var(--photo-border)] hover:border-[var(--photo-accent)]/50 rounded-lg text-[var(--photo-text-secondary)] hover:text-white transition-colors" title="Copiar Key">
                           {copied ? <CheckCircle2 size={16} className="text-[var(--photo-accent)]" /> : <Copy size={16} />}
                        </button>
                        <button onClick={regenerateSecret} disabled={regenerating} className="p-3 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-500 rounded-lg transition-colors" title="Forçar Nova Key (Quebra Antiga)">
                           {regenerating ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
                        </button>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         {/* Ensaios deste cliente */}
         <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-2xl overflow-hidden shadow-sm flex-1">
            <div className="p-5 border-b border-[var(--photo-border)] bg-[var(--bg-tertiary)]/50">
               <h3 className="font-semibold text-[var(--photo-text-primary)]">Histórico de Sessões de Fotografia</h3>
            </div>
            <div className="overflow-x-auto custom-scrollbar">
               <table className="w-full text-sm text-left">
                  <thead className="text-[10px] text-[var(--photo-text-muted)] uppercase tracking-wider bg-[var(--bg-tertiary)] border-b border-[var(--photo-border)]">
                     <tr>
                        <th className="px-6 py-3 font-semibold">Título do Ensaio</th>
                        <th className="px-6 py-3 font-semibold">Categoria</th>
                        <th className="px-6 py-3 font-semibold">Tamanho</th>
                        <th className="px-6 py-3 font-semibold">Status de Envio</th>
                        <th className="px-6 py-3 font-semibold text-right">Data de Lançamento</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--photo-border)]">
                     {ensaios.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-10 text-[var(--photo-text-muted)]">O estúdio não comandou nenhuma publicação.</td></tr>
                     ) : (
                        ensaios.map(ens => (
                           <tr key={ens.id} className="hover:bg-[var(--bg-tertiary)]/30 transition-colors">
                              <td className="px-6 py-4 font-medium text-[var(--photo-text-primary)]">{ens.titulo}</td>
                              <td className="px-6 py-4 capitalize text-[var(--photo-text-secondary)]">{ens.categoria}</td>
                              <td className="px-6 py-4 text-[var(--photo-text-secondary)]">{ens.total_fotos} img</td>
                              <td className="px-6 py-4">
                                 <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${ens.status === "publicado" ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10" : "border-amber-500/30 text-amber-400 bg-amber-500/10"}`}>
                                    {ens.status}
                                 </span>
                              </td>
                              <td className="px-6 py-4 text-right text-[var(--photo-text-secondary)] truncate">
                                 {format(new Date(ens.criado_em), "dd MMM, yyyy", { locale: ptBR })}
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
