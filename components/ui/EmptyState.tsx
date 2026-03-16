import { ImageOff, Plus } from "lucide-react"
import { LucideIcon } from "lucide-react"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({
  icon: Icon = ImageOff,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center border-2 border-dashed border-[var(--photo-border)] rounded-2xl bg-[var(--bg-secondary)]/40">
      {/* Ícone com glow */}
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center text-[var(--photo-accent)]/40">
          <Icon size={36} />
        </div>
        {/* Glow dourado atrás */}
        <div className="absolute inset-0 rounded-full bg-[var(--photo-accent)]/5 blur-xl" />
      </div>

      <h3 className="text-xl font-semibold text-[var(--text-primary)] font-['Playfair_Display']">
        {title}
      </h3>
      <p className="text-[var(--text-secondary)] text-sm mt-2 max-w-[300px] leading-relaxed">
        {description}
      </p>

      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-xl border border-[var(--photo-accent)]/40 text-[var(--photo-accent)] text-sm font-medium hover:bg-[var(--photo-accent)] hover:text-black transition-all duration-200"
        >
          <Plus size={16} />
          {actionLabel}
        </button>
      )}
    </div>
  )
}
