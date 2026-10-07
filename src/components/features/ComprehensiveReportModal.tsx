'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  FileText,
  Printer,
  Download,
  X,
  Search,
  Star
} from 'lucide-react'
import { ComprehensiveAnnualReport } from '../../actions/report-actions'
import { Button } from '../ui/Button'

interface ComprehensiveReportModalProps {
  isOpen: boolean
  onClose: () => void
  report: ComprehensiveAnnualReport | null
  loading?: boolean
}

export function ComprehensiveReportModal({
  isOpen,
  onClose,
  report,
  loading = false
}: ComprehensiveReportModalProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState<'ALL' | 'PRIORITY' | 'REGULAR'>('ALL')

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  if (loading || !report) {
    return createPortal(
      <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in-content">
        <div className="bg-surface rounded-bento border border-stroke p-8 max-w-sm w-full text-center space-y-4 shadow-xl">
          <div className="w-8 h-8 border-2 border-brand border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-ink">Menghitung Data Laporan Komprehensif...</p>
        </div>
      </div>,
      document.body
    )
  }

  // Filter rows
  const categories = Array.from(new Set(report.rows.map((r) => r.categoryName))).filter(Boolean)
  const priorityCount = report.rows.filter((r) => r.isPriority).length
  const filteredRows = report.rows.filter((r) => {
    const matchSearch = r.unitName.toLowerCase().includes(searchTerm.toLowerCase())
    const matchCat = categoryFilter === 'ALL' || r.categoryName === categoryFilter
    const matchPriority =
      priorityFilter === 'ALL' ||
      (priorityFilter === 'PRIORITY' && !!r.isPriority) ||
      (priorityFilter === 'REGULAR' && !r.isPriority)
    return matchSearch && matchCat && matchPriority
  })

  // Handle CSV Export
  const handleExportCsv = () => {
    const headers = [
      'Peringkat',
      'Nama Lokus',
      'Prioritas',
      'Kategori',
      'Status',
      'Kebijakan Pelayanan (24%)',
      'SDM (25%)',
      'Sarpras (18%)',
      'SIPP (11%)',
      'Konsultasi Pengaduan (10%)',
      'Inovasi (12%)',
      'Nilai F-02 (75%)',
      'Responden F-03',
      'Nilai F-03 (25%)',
      'Skor Akhir IPP (Skala 5)',
      'Persentase IPP',
      'Mutu/Huruf',
      'Predikat'
    ]

    const csvData = report.rows.map((r, idx) => [
      idx + 1,
      `"${r.unitName.replace(/"/g, '""')}"`,
      r.isPriority ? 'Prioritas' : 'Non-Prioritas',
      `"${r.categoryName.replace(/"/g, '""')}"`,
      r.isFinished ? 'Selesai' : 'Proses',
      r.aspectScores.kebijakanPelayanan.toFixed(1) + '%',
      r.aspectScores.sdm.toFixed(1) + '%',
      r.aspectScores.sarpras.toFixed(1) + '%',
      r.aspectScores.sipp.toFixed(1) + '%',
      r.aspectScores.konsultasi.toFixed(1) + '%',
      r.aspectScores.inovasi.toFixed(1) + '%',
      r.f02Scale5.toFixed(2),
      r.f03Count,
      r.f03Scale5.toFixed(2),
      r.finalIppScale5.toFixed(2),
      r.finalIppPercentage.toFixed(1) + '%',
      r.grade,
      `"${r.predicate}"`
    ])

    const csvContent = [
      `"LAPORAN HASIL PEKPPP MANDIRI TAHUN ANGGARAN ${report.year}"`,
      `"Kabupaten Kutai Barat"`,
      `"Rata-rata IPP: ${report.averageIpp.toFixed(2)} (${report.averagePredicate})"`,
      '',
      headers.join(','),
      ...csvData.map((row) => row.join(','))
    ].join('\r\n')

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', `Laporan_Hasil_PEKPPP_${report.year}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePrint = () => {
    window.print()
  }

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-2 sm:p-4 backdrop-blur-xs overflow-y-auto animate-fade-in-content print:static print:inset-auto print:block print:p-0 print:m-0 print:bg-white print:overflow-visible">
      {/* CSS Cetak Landscape A4 Langsung Halaman 1 Bersih Tanpa Blank Page */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          @page {
            size: A4 landscape;
            margin: 12mm 15mm 15mm 15mm;
          }

          html, body {
            height: auto !important;
            overflow: visible !important;
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          }

          /* Sembunyikan semua elemen bawaan layout di luar modal portal */
          body > * {
            display: none !important;
          }

          /* Tampilkan modal portal */
          body > div.fixed {
            display: block !important;
            position: static !important;
            padding: 0 !important;
            margin: 0 !important;
            overflow: visible !important;
            background: transparent !important;
          }

          #comprehensive-report-print {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            background: white !important;
            color: black !important;
            font-family: Arial, "Helvetica Neue", Helvetica, sans-serif !important;
            padding: 0 !important;
            margin: 0 !important;
            border: none !important;
            box-shadow: none !important;
          }

          /* Aturan Tabel & Baris Anti-Terpotong */
          table.report-table {
            width: 100% !important;
            border-collapse: collapse !important;
            page-break-inside: auto !important;
          }

          table.report-table thead {
            display: table-header-group !important; /* Header berulang di halaman lanjutan */
          }

          table.report-table tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }

          table.report-table td, table.report-table th {
            page-break-inside: avoid !important;
            border: 1px solid #333333 !important;
            padding: 5px 6px !important;
            color: black !important;
          }

          table.report-table th {
            background-color: #f3f4f6 !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .print-avoid-break {
            page-break-inside: avoid !important;
          }
        }
      `}} />

      <div
        id="comprehensive-report-print"
        className="bg-surface rounded-bento border border-stroke/70 w-full max-w-[1440px] max-h-[94vh] flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:max-h-none print:w-full print:rounded-none">
        
        {/* Modal Header & Toolbar (Screen Only) */}
        <div className="px-6 py-4 border-b border-stroke flex items-center justify-between bg-surface-subtle print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-ink">
                Laporan Hasil PEKPPP Mandiri Tahun {report.year}
              </h2>
              <p className="text-xs text-ink-muted">
                Rekapitulasi capaian 6 aspek, survei F-03, dan skor IPP seluruh lokus
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCsv}
              leftIcon={<Download className="w-3.5 h-3.5" />}>
              Ekspor CSV
            </Button>
            <Button
              variant="brand"
              size="sm"
              onClick={handlePrint}
              leftIcon={<Printer className="w-3.5 h-3.5" />}>
              Cetak Laporan / PDF
            </Button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors ml-2 cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body / Printable Content */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-5 flex-1 bg-surface print:p-0 print:overflow-visible print:space-y-4">
          
          {/* Judul Utama Resmi Laporan (Centered, Baris 2 Kabupaten Kutai Barat tanpa Permenpan) */}
          <div className="text-center print:text-center pb-2">
            <h1 className="text-base sm:text-lg font-black text-ink uppercase tracking-tight print:text-black print:text-base">
              LAPORAN HASIL PEKPPP MANDIRI TAHUN ANGGARAN {report.year}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-ink uppercase tracking-wide print:text-black mt-0.5">
              KABUPATEN KUTAI BARAT
            </p>
          </div>

          {/* Meta Info Format Dinas Resmi (Tabel Kolom Titik Dua Sejajar Tanpa Garis) */}
          <div className="text-xs text-ink print:text-black print-avoid-break max-w-xl">
            <table className="border-collapse text-xs print:text-xs">
              <tbody>
                <tr>
                  <td className="py-0.5 pr-4 font-medium text-ink print:text-black align-top whitespace-nowrap w-44">
                    Total Lokus Dinilai
                  </td>
                  <td className="py-0.5 pr-2 font-medium text-ink print:text-black align-top w-3">
                    :
                  </td>
                  <td className="py-0.5 font-bold text-ink print:text-black align-top">
                    {report.totalUnits} Lokus ({report.finishedUnits} Selesai)
                    {priorityCount > 0 && (
                      <span className="font-normal text-ink-secondary print:text-black ml-1.5">
                        &bull; {priorityCount} Lokus Prioritas
                      </span>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-4 font-medium text-ink print:text-black align-top whitespace-nowrap">
                    Rata-Rata IPP
                  </td>
                  <td className="py-0.5 pr-2 font-medium text-ink print:text-black align-top">
                    :
                  </td>
                  <td className="py-0.5 font-bold text-ink print:text-black align-top">
                    {report.averageIpp > 0 ? report.averageIpp.toFixed(2) : '-'} / 5.00 ({report.averageIppPercentage.toFixed(1)}% - {report.averagePredicate})
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-4 font-medium text-ink print:text-black align-top whitespace-nowrap">
                    Target Responden
                  </td>
                  <td className="py-0.5 pr-2 font-medium text-ink print:text-black align-top">
                    :
                  </td>
                  <td className="py-0.5 font-bold text-ink print:text-black align-top">
                    {report.targetF03Quota} Responden / Lokus (Bobot F-03: 25%)
                  </td>
                </tr>
                <tr>
                  <td className="py-0.5 pr-4 font-medium text-ink print:text-black align-top whitespace-nowrap">
                    Status Evaluasi
                  </td>
                  <td className="py-0.5 pr-2 font-medium text-ink print:text-black align-top">
                    :
                  </td>
                  <td className="py-0.5 font-bold text-ink print:text-black align-top">
                    {report.isPublished ? 'Resmi Dipublikasikan' : 'Internal Evaluator'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Filter Bar (Hidden on print) */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1 print:hidden">
            <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
              <div className="relative flex-1 sm:w-64">
                <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Cari lokus pelayanan..."
                  className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-stroke/60 bg-surface-subtle text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                />
              </div>

              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="px-3 py-1.5 text-xs rounded-lg border border-stroke/60 bg-surface-subtle text-ink cursor-pointer focus:outline-none focus:border-brand">
                <option value="ALL">Semua Lokus</option>
                <option value="PRIORITY">⭐ Hanya Prioritas ({priorityCount})</option>
                <option value="REGULAR">Non-Prioritas ({report.totalUnits - priorityCount})</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-stroke/60 bg-surface-subtle text-ink cursor-pointer focus:outline-none focus:border-brand">
                <option value="ALL">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="text-xs text-ink-muted self-end sm:self-center">
              Menampilkan <span className="font-semibold text-ink">{filteredRows.length}</span> dari {report.totalUnits} lokus
            </div>
          </div>

          {/* Comprehensive Table */}
          <div className="border border-stroke/70 rounded-xl overflow-hidden bg-surface print:border-none print:rounded-none">
            <div className="overflow-x-auto print:overflow-visible">
              <table className="report-table w-full text-left text-xs border-collapse print:text-[10px]">
                <thead>
                  <tr className="bg-surface-subtle/80 border-b border-stroke/60 font-semibold text-ink print:bg-gray-100 print:text-black print:font-bold">
                    <th className="py-2 px-2 w-8 text-center border-r border-stroke/40">No</th>
                    <th className="py-2 px-3 min-w-[170px] border-r border-stroke/40">Nama Lokus Pelayanan</th>
                    <th className="py-2 px-2 text-center border-r border-stroke/40">
                      Aspek 1<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(24%)</span>
                    </th>
                    <th className="py-2 px-2 text-center border-r border-stroke/40">
                      Aspek 2<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(25%)</span>
                    </th>
                    <th className="py-2 px-2 text-center border-r border-stroke/40">
                      Aspek 3<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(18%)</span>
                    </th>
                    <th className="py-2 px-2 text-center border-r border-stroke/40">
                      Aspek 4<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(11%)</span>
                    </th>
                    <th className="py-2 px-2 text-center border-r border-stroke/40">
                      Aspek 5<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(10%)</span>
                    </th>
                    <th className="py-2 px-2 text-center border-r border-stroke/40">
                      Aspek 6<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(12%)</span>
                    </th>
                    <th className="py-2 px-2.5 text-center border-r border-stroke/40 bg-surface-elevated/40 print:bg-gray-50">
                      F-02<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(75%)</span>
                    </th>
                    <th className="py-2 px-2.5 text-center border-r border-stroke/40 bg-surface-elevated/40 print:bg-gray-50">
                      F-03<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(25%)</span>
                    </th>
                    <th className="py-2 px-2.5 text-center border-r border-stroke/40 bg-brand/5 font-bold text-brand print:text-black print:font-black">
                      Skor IPP<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">(0-5)</span>
                    </th>
                    <th className="py-2 px-2.5 text-center">
                      Mutu<br /><span className="text-[9px] font-normal text-ink-muted print:text-black">Predikat</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke/40">
                  {filteredRows.map((row, idx) => (
                    <tr key={row.unitId} className="hover:bg-surface-subtle/40 transition-colors">
                      <td className="py-2 px-2 text-center font-medium text-ink-muted border-r border-stroke/30 print:text-black">
                        {idx + 1}
                      </td>
                      <td className="py-2 px-3 border-r border-stroke/30">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-ink print:text-black">{row.unitName}</span>
                          {row.isPriority && (
                            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-900 border border-amber-300 print:border-black print:bg-transparent print:text-black">
                              Prioritas
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-ink-muted print:text-gray-700">{row.categoryName}</div>
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-ink border-r border-stroke/30 print:text-black">
                        {row.aspectScores.kebijakanPelayanan.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-ink border-r border-stroke/30 print:text-black">
                        {row.aspectScores.sdm.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-ink border-r border-stroke/30 print:text-black">
                        {row.aspectScores.sarpras.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-ink border-r border-stroke/30 print:text-black">
                        {row.aspectScores.sipp.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-ink border-r border-stroke/30 print:text-black">
                        {row.aspectScores.konsultasi.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-center font-medium text-ink border-r border-stroke/30 print:text-black">
                        {row.aspectScores.inovasi.toFixed(1)}%
                      </td>
                      <td className="py-2 px-2 text-center font-semibold text-ink border-r border-stroke/30 bg-surface-elevated/20 print:text-black">
                        {row.f02Scale5.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center border-r border-stroke/30 bg-surface-elevated/20 print:text-black">
                        <span className="font-semibold text-ink print:text-black">{row.f03Scale5.toFixed(2)}</span>
                        <span className="block text-[9px] text-ink-muted print:text-gray-600">({row.f03Count} resp)</span>
                      </td>
                      <td className="py-2 px-2.5 text-center border-r border-stroke/30 bg-brand/5 font-black text-xs text-brand print:text-black print:font-bold">
                        {row.finalIppScale5.toFixed(2)}
                      </td>
                      <td className="py-2 px-2 text-center">
                        <span className="inline-block font-bold text-xs px-2 py-0.5 rounded bg-surface-elevated border border-stroke/50 text-ink print:border-black print:bg-transparent print:text-black">
                          {row.grade}
                        </span>
                        <span className="block text-[9px] font-medium text-ink-muted mt-0.5 print:text-black">
                          {row.predicate}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filteredRows.length === 0 && (
                    <tr>
                      <td colSpan={12} className="py-8 text-center text-ink-muted text-xs">
                        Tidak ada lokus yang sesuai dengan kriteria pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Lembar Pengesahan / Tanda Tangan Cetak (Anti Page Break) */}
          <div className="hidden print:grid grid-cols-2 pt-8 text-center text-xs print-avoid-break">
            <div>
              <p className="font-medium text-black">Mengetahui,</p>
              <p className="font-bold text-black uppercase">Kepala Bagian Organisasi Setda</p>
              <div className="h-16" />
              <p className="font-bold underline text-black">( .................................................. )</p>
              <p className="text-black text-[11px]">NIP. .....................................................</p>
            </div>
            <div>
              <p className="font-medium text-black">Sendawar, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
              <p className="font-bold text-black uppercase">Koordinator Tim Evaluator PEKPPP</p>
              <div className="h-16" />
              <p className="font-bold underline text-black">( .................................................. )</p>
              <p className="text-black text-[11px]">NIP. .....................................................</p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
