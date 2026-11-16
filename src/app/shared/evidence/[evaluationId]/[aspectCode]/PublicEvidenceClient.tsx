'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  ExternalLink,
  Download,
  Copy,
  Check,
  ArrowLeft
} from 'lucide-react'
import { toast } from 'sonner'
import { FormModal } from '../../../../../components/ui/FormModal'
import { Button } from '../../../../../components/ui/Button'
import { EvidenceSlotItem, EvidenceAttachmentItem } from '../../../../../actions/evidence-slot-actions'

interface PublicEvidenceClientProps {
  evaluationId: string
  aspectCode: string
  aspectName: string
  lokusName: string
  lokusCode: string
  year: number
  slots: EvidenceSlotItem[]
}

const ALL_ASPECTS: { code: string; label: string }[] = [
  { code: 'I', label: 'I' },
  { code: 'II', label: 'II' },
  { code: 'III', label: 'III' },
  { code: 'IV', label: 'IV' },
  { code: 'V', label: 'V' },
  { code: 'VI', label: 'VI' },
  { code: 'TAMBAHAN', label: 'Tambahan' }
]

export function PublicEvidenceClient({
  evaluationId,
  aspectCode,
  aspectName,
  lokusName,
  lokusCode,
  year,
  slots
}: PublicEvidenceClientProps) {
  const [copied, setCopied] = useState(false)
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null)
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Tautan berhasil disalin!')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleCopyFileLink = (fileUrl: string, fileName: string, fileId?: string) => {
    if (typeof window !== 'undefined') {
      const fullUrl = fileUrl.startsWith('http')
        ? fileUrl
        : `${window.location.origin}${fileUrl.startsWith('/') ? '' : '/'}${fileUrl}`
      navigator.clipboard.writeText(fullUrl)
      setCopiedFileId(fileId || fileUrl)
      toast.success(`Tautan berkas berhasil disalin!`)
      setTimeout(() => setCopiedFileId(null), 2000)
    }
  }

  // Kumpulkan seluruh item file dari seluruh slot di aspek ini
  const allFiles: {
    slotTitle: string
    fileName: string
    fileUrl: string
    fileType?: string
    fileSize?: number
  }[] = []

  slots.forEach((s) => {
    if (s.attachments && s.attachments.length > 0) {
      s.attachments.forEach((att) => {
        allFiles.push({
          slotTitle: s.title,
          fileName: att.fileName || s.title,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          fileSize: att.fileSize
        })
      })
    } else if (s.fileUrl && s.fileUrl.trim() !== '') {
      allFiles.push({
        slotTitle: s.title,
        fileName: s.fileName || s.title,
        fileUrl: s.fileUrl,
        fileType: s.fileType,
        fileSize: s.fileSize
      })
    }
  })

  // Kelompokkan butir yang memiliki berkas terunggah
  const filledSlotItems = slots
    .map((slot, originalIdx) => {
      const attachments: EvidenceAttachmentItem[] =
        slot.attachments && slot.attachments.length > 0
          ? slot.attachments
          : slot.fileUrl && slot.fileUrl.trim() !== ''
          ? [
              {
                id: `main_${slot.slotKey}`,
                fileUrl: slot.fileUrl,
                fileName: slot.fileName || slot.title,
                fileSize: slot.fileSize || 0,
                fileType: (slot.fileType as any) || 'DOCUMENT',
                uploadedAt: ''
              }
            ]
          : []
      return {
        slot,
        orderNumber: originalIdx + 1,
        attachments
      }
    })
    .filter((item) => item.attachments.length > 0)

  const emptySlotsCount = slots.length - filledSlotItems.length

  return (
    <div className="min-h-screen bg-canvas text-ink py-6 px-4 sm:px-8 lg:px-12 flex flex-col items-center">
      <div className="w-full max-w-5xl xl:max-w-6xl space-y-4">
        {/* Navigasi Atas: Breadcrumb & Aspect Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <Link
            href={`/shared/evidence/${evaluationId}`}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink-muted hover:text-brand transition-colors group">
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Semua Aspek</span>
          </Link>

          {/* Quick Aspect Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5">
            {ALL_ASPECTS.map((asp) => {
              const isActive = asp.code === aspectCode
              return (
                <Link
                  key={asp.code}
                  href={`/shared/evidence/${evaluationId}/${asp.code}`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all shrink-0 ${
                    isActive
                      ? 'bg-brand text-white font-bold shadow-2xs'
                      : 'bg-surface hover:bg-surface-subtle text-ink-secondary border border-stroke/50'
                  }`}>
                  {asp.code === 'TAMBAHAN' ? 'Tambahan' : `Aspek ${asp.label}`}
                </Link>
              )
            })}
          </div>
        </div>

        {/* Header Aspek - Ringkas & Bersih */}
        <div className="bg-surface rounded-2xl border border-stroke/60 p-4 sm:p-5 shadow-2xs">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <span className="text-[11px] font-mono font-bold text-brand block uppercase tracking-wider">
                {aspectCode === 'TAMBAHAN' ? 'Informasi Tambahan' : `Aspek ${aspectCode}`}
              </span>
              <h1 className="text-base sm:text-lg font-bold text-ink truncate mt-0.5" title={aspectName}>
                {aspectName}
              </h1>
              <div className="flex items-center gap-2 text-xs text-ink-muted mt-1">
                <span className="truncate max-w-[200px] sm:max-w-none">{lokusName}</span>
                <span>•</span>
                <span className="font-mono">{year}</span>
                <span>•</span>
                <span className="font-medium text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 text-[11px]">
                  {allFiles.length} Berkas
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-surface-subtle hover:bg-surface-hover text-ink border border-stroke/60 shadow-2xs transition-all shrink-0 cursor-pointer">
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tersalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Salin Tautan</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Konten File (Fokus Berkas) */}
        {allFiles.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-stroke/60 p-8 text-center text-xs text-ink-muted space-y-1">
            <FileText className="w-8 h-8 mx-auto text-ink-muted/40 mb-2" />
            <p className="font-semibold text-ink text-sm">Belum Ada Berkas Bukti</p>
            <p className="text-xs">Tidak ada dokumen bukti fisik yang diunggah untuk aspek ini.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filledSlotItems.map(({ slot, orderNumber, attachments }) => (
              <div
                key={slot.slotKey}
                className="bg-surface rounded-2xl border border-stroke/60 p-4 shadow-2xs space-y-2.5">
                {/* Judul Butir Saja (Tanpa Deskripsi Panjang) */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-[11px] font-mono text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-stroke/40 shrink-0">
                      #{orderNumber}
                    </span>
                    <h2 className="text-xs sm:text-sm font-semibold text-ink truncate" title={slot.title}>
                      {slot.title}
                    </h2>
                  </div>
                  <span className="text-[10px] font-mono text-ink-muted shrink-0">
                    {attachments.length} berkas
                  </span>
                </div>

                {/* List File */}
                <div className="divide-y divide-stroke/30 border border-stroke/40 rounded-xl overflow-hidden bg-surface-subtle/30">
                  {attachments.map((att, attIdx) => (
                    <div
                      key={att.id || attIdx}
                      className="flex items-center justify-between gap-2 p-2.5 text-xs hover:bg-surface-subtle transition-colors">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <FileText className="w-4 h-4 text-brand shrink-0" />
                        <span className="font-medium text-ink truncate" title={att.fileName}>
                          {att.fileName}
                        </span>
                        {att.fileSize ? (
                          <span className="text-[10px] text-ink-muted font-mono shrink-0 hidden sm:inline">
                            ({(att.fileSize / 1024 / 1024).toFixed(1)} MB)
                          </span>
                        ) : null}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setPreviewDoc({ title: att.fileName, url: att.fileUrl })}
                          className="px-2.5 py-1 rounded-md text-xs font-medium text-ink hover:bg-surface border border-stroke/50 transition-colors cursor-pointer">
                          Pratinjau
                        </button>

                        <a
                          href={att.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md text-xs font-medium bg-brand text-white hover:bg-brand-hover transition-colors inline-flex items-center gap-1 cursor-pointer">
                          <Download className="w-3 h-3" />
                          <span>Buka</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => handleCopyFileLink(att.fileUrl, att.fileName, att.id)}
                          className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface border border-stroke/50 transition-colors cursor-pointer"
                          title="Salin Tautan Langsung Berkas">
                          {copiedFileId === (att.id || att.fileUrl) ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {emptySlotsCount > 0 && (
              <p className="text-[11px] text-ink-muted text-center pt-2">
                Terdapat {emptySlotsCount} butir lain pada aspek ini yang belum mengunggah dokumen.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Modal Pratinjau Dokumen Sederhana */}
      <FormModal
        isOpen={Boolean(previewDoc)}
        onClose={() => setPreviewDoc(null)}
        title={previewDoc?.title || 'Pratinjau Dokumen'}
        icon={<FileText className="w-4 h-4" />}
        maxWidth="6xl"
        noBodyPadding
        bodyClassName="bg-slate-900/5 p-2 flex flex-col h-[82vh] min-h-[500px]"
        headerActions={
          previewDoc ? (
            <div className="flex items-center gap-1.5 mr-1">
              <a
                href={previewDoc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold text-brand hover:bg-brand-light transition-colors">
                <ExternalLink className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Buka di Tab Baru</span>
              </a>
              <a
                href={previewDoc.url}
                download
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-brand text-white hover:bg-brand-hover shadow-2xs transition-colors">
                <Download className="w-3.5 h-3.5" />
                <span>Unduh</span>
              </a>
            </div>
          ) : null
        }
        footer={
          <div className="flex justify-end w-full">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setPreviewDoc(null)}>
              Tutup Pratinjau
            </Button>
          </div>
        }>
        {previewDoc && (
          <div className="w-full h-full flex-1 flex flex-col overflow-hidden min-h-[75vh]">
            {previewDoc.url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
              <div className="w-full h-full flex-1 flex items-center justify-center p-3 overflow-auto">
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-[78vh] max-w-full object-contain rounded-lg border border-stroke/50 shadow-sm"
                />
              </div>
            ) : (
              <iframe
                src={previewDoc.url}
                title={previewDoc.title}
                className="w-full h-full flex-1 min-h-[75vh] rounded-lg border border-stroke/50 bg-white"
              />
            )}
          </div>
        )}
      </FormModal>
    </div>
  )
}
