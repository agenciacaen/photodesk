import { Loader2, Paperclip, Send, X, ImageIcon } from "lucide-react"
import { useRef, useState, useEffect } from "react"
import { useChatStore, UploadedPhoto } from "@/store/chatStore"

interface ChatInputProps {
  onSend: (text: string, files: File[] | undefined) => void // Modified onSend signature
  isLoading?: boolean
}

export function ChatInput({ onSend, isLoading }: ChatInputProps) {
  const [text, setText] = useState("")
  const [uploadingFiles, setUploadingFiles] = useState<{ id: string, name: string, progress: number }[]>([])
  const { uploadedPhotos, addUploadedPhotos, removeUploadedPhoto, clearUploadedPhotos } = useChatStore()
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Auto-resize do textarea (1 a 5 linhas)
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`
    }
  }, [text])

  const handleSend = () => {
    if ((!text.trim() && uploadedPhotos.length === 0) || isLoading) return
    onSend(text, undefined) // Anexos não vão mais soltos via memory do browser, mas sim persistidos
    setText("")
    clearUploadedPhotos()
    if (textareaRef.current) { // Added this back for textarea reset
      textareaRef.current.style.height = "auto"
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    if (selectedFiles.length === 0) return

    // Pre-adicionar marcadores de loading para UI imediata
    const newUploads = selectedFiles.map(f => ({ id: crypto.randomUUID(), name: f.name, progress: 0 }))
    setUploadingFiles(prev => [...prev, ...newUploads])

    // Faz o Upload em lote pro nosso endpoint
    const formData = new FormData()
    selectedFiles.forEach(f => formData.append("files", f))

    try {
      // Simulação de progresso fake p/ UX enquanto o server via fetch n suporta stream de up nativamente no browser
      const interval = setInterval(() => {
         setUploadingFiles(prev => prev.map(up => 
           newUploads.find(n => n.id === up.id) ? { ...up, progress: Math.min(up.progress + 25, 90) } : up
         ))
      }, 300)

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })
      clearInterval(interval)

      if (res.ok) {
        const data = await res.json()
        if (data.sucesso && data.fotos) {
          addUploadedPhotos(data.fotos)
        }
      } else {
        console.error("Falha no upload das imagens")
      }
    } catch(err) {
      console.error(err)
    } finally {
      // Remover indicativos de load
      setUploadingFiles(prev => prev.filter(up => !newUploads.find(n => n.id === up.id)))
    }
    
    e.target.value = "" // reset input
  }

  // removeFile function is no longer needed as file management is handled by useChatStore and UploadingChip
  // const removeFile = (indexToRemove: number) => {
  //   setFiles((prev) => prev.filter((_, i) => i !== indexToRemove))
  // }

  return (
    <div className="border-t border-[var(--photo-border)] bg-[var(--bg-secondary)]/80 backdrop-blur-md p-4 sticky bottom-0 z-10 w-full">
      <div className="max-w-4xl mx-auto">
        {/* Preview de arquivos */}
        {(uploadedPhotos.length > 0 || uploadingFiles.length > 0) && (
          <div className="flex gap-2 mb-3 flex-wrap">
            {uploadedPhotos.map((p) => (
              <PhotoPreviewChip 
                key={p.id} 
                photo={p} 
                onRemove={() => removeUploadedPhoto(p.id)} 
              />
            ))}
            {uploadingFiles.map((up) => (
              <UploadingChip key={up.id} name={up.name} progress={up.progress} />
            ))}
          </div>
        )}

        {/* Barra de input */}
        <div className="flex items-end gap-2 bg-[var(--bg-tertiary)] border border-[var(--photo-border)] focus-within:border-[var(--photo-accent)] rounded-2xl px-4 py-3 transition-colors shadow-sm">
          <label title="Anexar arquivo" className="cursor-pointer text-[var(--text-muted)] hover:text-[var(--photo-accent)] transition-colors p-1 flex-shrink-0"> {/* Changed text-muted to photo-text-muted */}
            <Paperclip size={20} /> {/* Changed size to 20 */}
            <input 
              type="file" 
              multiple 
              accept="image/*,.zip" 
              className="hidden"
              onChange={handleFileChange} 
              title="Selecione arquivos para anexar" // Added title
            />
          </label>
          
          <textarea 
            ref={textareaRef}
            value={text} 
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Descreva o ensaio ou faça uma pergunta..." // Changed placeholder
            className="flex-1 bg-transparent resize-none outline-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] max-h-[120px] py-1 custom-scrollbar" // Changed text-primary to photo-text-primary, removed min-h, added custom-scrollbar
            rows={1} 
            aria-label="Mensagem" // Added aria-label
          />
          
          <button 
            onClick={handleSend} 
            disabled={isLoading || (!text.trim() && uploadedPhotos.length === 0 && uploadingFiles.length === 0)} // Updated disabled condition
            className="p-1.5 bg-[var(--photo-accent)] text-black rounded-xl disabled:opacity-30 disabled:grayscale transition-all hover:brightness-110 flex-shrink-0 flex items-center justify-center h-8 w-8" // Changed disabled styles, removed disabled:cursor-not-allowed, removed p-1, removed transition-opacity
            title="Enviar mensagem" // Added title
          >
            {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} className="ml-0.5" />} {/* Changed size to 16, removed ml-0.5 from Send */}
          </button>
        </div>
      </div>
    </div>
  )
}

// --- Componentes Auxiliares ---

function PhotoPreviewChip({ photo, onRemove }: { photo: UploadedPhoto; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-full pl-1 pr-3 py-1 group animate-in fade-in zoom-in duration-200">
      <div className="w-6 h-6 rounded-full overflow-hidden bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
        {photo.url_thumb ? (
          <img src={photo.url_thumb} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <ImageIcon size={12} className="text-[var(--photo-text-muted)]" />
        )}
      </div>
      <span className="text-xs text-[var(--photo-text-secondary)] max-w-[100px] truncate">
        Foto carregada
      </span>
      <button
        onClick={onRemove}
        className="text-[var(--photo-text-muted)] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity ml-1"
        title="Remover anexo"
      >
        <X size={14} />
      </button>
    </div>
  )
}

function UploadingChip({ name, progress }: { name: string, progress: number }) {
  return (
    <div className="flex items-center gap-2 bg-[var(--bg-secondary)] border-dashed border border-[var(--photo-accent)] rounded-full pl-3 pr-4 py-1.5 opacity-80">
      <Loader2 size={14} className="animate-spin text-[var(--photo-accent)] shrink-0" />
      <div className="flex flex-col min-w-[80px]">
        <span className="text-[10px] text-[var(--photo-text-secondary)] truncate w-full max-w-[100px]">
          {name}
        </span>
        <div className="w-full bg-[var(--bg-tertiary)] rounded-full h-1 mt-1">
          <div className="bg-[var(--photo-accent)] h-1 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
        </div>
      </div>
    </div>
  )
}
