import { EnsaioFormData } from "@/store/chatStore"
import { Check, Edit2, X } from "lucide-react"

interface EnsaioSummaryCardProps {
  ensaio: Partial<EnsaioFormData>
  onConfirm?: () => void
  onEdit?: () => void
  onCancel?: () => void
  readOnly?: boolean
}

export function EnsaioSummaryCard({
  ensaio,
  onConfirm,
  onEdit,
  onCancel,
  readOnly = false,
}: EnsaioSummaryCardProps) {
  return (
    <div className="border border-[var(--photo-accent)]/80 bg-[var(--bg-tertiary)] shadow-[0_0_15px_rgba(232,201,126,0.05)] rounded-xl p-4 my-3 max-w-sm rounded-tl-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="flex justify-between items-start mb-2">
        <p className="font-semibold font-['Playfair_Display'] text-lg text-[var(--photo-accent)] truncate pr-2">
          {ensaio.titulo || "Novo Ensaio"}
        </p>
        <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--bg-secondary)] text-[var(--text-secondary)] border border-[var(--photo-border)]">
          RESUMO
        </span>
      </div>

      <div className="grid grid-cols-2 gap-1 text-xs text-[var(--text-secondary)] mb-3">
        <span className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">📁</span> 
          <span className="truncate">{ensaio.categoria || "—"}</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="text-[var(--text-muted)]">🖼️</span> 
          <span>{ensaio.totalFotos || 0} fotos</span>
        </span>
      </div>

      {ensaio.descricao && (
        <p className="text-xs text-[var(--text-secondary)] mb-3 line-clamp-2 italic border-l-2 border-[var(--photo-accent)]/30 pl-2">
          &quot;{ensaio.descricao}&quot;
        </p>
      )}

      {ensaio.capaUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={ensaio.capaUrl}
          alt="Capa do ensaio"
          className="w-full h-32 object-cover rounded-lg mb-4 border border-[var(--photo-border)]"
        />
      ) : (
        <div className="w-full h-32 bg-[var(--bg-secondary)] rounded-lg mb-4 flex items-center justify-center border border-dashed border-[var(--photo-border)]">
          <span className="text-xs text-[var(--text-muted)]">Sem capa definida</span>
        </div>
      )}

      {!readOnly && (
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 bg-[var(--photo-accent)] hover:bg-[var(--photo-accent)]/90 text-black text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
          >
            <Check size={14} strokeWidth={3} /> Publicar
          </button>
          {onEdit && (
            <button
              onClick={onEdit}
              className="bg-[var(--bg-secondary)] hover:border-[var(--photo-accent)] border border-[var(--photo-border)] text-[var(--text-primary)] text-xs px-3 rounded-lg flex items-center justify-center transition-colors"
              title="Editar"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onCancel && (
            <button
              onClick={onCancel}
              className="bg-transparent hover:bg-[var(--error)]/10 text-[var(--error)] text-xs px-3 rounded-lg flex items-center justify-center transition-colors border border-transparent hover:border-[var(--error)]/20"
              title="Cancelar"
            >
              <X size={16} />
            </button>
          )}
        </div>
      )}
    </div>
  )
}
