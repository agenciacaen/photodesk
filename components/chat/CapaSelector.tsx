import { UploadedPhoto } from "@/store/chatStore"
import { Check } from "lucide-react"

interface CapaSelectorProps {
  photos: UploadedPhoto[]
  selectedId: string | null
  onSelect: (id: string) => void
  onConfirm: () => void
}

export function CapaSelector({ photos, selectedId, onSelect, onConfirm }: CapaSelectorProps) {
  if (!photos || photos.length === 0) return null

  return (
    <div className="border border-[var(--photo-accent)]/30 rounded-xl p-4 my-2 bg-[var(--bg-secondary)]/50 animate-in fade-in zoom-in duration-300">
      <p className="font-semibold font-['Playfair_Display'] mb-4 text-[var(--photo-text-primary)]">
        Selecione a foto de capa para o ensaio
      </p>
      
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mb-4 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
        {photos.map((photo) => {
          const isSelected = selectedId === photo.id
          return (
            <button
              key={photo.id}
              onClick={() => onSelect(photo.id)}
              className={`relative aspect-square rounded-lg overflow-hidden transition-all duration-300 ${
                isSelected 
                  ? "ring-2 ring-[var(--photo-accent)] ring-offset-2 ring-offset-[var(--bg-secondary)] scale-[0.98]" 
                  : "hover:ring-2 hover:ring-[var(--photo-accent)]/50 hover:ring-offset-1 hover:ring-offset-[var(--bg-secondary)]"
              }`}
            >
              <img 
                src={photo.url_thumb} 
                alt="Thumbnail" 
                className="w-full h-full object-cover"
                loading="lazy"
              />
              
              {isSelected && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[1px]">
                  <div className="bg-[var(--photo-accent)] text-black rounded-full p-1.5 shadow-lg transform transition-transform animate-in zoom-in">
                    <Check size={20} strokeWidth={3} />
                  </div>
                </div>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-[var(--photo-border)]">
        <button
          onClick={onConfirm}
          disabled={!selectedId}
          className="bg-[var(--photo-accent)] text-black font-semibold text-sm px-6 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:brightness-110 transition-all active:scale-95"
        >
          Confirmar Capa ✓
        </button>
      </div>
    </div>
  )
}
