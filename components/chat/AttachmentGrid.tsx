import { FileImage } from "lucide-react"

interface AttachmentGridProps {
  files: any[] // Pode receber File[] (novo) ou string[] (urls salvas)
}

export function AttachmentGrid({ files }: AttachmentGridProps) {
  if (!files || files.length === 0) return null

  // Layout grid dependendo do número de fotos (max 4 no preview)
  const displayFiles = files.slice(0, 4)
  const hasMore = files.length > 4
  const moreCount = files.length - 4

  const gridClass = displayFiles.length === 1 
    ? "grid-cols-1" 
    : displayFiles.length === 2 
      ? "grid-cols-2" 
      : displayFiles.length === 3 
        ? "grid-cols-3" 
        : "grid-cols-2"

  return (
    <div className={`grid ${gridClass} gap-1.5 max-w-[320px] rounded-xl overflow-hidden`}>
      {displayFiles.map((file, i) => {
        let src = ""
        let isImage = false

        if (typeof file === "string") {
          src = file
          isImage = true // Simplificação para strings
        } else if (file instanceof File) {
          isImage = file.type.startsWith("image/")
          if (isImage) {
            src = URL.createObjectURL(file)
          }
        }

        const isLastItemWithMore = i === 3 && hasMore

        return (
          <div key={i} className="relative aspect-square bg-[var(--bg-tertiary)] flex items-center justify-center overflow-hidden border border-[var(--photo-border)] rounded-md group">
            {isImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={src} 
                alt="Anexo" 
                className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-110 ${isLastItemWithMore ? "brightness-50" : ""}`}
              />
            ) : (
              <FileImage size={24} className="text-[var(--text-muted)]" />
            )}

            {isLastItemWithMore && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                <span className="text-white font-bold text-lg">+{moreCount}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
