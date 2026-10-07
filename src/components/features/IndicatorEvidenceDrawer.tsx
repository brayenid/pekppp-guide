// src/components/features/IndicatorEvidenceDrawer.tsx
'use client'

import { useState, useEffect } from 'react'
import {
  X,
  Folder,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
  Loader2,
  Link2,
  History,
  Clock,
  User,
  ShieldCheck,
  UploadCloud
} from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { ConfirmationModal } from '../ui/ConfirmationModal'
import {
  getIndicatorEvidenceAction,
  saveIndicatorEvidenceSlotAction,
  addCustomAdditionalEvidenceSlotAction,
  deleteIndicatorEvidenceSlotAction,
  EvidenceSlotItem,
  EvidenceActivityItem
} from '../../actions/evidence-slot-actions'

export function IndicatorEvidenceDrawer({
  isOpen,
  onClose,
  evaluationId,
  aspectCode,
  aspectName,
  isEditable = false,
  unitId,
  uploaderName = 'Admin OPD'
}: {
  isOpen: boolean
  onClose: () => void
  evaluationId: string
  aspectCode: string
  aspectName: string
  isEditable?: boolean
  unitId: string
  uploaderName?: string
}) {
  const [activeTab, setActiveTab] = useState<'SLOTS' | 'HISTORY'>('SLOTS')
  const [slots, setSlots] = useState<EvidenceSlotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [activeInputMode, setActiveInputMode] = useState<Record<string, 'UPLOAD' | 'LINK'>>({})

  // Form Bukti Tambahan Kustom
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [customFile, setCustomFile] = useState<File | null>(null)
  const [customMode, setCustomMode] = useState<'UPLOAD' | 'LINK'>('UPLOAD')

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<EvidenceSlotItem | null>(null)
  const [activeImageExample, setActiveImageExample] = useState<string | null>(null)

  // Load Slots
  const loadSlots = async () => {
    setLoading(true)
    try {
      const res = await getIndicatorEvidenceAction(evaluationId, aspectCode)
      if (res.success && res.slots) {
        setSlots(res.slots)
        const initialEdits: Record<string, string> = {}
        res.slots.forEach((s) => {
          initialEdits[s.slotKey] = s.fileUrl || ''
        })
        setEditValues(initialEdits)
      }
    } catch {
      toast.error('Gagal memuat berkas bukti dukung.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadSlots()
    }
  }, [isOpen, aspectCode, evaluationId])

  // Handle Save Link URL
  const handleSaveLink = async (slot: EvidenceSlotItem) => {
    const newUrl = editValues[slot.slotKey] || ''
    if (!newUrl.trim()) {
      toast.error('Tautan file tidak boleh kosong.')
      return
    }

    setSavingKey(slot.slotKey)
    try {
      const res = await saveIndicatorEvidenceSlotAction({
        evaluationId,
        aspectCode,
        slotKey: slot.slotKey,
        title: slot.title,
        fileUrl: newUrl,
        uploaderName,
        path: `/evaluasi/${unitId}`
      })

      if (res.success) {
        toast.success(`Tautan "${slot.title}" berhasil disematkan!`)
        await loadSlots()
      } else {
        toast.error(res.error || 'Gagal menyimpan tautan.')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setSavingKey(null)
    }
  }

  // Handle Direct File Upload via API
  const handleDirectFileUpload = async (slot: EvidenceSlotItem, file: File) => {
    setUploadingKey(slot.slotKey)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('evaluationId', evaluationId)
    formData.append('aspectCode', aspectCode)
    formData.append('slotKey', slot.slotKey)
    formData.append('title', slot.title)
    formData.append('unitId', unitId)
    formData.append('uploaderName', uploaderName)

    try {
      const res = await fetch('/api/evidence/upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`File ${file.name} berhasil diunggah! (${data.submission.storageProvider})`)
        await loadSlots()
      } else {
        toast.error(data.error || 'Gagal mengunggah file.')
      }
    } catch {
      toast.error('Gagal mengunggah file.')
    } finally {
      setUploadingKey(null)
    }
  }
  // Handle Add Custom Slot
  const handleAddCustomSlot = async () => {
    if (!customTitle.trim()) {
      toast.error('Judul dokumen pendukung wajib diisi.')
      return
    }

    setLoading(true)
    try {
      if (customMode === 'UPLOAD' && customFile) {
        const generatedKey = `additional_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const formData = new FormData()
        formData.append('file', customFile)
        formData.append('evaluationId', evaluationId)
        formData.append('aspectCode', aspectCode)
        formData.append('slotKey', generatedKey)
        formData.append('title', customTitle.trim())
        formData.append('unitId', unitId)
        formData.append('uploaderName', uploaderName)

        const res = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()

        if (data.success) {
          toast.success(`Dokumen "${customTitle}" berhasil diunggah tersimpan!`)
          setShowAddCustom(false)
          setCustomTitle('')
          setCustomUrl('')
          setCustomFile(null)
          await loadSlots()
        } else {
          toast.error(data.error || 'Gagal menambah dokumen.')
        }
      } else if (customMode === 'LINK' && customUrl.trim()) {
        const res = await addCustomAdditionalEvidenceSlotAction({
          evaluationId,
          aspectCode,
          title: customTitle.trim(),
          fileUrl: customUrl.trim(),
          uploaderName,
          path: `/evaluasi/${unitId}`
        })

        if (res.success) {
          toast.success(`Dokumen tambahan "${customTitle}" berhasil ditambahkan!`)
          setShowAddCustom(false)
          setCustomTitle('')
          setCustomUrl('')
          await loadSlots()
        } else {
          toast.error(res.error || 'Gagal menambah dokumen.')
        }
      } else {
        toast.error('Pilih file atau masukkan tautan link dokumen.')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete
  const handleDeleteSubmission = async () => {
    if (!deleteTarget?.submissionId) return
    setLoading(true)
    try {
      const res = await deleteIndicatorEvidenceSlotAction({
        submissionId: deleteTarget.submissionId,
        evaluationId,
        path: `/evaluasi/${unitId}`
      })

      if (res.success) {
        toast.success(`Berkas "${deleteTarget.title}" berhasil dihapus.`)
        setDeleteTarget(null)
        await loadSlots()
      } else {
        toast.error('Gagal menghapus berkas.')
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi.')
    } finally {
      setLoading(false)
    }
  }

  const mandatorySlots = slots.filter((s) => s.isMandatory)
  const additionalSlots = slots.filter((s) => !s.isMandatory)
  const uploadedMandatoryCount = mandatorySlots.filter((s) => s.fileUrl).length

  // All Activities for History Tab
  const allActivities: Array<EvidenceActivityItem & { slotTitle: string }> = []
  slots.forEach((slot) => {
    if (slot.history) {
      slot.history.forEach((act) => {
        allActivities.push({
          ...act,
          slotTitle: slot.title
        })
      })
    }
  })
  allActivities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-card h-full shadow-2xl flex flex-col border-l border-line animate-in slide-in-from-right duration-200">
        
        {/* Drawer Header */}
        <div className="p-5 space-y-3 border-b border-line bg-surface-subtle">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="default" size="sm">
                  ASPEK {aspectCode}
                </Badge>
                <Badge variant={isEditable ? 'success' : 'neutral'} size="sm" dot>
                  {isEditable ? 'Mode Pengisian OPD' : 'Mode Evaluator (Read-Only)'}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-ink">
                Bukti Dukung: {aspectName}
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Dokumen fisik &amp; tautan bukti dukung living document standar PermenPAN-RB No. 29 Tahun 2022.
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-surface-muted border border-line transition-colors cursor-pointer shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 pt-2 border-t border-line">
            <button
              type="button"
              onClick={() => setActiveTab('SLOTS')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'SLOTS'
                  ? 'bg-ink text-white shadow-2xs'
                  : 'text-ink-secondary hover:bg-surface-muted'
              }`}>
              <Folder className="w-3.5 h-3.5" />
              <span>Daftar Dokumen ({uploadedMandatoryCount}/{mandatorySlots.length} Wajib)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('HISTORY')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'HISTORY'
                  ? 'bg-ink text-white shadow-2xs'
                  : 'text-ink-secondary hover:bg-surface-muted'
              }`}>
              <History className="w-3.5 h-3.5" />
              <span>Jejak Aktivitas ({allActivities.length})</span>
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3 text-ink-muted">
              <Loader2 className="w-8 h-8 animate-spin text-ink" />
              <p className="text-xs font-medium font-mono">Memuat berkas bukti dukung...</p>
            </div>
          ) : activeTab === 'HISTORY' ? (
            /* TAB 2: JEJAK AKTIVITAS */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-ink">
                    Riwayat Jejak Aktivitas Berkas
                  </h3>
                  <p className="text-[11px] text-ink-muted">
                    Kronologi pengunggahan, pembaruan tautan, dan revisi dokumen pada Aspek {aspectCode}.
                  </p>
                </div>
              </div>

              {allActivities.length === 0 ? (
                <div className="py-16 text-center space-y-2 border border-dashed border-line rounded-2xl p-6 bg-surface-subtle">
                  <History className="w-8 h-8 text-ink-faint mx-auto" />
                  <p className="text-xs font-bold text-ink">Belum Ada Riwayat Aktivitas</p>
                  <p className="text-[11px] text-ink-muted">
                    Setiap aktivitas upload atau pembaruan link oleh OPD akan tercatat otomatis di sini.
                  </p>
                </div>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-line">
                  {allActivities.map((act) => (
                    <div key={act.id} className="relative space-y-1 text-xs">
                      <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-card border-2 border-ink flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5 text-ink" />
                      </div>

                      <div className="p-3.5 rounded-xl border border-line bg-card shadow-2xs space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-bold text-ink text-xs flex items-center gap-1.5">
                            <Badge variant={act.action === 'UPLOAD' ? 'success' : 'default'} size="sm">
                              {act.action === 'UPLOAD' ? 'Unggah Berkas' : act.action === 'REPLACE' ? 'Ganti File' : 'Update Link'}
                            </Badge>
                            <span className="truncate">{act.slotTitle}</span>
                          </span>
                          <span className="text-[10px] font-mono text-ink-muted shrink-0">
                            {new Date(act.timestamp).toLocaleString('id-ID', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>

                        <p className="text-[11px] text-ink-secondary leading-relaxed">
                          {act.note}
                        </p>

                        <div className="flex items-center justify-between pt-1 border-t border-line text-[10px] text-ink-muted">
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3 text-ink-faint" />
                            <span>{act.actorName || 'Admin OPD'}</span>
                          </span>

                          {act.fileUrl && (
                            <a
                              href={act.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-bold text-ink hover:underline flex items-center gap-1">
                              <span>Buka Dokumen</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* TAB 1: DAFTAR BUKTI WAJIB & DOKUMEN TAMBAHAN FLEKSIBEL */
            <div className="space-y-8">
              {/* SEKSI 1: BUKTI WAJIB */}
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-line">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-ink" />
                      <span>1. Dokumen Bukti Wajib PermenPAN-RB</span>
                    </h3>
                    <p className="text-[11px] text-ink-muted">
                      Matriks dokumen pokok yang wajib dipenuhi unit kerja sesuai standar evaluasi.
                    </p>
                  </div>
                </div>

                <div className="space-y-3.5">
                  {mandatorySlots.map((slot) => {
                    const isUploaded = Boolean(slot.fileUrl)
                    const currentInputMode = activeInputMode[slot.slotKey] || 'UPLOAD'

                    return (
                      <div
                        key={slot.slotKey}
                        className={`rounded-2xl border transition-all p-4 space-y-3 ${
                          isUploaded
                            ? 'bg-card border-line shadow-2xs'
                            : 'bg-surface-subtle border-line'
                        }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-ink leading-tight">
                                {slot.title}
                              </span>
                              <Badge variant="default" size="sm">
                                WAJIB
                              </Badge>
                            </div>
                            {slot.description && (
                              <p className="text-[11px] text-ink-muted leading-relaxed">
                                {slot.description}
                              </p>
                            )}
                          </div>

                          <Badge
                            variant={isUploaded ? 'success' : 'neutral'}
                            size="sm"
                            dot>
                            {isUploaded ? 'Sudah Diunggah' : 'Belum Ada'}
                          </Badge>
                        </div>

                        {slot.exampleImages && slot.exampleImages.length > 0 && (
                          <div className="flex items-center gap-2 pt-1">
                            <span className="text-[10px] font-mono font-bold text-ink-muted uppercase">
                              Contoh:
                            </span>
                            <div className="flex flex-wrap gap-1.5">
                              {slot.exampleImages.map((imgUrl, i) => (
                                <button
                                  key={i}
                                  type="button"
                                  onClick={() => setActiveImageExample(imgUrl)}
                                  className="px-2 py-0.5 rounded-lg border border-line bg-surface-subtle hover:bg-surface-muted text-[10px] font-mono text-ink-secondary flex items-center gap-1 transition-colors cursor-pointer">
                                  <ImageIcon className="w-2.5 h-2.5 text-ink-faint" />
                                  <span>Format #{i + 1}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}

                        {isUploaded ? (
                          <div className="p-3 rounded-xl bg-surface-subtle border border-line space-y-2">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <FileText className="w-4 h-4 text-ink-secondary shrink-0" />
                                <div className="min-w-0">
                                  <div className="text-xs font-bold text-ink truncate font-mono">
                                    {slot.fileName || slot.fileUrl}
                                  </div>
                                  <div className="text-[10px] text-ink-muted flex items-center gap-2">
                                    <span>Penyimpanan: {slot.storageProvider || 'EXTERNAL_LINK'}</span>
                                    {slot.updatedAt && (
                                      <span>
                                        • Update: {new Date(slot.updatedAt).toLocaleDateString('id-ID')}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={slot.fileUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ink hover:bg-ink-secondary text-white text-[11px] font-bold shadow-2xs transition-all">
                                  <span>Buka Berkas</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>

                                {isEditable && (
                                  <button
                                    type="button"
                                    onClick={() => setDeleteTarget(slot)}
                                    title="Hapus / Kosongkan Berkas"
                                    className="p-1.5 rounded-xl text-ink-muted hover:text-pastel-rose-text hover:bg-pastel-rose border border-line transition-colors cursor-pointer">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div>
                            {!isEditable ? (
                              <div className="p-3 rounded-xl bg-surface-muted text-xs text-ink-muted italic border border-line text-center">
                                Dokumen ini belum diunggah oleh OPD lokus.
                              </div>
                            ) : (
                              <div className="space-y-2.5 pt-1">
                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveInputMode((prev) => ({
                                        ...prev,
                                        [slot.slotKey]: 'UPLOAD'
                                      }))
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      currentInputMode === 'UPLOAD'
                                        ? 'bg-ink text-white shadow-2xs'
                                        : 'bg-surface-subtle text-ink-muted hover:text-ink border border-line'
                                    }`}>
                                    Upload File Langsung (PDF/Gambar)
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() =>
                                      setActiveInputMode((prev) => ({
                                        ...prev,
                                        [slot.slotKey]: 'LINK'
                                      }))
                                    }
                                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                                      currentInputMode === 'LINK'
                                        ? 'bg-ink text-white shadow-2xs'
                                        : 'bg-surface-subtle text-ink-muted hover:text-ink border border-line'
                                    }`}>
                                    Tautkan Link (Google Drive / Web)
                                  </button>
                                </div>

                                {currentInputMode === 'UPLOAD' ? (
                                  <label className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-line hover:border-ink rounded-xl bg-card hover:bg-surface-subtle cursor-pointer transition-all">
                                    <input
                                      type="file"
                                      accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                                      className="hidden"
                                      disabled={uploadingKey === slot.slotKey}
                                      onChange={(e) => {
                                        const file = e.target.files?.[0]
                                        if (file) handleDirectFileUpload(slot, file)
                                      }}
                                    />
                                    {uploadingKey === slot.slotKey ? (
                                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-ink">
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Mengunggah ke storage...</span>
                                      </div>
                                    ) : (
                                      <div className="text-center space-y-1">
                                        <UploadCloud className="w-5 h-5 text-ink-muted mx-auto" />
                                        <div className="text-xs font-bold text-ink">
                                          Pilih File PDF / Gambar / Dokumen
                                        </div>
                                        <p className="text-[10px] text-ink-muted">
                                          Maksimal 25MB (Otomatis Cloudflare R2 / Fallback Lokal)
                                        </p>
                                      </div>
                                    )}
                                  </label>
                                ) : (
                                  <div className="flex gap-2">
                                    <div className="relative flex-1">
                                      <Link2 className="w-3.5 h-3.5 text-ink-faint absolute left-3 top-1/2 -translate-y-1/2" />
                                      <input
                                        type="url"
                                        value={editValues[slot.slotKey] || ''}
                                        onChange={(e) =>
                                          setEditValues((prev) => ({
                                            ...prev,
                                            [slot.slotKey]: e.target.value
                                          }))
                                        }
                                        placeholder="https://drive.google.com/... atau tautan berkas resmi"
                                        className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-line bg-card text-ink focus:outline-none focus:border-ink shadow-2xs font-mono"
                                      />
                                    </div>
                                    <Button
                                      variant="primary"
                                      size="sm"
                                      isLoading={savingKey === slot.slotKey}
                                      disabled={savingKey === slot.slotKey}
                                      onClick={() => handleSaveLink(slot)}
                                      leftIcon={<Save className="w-3.5 h-3.5" />}>
                                      Simpan
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* SEKSI 2: BUKTI PENDUKUNG TAMBAHAN FLEKSIBEL */}
              <div className="space-y-4 pt-4 border-t border-line">
                <div className="flex items-center justify-between pb-1 border-b border-line">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-ink flex items-center gap-1.5">
                      <Folder className="w-4 h-4 text-ink" />
                      <span>2. Dokumen Pendukung Tambahan ({additionalSlots.length})</span>
                    </h3>
                    <p className="text-[11px] text-ink-muted">
                      OPD lokus dapat mengunggah berkas pendukung relevan lainnya sebanyak yang dibutuhkan.
                    </p>
                  </div>

                  {isEditable && !showAddCustom && (
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setShowAddCustom(true)}
                      leftIcon={<Plus className="w-3.5 h-3.5" />}>
                      Tambah Dokumen
                    </Button>
                  )}
                </div>

                {showAddCustom && (
                  <div className="p-4 rounded-2xl border-2 border-dashed border-ink bg-surface-subtle space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-ink">
                        Tambah Berkas Pendukung Baru
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAddCustom(false)}
                        className="text-ink-muted hover:text-ink cursor-pointer">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-ink mb-1">
                        Nama / Judul Dokumen Pendukung <span className="text-pastel-rose-text">*</span>
                      </label>
                      <input
                        type="text"
                        value={customTitle}
                        onChange={(e) => setCustomTitle(e.target.value)}
                        placeholder="Contoh: Dokumen Sertifikasi ISO / SK Tim Pokja Layanan"
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-line bg-card text-ink focus:outline-none focus:border-ink shadow-2xs font-medium"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCustomMode('UPLOAD')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            customMode === 'UPLOAD'
                              ? 'bg-ink text-white shadow-2xs'
                              : 'bg-surface-subtle text-ink-muted border border-line'
                          }`}>
                          Upload File Langsung
                        </button>
                        <button
                          type="button"
                          onClick={() => setCustomMode('LINK')}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                            customMode === 'LINK'
                              ? 'bg-ink text-white shadow-2xs'
                              : 'bg-surface-subtle text-ink-muted border border-line'
                          }`}>
                          Tautan Eksternal (URL)
                        </button>
                      </div>

                      {customMode === 'UPLOAD' ? (
                        <input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                          onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                          className="w-full text-xs file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border file:border-line file:text-xs file:font-bold file:bg-surface-subtle file:text-ink cursor-pointer"
                        />
                      ) : (
                        <input
                          type="url"
                          value={customUrl}
                          onChange={(e) => setCustomUrl(e.target.value)}
                          placeholder="https://drive.google.com/..."
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-line bg-card text-ink focus:outline-none focus:border-ink shadow-2xs font-mono"
                        />
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-2 border-t border-line">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setShowAddCustom(false)}>
                        Batal
                      </Button>
                      <Button
                        type="button"
                        variant="primary"
                        size="sm"
                        onClick={handleAddCustomSlot}>
                        Unggah &amp; Simpan Dokumen
                      </Button>
                    </div>
                  </div>
                )}

                {additionalSlots.length === 0 && !showAddCustom ? (
                  <div className="p-6 text-center space-y-1.5 border border-line rounded-2xl bg-surface-subtle">
                    <p className="text-xs font-bold text-ink-muted">Belum Ada Dokumen Pendukung Tambahan</p>
                    <p className="text-[11px] text-ink-faint">
                      {isEditable
                        ? 'Klik tombol "Tambah Dokumen" di atas jika ada berkas pendukung tambahan yang relevan.'
                        : 'Unit kerja tidak menyertakan dokumen pendukung tambahan.'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {additionalSlots.map((slot) => (
                      <div
                        key={slot.slotKey}
                        className="rounded-2xl border border-line bg-card p-4 shadow-2xs space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs text-ink">{slot.title}</span>
                              <Badge variant="neutral" size="sm">
                                DOKUMEN TAMBAHAN
                              </Badge>
                            </div>
                            <div className="text-[10px] text-ink-muted mt-0.5">
                              Penyimpanan: {slot.storageProvider || 'EXTERNAL_LINK'}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <a
                              href={slot.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-ink hover:bg-ink-secondary text-white text-[11px] font-bold shadow-2xs transition-all">
                              <span>Buka Dokumen</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>

                            {isEditable && (
                              <button
                                type="button"
                                onClick={() => setDeleteTarget(slot)}
                                title="Hapus Dokumen Tambahan"
                                className="p-1.5 rounded-xl text-ink-muted hover:text-pastel-rose-text hover:bg-pastel-rose border border-line transition-colors cursor-pointer">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-line bg-surface-subtle flex items-center justify-between">
          <span className="text-xs text-ink-muted font-medium">
            Dokumen terunggah berlaku untuk seluruh indikator di Aspek {aspectCode}.
          </span>
          <Button
            variant="primary"
            size="sm"
            onClick={onClose}>
            Tutup Panel
          </Button>
        </div>
      </div>

      {/* Image Preview Modal */}
      {activeImageExample && (
        <div className="fixed inset-0 z-60 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card p-3 rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-hidden flex flex-col space-y-2 border border-line">
            <div className="flex items-center justify-between border-b border-line pb-2">
              <span className="font-bold text-xs text-ink">Contoh Format Bukti Fisik</span>
              <button
                type="button"
                onClick={() => setActiveImageExample(null)}
                className="p-1 rounded-lg text-ink-muted hover:text-ink cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-surface-subtle rounded-xl p-2">
              <img src={activeImageExample} alt="Contoh Dokumen" className="max-h-[60vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSubmission}
        loading={loading}
        variant="danger"
        title={`Hapus Dokumen "${deleteTarget?.title}"?`}
        description="Berkas bukti dukung ini akan dihapus dari sistem evaluasi unit kerja."
        confirmText="Hapus Berkas"
      />
    </div>
  )
}
