// src/app/admin/panduan-bukti/EvidenceGuideManagerClient.tsx
'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import {
  UploadCloud,
  FileText,
  ImageIcon,
  Trash2,
  ExternalLink,
  X,
  BookOpen,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import {
  uploadAspectSlotExampleAction,
  deleteAspectSlotExampleAction
} from '../../../actions/evidence-slot-actions'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { formatFileUrl } from '../../../lib/utils'

interface SlotWithGuide {
  aspectCode: string
  slotKey: string
  title: string
  description: string
  isMandatory: boolean
  orderIndex: number
  documentType: string
  exampleImages?: string[]
  hasCustomExample?: boolean
}

const ASPECTS = [
  { code: 'I', name: 'Kebijakan Pelayanan' },
  { code: 'II', name: 'Profesionalisme SDM' },
  { code: 'III', name: 'Sarana Prasarana' },
  { code: 'IV', name: 'Sistem Informasi Pelayanan Publik' },
  { code: 'V', name: 'Konsultasi & Pengaduan' },
  { code: 'VI', name: 'Inovasi Pelayanan Publik' }
]

export function EvidenceGuideManagerClient({ initialSlots }: { initialSlots: SlotWithGuide[] }) {
  const [slots, setSlots] = useState<SlotWithGuide[]>(initialSlots)
  const [activeAspect, setActiveAspect] = useState<string>('I')
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ slotKey: string; slotTitle: string; exampleUrl: string } | null>(null)

  const currentSlots = slots.filter((s) => s.aspectCode === activeAspect)

  const handleUpload = async (slotKey: string, file: File) => {
    setLoadingSlot(slotKey)
    const toastId = toast.loading(`Mengoptimasi & mengunggah "${file.name}"...`)
    try {
      // Kompres gambar otomatis jika format gambar
      let fileToUpload = file
      if (file.type.startsWith('image/')) {
        const { compressImageClient } = await import('../../../lib/client-image-compressor')
        fileToUpload = await compressImageClient(file)
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('aspectCode', activeAspect)
      formData.append('slotKey', slotKey)
      formData.append('path', '/admin/panduan-bukti')

      const res = await uploadAspectSlotExampleAction(formData)
      if (res.success && res.fileUrl) {
        toast.success(`Contoh format berhasil diperbarui!`, { id: toastId })
        setSlots((prev) =>
          prev.map((s) => {
            if (s.aspectCode === activeAspect && s.slotKey === slotKey) {
              const currentImgs = s.exampleImages || []
              return {
                ...s,
                exampleImages: [res.fileUrl!, ...currentImgs.filter((u) => u !== res.fileUrl)],
                hasCustomExample: true
              }
            }
            return s
          })
        )
      } else {
        toast.error(res.error || 'Gagal mengunggah berkas.', { id: toastId })
      }
    } catch {
      toast.error('Gagal mengunggah berkas contoh.', { id: toastId })
    } finally {
      setLoadingSlot(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const { slotKey, exampleUrl } = deleteTarget
    setLoadingSlot(slotKey)
    const toastId = toast.loading('Menghapus contoh...')
    try {
      const res = await deleteAspectSlotExampleAction({
        aspectCode: activeAspect,
        slotKey,
        exampleImageUrl: exampleUrl,
        path: '/admin/panduan-bukti'
      })
      if (res.success) {
        toast.success('Contoh format berhasil dihapus.', { id: toastId })
        setSlots((prev) =>
          prev.map((s) => {
            if (s.aspectCode === activeAspect && s.slotKey === slotKey) {
              const remaining = (s.exampleImages || []).filter((u) => u !== exampleUrl)
              return {
                ...s,
                exampleImages: remaining,
                hasCustomExample: remaining.length > 0
              }
            }
            return s
          })
        )
        setDeleteTarget(null)
      } else {
        toast.error(res.error || 'Gagal menghapus berkas.', { id: toastId })
      }
    } catch {
      toast.error('Gagal menghapus contoh berkas.', { id: toastId })
    } finally {
      setLoadingSlot(null)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<BookOpen className="w-5 h-5 text-brand" />}
        title="Master Panduan & Contoh Bukti Aspek"
        description="Kelola dan unggah contoh dokumen format fisik (PDF / Gambar) per aspek yang akan menjadi acuan panduan resmi bagi OPD."
      />

      {/* Aspect Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-surface rounded-2xl border border-stroke/50 shadow-soft-card overflow-x-auto text-xs font-medium">
        {ASPECTS.map((asp) => {
          const count = slots.filter((s) => s.aspectCode === asp.code).length
          const filled = slots.filter((s) => s.aspectCode === asp.code && s.exampleImages && s.exampleImages.length > 0).length
          const isActive = activeAspect === asp.code

          return (
            <button
              key={asp.code}
              type="button"
              onClick={() => setActiveAspect(asp.code)}
              className={`px-3.5 py-1.5 rounded-full transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 text-xs ${
                isActive
                  ? 'bg-brand text-white shadow-hz-button font-semibold'
                  : 'bg-surface-subtle text-ink-secondary hover:text-ink hover:bg-surface-hover border border-stroke/40 font-medium'
              }`}>
              <span>Aspek {asp.code}</span>
              <span
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : 'bg-surface text-ink-muted border border-stroke/40'
                }`}>
                {filled}/{count}
              </span>
            </button>
          )
        })}
      </div>

      {/* Aspect Info Banner */}
      <div className="p-5 bg-surface rounded-2xl border border-stroke/50 shadow-soft-card flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
            Panduan Aspek Terpilih
          </span>
          <h3 className="text-base font-medium text-ink tracking-tight mt-0.5">
            Aspek {activeAspect}: {ASPECTS.find((a) => a.code === activeAspect)?.name}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Terdapat {currentSlots.length} slot dokumen bukti dukung pada aspek ini.
          </p>
        </div>
      </div>

      {/* Slots List */}
      <div className="space-y-3.5">
        {currentSlots.map((slot) => {
          const hasExamples = slot.exampleImages && slot.exampleImages.length > 0
          const isProcessing = loadingSlot === slot.slotKey

          return (
            <div
              key={slot.slotKey}
              className="p-5 bg-surface rounded-2xl border border-stroke/50 shadow-soft-card hover:border-stroke hover:shadow-subtle transition-all space-y-3">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-stroke/40 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-subtle text-ink border border-stroke/50">
                      Slot #{slot.orderIndex} ({slot.slotKey})
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                        slot.isMandatory
                          ? 'bg-pastel-rose text-pastel-rose-text border-rose-200'
                          : 'bg-surface-subtle text-ink-muted border-stroke/50'
                      }`}>
                      {slot.isMandatory ? 'Wajib' : 'Opsional'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-pastel-blue text-pastel-blue-text border border-sky-200">
                      Tipe: {slot.documentType}
                    </span>
                  </div>
                  <h4 className="font-medium text-sm text-ink leading-snug">{slot.title}</h4>
                </div>

                {/* Upload Trigger */}
                <div className="shrink-0 flex items-center gap-2">
                  <label
                    className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all shadow-hz-button cursor-pointer ${
                      isProcessing
                        ? 'bg-surface-subtle text-ink-muted border border-stroke/50 cursor-not-allowed'
                        : 'bg-brand hover:bg-brand-hover text-white'
                    }`}>
                    <UploadCloud className="w-3.5 h-3.5 text-white" />
                    <span>{hasExamples ? 'Ganti / Tambah Contoh' : 'Unggah Contoh'}</span>
                    <input
                      type="file"
                      disabled={isProcessing}
                      accept=".pdf,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) handleUpload(slot.slotKey, file)
                      }}
                    />
                  </label>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-ink-secondary leading-relaxed font-normal">
                {slot.description}
              </p>

              {/* Example Files Preview List */}
              <div className="pt-1">
                <div className="text-[11px] font-medium text-ink-muted mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Berkas Contoh Panduan Saat Ini:</span>
                </div>

                {!hasExamples ? (
                  <div className="p-4 rounded-xl border border-dashed border-stroke/60 bg-surface-subtle/50 text-center text-xs text-ink-muted">
                    Belum ada berkas contoh format yang diunggah untuk slot ini.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {slot.exampleImages!.map((imgUrl, idx) => {
                      const isPdf = imgUrl.toLowerCase().endsWith('.pdf')

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-stroke/50 bg-surface hover:bg-surface-hover transition-all flex items-center justify-between gap-2 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(imgUrl)}
                            className="flex items-center gap-2 min-w-0 text-left hover:underline cursor-pointer">
                            {isPdf ? (
                              <FileText className="w-4 h-4 text-rose-500 shrink-0" />
                            ) : (
                              <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
                            )}
                            <span className="text-xs font-medium text-ink truncate">
                              Contoh #{idx + 1} ({isPdf ? 'PDF' : 'Gambar'})
                            </span>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setPreviewFile(imgUrl)}
                              className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                              title="Lihat Pratinjau">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() => setDeleteTarget({ slotKey: slot.slotKey, slotTitle: slot.title, exampleUrl: imgUrl })}
                              className="p-1.5 rounded-full text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Hapus berkas contoh ini">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Konfirmasi Hapus Contoh Format */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Hapus Contoh Format"
        description={`Hapus berkas contoh ini dari panduan "${deleteTarget?.slotTitle || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Contoh"
        cancelText="Batal"
        variant="danger"
        loading={Boolean(loadingSlot)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* Preview Modal */}
      {previewFile && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 m-0 animate-fade-in"
          onClick={() => setPreviewFile(null)}>
          <div
            className="bg-surface p-5 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col space-y-3 shadow-2xl border border-stroke/50"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-stroke/40 pb-2.5">
              <span className="font-medium text-sm text-ink">Pratinjau Contoh Format Bukti</span>
              <button
                type="button"
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-hover cursor-pointer transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-sand-canvas/50 rounded-xl p-3 min-h-[350px] border border-stroke/40">
              {formatFileUrl(previewFile).toLowerCase().endsWith('.pdf') ? (
                <div className="w-full h-[65vh] flex flex-col items-center justify-between gap-3">
                  <iframe
                    src={formatFileUrl(previewFile)}
                    className="w-full flex-1 rounded-xl border border-stroke/50 bg-surface"
                    title="Contoh Dokumen PDF"
                  />
                  <a
                    href={formatFileUrl(previewFile)}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-all shadow-hz-button">
                    <span>Buka Dokumen di Tab Baru</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              ) : (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={formatFileUrl(previewFile)} alt="Contoh" className="max-h-[65vh] object-contain rounded-xl shadow-sm" />
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
