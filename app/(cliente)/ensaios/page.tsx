"use client"

import { useEffect, useState } from "react"
import { PageHeader } from "@/components/ui/PageHeader"
import { EnsaioCard, Ensaio } from "@/components/ensaios/EnsaioCard"
import { EmptyState } from "@/components/ui/EmptyState"
import { Loader2, ImageOff, Image as ImageIcon } from "lucide-react"

const CATEGORIAS = ["Todos", "Casamento", "Newborn", "Família", "Gestante", "Aniversário", "Corporativo", "Outro"]

export default function EnsaiosPage() {
  const [ensaios, setEnsaios] = useState<Ensaio[]>([])
  const [loading, setLoading] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [categoriaAtiva, setCategoriaAtiva] = useState("Todos")

  useEffect(() => {
    async function fetchEnsaios() {
      setLoading(true)
      setErro(null)

      try {
        const query = categoriaAtiva === "Todos" ? "" : `?categoria=${encodeURIComponent(categoriaAtiva)}`
        const res = await fetch(`/api/ensaios${query}`)
        
        if (!res.ok) {
           throw new Error("Falha ao carregar os ensaios")
        }

        const data = await res.json()
        setEnsaios(data.ensaios || [])
      } catch (err: any) {
        setErro(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchEnsaios()
  }, [categoriaAtiva])

  return (
    <div className="flex-1 flex flex-col p-6 max-w-7xl mx-auto w-full">
      <PageHeader 
        title="Meus Ensaios" 
        subtitle="Gerencie seu portfólio de ensaios publicados e rascunhos."
      />

      {/* Chips de Categoria */}
      <div className="flex gap-2 overflow-x-auto pb-4 pt-2 custom-scrollbar mb-6">
        {CATEGORIAS.map(cat => (
          <button
            key={cat}
            onClick={() => setCategoriaAtiva(cat)}
            className={`whitespace-nowrap px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
              categoriaAtiva === cat
                ? "bg-[var(--photo-accent)] text-black shadow-md ring-2 ring-[var(--photo-accent)] ring-offset-2 ring-offset-[var(--bg-primary)]"
                : "bg-[var(--bg-secondary)] text-[var(--photo-text-secondary)] border border-[var(--photo-border)] hover:border-[var(--photo-accent)]/50 hover:text-[var(--photo-text-primary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Container de Estado */}
      <div className="flex-1 w-full">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
               <div key={i} className="animate-pulse flex flex-col rounded-xl overflow-hidden border border-[var(--photo-border)] bg-[var(--bg-secondary)]">
                  <div className="h-48 bg-[var(--bg-tertiary)] w-full"></div>
                  <div className="p-4 space-y-3">
                     <div className="h-5 bg-[var(--bg-tertiary)] rounded w-3/4"></div>
                     <div className="flex justify-between">
                        <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/4"></div>
                        <div className="h-3 bg-[var(--bg-tertiary)] rounded w-1/4"></div>
                     </div>
                  </div>
               </div>
            ))}
          </div>
        ) : erro ? (
          <EmptyState 
             icon={ImageOff}
             title="Algo deu errado"
             description={erro}
             actionLabel="Tentar Novamente"
             onAction={() => setCategoriaAtiva(categoriaAtiva)} 
          />
        ) : ensaios.length === 0 ? (
           <EmptyState 
             icon={ImageIcon}
             title="Nenhum ensaio encontrado"
             description={
               categoriaAtiva === "Todos" 
                 ? "Você ainda não tem nenhum ensaio. Peça para o assistente criar um novo no Chat!"
                 : `Nenhum ensaio na categoria ${categoriaAtiva} encontrado.`
             }
           />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {ensaios.map(ensaio => (
               <EnsaioCard key={ensaio.id} ensaio={ensaio} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
