import Link from "next/link"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ImageIcon } from "lucide-react"

export interface Ensaio {
  id: string
  titulo: string
  slug: string
  categoria: string
  capa_url: string | null
  status: string
  total_fotos: number
  criado_em: string
}

interface EnsaioCardProps {
  ensaio: Ensaio
}

export function EnsaioCard({ ensaio }: EnsaioCardProps) {
  const isPublicado = ensaio.status === "publicado"
  
  return (
    <Link href={`/ensaios/${ensaio.id}`}>
      <div className="group rounded-xl overflow-hidden border border-[var(--photo-border)] bg-[var(--bg-secondary)] hover:border-[var(--photo-accent)] transition-all duration-300 shadow-sm hover:shadow-md animate-in fade-in zoom-in duration-300">
        <div className="relative h-56 sm:h-48 overflow-hidden bg-[var(--bg-tertiary)] flex justify-center items-center">
          {ensaio.capa_url ? (
            <img 
              src={ensaio.capa_url} 
              alt={ensaio.titulo}
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              loading="lazy"
            />
          ) : (
             <div className="flex flex-col items-center gap-2 text-[var(--photo-text-muted)] p-4">
                <ImageIcon size={32} opacity={0.6} />
                <span className="text-xs uppercase tracking-widest font-semibold font-['DM_Sans'] opacity-50">Sem Capa</span>
             </div>
          )}

          {/* Badge Categoria (Base esquerda) */}
          <span className="absolute bottom-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-[var(--photo-accent)] text-black px-2.5 py-1 rounded-full shadow-sm">
            {ensaio.categoria}
          </span>
          
          {/* Badge Status (Topo direita) */}
          <span className={`absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md shadow-sm border ${
            isPublicado 
              ? "text-emerald-400 border-emerald-500/30 bg-black/40" 
              : "text-amber-400 border-amber-500/30 bg-black/40"
          }`}>
            {isPublicado ? "● Publicado" : "● Rascunho"}
          </span>
        </div>
        
        <div className="p-4 bg-[var(--bg-secondary)] group-hover:bg-[var(--bg-secondary)]/80 transition-colors">
          <h3 className="font-semibold font-['Playfair_Display'] text-lg truncate text-[var(--photo-text-primary)]">
            {ensaio.titulo}
          </h3>
          <div className="flex justify-between items-center mt-2">
            <p className="text-xs text-[var(--photo-text-secondary)]">
              {ensaio.total_fotos} fotos
            </p>
            <p className="text-[10px] text-[var(--photo-text-muted)]">
              {format(new Date(ensaio.criado_em), "dd 'de' MMM, yyyy", { locale: ptBR })}
            </p>
          </div>
        </div>
      </div>
    </Link>
  )
}
