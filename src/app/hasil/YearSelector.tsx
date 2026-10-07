'use client'

import { useRouter } from 'next/navigation'
import { CalendarDays, ChevronDown } from 'lucide-react'

interface YearSelectorProps {
  currentYear: number
  allYears: number[]
}

export function YearSelector({ currentYear, allYears }: YearSelectorProps) {
  const router = useRouter()

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedYear = e.target.value
    router.push(`/hasil?year=${selectedYear}`)
  }

  return (
    <div className="relative inline-flex items-center">
      <CalendarDays className="w-3.5 h-3.5 text-brand absolute left-3.5 pointer-events-none" />
      <select
        value={currentYear}
        onChange={handleYearChange}
        aria-label="Pilih Tahun Evaluasi"
        className="pl-9 pr-8 py-1.5 text-xs font-semibold rounded-full border border-stroke/60 bg-surface hover:bg-surface-subtle text-ink appearance-none cursor-pointer focus:outline-none focus:border-brand shadow-2xs transition-colors">
        {allYears.map((year) => (
          <option key={year} value={year} className="bg-surface text-ink font-sans">
            Tahun {year}
          </option>
        ))}
      </select>
      <ChevronDown className="w-3.5 h-3.5 text-ink-muted absolute right-3 pointer-events-none" />
    </div>
  )
}
