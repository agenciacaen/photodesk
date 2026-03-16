import Link from "next/link"
import { MessageSquare } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ConversaItemProps {
  id: string
  titulo?: string
  criado_em: string
  isActive?: boolean
}

export function ConversaItem({ id, titulo, criado_em, isActive = false }: ConversaItemProps) {
  const timeAgo = formatDistanceToNow(new Date(criado_em), { addSuffix: true, locale: ptBR })

  return (
    <Link
      href={`/chat/${id}`}
      className={`group flex flex-col gap-1 w-full px-3 py-2.5 rounded-xl border text-left transition-all duration-200 ${
        isActive
          ? "bg-[var(--photo-accent)]/10 border-[var(--photo-accent)]/50"
          : "bg-[var(--bg-tertiary)] border-[var(--photo-border)] hover:border-[var(--photo-accent)]/50 hover:bg-[var(--bg-secondary)]"
      }`}
    >
      <div className="flex items-center gap-2">
        <MessageSquare 
          size={14} 
          className={isActive ? "text-[var(--photo-accent)]" : "text-[var(--text-muted)] group-hover:text-[var(--photo-accent)]"} 
        />
        <span className={`text-sm font-medium truncate ${
          isActive ? "text-[var(--photo-accent)]" : "text-[var(--text-primary)]"
        }`}>
          {titulo || "Novo Ensaio"}
        </span>
      </div>
      <span className="text-[10px] text-[var(--text-muted)] ml-6 font-medium">
        {timeAgo}
      </span>
    </Link>
  )
}
