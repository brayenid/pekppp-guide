'use client'

import { useState } from 'react'
import { FileText } from 'lucide-react'
import { Button } from '../ui/Button'
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
      <Button
        variant="outline"
        size="sm"
        onClick={handleOpen}
        leftIcon={<FileText className="w-3.5 h-3.5" />}>
        Laporan Komprehensif
      </Button>

      <ComprehensiveReportModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        report={report}
        loading={loading}
      />
    </>
  )
}
