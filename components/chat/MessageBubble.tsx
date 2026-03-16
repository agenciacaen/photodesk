import { Message } from "@/store/chatStore"
import { UserAvatar } from "@/components/ui/UserAvatar"
import { EnsaioSummaryCard } from "./EnsaioSummaryCard"
import { AttachmentGrid } from "./AttachmentGrid"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user"

  return (
    <div className={`flex gap-3 w-full ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <UserAvatar
        name={isUser ? "Admin" : "Assistente"}
        image={!isUser ? "https://api.dicebear.com/7.x/bottts/svg?seed=photodesk&backgroundColor=1a1a1a" : undefined}
      />
      <div
        className={`max-w-[85%] md:max-w-[75%] rounded-2xl px-4 py-3 ${
          isUser
            ? "bg-[var(--bg-tertiary)] text-[var(--text-primary)] rounded-tr-sm"
            : "bg-[var(--bg-secondary)] border border-[var(--photo-border)] text-[var(--text-primary)] rounded-tl-sm shadow-sm"
        }`}
      >
        {message.formData && <EnsaioSummaryCard ensaio={message.formData} />}
        
        {message.content && (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {message.content}
          </p>
        )}
        
        {message.attachments && message.attachments.length > 0 && (
          <div className="mt-3">
            <AttachmentGrid files={message.attachments} />
          </div>
        )}
        
        {message.timestamp && (
          <span className="text-[10px] text-[var(--text-muted)] mt-1.5 block font-medium">
            {format(new Date(message.timestamp), "HH:mm", { locale: ptBR })}
          </span>
        )}
      </div>
    </div>
  )
}
