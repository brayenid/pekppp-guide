// src/app/admin/panduan-bukti/EvidenceGuideManagerClient.tsx
'use client'

import { useState, useEffect } from 'react'
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
  AlertTriangle,
  Sliders,
  FolderArchive,
  FolderOpen,
  Download,
  Sparkles,
  Link2
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Badge } from '../../../components/ui/Badge'
import { Button } from '../../../components/ui/Button'
import { AdminTabs, UnderlineTabs } from '../../../components/ui/AdminTabs'
import { Card } from '../../../components/ui/Card'
import {
  uploadAspectSlotExampleAction,
  deleteAspectSlotExampleAction,
  attachMediaAssetToSlotGuideAction
} from '../../../actions/evidence-slot-actions'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { MediaPickerModal } from '../../../components/media/MediaPickerModal'
import { MediaAssetItem } from '../../../actions/media-actions'
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

function getReadableNameFromUrl(url: string, index: number): string {
  try {
    const raw = decodeURIComponent(url.split('/').pop() || '')
    const withoutTime = raw.replace(/^\d+[\s_-]*/, '')
    const clean = withoutTime.replace(/[_-]+/g, ' ').trim()
    return clean || `Contoh Panduan #${index + 1}`
  } catch {
    return `Contoh Panduan #${index + 1}`
  }
}

export function EvidenceGuideManagerClient({ initialSlots }: { initialSlots: SlotWithGuide[] }) {
  const [mounted, setMounted] = useState(false)
  const [slots, setSlots] = useState<SlotWithGuide[]>(initialSlots)
  const [activeAspect, setActiveAspect] = useState<string>('I')
  const [previewFile, setPreviewFile] = useState<string | null>(null)
  const [loadingSlot, setLoadingSlot] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<{ slotKey: string; slotTitle: string; exampleUrl: string } | null>(null)
  const [pickerTargetSlot, setPickerTargetSlot] = useState<{ slotKey: string; title: string } | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const currentSlots = slots.filter((s) => s.aspectCode === activeAspect)

  // Menautkan berkas yang dipilih dari Media Manager
  const handleSelectFromMedia = async (asset: MediaAssetItem) => {
    if (!pickerTargetSlot) return
    const { slotKey } = pickerTargetSlot
    setLoadingSlot(slotKey)
    const toastId = toast.loading(`Menautkan "${asset.title}" ke slot ${slotKey}...`)

    try {
      const res = await attachMediaAssetToSlotGuideAction({
        aspectCode: activeAspect,
        slotKey,
        mediaAssetId: asset.id,
        path: '/admin/panduan-bukti'
      })

      if (res.success && res.fileUrl) {
        toast.success(`"${asset.title}" berhasil ditautkan sebagai panduan!`, { id: toastId })
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
        toast.error(res.error || 'Gagal menautkan berkas.', { id: toastId })
      }
    } catch {
      toast.error('Terjadi kesalahan saat menautkan berkas.', { id: toastId })
    } finally {
      setLoadingSlot(null)
      setPickerTargetSlot(null)
    }
  }

  // Upload berkas fisik baru secara manual
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
        toast.success(`Contoh format berhasil diperbarui & otomatis dicatat di Pustaka Media!`, { id: toastId })
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

  // Konfirmasi pelepasan / hapus contoh
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    const { slotKey, exampleUrl } = deleteTarget
    setLoadingSlot(slotKey)
    const toastId = toast.loading('Melepaskan contoh panduan...')
    try {
      const res = await deleteAspectSlotExampleAction({
        aspectCode: activeAspect,
        slotKey,
        exampleImageUrl: exampleUrl,
        path: '/admin/panduan-bukti'
      })
      if (res.success) {
        toast.success('Contoh panduan berhasil dilepaskan dari slot ini.', { id: toastId })
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
        toast.error(res.error || 'Gagal melepaskan berkas.', { id: toastId })
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
        title="Master Panduan &amp; Contoh Bukti Aspek"
        description="Kelola dan tautkan contoh dokumen format fisik (PDF, Word, Excel, Gambar) per aspek yang menjadi acuan panduan resmi bagi seluruh unit lokus."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = '/admin/media'
              }}
              leftIcon={<FolderOpen className="w-4 h-4 text-brand" />}>
              Buka Pustaka Media
            </Button>
          </div>
        }
        speedDialItems={[
          {
            label: 'Pustaka Berkas Media',
            icon: <FolderOpen className="w-4 h-4" />,
            href: '/admin/media',
            variant: 'brand'
          },
          {
            label: 'Aturan Bukti Dukung',
            icon: <Sliders className="w-4 h-4" />,
            href: '/admin/pengaturan-bukti',
            variant: 'secondary'
          },
          {
            label: 'Master Bukti Dukung',
            icon: <FolderArchive className="w-4 h-4" />,
            href: '/admin/master-bukti',
            variant: 'secondary'
          }
        ]}
      />

      {/* Aspect Selector Tabs */}
      <UnderlineTabs
        items={ASPECTS.map((asp) => {
          const count = slots.filter((s) => s.aspectCode === asp.code).length
          const filled = slots.filter((s) => s.aspectCode === asp.code && s.exampleImages && s.exampleImages.length > 0).length
          return {
            id: asp.code,
            badge: asp.code,
            label: asp.name,
            count: `${filled}/${count} Panduan`
          }
        })}
        activeId={activeAspect}
        onChange={setActiveAspect}
      />

      {/* Aspect Info Banner */}
      <Card className="flex items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-medium text-ink-muted uppercase tracking-wider">
            Panduan Aspek Terpilih
          </span>
          <h3 className="text-base font-semibold text-ink tracking-tight mt-0.5">
            Aspek {activeAspect}: {ASPECTS.find((a) => a.code === activeAspect)?.name}
          </h3>
          <p className="text-xs text-ink-muted mt-0.5">
            Terdapat {currentSlots.length} slot dokumen bukti dukung pada aspek ini. Anda dapat menautkan berkas dari Pustaka Media atau mengunggah format baru.
          </p>
        </div>
      </Card>

      {/* Slots List */}
      <div className="space-y-4">
        {currentSlots.map((slot) => {
          const hasExamples = slot.exampleImages && slot.exampleImages.length > 0
          const isProcessing = loadingSlot === slot.slotKey

          return (
            <Card
              key={slot.slotKey}
              hoverable
              className="space-y-3.5">
              {/* Header Row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-3.5">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-surface-subtle text-ink border border-line">
                      Slot #{slot.orderIndex} ({slot.slotKey})
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        slot.isMandatory
                          ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                          : 'bg-surface-subtle text-ink-muted border-line'
                      }`}>
                      {slot.isMandatory ? 'Wajib' : 'Opsional'}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
                      Tipe: {slot.documentType}
                    </span>
                  </div>
                  <h4 className="font-semibold text-sm sm:text-base text-ink leading-snug">{slot.title}</h4>
                </div>

                {/* Dual Action Triggers: 1. Pick from Media Manager, 2. Direct Upload */}
                <div className="shrink-0 flex items-center gap-2 flex-wrap">
                  {/* Button 1: Pilih dari Pustaka Media */}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isProcessing}
                    onClick={() => setPickerTargetSlot({ slotKey: slot.slotKey, title: slot.title })}
                    leftIcon={<FolderOpen className="w-3.5 h-3.5 text-brand" />}>
                    <span>Pilih dari Pustaka</span>
                  </Button>

                  {/* Button 2: Unggah Berkas Baru Langsung */}
                  <label
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer select-none ${
                      isProcessing
                        ? 'bg-surface-subtle text-ink-muted border border-line cursor-not-allowed opacity-60'
                        : 'bg-brand hover:bg-brand-hover text-white shadow-xs'
                    }`}>
                    <UploadCloud className="w-3.5 h-3.5 text-white" />
                    <span>Unggah Baru</span>
                    <input
                      type="file"
                      disabled={isProcessing}
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xls,.xlsx"
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
              <p className="text-xs text-ink-muted leading-relaxed font-normal">
                {slot.description}
              </p>

              {/* Example Files Preview List */}
              <div className="pt-1">
                <div className="text-[11px] font-semibold text-ink-muted mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand" />
                  <span>Dokumen Format / Contoh Panduan Saat Ini ({slot.exampleImages?.length || 0}):</span>
                </div>

                {!hasExamples ? (
                  <div className="p-4 rounded-xl border border-dashed border-line bg-surface-subtle/40 text-center text-xs text-ink-muted flex flex-col items-center justify-center gap-2">
                    <p>Belum ada berkas contoh format atau panduan yang ditautkan untuk slot ini.</p>
                    <button
                      type="button"
                      onClick={() => setPickerTargetSlot({ slotKey: slot.slotKey, title: slot.title })}
                      className="text-brand font-semibold hover:underline inline-flex items-center gap-1">
                      <FolderOpen className="w-3.5 h-3.5" />
                      Pilih template dari Pustaka Media
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                    {slot.exampleImages!.map((imgUrl, idx) => {
                      const lower = imgUrl.toLowerCase()
                      const isPdf = lower.endsWith('.pdf')
                      const isImage = lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp')
                      const readableName = getReadableNameFromUrl(imgUrl, idx)

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl border border-line bg-surface hover:border-brand/40 transition-all flex items-center justify-between gap-2 shadow-2xs group">
                          <button
                            type="button"
                            onClick={() => setPreviewFile(imgUrl)}
                            className="flex items-center gap-2.5 min-w-0 text-left hover:underline cursor-pointer flex-1">
                            {isPdf ? (
                              <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 border border-rose-500/20 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            ) : isImage ? (
                              <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 border border-purple-500/20 shrink-0">
                                <ImageIcon className="w-4 h-4" />
                              </div>
                            ) : (
                              <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 border border-blue-500/20 shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                            )}
                            <div className="min-w-0">
                              <span className="text-xs font-semibold text-ink group-hover:text-brand truncate block">
                                {readableName}
                              </span>
                              <span className="text-[10px] text-ink-muted block truncate font-mono">
                                {isPdf ? 'Dokumen PDF' : isImage ? 'File Gambar' : 'Dokumen Format'}
                              </span>
                            </div>
                          </button>

                          <div className="flex items-center gap-1 shrink-0">
                            {/* Preview */}
                            <button
                              type="button"
                              onClick={() => setPreviewFile(imgUrl)}
                              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                              title="Lihat Pratinjau">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>

                            {/* Download */}
                            <a
                              href={formatFileUrl(imgUrl)}
                              download
                              className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
                              title="Unduh Berkas">
                              <Download className="w-3.5 h-3.5" />
                            </a>

                            {/* Delete / Unlink */}
                            <button
                              type="button"
                              disabled={isProcessing}
                              onClick={() =>
                                setDeleteTarget({
                                  slotKey: slot.slotKey,
                                  slotTitle: slot.title,
                                  exampleUrl: imgUrl
                                })
                              }
                              className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Lepaskan berkas panduan ini">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          )
        })}
      </div>

      {/* ── MODAL 1: Media Picker Modal (Ambil dari Media Manager) ── */}
      <MediaPickerModal
        isOpen={Boolean(pickerTargetSlot)}
        targetAspect={activeAspect}
        title={`Pilih Dokumen Panduan untuk Slot ${pickerTargetSlot?.slotKey}`}
        description={`Pilih berkas dari Pustaka Media yang akan dijadikan format contoh bagi lokus pada "${pickerTargetSlot?.title}".`}
        onClose={() => setPickerTargetSlot(null)}
        onSelect={handleSelectFromMedia}
      />

      {/* ── MODAL 2: Modal Konfirmasi Lepas Panduan ── */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        title="Lepaskan Contoh Format Panduan"
        description={`Apakah Anda yakin ingin melepaskan contoh ini dari panduan "${deleteTarget?.slotTitle || ''}"? Berkas bersama di Pustaka Media akan tetap tersimpan aman.`}
        confirmText="Ya, Lepaskan"
        cancelText="Batal"
        variant="danger"
        loading={Boolean(loadingSlot)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
      />

      {/* ── MODAL 3: Preview Modal (dengan createPortal & z-[250]) ── */}
      {previewFile &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
            onClick={() => setPreviewFile(null)}>
            <div
              className="bg-surface rounded-2xl border border-line shadow-2xl max-w-4xl w-full max-h-[88vh] overflow-hidden flex flex-col"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-line p-4">
                <div className="min-w-0 pr-2">
                  <span className="font-semibold text-sm text-ink truncate block">
                    Pratinjau Format Contoh Bukti Dukung
                  </span>
                  <span className="text-xs text-ink-muted font-mono truncate block">
                    {previewFile}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={formatFileUrl(previewFile)}
                    download
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors">
                    <Download className="w-3.5 h-3.5" />
                    <span>Unduh</span>
                  </a>
                  <button
                    type="button"
                    onClick={() => setPreviewFile(null)}
                    className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle cursor-pointer transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-auto flex items-center justify-center bg-surface-subtle p-3 min-h-[350px]">
                {formatFileUrl(previewFile).toLowerCase().endsWith('.pdf') ? (
                  <div className="w-full h-[65vh] flex flex-col items-center justify-between gap-3">
                    <iframe
                      src={formatFileUrl(previewFile)}
                      className="w-full flex-1 rounded-xl border border-line bg-white"
                      title="Contoh Dokumen PDF"
                    />
                  </div>
                ) : (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={formatFileUrl(previewFile)}
                    alt="Contoh"
                    className="max-h-[65vh] object-contain rounded-xl shadow-sm"
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  )
}

