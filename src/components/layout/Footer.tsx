'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function Footer() {
  const pathname = usePathname()

  // Do not render marketing footer on admin, opd, or focused evaluation screens
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/opd') || pathname?.startsWith('/evaluasi')) {
    return null
  }

  return (
    <footer className="border-t border-stroke/50 bg-surface/90 relative z-40 mt-auto shadow-2xs">
      <div className="max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-ink-muted">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-ink">PEKPPP.ext · Kutai Barat</span>
            <span className="text-stroke">•</span>
            <span className="text-[11px]">PermenPAN-RB 29/2022</span>
            <span className="text-stroke hidden sm:inline">•</span>
            <span className="text-ink-secondary">Bagian Organisasi Setdakab Kutai Barat</span>
          </div>
          <div className="text-[11px] text-ink-muted">
            © {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </footer>
  )
}
