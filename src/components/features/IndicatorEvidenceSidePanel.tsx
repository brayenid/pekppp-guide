// src/components/features/IndicatorEvidenceSidePanel.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Folder,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Image as ImageIcon,
  Save,
  Loader2,
  Link2,
  UploadCloud,
  FileUp,
  X,
  Maximize2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getIndicatorEvidenceAction,
  saveIndicatorEvidenceSlotAction,
  addCustomAdditionalEvidenceSlotAction,
  deleteIndicatorEvidenceSlotAction,
  EvidenceSlotItem
} from '../../actions/evidence-slot-actions'

import { ConfirmationModal } from '../ui/ConfirmationModal'
import { IndicatorEvidenceDrawer } from './IndicatorEvidenceDrawer'

export function IndicatorEvidenceSidePanel({
  evaluationId,
  aspectCode,
  aspectName,
  isEditable = false,
  unitId,
  uploaderName = 'Admin OPD'
}: {
  evaluationId: string
  aspectCode: string
  aspectName: string
  isEditable?: boolean
  unitId: string
  uploaderName?: string
}) {
  const [slots, setSlots] = useState<EvidenceSlotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [inputModes, setInputModes] = useState<Record<string, 'FILE' | 'LINK'>>({})
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [customFile, setCustomFile] = useState<File | null>(null)
  const [customMode, setCustomMode] = useState<'FILE' | 'LINK'>('FILE')
  const [activeImageExample, setActiveImageExample] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<EvidenceSlotItem | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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
    loadSlots()
  }, [aspectCode, evaluationId])

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
        toast.success(`Berkas "${file.name}" berhasil diunggah!`)
        await loadSlots()
      } else {
        toast.error(data.error || 'Gagal mengunggah berkas.')
      }
    } catch {
      toast.error('Gagal mengunggah berkas.')
    } finally {
      setUploadingKey(null)
    }
  }

  const handleSaveSlotLink = async (slot: EvidenceSlotItem) => {
    const newUrl = editValues[slot.slotKey] || ''
    setSavingKey(slot.slotKey)
    try {
      await saveIndicatorEvidenceSlotAction({
        evaluationId,
        aspectCode,
        slotKey: slot.slotKey,
        title: slot.title,
        fileUrl: newUrl,
        uploaderName,
        path: `/evaluasi/${unitId}`
      })
      toast.success(`Tautan "${slot.title}" disimpan!`)
      await loadSlots()
    } catch {
      toast.error('Gagal menyimpan tautan.')
    } finally {
      setSavingKey(null)
    }
  }

  const handleAddCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim()) {
      toast.error('Nama dokumen wajib diisi.')
      return
    }

    setSavingKey('new_custom')

    try {
      if (customMode === 'FILE') {
        if (!customFile) {
          toast.error('Pilih berkas file yang akan diunggah.')
          setSavingKey(null)
          return
        }
        const customSlotKey = `additional_${Date.now()}_${Math.random().toString(36).substring(7)}`
        const formData = new FormData()
        formData.append('file', customFile)
        formData.append('evaluationId', evaluationId)
        formData.append('aspectCode', aspectCode)
        formData.append('slotKey', customSlotKey)
        formData.append('title', customTitle.trim())
        formData.append('unitId', unitId)
        formData.append('uploaderName', uploaderName)

        const res = await fetch('/api/evidence/upload', {
          method: 'POST',
          body: formData
        })
        const data = await res.json()

        if (data.success) {
          toast.success(`Berkas tambahan "${customTitle}" berhasil diunggah!`)
          setCustomTitle('')
          setCustomFile(null)
          setShowAddCustom(false)
          await loadSlots()
        } else {
          toast.error(data.error || 'Gagal mengunggah berkas tambahan.')
        }
      } else {
        if (!customUrl.trim()) {
          toast.error('Tautan URL dokumen wajib diisi.')
          setSavingKey(null)
          return
        }
        await addCustomAdditionalEvidenceSlotAction({
          evaluationId,
          aspectCode,
          title: customTitle.trim(),
          fileUrl: customUrl.trim(),
          uploaderName,
          path: `/evaluasi/${unitId}`
        })
        toast.success('Dokumen tambahan berhasil ditambahkan!')
        setCustomTitle('')
        setCustomUrl('')
        setShowAddCustom(false)
        await loadSlots()
      }
    } catch {
      toast.error('Gagal menambah berkas tambahan.')
    } finally {
      setSavingKey(null)
    }
  }

  const handleDeleteSlot = async () => {
    if (!deleteTarget?.submissionId) return
    setLoading(true)
    try {
      await deleteIndicatorEvidenceSlotAction({
        submissionId: deleteTarget.submissionId,
        evaluationId,
        path: `/evaluasi/${unitId}`
      })
      toast.success('Berkas berhasil dihapus.')
      setDeleteTarget(null)
      await loadSlots()
    } catch {
      toast.error('Gagal menghapus berkas.')
    } finally {
      setLoading(false)
    }
  }

  const mandatoryCount = slots.filter((s) => s.isMandatory).length
  const filledMandatoryCount = slots.filter((s) => s.isMandatory && s.fileUrl && s.fileUrl.trim() !== '').length

  return (
    <div className="space-y-3.5">
      {/* Aspect Summary Header */}
      <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1.5 shadow-2xs">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider font-mono truncate">
            Aspek {aspectCode} • {aspectName}
          </span>
          <div className="flex items-center gap-1.5 shrink-0">
            <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded shadow-2xs border ${
              filledMandatoryCount === mandatoryCount && mandatoryCount > 0
                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                : 'bg-white text-slate-700 border-slate-200'
            }`}>
              {filledMandatoryCount}/{mandatoryCount} Wajib
            </span>
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              title="Buka Drawer Penuh & Jejak Aktivitas"
              className="p-1 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 border border-slate-200 bg-white transition-colors cursor-pointer">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
          {isEditable 
            ? 'Unggah berkas bukti dukung (PDF/Dokumen) untuk memenuhi parameter penilaian aspek ini.'
            : 'Dokumen bukti dukung acuan pembuktian evaluator untuk pertanyaan Aspek ini.'}
        </p>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin text-slate-700" />
          <span className="text-xs font-medium">Memuat slot berkas...</span>
        </div>
      ) : (
        <div className="space-y-3 max-h-[calc(100vh-270px)] overflow-y-auto pr-1">
          {slots.map((slot) => {
            const hasUploaded = Boolean(slot.fileUrl && slot.fileUrl.trim() !== '')
            const currentMode = inputModes[slot.slotKey] || 'FILE'
            const currentEditVal = editValues[slot.slotKey] ?? ''
            const isDirty = currentEditVal.trim() !== (slot.fileUrl || '').trim()
            const isUploading = uploadingKey === slot.slotKey
            const isSaving = savingKey === slot.slotKey

            return (
              <div
                key={slot.slotKey}
                className={`rounded-xl border p-3 transition-all space-y-2.5 shadow-2xs ${
                  hasUploaded
                    ? 'bg-white border-emerald-200/80 ring-1 ring-emerald-500/10'
                    : slot.isMandatory
                    ? 'bg-amber-50/20 border-amber-200/80'
                    : 'bg-white border-slate-200'
                }`}>
                {/* Slot Title & Status Badge */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase font-mono ${
                          slot.isMandatory
                            ? 'bg-rose-100 text-rose-900 border border-rose-200'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                        {slot.isMandatory ? 'Wajib' : 'Tambahan'}
                      </span>
                      <h4 className="text-xs font-bold text-slate-900 leading-snug">
                        {slot.title}
                      </h4>
                    </div>

                    {slot.description && (
                      <p className="text-[11px] text-slate-500 leading-relaxed font-medium pt-0.5">
                        {slot.description}
                      </p>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 pt-0.5">
                    {hasUploaded ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[10px] font-bold border border-emerald-300">
                        <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                        <span>Terunggah</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold border border-amber-300">
                        <AlertCircle className="w-3 h-3 text-amber-700" />
                        <span>Kosong</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Example Photo Thumbnail if available */}
                {slot.exampleImages && slot.exampleImages.length > 0 && (
                  <div className="bg-slate-50 p-2 rounded-lg border border-slate-200/80 flex items-center justify-between gap-2">
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-slate-400" /> Format Contoh:
                    </span>
                    <div className="flex gap-1.5 overflow-x-auto">
                      {slot.exampleImages.map((imgUrl, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setActiveImageExample(imgUrl)}
                          className="relative h-7 w-11 rounded border border-slate-200 hover:border-slate-800 transition-all shrink-0 overflow-hidden cursor-pointer">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={imgUrl} alt="Contoh" className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Info File Terunggah */}
                {hasUploaded && (
                  <div className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-700 shrink-0 shadow-2xs">
                        {slot.storageProvider === 'EXTERNAL_LINK' ? (
                          <Link2 className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 truncate text-[11px]">
                          {slot.fileName || slot.title}
                        </p>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {slot.storageProvider || 'FILE'}
                        </span>
                      </div>
                    </div>

                    <a
                      href={slot.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-md bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 font-semibold text-[10px] inline-flex items-center gap-1 transition-colors shadow-2xs shrink-0">
                      <span>Buka</span>
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                )}

                {/* Input / Action Form */}
                {isEditable ? (
                  /* OPD Mode: Direct File Upload with URL fallback */
                  <div className="pt-1.5 border-t border-slate-100 space-y-2">
                    {/* Mode Toggle & File Upload Area */}
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-semibold text-slate-600">
                        {hasUploaded ? 'Perbarui / Ganti Berkas:' : 'Unggah Bukti Fisik:'}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setInputModes((prev) => ({ ...prev, [slot.slotKey]: 'FILE' }))}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                            currentMode === 'FILE'
                              ? 'bg-slate-900 text-white font-bold'
                              : 'text-slate-500 hover:text-slate-900 bg-slate-100'
                          }`}>
                          Upload File
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputModes((prev) => ({ ...prev, [slot.slotKey]: 'LINK' }))}
                          className={`px-1.5 py-0.5 rounded text-[10px] font-medium transition-colors cursor-pointer ${
                            currentMode === 'LINK'
                              ? 'bg-slate-900 text-white font-bold'
                              : 'text-slate-500 hover:text-slate-900 bg-slate-100'
                          }`}>
                          Tautan Link
                        </button>
                      </div>
                    </div>

                    {currentMode === 'FILE' ? (
                      <div>
                        <input
                          type="file"
                          ref={(el) => {
                            fileInputRefs.current[slot.slotKey] = el
                          }}
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleDirectFileUpload(slot, file)
                          }}
                          accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                          className="hidden"
                        />
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => fileInputRefs.current[slot.slotKey]?.click()}
                          className="w-full py-2 px-3 rounded-lg border border-dashed border-slate-300 hover:border-slate-800 bg-white hover:bg-slate-50 text-slate-800 text-[11px] font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-2xs">
                          {isUploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-800" />
                              <span>Mengunggah Berkas...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-3.5 h-3.5 text-slate-600" />
                              <span>{hasUploaded ? 'Pilih Berkas Pengganti (PDF/Gambar)' : 'Pilih Berkas Dokumen (PDF/Gambar)'}</span>
                            </>
                          )}
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <div className="relative flex-1">
                          <Link2 className="w-3 h-3 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                          <input
                            type="url"
                            value={currentEditVal}
                            onChange={(e) =>
                              setEditValues((prev) => ({ ...prev, [slot.slotKey]: e.target.value }))
                            }
                            placeholder="Paste tautan URL / Google Drive..."
                            className="w-full pl-7 pr-2 py-1.5 text-[11px] font-mono rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-900 shadow-2xs"
                          />
                        </div>

                        <button
                          type="button"
                          disabled={isSaving || (!isDirty && !hasUploaded)}
                          onClick={() => handleSaveSlotLink(slot)}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-2xs shrink-0 ${
                            isDirty
                              ? 'bg-slate-900 hover:bg-slate-800 text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}>
                          {isSaving ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Save className="w-3 h-3" />
                          )}
                          <span>Simpan</span>
                        </button>
                      </div>
                    )}

                    {!slot.isMandatory && slot.submissionId && (
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(slot)}
                          className="text-[10px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium hover:underline cursor-pointer">
                          <Trash2 className="w-2.5 h-2.5" />
                          <span>Hapus Dokumen Tambahan Ini</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Evaluator Mode: Direct inspection button */
                  <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between gap-2">
                    {hasUploaded ? (
                      <a
                        href={slot.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-semibold transition-all shadow-2xs">
                        <Folder className="w-3 h-3" />
                        <span>Buka Dokumen Pembuktian</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-slate-400 italic">
                        Lokus belum melampirkan berkas untuk slot ini.
                      </span>
                    )}
                  </div>
                )}
              </div>
            )
          })}

          {/* Add Custom Additional Slot (OPD Mode) */}
          {isEditable && (
            <div className="pt-1">
              {!showAddCustom ? (
                <button
                  type="button"
                  onClick={() => setShowAddCustom(true)}
                  className="w-full py-2.5 rounded-xl border border-dashed border-slate-300 hover:border-slate-600 bg-slate-50/50 hover:bg-white text-slate-700 font-semibold text-[11px] transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Dokumen Pendukung Lain</span>
                </button>
              ) : (
                <form
                  onSubmit={handleAddCustomSlot}
                  className="p-3 rounded-xl border border-slate-300 bg-white space-y-2.5 shadow-sm text-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900 text-[11px]">Tambah Berkas Tambahan</h5>
                    <button
                      type="button"
                      onClick={() => setShowAddCustom(false)}
                      className="text-slate-400 hover:text-slate-700 text-[10px]">
                      Batal
                    </button>
                  </div>

                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Nama Dokumen (e.g. Sertifikat ISO 9001)..."
                    className="w-full px-2.5 py-1.5 text-[11px] rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                  />

                  {/* Mode Selector */}
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setCustomMode('FILE')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        customMode === 'FILE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}>
                      Unggah File
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomMode('LINK')}
                      className={`flex-1 py-1 text-[10px] font-bold rounded-md transition-all cursor-pointer ${
                        customMode === 'LINK' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500'
                      }`}>
                      Tautan URL
                    </button>
                  </div>

                  {customMode === 'FILE' ? (
                    <div>
                      <input
                        type="file"
                        onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp"
                        className="w-full text-[11px] text-slate-600 file:mr-2 file:py-1 file:px-2.5 file:rounded-md file:border-0 file:text-[10px] file:font-semibold file:bg-slate-900 file:text-white hover:file:bg-slate-800 cursor-pointer"
                      />
                    </div>
                  ) : (
                    <input
                      type="url"
                      value={customUrl}
                      onChange={(e) => setCustomUrl(e.target.value)}
                      placeholder="Paste link URL / Google Drive..."
                      className="w-full px-2.5 py-1.5 text-[11px] font-mono rounded-lg border border-slate-200 bg-white text-slate-900 focus:outline-none focus:border-slate-900 shadow-2xs"
                    />
                  )}

                  <button
                    type="submit"
                    disabled={savingKey === 'new_custom'}
                    className="w-full py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-[11px] transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-hz-button">
                    {savingKey === 'new_custom' ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Plus className="w-3 h-3" />
                    )}
                    <span>Tambahkan Berkas</span>
                  </button>
                </form>
              )}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Modal */}
      {activeImageExample && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white p-3 rounded-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col space-y-2 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <span className="font-bold text-xs text-slate-900">Format Contoh Bukti Fisik</span>
              <button
                type="button"
                onClick={() => setActiveImageExample(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-900">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center bg-slate-100 rounded-xl p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activeImageExample} alt="Contoh" className="max-h-[60vh] object-contain rounded-lg" />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSlot}
        loading={loading}
        variant="danger"
        title={`Hapus Dokumen "${deleteTarget?.title}"?`}
        description="Berkas bukti dukung ini akan dihapus dari sistem evaluasi unit kerja."
        confirmText="Hapus Berkas"
      />
      {/* Full Indicator Evidence Drawer */}
      <IndicatorEvidenceDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false)
          loadSlots()
        }}
        evaluationId={evaluationId}
        aspectCode={aspectCode}
        aspectName={aspectName}
        isEditable={isEditable}
        unitId={unitId}
        uploaderName={uploaderName}
      />
    </div>
  )
}
