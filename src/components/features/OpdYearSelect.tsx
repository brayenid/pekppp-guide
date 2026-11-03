'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown } from 'lucide-react'

interface OpdYearSelectProps {
  years: number[]
  selectedYear: number | null
  defaultYear: number | null
  className?: string
  onChangeYear?: (year: number) => void
}

export function OpdYearSelect({
  years,
  selectedYear,
  defaultYear,
  className = '',
  onChangeYear
}: OpdYearSelectProps) {
  const router = useRouter()

  if (years.length <= 1) {
    return (
      <div
        className={`w-full px-3 py-2 rounded-xl bg-surface text-ink font-semibold text-xs border border-stroke/70 ${className}`}>
        Tahun {selectedYear || '-'}
      </div>
    )
  }

  const handleChange = (yr: number) => {
    if (onChangeYear) {
      onChangeYear(yr)
    } else {
      if (yr === defaultYear) {
        router.push('/opd')
      } else {
        router.push(`/opd?tahun=${yr}`)
      }
    }
  }

  return (
    <div className="relative w-full">
      <select
        value={selectedYear || ''}
        onChange={(e) => handleChange(Number(e.target.value))}
        aria-label="Pilih Tahun Penilaian"
        className={`w-full px-3 py-2 pr-8 rounded-xl border border-stroke/70 bg-surface text-ink text-xs font-semibold appearance-none focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer transition-colors ${className}`}>
        {years.map((yr) => (
          <option key={yr} value={yr}>
            Tahun {yr} {yr === defaultYear ? '(Aktif)' : '(Ditutup)'}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-ink-muted absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
    </div>
  )
}
