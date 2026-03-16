"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { ArrowLeft, Trash2, ExternalLink, Calendar, Folder, Image as ImageIcon, X, ChevronLeft, ChevronRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { EmptyState } from "@/components/ui/EmptyState"

interface Foto {
  id: string
  url_publica: string
  url_thumb: string
  largura: number | null
  altura: number | null
}

interface EnsaioDetalhes {
  id: string
  titulo: string
  slug: string
  categoria: string
  status: string
  total_fotos: number
  criado_em: string
  publicado_em: string | null
  fotos: Foto[]
}

export default function EnsaioDetailsPage() {
  const { id } = useParams()
  const router = useRouter()
  const supabase = createClient()

  const [ensaio, setEnsaio] = useState<EnsaioDetalhes | null>(null)
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [deletando, setDeletando] = useState(false)

  // Lightbox State
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    async function loadEnsaio() {
      try {
        const { data: usuario } = await supabase.auth.getUser()
        if (!usuario.user) throw new Error("Não autenticado")

        // Busca o ensaio
        const { data: ensaioData, error: ensaioErr } = await supabase
          .from("ensaios")
          .select("*")
          .eq("id", id)
          .single()

        if (ensaioErr) throw new Error("Ensaio não encontrado")

        // Busca as fotos
        const { data: fotosData, error: fotosErr } = await supabase
          .from("fotos")
          .select("id, url_publica, url_thumb, largura, altura, ordem")
          .eq("ensaio_id", id)
          .order("ordem", { ascending: true })

        if (fotosErr) throw fotosErr

        setEnsaio({ ...ensaioData, fotos: fotosData || [] })

      } catch (err: any) {
        setErro(err.message)
      } finally {
        setLoading(false)
      }
    }

    if (id) loadEnsaio()
  }, [id, supabase])

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja remover este ensaio?")) return

    setDeletando(true)
    try {
      const res = await fetch(`/api/ensaios?id=${ensaio?.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error("Falha ao excluir ensaio")
      
      router.push("/ensaios")
    } catch (err) {
      console.error(err)
      alert("Erro ao remover ensaio.")
      setDeletando(false)
    }
  }

  // Comandos Lightbox
  const showLightbox = lightboxIndex !== null
  const currentPhoto = showLightbox && ensaio?.fotos ? ensaio.fotos[lightboxIndex] : null

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!showLightbox) return
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowLeft") setLightboxIndex(prev => prev! > 0 ? prev! - 1 : ensaio!.fotos.length - 1)
      if (e.key === "ArrowRight") setLightboxIndex(prev => prev! < ensaio!.fotos.length - 1 ? prev! + 1 : 0)
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [showLightbox, ensaio])


  if (loading) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[var(--photo-accent)]" />
      </div>
    )
  }

  if (erro || !ensaio) {
    return (
      <div className="flex-1 p-6 max-w-7xl mx-auto w-full">
         <EmptyState title="Ensaio não encontrado" description={erro || "O ensaio solicitado nao existe ou foi removido."} />
      </div>
    )
  }

  const isPublicado = ensaio.status === "publicado"

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 lg:px-8 max-w-[1600px] mx-auto w-full animate-in fade-in duration-500">
      
      {/* Header Interativo */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
        <div>
          <Link href="/ensaios" className="inline-flex items-center text-[var(--photo-text-muted)] hover:text-[var(--photo-text-primary)] transition-colors mb-4 text-sm font-medium">
            <ArrowLeft size={16} className="mr-1.5" /> Voltar para Ensaios
          </Link>
          
          <div className="flex items-center gap-3 mb-2">
             <h1 className="text-3xl md:text-4xl font-bold font-['Playfair_Display'] text-[var(--photo-text-primary)]">
               {ensaio.titulo}
             </h1>
             <span className={`text-[10px] md:text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${
               isPublicado 
                 ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10" 
                 : "text-amber-400 border-amber-500/30 bg-amber-500/10"
             }`}>
               {isPublicado ? "Publicado" : "Rascunho"}
             </span>
          </div>
          
          <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-[var(--photo-text-secondary)] mt-3">
            <div className="flex items-center gap-1.5">
               <Folder size={16} className="text-[var(--photo-accent)]" /> 
               <span className="capitalize">{ensaio.categoria}</span>
            </div>
            <div className="flex items-center gap-1.5">
               <ImageIcon size={16} className="text-[var(--photo-accent)]" /> 
               <span>{ensaio.total_fotos} fotos</span>
            </div>
            <div className="flex items-center gap-1.5">
               <Calendar size={16} className="text-[var(--photo-accent)]" /> 
               <span>{format(new Date(ensaio.criado_em), "dd MMM yyyy", { locale: ptBR })}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {isPublicado && (
             <a 
               href={`https://studio-luz.com/ensaios/${ensaio.slug}`} // TODO: Linkar à variavel real do cliente no banco (url_site)
               target="_blank" 
               rel="noreferrer"
               className="flex items-center gap-2 bg-[var(--bg-tertiary)] hover:bg-[var(--bg-secondary)] border border-[var(--photo-border)] px-4 py-2.5 rounded-xl text-sm font-medium transition-colors"
             >
                <ExternalLink size={16} /> Ver Site
             </a>
          )}
          
          <button 
             onClick={handleDelete}
             disabled={deletando}
             className="flex items-center justify-center gap-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          >
            {deletando ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            <span className="hidden sm:inline">{deletando ? "Removendo..." : "Excluir Ensaio"}</span>
          </button>
        </div>
      </div>

      {/* Grid de Fotos */}
      {ensaio.fotos.length === 0 ? (
         <EmptyState 
           title="Nenhuma foto anexada" 
           description="Este ensaio não possui fotografias na sua galeria interna." 
         />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4 lg:gap-6">
          {ensaio.fotos.map((foto, index) => (
             <div 
               key={foto.id} 
               onClick={() => setLightboxIndex(index)}
               className="relative aspect-square group rounded-xl overflow-hidden cursor-pointer border border-[var(--photo-border)] bg-[var(--bg-tertiary)] shadow-sm hover:shadow-lg transition-all"
             >
                <img 
                  src={foto.url_thumb || foto.url_publica} 
                  alt={`Foto ${index + 1}`} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                {/* Overlay Hover */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                   <span className="text-white bg-[var(--photo-accent)]/80 text-xs px-3 py-1.5 rounded-full backdrop-blur-md">
                     Expandir
                   </span>
                </div>
             </div>
          ))}
        </div>
      )}

      {/* Lightbox Imersivo */}
      {showLightbox && currentPhoto && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center backdrop-blur-sm animate-in fade-in duration-200">
           {/* Topbar Actions */}
           <div className="absolute top-0 right-0 p-4 z-[60] flex gap-4">
              <span className="text-white/60 text-sm font-medium bg-black/40 px-3 py-1.5 rounded-full">
                {lightboxIndex! + 1} / {ensaio.fotos.length}
              </span>
              <button 
                onClick={() => setLightboxIndex(null)}
                className="bg-black/40 hover:bg-white/10 text-white p-2 rounded-full transition-colors"
                title="Fechar (Esc)"
              >
                <X size={24} />
              </button>
           </div>
           
           {/* Navigation Controls */}
           <button 
             onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev! > 0 ? prev! - 1 : ensaio!.fotos.length - 1) }}
             className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-white/10 text-white p-3 rounded-full transition-colors z-[60]"
           >
             <ChevronLeft size={32} />
           </button>

           <button 
             onClick={(e) => { e.stopPropagation(); setLightboxIndex(prev => prev! < ensaio.fotos.length - 1 ? prev! + 1 : 0) }}
             className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-white/10 text-white p-3 rounded-full transition-colors z-[60]"
           >
             <ChevronRight size={32} />
           </button>

           {/* Imagem em Destaque */}
           <div 
             className="relative w-full h-full p-4 md:p-12 flex items-center justify-center outline-none" 
             onClick={() => setLightboxIndex(null)}
           >
              <img 
                src={currentPhoto.url_publica} 
                alt="Foto Ampliada" 
                className="max-w-full max-h-full object-contain rounded-sm shadow-2xl animate-in zoom-in-95 duration-300 pointer-events-auto"
                onClick={(e) => e.stopPropagation()} // Impede fechar ao clicar na foto si
              />
           </div>
        </div>
      )}

    </div>
  )
}
