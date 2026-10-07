'use client'

import { useRouter } from 'next/navigation'
import { Filter } from 'lucide-react'

export function AspectFilterSelect({
  unitId,
  activeAspect,
  options
}: {
  unitId: string
  activeAspect: string
  options: Array<{ code: string; name: string; count: number }>
}) {
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    router.push(`/evaluasi/${unitId}?aspek=${val}`)
  }

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-slate-700 shrink-0" />
      <select
        value={activeAspect}
        onChange={handleChange}
        className="px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-900 focus:outline-none focus:border-slate-900 cursor-pointer shadow-2xs">
        <option value="all">Semua Pertanyaan (31 Pertanyaan)</option>
        {options.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.name} ({opt.count} Pertanyaan)
          </option>
        ))}
      </select>
    </div>
  )
}
