export function TypingIndicator() {
  return (
    <div className="flex gap-3 w-full flex-row">
      <div className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-[var(--bg-tertiary)] border border-[var(--photo-border)] overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://api.dicebear.com/7.x/bottts/svg?seed=photodesk&backgroundColor=1a1a1a"
          alt="Assistente"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex gap-1 px-4 py-3.5 w-fit bg-[var(--bg-secondary)] border border-[var(--photo-border)] rounded-2xl rounded-tl-sm shadow-sm items-center h-[44px]">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-[var(--photo-accent)] opacity-60 animate-bounce"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  )
}
