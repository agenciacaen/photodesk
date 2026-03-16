"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { ChevronRight, LucideIcon } from "lucide-react"
import { clsx } from "clsx"

interface NavLinkProps {
  href: string
  label: string
  icon: LucideIcon
  mobile?: boolean
}

export function NavLink({ href, label, icon: Icon, mobile = false }: NavLinkProps) {
  const pathname = usePathname()
  const isActive = pathname === href || pathname.startsWith(href + "/")

  if (mobile) {
    return (
      <Link
        href={href}
        className={clsx(
          "flex flex-col items-center gap-1 transition-colors",
          isActive
            ? "text-[var(--photo-accent)]"
            : "text-[var(--text-secondary)] hover:text-[var(--photo-accent)]"
        )}
      >
        <Icon size={20} />
        <span className="text-[10px] uppercase font-bold tracking-widest">{label}</span>
      </Link>
    )
  }

  return (
    <Link
      href={href}
      className={clsx(
        "flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all group",
        isActive
          ? "bg-[var(--photo-accent)]/10 text-[var(--photo-accent)]"
          : "text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--photo-accent)]"
      )}
    >
      <div className="flex items-center gap-3">
        <Icon size={18} />
        {label}
      </div>
      <ChevronRight
        size={14}
        className={clsx(
          "transition-opacity",
          isActive ? "opacity-100" : "opacity-0 group-hover:opacity-100"
        )}
      />
    </Link>
  )
}
