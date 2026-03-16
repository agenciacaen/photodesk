interface UserAvatarProps {
  name?: string
  image?: string
  className?: string
}

export function UserAvatar({ name, image, className = "" }: UserAvatarProps) {
  const initials = name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <div
      className={`relative flex shrink-0 items-center justify-center rounded-full bg-[var(--bg-tertiary)] border border-[var(--photo-border)] overflow-hidden w-9 h-9 ${className}`}
    >
      {image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={image}
          alt={name || "Avatar"}
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-[var(--photo-accent)] font-semibold text-sm leading-none select-none">
          {initials}
        </span>
      )}
    </div>
  )
}
