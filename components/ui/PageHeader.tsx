import { ReactNode } from "react"

interface PageHeaderProps {
  title: string
  subtitle?: string
  children?: ReactNode
}

export function PageHeader({ title, subtitle, children }: PageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-8">
      <div>
        <div className="flex items-center gap-3">
          {/* Detalhe dourado */}
          <div className="w-1 h-8 rounded-full bg-[var(--photo-accent)] flex-shrink-0 hidden md:block" />
          <h1 className="text-3xl font-bold font-['Playfair_Display'] text-[var(--text-primary)]">
            {title}
          </h1>
        </div>
        {subtitle && (
          <p className="text-[var(--text-secondary)] text-sm mt-1.5 md:ml-4">
            {subtitle}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  )
}
