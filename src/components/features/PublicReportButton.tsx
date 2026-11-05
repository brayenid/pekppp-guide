'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'
import { ComprehensiveReportModal } from './ComprehensiveReportModal'
import { getComprehensiveAnnualReportAction, ComprehensiveAnnualReport } from '../../actions/report-actions'
import { toast } from 'sonner'

export function PublicReportButton({ year }: { year: number }) {
  const [isOpen, setIsOpen] = useState(false)
  const [report, setReport] = useState<ComprehensiveAnnualReport | null>(null)
  const [loading, setLoading] = useState(false)

  const handleOpen = async () => {
    setIsOpen(true)
    if (!report) {
      setLoading(true)
      try {
        const data = await getComprehensiveAnnualReportAction(year)
        setReport(data)
      } catch (err) {
        console.error(err)
        toast.error('Gagal memuat laporan komprehensif.')
      } finally {
        setLoading(false)
      }
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={loading}
        className="h-9 px-3.5 inline-flex items-center gap-1.5 text-xs font-semibold rounded-full border border-line bg-surface hover:bg-surface-subtle hover:border-brand/40 text-ink shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none active:scale-[0.98]">
        {loading ? (
          <Loader2 className="w-3.5 h-3.5 text-brand animate-spin" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-brand" />
        )}
        <span>Laporan Komprehensif</span>
      </button>

      <ComprehensiveReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        report={report}
        loading={loading}
      />
    </>
  )
}
