'use client'

import { useRouter } from 'next/navigation'

interface OpdYearSelectProps {
  years: number[]
  selectedYear: number | null
  defaultYear: number | null
}

export function OpdYearSelect({ years, selectedYear, defaultYear }: OpdYearSelectProps) {
  const router = useRouter()

  if (years.length <= 1) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-pill bg-surface-subtle text-ink font-medium text-xs border border-stroke/50">
        Tahun {selectedYear || '-'}
      </span>
    )
  }

  return (
    <select
      value={selectedYear || ''}
      onChange={(e) => {
        const yr = Number(e.target.value)
        if (yr === defaultYear) {
          router.push('/opd')
        } else {
          router.push(`/opd?tahun=${yr}`)
        }
      }}
      aria-label="Pilih Tahun Penilaian"
      className="px-3 py-1.5 rounded-xl border border-stroke/70 bg-surface text-ink text-xs font-semibold focus:outline-none focus:border-brand cursor-pointer shadow-2xs transition-colors">
      {years.map((yr) => (
        <option key={yr} value={yr}>
          Tahun {yr} {yr === defaultYear ? '(Aktif)' : '(Ditutup)'}
        </option>
      ))}
    </select>
  )
}
