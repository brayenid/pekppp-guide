// src/components/features/BeritaAcaraWorkspaceClient.tsx
'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Printer,
  Send,
  Download,
  Upload,
  Plus,
  Copy,
  Check,
  ExternalLink,
  Users,
  FileCheck2,
  FileText,
  Sparkles,
  Loader2,
  ChevronRight,
  ShieldCheck,
  Layers,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import {
  saveAndSyncMenpanBapAction,
  addMenpanBapSignerAction,
  uploadSignedBapPdfToMenpanAction
} from '../../actions/menpan-actions'
import type {
  MenpanBapSectionItem,
  MenpanBapSignerItem,
  MenpanBapSigningLinks
} from '../../services/menpan-api-service'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'
import { MenpanRichTextEditor } from '../editor/MenpanRichTextEditor'
import { formatLegacyPipeNotesToHtml } from '../../lib/menpan-note-formatter'

export interface AspectSummaryRow {
  code: string
  romanCode: string
  sectionId: number
  name: string
  weight: number
  scoreScale5: number
  weightedScore: number
  percentage: number
}

export interface IndicatorComparisonRow {
  indicatorNumber: number
  code: string
  question: string
  aspectCode: string
  aspectName: string
  f01AnswerSummary: string
  f02Score: number | null
  notes: string | null
  proofUrl: string | null
}

export interface BeritaAcaraWorkspaceClientProps {
  evaluationId: string
  unitName: string
  categoryName: string
  year: number
  isFinished: boolean
  userRole: 'SUPER_ADMIN' | 'OPD'
  f02Pct: number
  f02Scale5: number
  f03Pct: number
  f03Count: number
  targetQuota: number
  isF03Qualified: boolean
  finalPct: number
  finalScale5: number
  grade: string
  predicate: string
  formattedAssessmentDate: string
  aspectSummaryRows: AspectSummaryRow[]
  indicatorRows: IndicatorComparisonRow[]
  boundFormsSummary: {
    groupUuid?: string | null
    F01?: string | null
    F02?: string | null
    F03?: string | null
  }
  initialBap: {
    groupUuid: string | null
    bapName: string
    printedAt: string
    bapNumber: string
    bapFileUrl: string | null
    bapFileSource: string | null
    lastSyncedAt: string | null
    sections: MenpanBapSectionItem[]
    evaluators: MenpanBapSignerItem[]
    knowers: MenpanBapSignerItem[]
    signingLinks: MenpanBapSigningLinks | null
  }
}

function stripHtmlTags(raw?: string | null): string {
  if (!raw) return ''
  return raw
    .replace(/<\/p>\s*<p>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .trim()
}

export function BeritaAcaraWorkspaceClient({
  evaluationId,
  unitName,
  categoryName,
  year,
  isFinished,
  userRole,
  f02Pct,
  f02Scale5,
  f03Pct,
  f03Count,
  targetQuota,
  isF03Qualified,
  finalPct,
  finalScale5,
  grade,
  predicate,
  formattedAssessmentDate,
  aspectSummaryRows,
  indicatorRows,
  boundFormsSummary,
  initialBap
}: BeritaAcaraWorkspaceClientProps) {
  const isSuperAdmin = userRole === 'SUPER_ADMIN'

  // Tab Mode: default ke Dokumen BAP agar rapi dan tenang
  const [activeTab, setActiveTab] = useState<'preview' | 'sections' | 'signers' | 'file'>('preview')
  const [showDetailedIndicators, setShowDetailedIndicators] = useState<boolean>(true)

  // State Data BAP
  const [bapName, setBapName] = useState<string>(initialBap.bapName || unitName)
  const [printedAt, setPrintedAt] = useState<string>(initialBap.printedAt)
  const [bapNumber, setBapNumber] = useState<string>(initialBap.bapNumber)
  const [sections, setSections] = useState<MenpanBapSectionItem[]>(
    initialBap.sections.map((s) => ({
      ...s,
      catatan: s.catatan || '',
      rekomendasi: s.rekomendasi || s.catatan || ''
    }))
  )
  const [evaluators, setEvaluators] = useState<MenpanBapSignerItem[]>(initialBap.evaluators || [])
  const [knowers, setKnowers] = useState<MenpanBapSignerItem[]>(initialBap.knowers || [])
  const [signingLinks] = useState<MenpanBapSigningLinks | null>(initialBap.signingLinks)
  const [bapFileSource, setBapFileSource] = useState<string | null>(initialBap.bapFileSource)
  const [groupUuid, setGroupUuid] = useState<string | null>(
    initialBap.groupUuid || boundFormsSummary.groupUuid || null
  )

  // State Form Tambah Penandatangan
  const [newSignerRole, setNewSignerRole] = useState<'evaluator' | 'mengetahui'>(
    isSuperAdmin ? 'evaluator' : 'mengetahui'
  )
  const [newSignerName, setNewSignerName] = useState<string>('')
  const [newSignerPosition, setNewSignerPosition] = useState<string>('')
  const [newSignerNip, setNewSignerNip] = useState<string>('')

  // State Loading & Copy
  const [savingBap, setSavingBap] = useState<boolean>(false)
  const [addingSigner, setAddingSigner] = useState<boolean>(false)
  const [uploadingPdf, setUploadingPdf] = useState<boolean>(false)
  const [selectedPdfFile, setSelectedPdfFile] = useState<File | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // State Credit Footer Cetak Website
  const [currentHost, setCurrentHost] = useState('pekppp.kutaibaratkab.go.id')
  const [printDateTimeStr, setPrintDateTimeStr] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const host = window.location.host || 'pekppp.kutaibaratkab.go.id'
      setCurrentHost(host)
      const now = new Date()
      const d = new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(now)
      const t = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
      setPrintDateTimeStr(`${d}, ${t} WITA`)
    }
  }, [])

  const handleCopyText = (key: string, text: string, label: string) => {
    navigator.clipboard.writeText(text)
    setCopiedKey(key)
    toast.success(`${label} berhasil disalin!`)
    setTimeout(() => setCopiedKey(null), 2000)
  }

  const handleSectionChange = (
    sectionId: number,
    field: 'kondisi' | 'catatan' | 'rekomendasi',
    value: string
  ) => {
    setSections((prev) =>
      prev.map((sec) => {
        if (sec.section_id !== sectionId) return sec
        if (field === 'rekomendasi') {
          const nextCatatan = !sec.catatan || sec.catatan === sec.rekomendasi ? value : sec.catatan
          return { ...sec, rekomendasi: value, catatan: nextCatatan }
        }
        return { ...sec, [field]: value }
      })
    )
  }

  const handleSaveAndSyncBap = async (pushToMenpan: boolean) => {
    setSavingBap(true)
    try {
      const formattedSections = sections.map((s) => {
        const cleanRekom = (s.rekomendasi || s.catatan || '').trim()
        const cleanCatatan = (s.catatan || cleanRekom).trim()
        return {
          section_id: s.section_id,
          kondisi: (s.kondisi || '').trim(),
          catatan: cleanCatatan
            ? cleanCatatan.startsWith('<')
              ? cleanCatatan
              : `<p>${cleanCatatan}</p>`
            : '',
          rekomendasi: cleanRekom
            ? cleanRekom.startsWith('<')
              ? cleanRekom
              : `<p>${cleanRekom}</p>`
            : ''
        }
      })

      const res = await saveAndSyncMenpanBapAction(evaluationId, {
        name: bapName,
        printed_at: printedAt,
        bapNumber,
        pushToMenpan,
        sections: formattedSections
      })

      if (res.success) {
        if (res.groupUuid) setGroupUuid(res.groupUuid)
        toast.success(res.message)
      } else {
        toast.error(res.message || 'Gagal menyimpan BAP.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat menyimpan BAP.')
    } finally {
      setSavingBap(false)
    }
  }

  const handleAddSigner = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newSignerName.trim()) {
      toast.error('Nama penandatangan wajib diisi.')
      return
    }
    setAddingSigner(true)
    try {
      const res = await addMenpanBapSignerAction(evaluationId, {
        role: newSignerRole,
        name: newSignerName.trim(),
        position: newSignerPosition.trim() || (newSignerRole === 'evaluator' ? 'Tim Evaluator PEKPPP' : `Kepala ${unitName}`),
        nip: newSignerNip.trim() || '-'
      })

      if (res.success) {
        toast.success(res.message)
        const newEntry: MenpanBapSignerItem = {
          id: `signer_${Date.now()}`,
          role: newSignerRole,
          name: newSignerName.trim(),
          position: newSignerPosition.trim() || (newSignerRole === 'evaluator' ? 'Tim Evaluator' : `Kepala ${unitName}`),
          nip: newSignerNip.trim() || '-'
        }
        if (newSignerRole === 'evaluator') {
          setEvaluators((prev) => [...prev, newEntry])
        } else {
          setKnowers((prev) => [...prev, newEntry])
        }
        setNewSignerName('')
        setNewSignerPosition('')
        setNewSignerNip('')
      } else {
        toast.error(res.message || 'Gagal menambahkan penandatangan.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan.')
    } finally {
      setAddingSigner(false)
    }
  }

  const handleUploadSignedPdf = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPdfFile) {
      toast.error('Pilih berkas PDF terlebih dahulu.')
      return
    }
    setUploadingPdf(true)
    try {
      const formData = new FormData()
      formData.set('file', selectedPdfFile)
      const res = await uploadSignedBapPdfToMenpanAction(evaluationId, formData)
      if (res.success) {
        toast.success(res.message || 'Berkas BAP berhasil diunggah ke MenPAN-RB!')
        setBapFileSource('uploaded')
        setSelectedPdfFile(null)
      } else {
        toast.error(res.message || 'Gagal mengunggah berkas PDF BAP.')
      }
    } catch (err: any) {
      toast.error(err.message || 'Terjadi kesalahan saat mengunggah berkas.')
    } finally {
      setUploadingPdf(false)
    }
  }

  // Format tanggal untuk kop narasi
  const parsedPrintDate = new Date(printedAt)
  const formattedPrintDate = !isNaN(parsedPrintDate.getTime())
    ? new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      }).format(parsedPrintDate)
    : printedAt

  const backUrl = isSuperAdmin ? `/admin/periode/${year}` : `/opd`

  return (
    <div className="w-full min-w-0 space-y-4 pb-16">
      {/* CSS Override for Multi-Page Clean A4 Printing Layout with Running Fixed Footer Credit */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 18mm 12mm;
          }

          html, body {
            overflow: visible !important;
            height: auto !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            color: #000000 !important;
          }

          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
          }

          header, nav, aside, footer, .print\\:hidden, [data-print-hidden="true"] {
            display: none !important;
          }

          #print-area {
            display: block !important;
            position: static !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #ffffff !important;
            color: #000000 !important;
            font-size: 11px !important;
            line-height: 1.4 !important;
          }

          #print-area h1,
          #print-area h2,
          #print-area h3 {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            break-after: avoid !important;
            page-break-after: avoid !important;
          }

          #print-area h1,
          #print-area h2,
          #print-area p,
          #print-area table,
          #print-area td,
          #print-area th,
          #print-area div,
          #print-area span {
            font-size: 11px !important;
          }

          .print-lampiran-section {
            page-break-before: always !important;
            break-before: page !important;
          }

          .signature-section {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .print-page-credit {
            display: block !important;
            position: fixed !important;
            bottom: 3mm !important;
            left: 0 !important;
            right: 0 !important;
            text-align: center !important;
            font-size: 8px !important;
            color: #666666 !important;
            border-top: 0.5px solid #d1d5db !important;
            padding-top: 2px !important;
            background: #ffffff !important;
            z-index: 9999 !important;
          }

          table {
            page-break-inside: auto !important;
          }
          tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
            break-after: avoid !important;
          }
          tfoot {
            display: table-footer-group !important;
          }
        }
      `
        }}
      />

      {/* =====================================================================
          HEADER TENANG & RINGKAS (AKSI UTAMA & STATUS) - NON-PRINT
      ===================================================================== */}
      <div className="print:hidden rounded-2xl border border-stroke/70 bg-surface shadow-soft-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-base sm:text-lg font-bold text-ink">
                Berita Acara Penilaian (BAP)
              </h1>
              <span className="text-xs font-medium text-ink-secondary">· {unitName}</span>
              <Badge variant="neutral" size="sm">
                Tahun {year}
              </Badge>
              <Badge variant={finalPct >= 80 ? 'success' : 'info'} size="sm">
                IPP: {finalScale5.toFixed(2)} ({predicate})
              </Badge>
              {groupUuid && (
                <span className="text-[10px] font-mono text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-stroke/50">
                  MenPAN: Terhubung
                </span>
              )}
            </div>
          </div>

          {/* Tombol Aksi Cepat Dokumen */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <label className="inline-flex items-center gap-1.5 text-xs text-ink-secondary cursor-pointer select-none px-2.5 py-1.5 rounded-xl border border-stroke/60 bg-surface hover:bg-surface-subtle transition-colors">
              <input
                type="checkbox"
                checked={showDetailedIndicators}
                onChange={(e) => setShowDetailedIndicators(e.target.checked)}
                className="rounded border-stroke text-brand focus:ring-brand"
              />
              <span>Lampiran 31 Indikator</span>
            </label>

            {groupUuid && (
              <a
                href={`/api/menpan/bap-pdf/${evaluationId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface hover:bg-surface-subtle text-ink border border-stroke text-xs font-semibold transition-all shadow-2xs">
                <Download className="w-3.5 h-3.5 text-brand" />
                <span>PDF MenPAN-RB</span>
              </a>
            )}

            <Button
              type="button"
              variant="brand"
              size="sm"
              onClick={() => window.print()}
              leftIcon={<Printer className="w-3.5 h-3.5" />}>
              Cetak Dokumen (A4)
            </Button>
          </div>
        </div>

        {/* Tab Switcher - Hanya Tampil untuk Admin agar Layar Tidak Berantakan */}
        {isSuperAdmin && (
          <div className="flex items-center gap-1 border-t border-stroke/50 pt-3 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'preview'
                  ? 'bg-brand text-white shadow-2xs'
                  : 'bg-surface-subtle text-ink-secondary hover:text-ink'
              }`}>
              <FileCheck2 className="w-3.5 h-3.5" />
              <span>Dokumen BAP (Pratinjau Cetak)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('sections')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'sections'
                  ? 'bg-brand text-white shadow-2xs'
                  : 'bg-surface-subtle text-ink-secondary hover:text-ink'
              }`}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Editor Rekomendasi (7 Aspek)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('signers')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'signers'
                  ? 'bg-brand text-white shadow-2xs'
                  : 'bg-surface-subtle text-ink-secondary hover:text-ink'
              }`}>
              <Users className="w-3.5 h-3.5" />
              <span>Penandatangan &amp; TTE ({evaluators.length + knowers.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('file')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'file'
                  ? 'bg-brand text-white shadow-2xs'
                  : 'bg-surface-subtle text-ink-secondary hover:text-ink'
              }`}>
              <Upload className="w-3.5 h-3.5" />
              <span>Berkas PDF Terunggah</span>
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          TAB 2: EDITOR PENGAMATAN & REKOMENDASI (7 ASPEK) - ADMIN ONLY
      ===================================================================== */}
      {isSuperAdmin && activeTab === 'sections' && (
        <div className="print:hidden rounded-2xl border border-stroke/70 bg-surface shadow-soft-card p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stroke/50">
            <div>
              <h2 className="text-sm font-bold text-ink">
                Editor Catatan &amp; Rekomendasi 7 Aspek (PUT /bap)
              </h2>
              <p className="text-xs text-ink-muted">
                Perbarui nama lokus, tanggal cetak, serta catatan &amp; rekomendasi per aspek untuk sinkronisasi portal MenPAN-RB.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={savingBap}
                onClick={() => handleSaveAndSyncBap(false)}>
                Simpan
              </Button>
              <Button
                type="button"
                variant="brand"
                size="sm"
                disabled={savingBap}
                onClick={() => handleSaveAndSyncBap(true)}
                leftIcon={
                  savingBap ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Send className="w-3.5 h-3.5" />
                  )
                }>
                {savingBap ? 'Menyinkronkan...' : 'Simpan & Push'}
              </Button>
            </div>
          </div>

          {/* Form Header Nama Lokus & Tanggal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-xl bg-surface-subtle/50 border border-stroke/50">
            <div>
              <label className="block text-[10px] font-semibold text-ink-muted uppercase mb-1">
                Nama Lokus (Header Surat)
              </label>
              <input
                type="text"
                value={bapName}
                onChange={(e) => setBapName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stroke bg-surface text-ink focus:outline-none focus:border-brand font-medium"
              />
            </div>
            <div>
              <label className="block text-[10px] font-semibold text-ink-muted uppercase mb-1">
                Tanggal BAP (printed_at)
              </label>
              <input
                type="date"
                value={printedAt}
                onChange={(e) => setPrintedAt(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-stroke bg-surface text-ink focus:outline-none focus:border-brand font-medium"
              />
            </div>
          </div>

          {/* Daftar 7 Section Aspek (Format 3 Kolom Selaras MenPAN-RB) */}
          <div className="space-y-4 pt-1">
            {sections.map((sec, idx) => {
              const summary = aspectSummaryRows.find((r) => r.sectionId === sec.section_id)
              const filledCount = [
                Boolean(stripHtmlTags(sec.kondisi).trim()),
                Boolean(stripHtmlTags(sec.catatan).trim()),
                Boolean(stripHtmlTags(sec.rekomendasi).trim())
              ].filter(Boolean).length

              return (
                <div
                  key={sec.section_id}
                  className="p-4 sm:p-5 rounded-2xl border border-stroke/70 bg-surface space-y-3.5 shadow-2xs">
                  {/* Header Kartu Aspek dengan Status Pengisian MenPAN-RB */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-stroke/40 pb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-brand/10 text-brand">
                        Section #{sec.section_id}
                      </span>
                      <h3 className="text-xs sm:text-sm font-bold text-ink">
                        {idx < 6 ? `Aspek ${idx + 1}: ${sec.name}` : sec.name}
                      </h3>
                      {summary && summary.weight > 0 && (
                        <span className="text-[10px] text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-stroke/50">
                          Bobot {summary.weight}%
                        </span>
                      )}
                      <span
                        className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-colors ${
                          filledCount === 3
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
                            : filledCount > 0
                            ? 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800'
                            : 'bg-surface-subtle text-ink-muted border-stroke/60'
                        }`}>
                        Terisi {filledCount} dari 3 kolom
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            `cat_${sec.section_id}`,
                            sec.catatan || '',
                            `Catatan ${sec.name}`
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-brand cursor-pointer transition-colors">
                        {copiedKey === `cat_${sec.section_id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Salin Catatan</span>
                      </button>

                      <span className="text-stroke">·</span>

                      <button
                        type="button"
                        onClick={() =>
                          handleCopyText(
                            `sec_${sec.section_id}`,
                            sec.rekomendasi || '',
                            `Rekomendasi ${sec.name}`
                          )
                        }
                        className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-brand cursor-pointer transition-colors">
                        {copiedKey === `sec_${sec.section_id}` ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Salin Rekomendasi</span>
                      </button>
                    </div>
                  </div>

                  {/* 3 Kolom Editor: Kondisi, Catatan, Rekomendasi (Identik MenPAN-RB) */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3.5 items-stretch">
                    {/* Kolom 1: Kondisi */}
                    <div className="flex flex-col space-y-1.5 p-3 rounded-xl bg-surface-subtle/30 border border-stroke/60">
                      <div className="flex items-center justify-between pb-1 border-b border-stroke/30">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <span>Kondisi</span>
                          <span className="text-[10px] font-normal text-ink-muted">(Faktual F-02)</span>
                        </label>
                      </div>
                      <MenpanRichTextEditor
                        value={sec.kondisi || ''}
                        onChange={(html) => handleSectionChange(sec.section_id, 'kondisi', html)}
                        placeholder="Rangkuman kondisi faktual penyelenggaraan pelayanan publik di lapangan..."
                        minHeight="140px"
                      />
                    </div>

                    {/* Kolom 2: Catatan */}
                    <div className="flex flex-col space-y-1.5 p-3 rounded-xl bg-surface-subtle/30 border border-stroke/60">
                      <div className="flex items-center justify-between pb-1 border-b border-stroke/30">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <span>Catatan</span>
                          <span className="text-[10px] font-normal text-ink-muted">(Temuan / Bukti)</span>
                        </label>
                      </div>
                      <MenpanRichTextEditor
                        value={sec.catatan || ''}
                        onChange={(html) => handleSectionChange(sec.section_id, 'catatan', html)}
                        placeholder="Catatan temuan evaluator, verifikasi bukti dokumen F-01, kendala lapangan..."
                        minHeight="140px"
                      />
                    </div>

                    {/* Kolom 3: Rekomendasi */}
                    <div className="flex flex-col space-y-1.5 p-3 rounded-xl bg-surface-subtle/30 border border-stroke/60">
                      <div className="flex items-center justify-between pb-1 border-b border-stroke/30">
                        <label className="text-xs font-bold text-ink flex items-center gap-1.5">
                          <span>Rekomendasi</span>
                          <span className="text-[10px] font-normal text-ink-muted">(Tindak Lanjut OPD)</span>
                        </label>
                      </div>
                      <MenpanRichTextEditor
                        value={sec.rekomendasi || ''}
                        onChange={(html) => handleSectionChange(sec.section_id, 'rekomendasi', html)}
                        placeholder="Rekomendasi arahan perbaikan yang harus ditindaklanjuti OPD..."
                        minHeight="140px"
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 3: PENANDATANGAN & TTE MENPAN-RB (ADMIN ONLY)
      ===================================================================== */}
      {isSuperAdmin && activeTab === 'signers' && (
        <div className="print:hidden rounded-2xl border border-stroke/70 bg-surface shadow-soft-card p-5 space-y-4">
          <div className="pb-3 border-b border-stroke/50">
            <h2 className="text-sm font-bold text-ink">
              Penandatangan BAP &amp; Tautan Tanda Tangan Digital (TTE)
            </h2>
            <p className="text-xs text-ink-muted">
              Kelola pejabat penandatangan BAP serta bagikan tautan tanda tangan elektronik MenPAN-RB.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* Form Tambah Penandatangan */}
            <form onSubmit={handleAddSigner} className="lg:col-span-5 p-4 rounded-xl border border-stroke/60 bg-surface-subtle/40 space-y-3">
              <div className="text-xs font-bold text-ink flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-brand" />
                <span>Tambah Penandatangan (POST /bap/signers)</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setNewSignerRole('evaluator')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    newSignerRole === 'evaluator'
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'bg-surface border-stroke/60 text-ink-secondary'
                  }`}>
                  Tim Evaluator
                </button>
                <button
                  type="button"
                  onClick={() => setNewSignerRole('mengetahui')}
                  className={`py-1.5 px-2.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                    newSignerRole === 'mengetahui'
                      ? 'bg-brand/10 border-brand text-brand'
                      : 'bg-surface border-stroke/60 text-ink-secondary'
                  }`}>
                  Pihak Lokus
                </button>
              </div>

              <div className="space-y-2">
                <input
                  type="text"
                  value={newSignerName}
                  onChange={(e) => setNewSignerName(e.target.value)}
                  placeholder="Nama Lengkap & Gelar (Wajib)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stroke bg-surface text-ink"
                />
                <input
                  type="text"
                  value={newSignerPosition}
                  onChange={(e) => setNewSignerPosition(e.target.value)}
                  placeholder={
                    newSignerRole === 'evaluator'
                      ? 'Jabatan (misal: Ketua Tim Evaluator Bagian Organisasi)'
                      : `Jabatan (misal: Kepala ${unitName})`
                  }
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stroke bg-surface text-ink"
                />
                <input
                  type="text"
                  value={newSignerNip}
                  onChange={(e) => setNewSignerNip(e.target.value)}
                  placeholder="NIP (misal: 198501012010011001)"
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-stroke bg-surface text-ink"
                />
              </div>

              <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={addingSigner || !newSignerName.trim()}
                leftIcon={<Plus className="w-3.5 h-3.5" />}>
                {addingSigner ? 'Menambahkan...' : 'Simpan Penandatangan'}
              </Button>
            </form>

            {/* Kolom Kanan: Tautan TTE & Daftar Penandatangan */}
            <div className="lg:col-span-7 space-y-3">
              {/* Card Tautan TTE Digital */}
              {signingLinks && (
                <div className="p-3.5 rounded-xl border border-brand/30 bg-brand-light/30 space-y-2">
                  <div className="text-xs font-bold text-brand flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Tautan Tanda Tangan Digital MenPAN-RB (/bap/signing-links)</span>
                  </div>
                  {(() => {
                    const evalUrl = signingLinks.evaluator_signing_url || signingLinks.evaluator_url
                    const knowUrl = signingLinks.knower_signing_url || signingLinks.knower_url
                    return (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {evalUrl && (
                          <div className="p-2.5 rounded-lg bg-surface border border-stroke/60 space-y-1.5">
                            <div className="font-semibold text-ink text-[11px]">TTE Tim Evaluator</div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyText('tte_eval', evalUrl, 'Tautan TTE Evaluator')}
                                className="px-2 py-1 rounded bg-surface-subtle hover:bg-surface border border-stroke text-[11px] font-medium text-ink cursor-pointer">
                                {copiedKey === 'tte_eval' ? 'Tersalin' : 'Salin Tautan'}
                              </button>
                              <a
                                href={evalUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-brand hover:text-brand-hover">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}

                        {knowUrl && (
                          <div className="p-2.5 rounded-lg bg-surface border border-stroke/60 space-y-1.5">
                            <div className="font-semibold text-ink text-[11px]">TTE Pihak Lokus (Mengetahui)</div>
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleCopyText('tte_know', knowUrl, 'Tautan TTE Lokus')}
                                className="px-2 py-1 rounded bg-surface-subtle hover:bg-surface border border-stroke text-[11px] font-medium text-ink cursor-pointer">
                                {copiedKey === 'tte_know' ? 'Tersalin' : 'Salin Tautan'}
                              </button>
                              <a
                                href={knowUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 rounded text-brand hover:text-brand-hover">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })()}
                </div>
              )}

              {/* Daftar Penandatangan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-stroke/60 bg-surface-subtle/30 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-ink-muted">
                    Tim Evaluator ({evaluators.length})
                  </div>
                  {evaluators.length === 0 ? (
                    <p className="text-xs text-ink-muted italic">Belum ada nama evaluator ditambahkan.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {evaluators.map((ev, i) => (
                        <div key={ev.id || i} className="p-2 rounded-lg bg-surface border border-stroke/40 text-xs">
                          <div className="font-semibold text-ink">{ev.name}</div>
                          <div className="text-[11px] text-ink-secondary">{ev.position || 'Evaluator'}</div>
                          {ev.nip && <div className="text-[10px] font-mono text-ink-muted">NIP. {ev.nip}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded-xl border border-stroke/60 bg-surface-subtle/30 space-y-2">
                  <div className="text-[11px] font-bold uppercase text-ink-muted">
                    Pihak Lokus ({knowers.length})
                  </div>
                  {knowers.length === 0 ? (
                    <p className="text-xs text-ink-muted italic">Belum ada pejabat lokus ditambahkan.</p>
                  ) : (
                    <div className="space-y-1.5">
                      {knowers.map((kn, i) => (
                        <div key={kn.id || i} className="p-2 rounded-lg bg-surface border border-stroke/40 text-xs">
                          <div className="font-semibold text-ink">{kn.name}</div>
                          <div className="text-[11px] text-ink-secondary">{kn.position || unitName}</div>
                          {kn.nip && <div className="text-[10px] font-mono text-ink-muted">NIP. {kn.nip}</div>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          TAB 4: UNGGAH BERKAS PDF BAP BERTANDATANGAN (ADMIN ONLY)
      ===================================================================== */}
      {isSuperAdmin && activeTab === 'file' && (
        <div className="print:hidden rounded-2xl border border-stroke/70 bg-surface shadow-soft-card p-5 space-y-4">
          <div className="pb-3 border-b border-stroke/50">
            <h2 className="text-sm font-bold text-ink">
              Unggah Berkas PDF BAP yang Telah Ditandatangani (/bap/file/presign &amp; confirm)
            </h2>
            <p className="text-xs text-ink-muted">
              Kirimkan berkas PDF BAP fisik yang sudah bertanda tangan basah/stempel ke server penyimpanan MenPAN-RB (<code>baskom.menpan.go.id</code>).
            </p>
          </div>

          <form
            onSubmit={handleUploadSignedPdf}
            className="p-4 rounded-xl border border-stroke/60 bg-surface-subtle/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1 max-w-xl text-xs">
              <div className="font-semibold text-ink">Pilih Berkas PDF BAP</div>
              <p className="text-ink-secondary">
                Format yang diizinkan hanya .pdf dengan ukuran maksimal 25 MB.
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap shrink-0">
              <input
                type="file"
                accept="application/pdf,.pdf"
                onChange={(e) => setSelectedPdfFile(e.target.files?.[0] || null)}
                className="text-xs text-ink-secondary file:mr-2.5 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-brand/10 file:text-brand hover:file:bg-brand/20 cursor-pointer"
              />
              <Button
                type="submit"
                variant="brand"
                size="sm"
                disabled={uploadingPdf || !selectedPdfFile}
                leftIcon={
                  uploadingPdf ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2Icon className="w-3.5 h-3.5" />
                  )
                }>
                {uploadingPdf ? 'Mengunggah ke MenPAN-RB...' : 'Unggah & Konfirmasi BAP'}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* =====================================================================
          TAB 1: DOKUMEN KERTAS BERITA ACARA RESMI (A4 PORTRAIT)
          Tampil bersih, tenang, berwibawa, dan 100% rapi saat dicetak
      ===================================================================== */}
      {(activeTab === 'preview' || !isSuperAdmin) && (
        <div
          id="print-area"
          className="bg-white text-black border border-neutral-300 p-6 sm:p-8 space-y-4 shadow-sm print:border-none print:shadow-none print:p-0 print:m-0 font-sans text-[11px]"
          style={{ borderRadius: 0 }}>
          {/* KOP RESMI DOKUMEN BAP (SESUAI FORMAT RESMI MENPAN-RB, TANPA NOMOR & TANPA LOGO) */}
          <div className="text-center pt-1 pb-1 space-y-1">
            <h1 className="font-bold text-[11px] uppercase tracking-normal text-black leading-snug">
              BERITA ACARA HASIL PEMANTAUAN DAN EVALUASI PENYELENGGARAAN PELAYANAN
              <br />
              PUBLIK
              <br />
              PADA {(bapName || unitName).toUpperCase()}
              <br />
              TAHUN {year}
            </h1>
            <div className="w-full border-b-2 border-black pt-2 pb-0.5" />
          </div>

          {/* PARAGRAF PEMBUKA LEGAL RESMI */}
          <p className="text-[11px] leading-relaxed text-neutral-900 text-justify indent-8">
            Pada hari ini, <strong>{formattedPrintDate}</strong>, telah dilaksanakan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik (PEKPPP) Tahun Anggaran {year} terhadap unit pelayanan publik <strong>{unitName}</strong> Pemerintah Kabupaten Kutai Barat berdasarkan pedoman dan ketentuan Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi Republik Indonesia.
          </p>

          {/* TABEL RINGKASAN DATA LOKUS & HASIL AKHIR PENILAIAN */}
          <table className="w-full text-[11px] border border-neutral-400" style={{ borderCollapse: 'collapse' }}>
            <tbody>
              <tr className="border-b border-neutral-400">
                <td className="w-1/3 bg-neutral-100 px-3 py-1.5 font-semibold text-neutral-800 border-r border-neutral-400">
                  Nama Unit Pelayanan (Lokus)
                </td>
                <td className="w-2/3 px-3 py-1.5 font-bold text-black uppercase">
                  {unitName}
                </td>
              </tr>
              <tr className="border-b border-neutral-400">
                <td className="bg-neutral-100 px-3 py-1.5 font-semibold text-neutral-800 border-r border-neutral-400">
                  Kategori Unit &amp; Tahun Evaluasi
                </td>
                <td className="px-3 py-1.5 text-neutral-900">
                  {categoryName} - Tahun Anggaran {year} ({isFinished ? 'FINAL / SELESAI' : 'SEMENTARA'})
                </td>
              </tr>
              <tr className="border-b border-neutral-400">
                <td className="bg-neutral-100 px-3 py-1.5 font-semibold text-neutral-800 border-r border-neutral-400">
                  Komponen Nilai F-02 &amp; Survei F-03
                </td>
                <td className="px-3 py-1.5 text-black">
                  <strong>F-02 Evaluator (Bobot 75%):</strong> Indeks {f02Scale5.toFixed(2)} ({f02Pct.toFixed(2)}%) &nbsp;|&nbsp;{' '}
                  <strong>F-03 Survei Masyarakat (Bobot 25%):</strong>{' '}
                  {f03Count > 0
                    ? `${f03Pct.toFixed(2)}% (${f03Count}/${targetQuota} responden${isF03Qualified ? '' : ' - Proporsional'})`
                    : 'Belum Terisi'}
                </td>
              </tr>
              <tr>
                <td className="bg-neutral-100 px-3 py-1.5 font-semibold text-neutral-800 border-r border-neutral-400">
                  Indeks Pelayanan Publik (IPP) &amp; Predikat
                </td>
                <td className="px-3 py-1.5 font-bold text-black">
                  Indeks Skala 5: {finalScale5.toFixed(2)} ({finalPct.toFixed(2)}%) - Kategori Mutu: {grade} ({predicate})
                </td>
              </tr>
            </tbody>
          </table>

          {/* TABEL 1: REKAPITULASI CAPAIAN, KONDISI PENGAMATAN, DAN REKOMENDASI PER ASPEK */}
          <div className="space-y-1.5 pt-1">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-black">
              I. Ringkasan Capaian, Kondisi Pengamatan &amp; Rekomendasi Evaluator per Aspek (F-02 &amp; BAP MenPAN-RB)
            </h2>
            <table className="w-full text-[11px] border border-neutral-400" style={{ borderCollapse: 'collapse' }}>
              <thead className="bg-neutral-100 border-b border-neutral-400 text-neutral-900">
                <tr>
                  <th className="px-2 py-1.5 text-center w-[32px] font-bold border-r border-neutral-400">No</th>
                  <th className="px-2.5 py-1.5 text-left w-[150px] font-bold border-r border-neutral-400">
                    Aspek Penilaian &amp; Bobot
                  </th>
                  <th className="px-2 py-1.5 text-center w-[72px] font-bold border-r border-neutral-400">
                    Indeks &amp; Capaian
                  </th>
                  <th className="px-2.5 py-1.5 text-left w-[34%] font-bold border-r border-neutral-400">
                    Kondisi Pengamatan (F-02)
                  </th>
                  <th className="px-2.5 py-1.5 text-left font-bold">
                    Catatan &amp; Rekomendasi Perbaikan Evaluator
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-400">
                {sections.map((sec, idx) => {
                  const summary = aspectSummaryRows.find((r) => r.sectionId === sec.section_id)
                  const rawRekomHtml = sec.rekomendasi || sec.catatan || ''
                  const hasRekomContent = Boolean(stripHtmlTags(rawRekomHtml).trim())
                  return (
                    <tr key={sec.section_id} className="align-top">
                      <td className="px-2 py-2 text-center font-mono text-neutral-800 border-r border-neutral-400">
                        {idx < 6 ? summary?.romanCode || idx + 1 : '+'}
                      </td>
                      <td className="px-2.5 py-2 border-r border-neutral-400">
                        <div className="font-bold text-black">{sec.name}</div>
                        {summary && summary.weight > 0 ? (
                          <div className="text-[10px] text-neutral-600 mt-0.5">
                            Bobot Aspek: {summary.weight}%
                          </div>
                        ) : (
                          <div className="text-[10px] text-neutral-600 mt-0.5">
                            Suplemen / Tambahan
                          </div>
                        )}
                      </td>
                      <td className="px-2 py-2 text-center border-r border-neutral-400">
                        {summary && summary.weight > 0 ? (
                          <>
                            <div className="font-bold text-black text-xs">
                              {summary.scoreScale5.toFixed(2)}
                            </div>
                            <div className="text-[10px] text-neutral-700">
                              ({summary.percentage.toFixed(1)}%)
                            </div>
                          </>
                        ) : (
                          <span className="text-neutral-500">-</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 text-neutral-800 leading-snug border-r border-neutral-400 text-justify">
                        {sec.kondisi && stripHtmlTags(sec.kondisi).trim() !== '' ? (
                          /<[a-z][\s\S]*>/i.test(sec.kondisi) ? (
                            <div
                              className="prose prose-sm max-w-none text-neutral-800 text-[11px] leading-snug [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5 [&_ul]:my-0.5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-0.5 [&_ol]:my-0.5 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:font-bold"
                              dangerouslySetInnerHTML={{ __html: sec.kondisi }}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">{sec.kondisi}</div>
                          )
                        ) : (
                          <span className="text-neutral-400 italic">Belum ada ringkasan kondisi</span>
                        )}
                      </td>
                      <td className="px-2.5 py-2 text-neutral-900 leading-snug">
                        {hasRekomContent ? (
                          <div className="space-y-2 text-[11px] leading-snug">
                            {Boolean(stripHtmlTags(sec.catatan).trim()) && (
                              <div>
                                {Boolean(stripHtmlTags(sec.rekomendasi).trim()) && (
                                  <div className="font-bold text-black uppercase text-[9px] tracking-wider mb-0.5">
                                    Catatan Telaah Evaluator:
                                  </div>
                                )}
                                {/<[a-z][\s\S]*>/i.test(sec.catatan) ? (
                                  <div
                                    className="prose prose-sm max-w-none text-neutral-900 text-[11px] leading-snug [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5 [&_ul]:my-0.5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-0.5 [&_ol]:my-0.5 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:font-bold"
                                    dangerouslySetInnerHTML={{ __html: sec.catatan }}
                                  />
                                ) : (
                                  <div className="whitespace-pre-wrap">{sec.catatan}</div>
                                )}
                              </div>
                            )}

                            {Boolean(stripHtmlTags(sec.rekomendasi).trim()) && (
                              <div>
                                {Boolean(stripHtmlTags(sec.catatan).trim()) && (
                                  <div className="font-bold text-black uppercase text-[9px] tracking-wider mb-0.5">
                                    Rekomendasi Tindak Lanjut:
                                  </div>
                                )}
                                {/<[a-z][\s\S]*>/i.test(sec.rekomendasi) ? (
                                  <div
                                    className="prose prose-sm max-w-none text-neutral-900 text-[11px] leading-snug [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5 [&_ul]:my-0.5 [&_ol]:list-decimal [&_ol]:list-inside [&_ol]:space-y-0.5 [&_ol]:my-0.5 [&_p]:mb-1 [&_p:last-child]:mb-0 [&_strong]:font-bold"
                                    dangerouslySetInnerHTML={{ __html: sec.rekomendasi }}
                                  />
                                ) : (
                                  <div className="whitespace-pre-wrap">{sec.rekomendasi}</div>
                                )}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-neutral-400 italic">Tidak ada catatan rekomendasi</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* PERNYATAAN PENUTUP & KESEPAKATAN LEGAL */}
          <div className="pt-2" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            <p className="text-[11px] leading-relaxed text-neutral-900 text-justify">
              Demikian Berita Acara ini dibuat dan disepakati bersama dengan penuh tanggung jawab sebagai hasil resmi evaluasi pelayanan publik untuk dipergunakan sebagai bahan penetapan indeks dan tindak lanjut perbaikan mutu pelayanan secara berkelanjutan.
            </p>
          </div>

          {/* AREA TANDA TANGAN LEGAL (DINAMIS DARI DATA PENANDATANGAN ATAU DEFAULT) */}
          <div className="pt-4 grid grid-cols-2 gap-8 text-[11px] text-center signature-section" style={{ pageBreakInside: 'avoid', breakInside: 'avoid' }}>
            {/* Pihak Lokus (Mengetahui) */}
            <div className="space-y-16">
              <div>
                <p className="text-neutral-700">Pihak Unit Pelayanan Publik (Lokus),</p>
                <p className="font-bold text-black uppercase mt-0.5">
                  {knowers[0]?.position || `Kepala ${unitName}`}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-black underline underline-offset-2">
                  {knowers[0]?.name || '__________________________'}
                </p>
                <p className="font-mono text-[11px] text-neutral-700">
                  {knowers[0]?.nip && knowers[0].nip !== '-' ? `NIP. ${knowers[0].nip}` : 'NIP. ........................................'}
                </p>
              </div>
            </div>

            {/* Tim Evaluator Pemkab Kutai Barat */}
            <div className="space-y-16">
              <div>
                <p className="text-neutral-700">Sendawar, {formattedPrintDate}</p>
                <p className="font-bold text-black uppercase mt-0.5">
                  {evaluators[0]?.position || 'Ketua Tim Evaluator PEKPPP Kab. Kutai Barat'}
                </p>
              </div>
              <div className="space-y-0.5">
                <p className="font-bold text-black underline underline-offset-2">
                  {evaluators[0]?.name || '__________________________'}
                </p>
                <p className="font-mono text-[11px] text-neutral-700">
                  {evaluators[0]?.nip && evaluators[0].nip !== '-' ? `NIP. ${evaluators[0].nip}` : 'NIP. ........................................'}
                </p>
              </div>
            </div>
          </div>

          {/* TABEL 2: LAMPIRAN RINCIAN 31 INDIKATOR (OPSIONAL DENGAN TOGGLE - DI HALAMAN TERPISAH) */}
          {showDetailedIndicators && (
            <div
              className="space-y-1.5 pt-4 print-lampiran-section"
              style={{ pageBreakBefore: 'always', breakBefore: 'page' }}>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-black">
                II. Lampiran Rincian 31 Indikator Penilaian (Komparasi Isian Mandiri F-01 &amp; Evaluator F-02)
              </h2>
              <table className="w-full text-[11px] border border-neutral-400" style={{ borderCollapse: 'collapse' }}>
                <thead className="bg-neutral-100 border-b border-neutral-400 text-neutral-900">
                  <tr>
                    <th className="px-1.5 py-1 text-center w-[28px] font-bold border-r border-neutral-400">No</th>
                    <th className="px-2 py-1 text-left w-[55px] font-bold border-r border-neutral-400">Kode</th>
                    <th className="px-2 py-1 text-left font-bold border-r border-neutral-400">Pertanyaan Indikator</th>
                    <th className="px-2 py-1 text-left w-[26%] font-bold border-r border-neutral-400">Jawaban Mandiri OPD (F-01)</th>
                    <th className="px-1.5 py-1 text-center w-[45px] font-bold border-r border-neutral-400">Skor F02</th>
                    <th className="px-2 py-1 text-left w-[24%] font-bold">Catatan Penilaian</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-300">
                  {indicatorRows.map((ind) => (
                    <tr key={ind.indicatorNumber} className="align-top">
                      <td className="px-1.5 py-1 text-center font-mono border-r border-neutral-400">
                        {ind.indicatorNumber}
                      </td>
                      <td className="px-2 py-1 font-mono text-neutral-700 border-r border-neutral-400">
                        {ind.code}
                      </td>
                      <td className="px-2 py-1 leading-tight border-r border-neutral-400">
                        <div className="font-medium text-black">{ind.question}</div>
                        <div className="text-[9px] text-neutral-500 font-mono mt-0.5">Aspek {ind.aspectCode}</div>
                      </td>
                      <td className="px-2 py-1 text-neutral-800 leading-tight border-r border-neutral-400">
                        {ind.f01AnswerSummary ? (
                          /<[a-z][\s\S]*>/i.test(ind.f01AnswerSummary) ? (
                            <div
                              className="prose prose-xs max-w-none text-neutral-800 text-[11px] leading-tight [&_p]:mb-0.5 [&_p:last-child]:mb-0"
                              dangerouslySetInnerHTML={{ __html: ind.f01AnswerSummary }}
                            />
                          ) : (
                            <span>{ind.f01AnswerSummary}</span>
                          )
                        ) : (
                          <span className="text-neutral-400 italic">Belum diisi</span>
                        )}
                      </td>
                      <td className="px-1.5 py-1 text-center font-bold text-black border-r border-neutral-400">
                        {ind.f02Score !== null ? ind.f02Score : '-'}
                      </td>
                      <td className="px-2 py-1 text-neutral-800 leading-tight">
                        {ind.notes ? (
                          /<[a-z][\s\S]*>/i.test(ind.notes) ? (
                            <div
                              className="prose prose-xs max-w-none text-neutral-800 text-[11px] leading-tight [&_p]:mb-0.5 [&_p:last-child]:mb-0 [&_ul]:list-disc [&_ul]:list-inside [&_ul]:space-y-0.5 [&_ul]:my-0.5"
                              dangerouslySetInnerHTML={{ __html: ind.notes }}
                            />
                          ) : (
                            <div className="whitespace-pre-wrap">{ind.notes}</div>
                          )
                        ) : (
                          <span className="text-neutral-400 italic">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* CREDIT WEBSITE RESMI (MUNCUL DI BAWAH SETIAP HALAMAN CETAK & FOOTER PREVIEW) */}
          <div className="print-page-credit print:block hidden text-center text-[8px] text-neutral-500 font-sans">
            dicetak di {currentHost} pada {printDateTimeStr || formattedPrintDate}
          </div>

          <div className="pt-4 border-t border-neutral-200 text-center text-[10px] text-neutral-400 print:hidden font-mono">
            dicetak di {currentHost} pada {printDateTimeStr || formattedPrintDate}
          </div>
        </div>
      )}
    </div>
  )
}

function CheckCircle2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}>
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
