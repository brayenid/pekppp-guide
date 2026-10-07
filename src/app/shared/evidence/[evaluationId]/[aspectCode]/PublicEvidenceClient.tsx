'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  FileText,
  ExternalLink,
  Download,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  X
} from 'lucide-react'
import { toast } from 'sonner'
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
  const [previewDoc, setPreviewDoc] = useState<{ title: string; url: string } | null>(null)

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Tautan berkas bukti berhasil disalin!')
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // Filter slot yang memiliki berkas terunggah
  const filledSlots = slots.filter(
    (s) => (s.fileUrl && s.fileUrl.trim() !== '') || (s.attachments && s.attachments.length > 0)
  )

  // Kumpulkan seluruh item file dari seluruh slot di aspek ini
  const allFiles: {
    slotTitle: string
    isMandatory: boolean
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
          isMandatory: s.isMandatory,
          fileName: att.fileName || s.title,
          fileUrl: att.fileUrl,
          fileType: att.fileType,
          fileSize: att.fileSize
        })
      })
    } else if (s.fileUrl && s.fileUrl.trim() !== '') {
      allFiles.push({
        slotTitle: s.title,
        isMandatory: s.isMandatory,
        fileName: s.fileName || s.title,
        fileUrl: s.fileUrl,
        fileType: s.fileType,
        fileSize: s.fileSize
      })
    }
  })

  return (
    <div className="min-h-screen bg-canvas text-ink py-8 px-4 sm:px-6 lg:px-8 flex flex-col items-center">
      <div className="w-full max-w-4xl space-y-6">
        {/* Header Resmi Kutai Barat */}
        <header className="bg-surface rounded-2xl border border-stroke/60 p-6 sm:p-8 shadow-2xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-stroke/40 pb-5">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center text-white font-bold text-base shadow-2xs">
                P
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold uppercase tracking-wider text-brand">
                  Pemerintah Kabupaten Kutai Barat
                </span>
                <h1 className="text-base sm:text-lg font-bold text-ink">
                  Berkas Bukti Dukung PEKPPP {year}
                </h1>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-surface-subtle hover:bg-surface-hover text-ink border border-stroke/60 shadow-2xs transition-all self-start sm:self-auto cursor-pointer">
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Tautan Disalin</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Salin Tautan Resmi</span>
                </>
              )}
            </button>
          </div>

          {/* Meta Informasi Lokus & Aspek */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-ink-muted block text-[11px]">Unit Penyelenggara Pelayanan Publik (Lokus):</span>
              <p className="font-semibold text-ink text-sm">
                {lokusName} <span className="text-ink-muted font-mono font-normal text-xs">({lokusCode})</span>
              </p>
            </div>

            <div className="space-y-1 sm:text-right">
              <span className="text-ink-muted block text-[11px]">Cakupan Aspek Instrumen:</span>
              <div className="inline-flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded-md bg-brand-light text-brand font-semibold">
                  {aspectCode === 'TAMBAHAN' ? 'Tambahan' : `Aspek ${aspectCode}`}
                </span>
                <span className="font-semibold text-ink">{aspectName}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Ringkasan Status & Statistik Berkas */}
        <div className="bg-surface rounded-2xl border border-stroke/60 p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-ink">
                Status Dokumen Tersinkronisasi
              </h2>
              <p className="text-[11px] text-ink-muted">
                Tersedia {allFiles.length} berkas bukti fisik terverifikasi yang siap diperiksa oleh Tim Evaluator MenPAN-RB.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-ink-muted bg-surface-subtle px-3 py-1.5 rounded-xl border border-stroke/40 self-start sm:self-auto">
            <span>{filledSlots.length}/{slots.length} Butir Terisi</span>
          </div>
        </div>

        {/* Daftar Berkas Bukti Dukung */}
        <div className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-secondary px-1">
            Daftar Berkas Fisik &amp; Tautan Bukti:
          </h3>

          {slots.length === 0 ? (
            <div className="bg-surface rounded-2xl border border-stroke/60 p-8 text-center text-xs text-ink-muted">
              Belum ada slot bukti dukung yang terdaftar pada aspek ini.
            </div>
          ) : (
            <div className="space-y-3">
              {slots.map((slot, idx) => {
                const attachments: EvidenceAttachmentItem[] =
                  slot.attachments && slot.attachments.length > 0
                    ? slot.attachments
                    : slot.fileUrl
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

                const isFilled = attachments.length > 0

                return (
                  <div
                    key={slot.slotKey || idx}
                    className="bg-surface rounded-2xl border border-stroke/60 p-5 shadow-2xs space-y-3.5 transition-all">
                    {/* Header Slot */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-mono font-medium px-2 py-0.5 rounded-md bg-surface-subtle text-ink-secondary border border-stroke/40">
                            #{idx + 1}
                          </span>
                          <span className="text-xs font-semibold text-ink">
                            {slot.title}
                          </span>
                          {slot.isMandatory ? (
                            <span className="text-[10px] font-medium text-brand bg-brand-light px-2 py-0.5 rounded-full">
                              Wajib
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full">
                              Tambahan
                            </span>
                          )}
                        </div>

                        {slot.description && (
                          <p className="text-[11px] text-ink-muted leading-relaxed">
                            {slot.description}
                          </p>
                        )}
                      </div>

                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full shrink-0 ${
                          isFilled
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}>
                        {isFilled ? 'Tersedia' : 'Belum Ada'}
                      </span>
                    </div>

                    {/* Lampiran File */}
                    {isFilled ? (
                      <div className="space-y-2 pt-2 border-t border-stroke/30">
                        {attachments.map((att, attIdx) => (
                          <div
                            key={att.id || attIdx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-surface-subtle/70 border border-stroke/40 text-xs">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <FileText className="w-4 h-4 text-brand shrink-0" />
                              <span className="font-medium text-ink truncate" title={att.fileName}>
                                {att.fileName}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <button
                                type="button"
                                onClick={() => setPreviewDoc({ title: att.fileName, url: att.fileUrl })}
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-surface hover:bg-surface-hover text-ink border border-stroke/60 font-medium text-[11px] transition-colors cursor-pointer">
                                <span>Lihat Pratinjau</span>
                              </button>

                              <a
                                href={att.fileUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                download
                                className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-[11px] shadow-2xs transition-colors">
                                <Download className="w-3 h-3" />
                                <span>Buka / Unduh</span>
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-[11px] text-ink-muted italic pt-1 border-t border-stroke/30">
                        Belum ada dokumen yang dilampirkan pada butir ini.
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer Sederhana */}
        <footer className="text-center text-[11px] text-ink-muted pt-6 pb-12 space-y-1">
          <p>
            Portal Penyelenggaraan Evaluasi Kinerja Pelayanan Publik (PEKPPP) • Kabupaten Kutai Barat
          </p>
          <p className="text-[10px] text-ink-muted/80">
            Tautan publik resmi terpadu untuk pengawasan dan sinkronisasi portal nasional evaluasi.menpan.go.id
          </p>
        </footer>
      </div>

      {/* Modal Pratinjau Dokumen Sederhana */}
      {previewDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-stroke/60 shadow-xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-stroke/40 bg-surface-subtle/50">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="w-4 h-4 text-brand shrink-0" />
                <span className="font-semibold text-xs text-ink truncate">
                  {previewDoc.title}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={previewDoc.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-brand hover:underline font-medium mr-2">
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka di Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-surface-subtle p-2 flex items-center justify-center overflow-hidden">
              {previewDoc.url.match(/\.(jpeg|jpg|gif|png|webp)($|\?)/i) ? (
                <img
                  src={previewDoc.url}
                  alt={previewDoc.title}
                  className="max-h-full max-w-full object-contain rounded-lg border border-stroke/40 shadow-sm"
                />
              ) : (
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.title}
                  className="w-full h-full rounded-lg border border-stroke/40 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}