import Link from 'next/link'

interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Logo({ className = "", size = "md" }: LogoProps) {
  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-3xl',
  }

  return (
    <Link href="/" className={`flex items-center gap-2.5 group ${className}`}>
      {/* Ícone câmera simplificado */}
      <div className="w-7 h-7 rounded-lg bg-[var(--photo-accent)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M2 4.5C2 3.67 2.67 3 3.5 3h0.77L5 1.5h4l.73 1.5H10.5C11.33 3 12 3.67 12 4.5v6C12 11.33 11.33 12 10.5 12h-7C2.67 12 2 11.33 2 10.5v-6z" stroke="#000" strokeWidth="1.2" fill="none"/>
          <circle cx="7" cy="7.5" r="2" stroke="#000" strokeWidth="1.2"/>
        </svg>
      </div>
      <span className={`font-['Playfair_Display'] ${textSizes[size]} font-bold tracking-tight text-[var(--text-primary)]`}>
        Photo<span className="text-[var(--photo-accent)]">Desk</span>
      </span>
    </Link>
  )
}
