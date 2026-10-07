'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  CalendarDays,
  Building2,
  Users,
  UserCog,
  ArrowLeft,
  ShieldCheck,
  Sparkles,
  FileCheck,
  MessageSquare
} from 'lucide-react'

const ADMIN_NAV = [
  {
    href: '/admin/periode',
    label: 'Tahun Penilaian PEKPPP',
    icon: CalendarDays,
    description: 'Lokus & evaluasi PEKPPP'
  },
  {
    href: '/admin/lokus',
    label: 'Master Lokus',
    icon: Building2,
    description: 'Daftar master unit kerja'
  },
  {
    href: '/admin/panduan-bukti',
    label: 'Master Panduan Bukti',
    icon: FileCheck,
    description: 'Contoh berkas 6 Aspek'
  },
  {
    href: '/admin/akun',
    label: 'Manajemen Akun',
    icon: UserCog,
    description: 'Super Admin & OPD'
  },
  {
    href: '/admin/pengaturan-ai',
    label: 'Pengaturan & Konteks AI',
    icon: Sparkles,
    description: 'Model, biaya & 6 Aspek Utama'
  },
  {
    href: '/admin/pengaturan-api',
    label: 'Pengaturan API',
    icon: ShieldCheck,
    description: 'Integrasi API MenPAN-RB'
  },
  {
    href: '/admin/pengaturan-wa',
    label: 'Pengaturan WhatsApp',
    icon: MessageSquare,
    description: 'Bot Gateway Fonnte & Notifikasi'
  }
]

export interface PeriodItem {
  id: string
  year: number
  title?: string | null
  isOpen: boolean
}

export default function AdminSidebar({ periods = [] }: { periods?: PeriodItem[] }) {
  const pathname = usePathname()

  return (
    <aside className="sticky top-20 h-[calc(100vh-80px)] w-72 shrink-0 bg-surface/95 border-r border-stroke flex flex-col overflow-y-auto self-start z-30">
      {/* Sidebar Header */}
      <div className="px-5 py-4 border-b border-stroke bg-surface-subtle/30">
        <div className="text-[10px] font-mono uppercase tracking-wider text-brand font-semibold">Super Admin</div>
        <div className="font-medium text-sm text-ink tracking-tight">Admin Dashboard</div>
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-3.5 space-y-1.5">
        {ADMIN_NAV.map(({ href, label, icon: Icon, description }) => {
          const isActive = pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={`flex items-start gap-3 px-3.5 py-2.5 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? 'bg-surface-elevated text-ink font-medium shadow-soft-card border border-stroke/60'
                  : 'text-ink-secondary hover:bg-surface-subtle/80 hover:text-ink'
              }`}>
              <div
                className={`p-1.5 rounded-xl transition-colors shrink-0 mt-0.5 ${
                  isActive ? 'bg-brand-light text-brand' : 'bg-transparent text-ink-muted group-hover:text-ink'
                }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className={`text-xs leading-tight ${isActive ? 'font-semibold text-ink' : 'font-normal text-ink-secondary group-hover:text-ink'}`}>
                  {label}
                </div>
                <div className="text-[10px] text-ink-muted leading-tight mt-0.5 line-clamp-1">
                  {description}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Back to Site */}
      <div className="p-4 border-t border-stroke/40">
        <Link
          href="/"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-surface-subtle border border-stroke/50 text-xs text-ink-secondary hover:text-ink hover:bg-surface-elevated transition-all font-medium shadow-2xs">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Kembali ke Situs</span>
        </Link>
      </div>
    </aside>
  )
}
