'use client'

import { useEffect } from 'react'
import { Printer } from 'lucide-react'

export function PrintButton({ autoPrint = true }: { autoPrint?: boolean }) {
  useEffect(() => {
    if (autoPrint) {
      const timer = setTimeout(() => {
        window.print()
      }, 400)
      return () => clearTimeout(timer)
    }
  }, [autoPrint])

  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer">
      <Printer className="w-4 h-4" />
      Cetak / Simpan PDF
    </button>
  )
}
