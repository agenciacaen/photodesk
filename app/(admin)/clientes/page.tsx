"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { PageHeader } from "@/components/ui/PageHeader"
import { Loader2, Plus, Search, LogOut, CheckCircle2, ArrowUpRight } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ClienteAdmin {
  id: string
  nome_studio: string
  slug: string
  plano: string
  ativo: boolean
  url_site: string
  criado_em: string
}

export default function ClientesAdminPage() {
  const supabase = createClient()
  const [clientes, setClientes] = useState<ClienteAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")

  // Estado do Modal de Cadastro
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loadingModal, setLoadingModal] = useState(false)
  const [erroModal, setErroModal] = useState("")
  const [sucessoModal, setSucessoModal] = useState(false)

  // Campos do Form
  const [formConfig, setFormConfig] = useState({
     email: "",
     senha: "",
     nome_studio: "",
     url_site: "",
     webhook_url: "",
     plano: "basico"
  })

  useEffect(() => {
    fetchClientes()
  }, [])

  async function fetchClientes() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("clientes")
        .select("id, nome_studio, slug, plano, ativo, url_site, criado_em")
        .order("criado_em", { ascending: false })

      if (error) throw error
      setClientes(data || [])
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const clientesFiltrados = clientes.filter(c => 
    c.nome_studio.toLowerCase().includes(busca.toLowerCase()) || c.plano.toLowerCase().includes(busca.toLowerCase())
  )

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoadingModal(true)
    setErroModal("")
    setSucessoModal(false)

    try {
      const res = await fetch("/api/admin/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formConfig)
      })

      if (!res.ok) {
        const errorData = await res.json()
        throw new Error(errorData.error || "Ocorreu um erro no servidor")
      }

      setSucessoModal(true)
      fetchClientes() // Refresh na tabela de trás

      setTimeout(() => {
         setIsModalOpen(false)
         setSucessoModal(false)
         setFormConfig({email:"", senha:"", nome_studio:"", url_site:"", webhook_url:"", plano:"basico"})
      }, 2000)

    } catch(err: unknown) {
       setErroModal((err as Error).message)
    } finally {
       setLoadingModal(false)
    }
  }

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full animate-in fade-in duration-500">
       <PageHeader 
          title="Diretório de Estúdios" 
          subtitle="Gerencie os fotógrafos matriculados, configure webhooks e altere limites de conta."
       />

       {/* Toolbar */}
       <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-6">
          <div className="relative w-full md:w-96">
             <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--photo-text-muted)]" />
             <input 
               type="text" 
               placeholder="Pesquisar por estúdio ou plano..."
               value={busca}
               onChange={(e) => setBusca(e.target.value)}
               className="w-full bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none text-[var(--photo-text-primary)] placeholder:text-[var(--photo-text-muted)] focus:border-[var(--photo-accent)] transition-colors"
             />
          </div>

          <button 
             onClick={() => setIsModalOpen(true)}
             className="w-full md:w-auto flex items-center justify-center gap-2 bg-[var(--photo-accent)] text-black px-5 py-2.5 rounded-xl font-medium text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm"
          >
             <Plus size={18} /> Cadastrar Estúdio
          </button>
       </div>

       {/* Tabela */}
       <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-2xl overflow-hidden shadow-sm flex-1 max-h-[calc(100vh-250px)] relative">
          <div className="overflow-x-auto h-full custom-scrollbar relative">
             <table className="w-full text-sm text-left">
                <thead className="text-xs text-[var(--photo-text-secondary)] uppercase bg-[var(--bg-tertiary)] sticky top-0 z-10">
                   <tr>
                      <th className="px-6 py-4 font-medium">Estúdio</th>
                      <th className="px-6 py-4 font-medium">Plano Contratado</th>
                      <th className="px-6 py-4 font-medium">Website Connect</th>
                      <th className="px-6 py-4 font-medium">Status</th>
                      <th className="px-6 py-4 font-medium text-right">Cadastrado em</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-[var(--photo-border)]">
                   {loading ? (
                      <tr><td colSpan={5} className="text-center py-20"><Loader2 size={30} className="animate-spin text-[var(--photo-accent)] mx-auto mb-4" /> <span className="text-[var(--photo-text-secondary)]">Buscando banco de talentos...</span></td></tr>
                   ) : clientesFiltrados.length === 0 ? (
                      <tr><td colSpan={5} className="text-center py-20 text-[var(--photo-text-muted)]">Nenhum resultado pra busca.</td></tr>
                   ) : (
                      clientesFiltrados.map(cli => (
                         <tr key={cli.id} className="hover:bg-[var(--bg-tertiary)]/60 transition-colors group cursor-pointer" onClick={() => window.location.href = `/clientes/${cli.id}`}>
                            <td className="px-6 py-5 font-medium text-[var(--photo-text-primary)]">
                               {cli.nome_studio}
                               <div className="text-[10px] text-[var(--photo-text-muted)] mt-0.5">{cli.slug}</div>
                            </td>
                            <td className="px-6 py-5">
                               <span className="bg-[var(--bg-tertiary)] border border-[var(--photo-border)] px-3 py-1.5 rounded-md capitalize text-xs font-semibold tracking-wide text-white/80">
                                 {cli.plano}
                               </span>
                            </td>
                            <td className="px-6 py-5 text-[var(--photo-text-muted)] group-hover:text-[var(--photo-accent)] transition-colors">
                               {cli.url_site ? new URL(cli.url_site).hostname : 'Sem domínio configurado'}
                            </td>
                            <td className="px-6 py-5">
                               <div className="flex items-center text-xs">
                                  <div className={`h-2.5 w-2.5 rounded-full mr-2 shadow-sm ${cli.ativo ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-red-500 shadow-red-500/50'}`}></div>
                                  {cli.ativo ? 'Ativo' : 'Suspenso'}
                               </div>
                            </td>
                            <td className="px-6 py-5 text-right text-[var(--photo-text-secondary)]">
                               {format(new Date(cli.criado_em), "dd MMM, yyyy", { locale: ptBR })}
                            </td>
                         </tr>
                      ))
                   )}
                </tbody>
             </table>
          </div>
       </div>


       {/* Modals e Overlays - Criação */}
       {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
             <div className="bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-2xl w-full max-w-xl shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                
                <div className="p-6 border-b border-[var(--photo-border)] flex justify-between items-center">
                   <h2 className="text-xl font-semibold font-['Playfair_Display']">Provisionar Novo Estúdio</h2>
                   <button title="Fechar Modal" onClick={() => setIsModalOpen(false)} className="text-[var(--photo-text-muted)] hover:text-white"><LogOut size={20} /></button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                   {erroModal && <div className="mb-4 bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-xl text-sm">{erroModal}</div>}
                   {sucessoModal && <div className="mb-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-xl text-sm flex gap-2 items-center"><CheckCircle2 size={16}/> Provisionado com sucesso, autorizando login.</div>}

                   <form id="clientForm" onSubmit={handleCadastro} className="space-y-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-sm text-[var(--photo-text-secondary)] font-medium">Nome do Estúdio *</label>
                            <input required type="text" className="w-full bg-[var(--bg-tertiary)] border border-[var(--photo-border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--photo-accent)] placeholder:text-[var(--photo-text-muted)]" placeholder="Ex: FlashStudio"
                               value={formConfig.nome_studio} onChange={e => setFormConfig({...formConfig, nome_studio: e.target.value})} />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-sm text-[var(--photo-text-secondary)] font-medium">Plano Contratado *</label>
                            <select title="Selecione o plano desejado" required className="w-full bg-[var(--bg-tertiary)] border border-[var(--photo-border)] rounded-xl px-4 py-2.5 text-sm outline-none focus:border-[var(--photo-accent)] appearance-none"
                               value={formConfig.plano} onChange={e => setFormConfig({...formConfig, plano: e.target.value})}>
                               <option value="basico">Básico (200 fotos /mês)</option>
                               <option value="pro">Profissional (500 fotos /mês)</option>
                               <option value="ilimitado">Ilimitado VIP</option>
                            </select>
                         </div>
                      </div>

                      <div className="space-y-1.5">
                         <label className="text-sm text-[var(--photo-text-secondary)] font-medium">Credenciais do Auth Supabase *</label>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input required type="email" placeholder="Email do Fotógrafo" className="w-full bg-[var(--bg-tertiary)] border border-[var(--photo-border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--photo-accent)]"
                               value={formConfig.email} onChange={e => setFormConfig({...formConfig, email: e.target.value})} />
                            <input required type="password" placeholder="Senha Provisória" className="w-full bg-[var(--bg-tertiary)] border border-[var(--photo-border)] rounded-xl px-4 py-2 text-sm outline-none focus:border-[var(--photo-accent)]" 
                               value={formConfig.senha} onChange={e => setFormConfig({...formConfig, senha: e.target.value})} minLength={6} />
                         </div>
                      </div>

                      <div className="p-4 rounded-xl border border-[var(--photo-accent)]/20 bg-[var(--photo-accent)]/5 mt-6 mb-2 space-y-4">
                         <h4 className="text-xs font-bold uppercase tracking-wider text-[var(--photo-accent)] mb-2 flex items-center gap-2"><ArrowUpRight size={14}/> Configurações Endpoints</h4>
                         <div className="space-y-1.5">
                            <label className="text-xs text-[var(--photo-text-secondary)] font-medium">URL Raiz do Website Hospedeiro</label>
                            <input type="url" placeholder="https://studio-oficial.com" className="w-full bg-black/40 border border-[var(--photo-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--photo-accent)] text-[var(--photo-text-muted)] focus:text-[var(--photo-text-primary)]"
                               value={formConfig.url_site} onChange={e => setFormConfig({...formConfig, url_site: e.target.value})} />
                         </div>
                         <div className="space-y-1.5">
                            <label className="text-xs text-[var(--photo-text-secondary)] font-medium">Webhook URL de Publicação</label>
                            <input type="url" placeholder="https://api.studio-oficial.com/receive-photodesk" className="w-full bg-black/40 border border-[var(--photo-border)] rounded-lg px-3 py-2 text-sm outline-none focus:border-[var(--photo-accent)] text-[var(--photo-text-muted)] focus:text-[var(--photo-text-primary)]"
                               value={formConfig.webhook_url} onChange={e => setFormConfig({...formConfig, webhook_url: e.target.value})} />
                         </div>
                      </div>

                   </form>
                </div>

                <div className="p-4 border-t border-[var(--photo-border)] flex justify-end gap-3 bg-[var(--bg-tertiary)]/50 rounded-b-2xl">
                   <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-[var(--photo-text-muted)] hover:text-white transition-colors">Cancelar</button>
                   <button form="clientForm" type="submit" disabled={loadingModal} className="w-36 flex items-center justify-center gap-2 bg-[var(--photo-accent)] text-black px-4 py-2 rounded-xl font-medium text-sm hover:brightness-110 active:scale-95 transition-all shadow-sm">
                      {loadingModal ? <Loader2 size={16} className="animate-spin" /> : "Criar Servidor"}
                   </button>
                </div>
             </div>
          </div>
       )}
    </div>
  )
}
