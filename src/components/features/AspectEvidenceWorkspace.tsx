// src/components/features/AspectEvidenceWorkspace.tsx
'use client'

import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import {
  Folder,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
  Loader2,
  Link2,
  Clock,
  User,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  FileCheck,
  History,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  LayoutGrid,
  List,
  RotateCcw,
  MoreVertical,
  ShieldAlert
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../ui/Button'
import { ConfirmationModal } from '../ui/ConfirmationModal'
import { DocumentRedactionModal } from './DocumentRedactionModal'
import {
  getIndicatorEvidenceAction,
  saveIndicatorEvidenceSlotAction,
  addCustomAdditionalEvidenceSlotAction,
  deleteIndicatorEvidenceSlotAction,
  deleteEvidenceAttachmentAction,
  deleteHistoryItemAction,
  uploadAspectSlotExampleAction,
  deleteAspectSlotExampleAction,
  uploadNewAttachmentVersionAction,
  restoreAttachmentVersionAction,
  deleteAttachmentVersionAction,
  EvidenceSlotItem,
  EvidenceActivityItem,
  EvidenceAttachmentItem,
  FileVersionItem
} from '../../actions/evidence-slot-actions'
import { formatFileUrl } from '../../lib/utils'

export function AspectEvidenceWorkspace({
  evaluationId,
  aspectCode,
  aspectName,
  isEditable = false,
  isEvaluator = false,
  evaluatorAiNote = null,
  unitId,
  uploaderName = 'Admin OPD',
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  targetSlotKey
}: {
  evaluationId: string
  aspectCode: string
  aspectName: string
  isEditable?: boolean
  isEvaluator?: boolean
  evaluatorAiNote?: {
    confidenceLevel: 'TINGGI' | 'SEDANG' | 'RENDAH'
    confidenceScore: number
    summary: string
    aspectGaps: string[]
    analyzedAt: string
  } | null
  unitId: string
  uploaderName?: string
  onPrev?: () => void
  onNext?: () => void
  prevLabel?: string
  nextLabel?: string
  targetSlotKey?: string | null
}) {
  const [slots, setSlots] = useState<EvidenceSlotItem[]>([])
  const [loading, setLoading] = useState(true)
  const [isAnalyzingAi, setIsAnalyzingAi] = useState(false)
  const [isCheckingCompliance, setIsCheckingCompliance] = useState(false)
  const [complianceSummary, setComplianceSummary] = useState<{
    overallReadinessScore: number
    overallSummary: string
    checkedAt?: string
  } | null>(null)
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0)
  const latinMap: Record<string, string> = { I: '1', II: '2', III: '3', IV: '4', V: '5', VI: '6', TAMBAHAN: 'Tambahan (Q31)' }
  const indicatorNumberLabel = latinMap[aspectCode] || aspectCode

  const defaultAspectNames: Record<string, string> = {
    'I': 'Kebijakan Pelayanan',
    'II': 'Profesionalisme SDM',
    'III': 'Sarana & Prasarana',
    'IV': 'Sistem Informasi Pelayanan Publik',
    'V': 'Konsultasi & Pengaduan',
    'VI': 'Inovasi Pelayanan Publik',
    'TAMBAHAN': 'Informasi Tambahan (Q31)'
  }
  const resolvedAspectName =
    aspectName && aspectName !== aspectCode && !['I', 'II', 'III', 'IV', 'V', 'VI', 'TAMBAHAN'].includes(aspectName)
      ? aspectName
      : defaultAspectNames[aspectCode] || aspectName || `Aspek ${aspectCode}`

  // Rate Limiting Cooldown Timer (60s)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const cooldownKey = `compliance_cooldown_${evaluationId}_${aspectCode}`
    const checkCooldown = () => {
      const stored = localStorage.getItem(cooldownKey)
      if (stored) {
        const expiry = parseInt(stored, 10)
        const diff = Math.ceil((expiry - Date.now()) / 1000)
        if (diff > 0) {
          setCooldownRemaining(diff)
        } else {
          setCooldownRemaining(0)
          localStorage.removeItem(cooldownKey)
        }
      } else {
        setCooldownRemaining(0)
      }
    }

    checkCooldown()
    const interval = setInterval(checkCooldown, 1000)
    return () => clearInterval(interval)
  }, [evaluationId, aspectCode])
  const [savingKey, setSavingKey] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>({})
  const [openLinkInputKey, setOpenLinkInputKey] = useState<string | null>(null)
  const [openAccordionKey, setOpenAccordionKey] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    try {
      const savedMode = localStorage.getItem('evidence_view_mode')
      if (savedMode === 'list' || savedMode === 'grid') {
        setViewMode(savedMode)
      }
    } catch {}
  }, [])

  const handleSetViewMode = (mode: 'grid' | 'list') => {
    setViewMode(mode)
    try {
      localStorage.setItem('evidence_view_mode', mode)
    } catch {}
  }

  // Form Bukti Tambahan Kustom
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customUrl, setCustomUrl] = useState('')
  const [customFile, setCustomFile] = useState<File | null>(null)
  const [customMode, setCustomMode] = useState<'UPLOAD' | 'LINK'>('UPLOAD')
  const [customDocType, setCustomDocType] = useState<'PDF' | 'IMAGE'>('PDF')

  // Delete Confirmation
  const [deleteTarget, setDeleteTarget] = useState<EvidenceSlotItem | null>(null)
  const [restoreVersionTarget, setRestoreVersionTarget] = useState<{ targetVersionId: string; verNum: number } | null>(null)
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<{ targetVersionId: string; verNum: number; fileName: string } | null>(null)
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState<{ slot: EvidenceSlotItem; attachmentId: string; fileName: string } | null>(null)
  const [deleteHistoryTarget, setDeleteHistoryTarget] = useState<{ slot: EvidenceSlotItem; activityId: string; fileName?: string } | null>(null)
  const [deleteExampleTarget, setDeleteExampleTarget] = useState<{ exampleUrl: string; slotKey: string } | null>(null)
  const [activeImageExample, setActiveImageExample] = useState<string | null>(null)
  const [activeExampleGallery, setActiveExampleGallery] = useState<{
    slotKey: string
    slotTitle: string
    urls: string[]
    currentIndex: number
  } | null>(null)

  // Redaction Studio Modal Target (Untuk Berkas yang Sudah Ada)
  const [redactModalTarget, setRedactModalTarget] = useState<{
    slot: EvidenceSlotItem
    attachment: EvidenceAttachmentItem
  } | null>(null)

  // Modal Tambah Berkas (File Picker & Dropzone)
  const [uploadModalSlot, setUploadModalSlot] = useState<EvidenceSlotItem | null>(null)
  const [pickedFileForUpload, setPickedFileForUpload] = useState<File | null>(null)
  const [isDragOverUpload, setIsDragOverUpload] = useState(false)
  const modalFileInputRef = useRef<HTMLInputElement | null>(null)

  // Pre-Upload Redaction Studio Target (Ditahan di Client / Memory sebelum masuk Server)
  const [preUploadRedactTarget, setPreUploadRedactTarget] = useState<{
    slot: EvidenceSlotItem
    file: File
    previewUrl: string
  } | null>(null)

  // Version Management Modal Target
  const [versionModalTarget, setVersionModalTarget] = useState<{
    slot: EvidenceSlotItem
    attachment: EvidenceAttachmentItem
  } | null>(null)
  const [isUploadingVersion, setIsUploadingVersion] = useState(false)
  const [isRestoringVersion, setIsRestoringVersion] = useState(false)
  const versionFileInputRef = useRef<HTMLInputElement | null>(null)

  // Handler simpan berkas baru dari Pre-Upload Studio langsung ke Server API
  const handleSavePreUploadFile = async (redactedOrOriginalFile: File) => {
    if (!preUploadRedactTarget) return
    const { slot } = preUploadRedactTarget
    await handleDirectFileUpload(slot, [redactedOrOriginalFile])
    // Revoke object url untuk membersihkan memory
    if (preUploadRedactTarget.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(preUploadRedactTarget.previewUrl)
    }
    setPreUploadRedactTarget(null)
  }

  // Buka Modal Tambah Berkas saat user klik Tambah Berkas
  const handleOpenUploadModal = (slot: EvidenceSlotItem) => {
    setUploadModalSlot(slot)
    setPickedFileForUpload(null)
  }

  // Validasi format file ketika file dipilih/didrop di modal
  const handleSelectFileInModal = (file: File) => {
    if (!uploadModalSlot) return
    const isImageOnlySlot = uploadModalSlot.documentType === 'IMAGE'
    const isDocOnlySlot = uploadModalSlot.documentType === 'PDF' && uploadModalSlot.slotKey === 'sk_sp'
    const isImageFile = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
    const isDocFile =
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.type === 'application/pdf' ||
      file.type.includes('word') ||
      file.type.includes('officedocument')

    if (isImageOnlySlot) {
      if (!isImageFile) {
        toast.error(`Berkas "${file.name}" ditolak! Slot ini khusus untuk foto/gambar (JPG, PNG, WEBP).`)
        return
      }
      if (file.size > 1 * 1024 * 1024) {
        toast.error(`Ukuran foto melebihi batas maksimal 1 MB.`)
        return
      }
    } else if (isDocOnlySlot) {
      if (!isDocFile) {
        toast.error(`Format berkas tidak didukung. Harap pilih berkas PDF atau DOCX resmi.`)
        return
      }
      if (file.size > 20 * 1024 * 1024) {
        toast.error(`Ukuran dokumen melebihi batas maksimal 20 MB.`)
        return
      }
    } else {
      if (!isImageFile && !isDocFile) {
        toast.error(`Format tidak didukung. Format yang diizinkan: PDF, DOCX, JPG, PNG, WEBP.`)
        return
      }
      if (isImageFile && file.size > 1 * 1024 * 1024) {
        toast.error(`Ukuran foto melebihi batas maksimal 1 MB.`)
        return
      }
      if (isDocFile && file.size > 20 * 1024 * 1024) {
        toast.error(`Ukuran dokumen melebihi batas maksimal 20 MB.`)
        return
      }
    }

    setPickedFileForUpload(file)
  }

  // Tombol "Unggah" di Modal Tambah Berkas diklik -> Tahan di client dan bawa ke Studio Sensor jika PDF/Gambar
  const handleProceedToRedactionOrUpload = () => {
    if (!uploadModalSlot || !pickedFileForUpload) return
    const file = pickedFileForUpload
    const isImageOrPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp)$/i.test(file.name)

    const targetSlot = uploadModalSlot
    setUploadModalSlot(null)
    setPickedFileForUpload(null)

    if (isImageOrPdf) {
      // TAHAN DI CLIENT: Buat blob URL lokal, belum dikirim ke server sama sekali
      const blobUrl = URL.createObjectURL(file)
      setPreUploadRedactTarget({
        slot: targetSlot,
        file,
        previewUrl: blobUrl
      })
    } else {
      // Jika dokumen docx biasa tanpa canvas viewer, langsung upload ke server
      handleDirectFileUpload(targetSlot, [file])
    }
  }

  const handleSaveRedactedAttachment = async (redactedFile: File, saveMode: 'new_version' | 'overwrite' = 'new_version') => {
    if (!redactModalTarget) return
    const { slot, attachment } = redactModalTarget
    const formData = new FormData()
    formData.append('file', redactedFile)
    formData.append('evaluationId', evaluationId)
    formData.append('aspectCode', aspectCode)
    formData.append('slotKey', slot.slotKey)
    formData.append('attachmentId', attachment.id)
    formData.append('unitId', unitId)
    formData.append('uploaderName', uploaderName)
    formData.append('saveMode', saveMode)
    formData.append(
      'note',
      saveMode === 'overwrite'
        ? 'Menimpa berkas dengan hasil sensor data rahasia'
        : 'Hasil sensor data pribadi/rahasia (Redacted)'
    )

    try {
      const res = await uploadNewAttachmentVersionAction(formData)
      if (res.success) {
        if (saveMode === 'overwrite') {
          toast.success(`Berkas berhasil disensor dan ditimpa langsung!`)
        } else {
          toast.success(`Berkas hasil sensor berhasil disimpan sebagai versi baru (v${res.newVersion})!`)
        }
        await loadSlots()
        setRedactModalTarget(null)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('evidence-updated'))
        }
      } else {
        toast.error(res.error || 'Gagal menyimpan berkas tersensor.')
      }
    } catch (err: any) {
      toast.error('Gagal menyimpan berkas tersensor: ' + (err.message || 'Error'))
    }
  }

  // Dropdown Menu Target for Attachment (shadcn-style compact popover)
  const [openDropdownAttId, setOpenDropdownAttId] = useState<string | null>(null)

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null
      if (target && !target.closest('[data-attachment-dropdown]')) {
        setOpenDropdownAttId(null)
      }
    }
    if (openDropdownAttId) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [openDropdownAttId])

  const handleUploadNewVersion = async (file: File) => {
    if (!versionModalTarget) return
    setIsUploadingVersion(true)
    const { slot, attachment } = versionModalTarget
    const formData = new FormData()
    formData.append('file', file)
    formData.append('evaluationId', evaluationId)
    formData.append('aspectCode', aspectCode)
    formData.append('slotKey', slot.slotKey)
    formData.append('attachmentId', attachment.id)
    formData.append('unitId', unitId)
    formData.append('uploaderName', uploaderName)

    try {
      const res = await uploadNewAttachmentVersionAction(formData)
      if (res.success) {
        toast.success(`Versi baru (${res.newVersion}) berhasil diunggah!`)
        await loadSlots()
        setVersionModalTarget(null)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('evidence-updated'))
        }
      } else {
        toast.error(res.error || 'Gagal mengunggah versi baru.')
      }
    } catch {
      toast.error('Gagal mengunggah versi baru.')
    } finally {
      setIsUploadingVersion(false)
    }
  }

  const handleConfirmRestoreVersion = async () => {
    if (!versionModalTarget || !restoreVersionTarget) return
    setIsRestoringVersion(true)
    const { slot, attachment } = versionModalTarget
    const { targetVersionId } = restoreVersionTarget

    try {
      const res = await restoreAttachmentVersionAction({
        evaluationId,
        aspectCode,
        slotKey: slot.slotKey,
        attachmentId: attachment.id,
        targetVersionId,
        uploaderName
      })
      if (res.success) {
        toast.success(`Versi ${res.restoredVersion} berhasil dipulihkan menjadi berkas aktif!`)
        await loadSlots()
        setVersionModalTarget(null)
        setRestoreVersionTarget(null)
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('evidence-updated'))
        }
      } else {
        toast.error(res.error || 'Gagal memulihkan versi berkas.')
      }
    } catch {
      toast.error('Gagal memulihkan versi berkas.')
    } finally {
      setIsRestoringVersion(false)
    }
  }

  const [isDeletingVersion, setIsDeletingVersion] = useState(false)

  const handleConfirmDeleteVersion = async () => {
    if (!versionModalTarget || !deleteVersionTarget) return
    setIsDeletingVersion(true)
    const { slot, attachment } = versionModalTarget
    const { targetVersionId, verNum } = deleteVersionTarget

    try {
      const res = await deleteAttachmentVersionAction({
        evaluationId,
        aspectCode,
        slotKey: slot.slotKey,
        attachmentId: attachment.id,
        versionId: targetVersionId,
        actorName: uploaderName
      })
      if (res.success) {
        toast.success(`Arsip Versi ${verNum} berhasil dihapus permanen!`)
        setDeleteVersionTarget(null)
        // Update local modal target versi agar langsung reaktif tanpa harus tutup modal
        const updatedSlotList = await loadSlots()
        const refreshedSlot = updatedSlotList?.find((s) => s.slotKey === slot.slotKey)
        const refreshedAtt = refreshedSlot?.attachments?.find((a) => a.id === attachment.id)
        if (refreshedAtt) {
          setVersionModalTarget({ slot: refreshedSlot || slot, attachment: refreshedAtt })
        } else {
          setVersionModalTarget(null)
        }
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('evidence-updated'))
        }
      } else {
        toast.error(res.error || 'Gagal menghapus versi berkas.')
      }
    } catch {
      toast.error('Gagal menghapus versi berkas.')
    } finally {
      setIsDeletingVersion(false)
    }
  }

  const openExampleGallery = (slot: EvidenceSlotItem, initialIndex = 0) => {
    if (!slot.exampleImages || slot.exampleImages.length === 0) return
    setActiveExampleGallery({
      slotKey: slot.slotKey,
      slotTitle: slot.title,
      urls: slot.exampleImages,
      currentIndex: initialIndex
    })
  }

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

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

        // Cek riwayat hasil pengecekan kelayakan berkas
        const slotsWithInsights = res.slots.filter((s) => s.aiInsights?.status)
        if (slotsWithInsights.length > 0) {
          const validCount = slotsWithInsights.filter((s) => s.aiInsights?.status === 'LAYAK').length
          const readiness = Math.round((validCount / slotsWithInsights.length) * 100)
          const lastCheckedAt = slotsWithInsights[0].aiInsights?.checkedAt
          setComplianceSummary({
            overallReadinessScore: readiness,
            overallSummary: `${validCount} dari ${slotsWithInsights.length} dokumen telah berstatus Layak & Sah berdasarkan hasil pengecekan terakhir.`,
            checkedAt: lastCheckedAt
          })

          // Sinkronisasi Cooldown dari Server (Anti-tamper localStorage)
          if (lastCheckedAt) {
            const lastTime = new Date(lastCheckedAt).getTime()
            if (!isNaN(lastTime)) {
              const elapsed = Math.floor((Date.now() - lastTime) / 1000)
              if (elapsed >= 0 && elapsed < 60) {
                const remaining = 60 - elapsed
                setCooldownRemaining(remaining)
                if (typeof window !== 'undefined') {
                  const cooldownKey = `compliance_cooldown_${evaluationId}_${aspectCode}`
                  localStorage.setItem(cooldownKey, (Date.now() + remaining * 1000).toString())
                }
              }
            }
          }
        }
        return res.slots
      }
      return []
    } catch {
      toast.error('Gagal memuat berkas bukti dukung.')
      return []
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSlots()
  }, [aspectCode, evaluationId])

  // Auto-scroll ke slot bukti jika ada targetSlotKey
  useEffect(() => {
    if (!loading && targetSlotKey) {
      const timer = setTimeout(() => {
        const el = document.getElementById(`evidence-slot-${targetSlotKey}`)
        if (el) {
          const yOffset = -100
          const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
          window.scrollTo({ top: y, behavior: 'smooth' })
        }
      }, 150)
      return () => clearTimeout(timer)
    }
  }, [loading, targetSlotKey])

  // Handle Save Link URL
  const handleSaveLink = async (slot: EvidenceSlotItem) => {
    const newUrl = editValues[slot.slotKey] || ''
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
        toast.success(`Tautan disimpan.`)
        setOpenLinkInputKey(null)
        await loadSlots()
      } else {
        toast.error(res.error || 'Gagal menyimpan tautan.')
      }
    } catch {
      toast.error('Gagal menyimpan tautan.')
    } finally {
      setSavingKey(null)
    }
  }

  // Handle Direct File Upload (Mendukung Dokumen & Foto dengan Batasan Wajar)
  const handleDirectFileUpload = async (slot: EvidenceSlotItem, files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const isImageOnlySlot = slot.documentType === 'IMAGE'
    const isDocOnlySlot = slot.documentType === 'PDF' && slot.slotKey === 'sk_sp'
    const maxCount = 6
    const currentAttachments = slot.attachments || []

    // 1. Validasi Kuota Jumlah Berkas
    if (currentAttachments.length + fileArray.length > maxCount) {
      toast.error(
        `Batas kuota terlampaui! Maksimal ${maxCount} berkas per slot. Saat ini sudah ada ${currentAttachments.length} berkas, dan Anda memilih ${fileArray.length} berkas baru.`,
        { duration: 6000 }
      )
      return
    }

    // 2. Validasi Format & Ukuran Tiap Berkas
    for (const file of fileArray) {
      const isImageFile = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
      const isDocFile =
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.doc') ||
        file.name.toLowerCase().endsWith('.docx') ||
        file.type === 'application/pdf' ||
        file.type.includes('word') ||
        file.type.includes('officedocument')

      if (isImageOnlySlot) {
        if (!isImageFile) {
          toast.error(`Berkas "${file.name}" ditolak! Slot "${slot.title}" khusus untuk berkas foto/gambar (JPG, PNG, WEBP).`, { duration: 6000 })
          return
        }
        if (file.size > 1 * 1024 * 1024) {
          const actualMb = (file.size / (1024 * 1024)).toFixed(2)
          toast.error(`Ukuran foto "${file.name}" (${actualMb} MB) melebihi batas maksimal 1 MB per foto.`, { duration: 6000 })
          return
        }
      } else if (isDocOnlySlot) {
        if (isImageFile) {
          toast.error(`Format ditolak! Berkas "${file.name}" adalah gambar. Slot "${slot.title}" adalah dokumen resmi (wajib PDF atau DOCX).`, { duration: 6000 })
          return
        }
        if (!isDocFile) {
          toast.error(`Format berkas "${file.name}" tidak didukung. Harap unggah berkas PDF atau DOCX resmi.`, { duration: 5000 })
          return
        }
        if (file.size > 20 * 1024 * 1024) {
          const actualMb = (file.size / (1024 * 1024)).toFixed(1)
          toast.error(`Ukuran dokumen "${file.name}" (${actualMb} MB) melebihi batas maksimal 20 MB per berkas.`, { duration: 6000 })
          return
        }
      } else {
        // HYBRID: Menerima PDF/DOCX dan Foto (misalnya Laporan SKM + Foto Publikasi)
        if (!isImageFile && !isDocFile) {
          toast.error(`Format berkas "${file.name}" tidak didukung. Format yang diizinkan: PDF, DOCX, JPG, PNG, WEBP.`, { duration: 5000 })
          return
        }
        if (isImageFile && file.size > 1 * 1024 * 1024) {
          const actualMb = (file.size / (1024 * 1024)).toFixed(2)
          toast.error(`Ukuran foto "${file.name}" (${actualMb} MB) melebihi batas maksimal 1 MB per foto.`, { duration: 6000 })
          return
        }
        if (isDocFile && file.size > 20 * 1024 * 1024) {
          const actualMb = (file.size / (1024 * 1024)).toFixed(1)
          toast.error(`Ukuran dokumen "${file.name}" (${actualMb} MB) melebihi batas maksimal 20 MB per berkas.`, { duration: 6000 })
          return
        }
      }
    }

    setUploadingKey(slot.slotKey)
    const formData = new FormData()
    fileArray.forEach((f) => formData.append('files', f))
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
        toast.success(`${fileArray.length} berkas berhasil diunggah!`)
        await loadSlots()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('evidence-updated'))
        }
      } else {
        toast.error(data.error || 'Gagal mengunggah berkas.')
      }
    } catch {
      toast.error('Gagal mengunggah berkas.')
    } finally {
      setUploadingKey(null)
    }
  }

  // Handle Delete Attachment Spesifik
  const handleConfirmDeleteAttachment = async () => {
    if (!deleteAttachmentTarget) return
    const { slot, attachmentId, fileName } = deleteAttachmentTarget

    setUploadingKey(slot.slotKey)
    try {
      const res = await deleteEvidenceAttachmentAction({
        evaluationId,
        aspectCode,
        slotKey: slot.slotKey,
        attachmentId,
        path: `/evaluasi/${unitId}`
      })

      if (res.success) {
        toast.success(`Berkas "${fileName}" berhasil dihapus.`)
        setDeleteAttachmentTarget(null)
        await loadSlots()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('evidence-updated'))
        }
      } else {
        toast.error(res.error || 'Gagal menghapus berkas.')
      }
    } catch {
      toast.error('Gagal menghapus berkas.')
    } finally {
      setUploadingKey(null)
    }
  }

  // Handle Add Custom Evidence Slot
  const handleAddCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim()) {
      toast.error('Nama dokumen wajib diisi.')
      return
    }

    setSavingKey('new_custom')

    try {
      if (customMode === 'UPLOAD') {
        if (!customFile) {
          toast.error('Pilih berkas file yang akan diunggah.')
          setSavingKey(null)
          return
        }

        // Validasi Format Khusus Kustom
        const isImageFile = customFile.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(customFile.name)
        if (customDocType === 'PDF' && isImageFile) {
          toast.error('Format ditolak! Dokumen resmi tidak mengizinkan file gambar/foto. Harap unggah berkas PDF atau DOCX.', { duration: 6000 })
          setSavingKey(null)
          return
        }
        if (customDocType === 'IMAGE' && !isImageFile) {
          toast.error('Format ditolak! Anda memilih tipe Foto/Gambar. Harap unggah berkas JPG atau PNG.', { duration: 6000 })
          setSavingKey(null)
          return
        }

        // Validasi Instan di Browser (Maks 25MB)
        const MAX_SIZE_MB = 25
        if (customFile.size > MAX_SIZE_MB * 1024 * 1024) {
          const actualMb = (customFile.size / (1024 * 1024)).toFixed(1)
          toast.error(
            `Ukuran berkas terlalu besar (${actualMb} MB). Batas maksimal adalah ${MAX_SIZE_MB} MB.`,
            { duration: 6000 }
          )
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
          toast.success(`Berkas tambahan berhasil diunggah!`)
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
        const res = await addCustomAdditionalEvidenceSlotAction({
          evaluationId,
          aspectCode,
          title: customTitle.trim(),
          fileUrl: customUrl.trim(),
          uploaderName,
          path: `/evaluasi/${unitId}`
        })

        if (res.success) {
          toast.success('Dokumen tambahan berhasil ditambahkan!')
          setCustomTitle('')
          setCustomUrl('')
          setShowAddCustom(false)
          await loadSlots()
        } else {
          toast.error(res.error || 'Gagal menambah dokumen.')
        }
      }
    } catch {
      toast.error('Gagal memproses dokumen tambahan.')
    } finally {
      setSavingKey(null)
    }
  }

  // Handle Delete Slot (Single Delete: Hapus berkas aktif & rollback riwayat jika ada)
  const handleDeleteSlot = async () => {
    if (!deleteTarget) return
    setLoading(true)
    try {
      const res = await deleteIndicatorEvidenceSlotAction({
        submissionId: deleteTarget.submissionId,
        evaluationId,
        slotKey: deleteTarget.slotKey,
        aspectCode,
        path: `/evaluasi/${unitId}`
      })
      if (res.success) {
        toast.success(`Berkas berhasil dihapus.`)
        setDeleteTarget(null)
        await loadSlots()
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new Event('evidence-updated'))
        }
      } else {
        toast.error(res.error || 'Gagal menghapus berkas.')
      }
    } catch {
      toast.error('Gagal menghapus berkas.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Delete Single History Item
  const handleConfirmDeleteHistoryItem = async () => {
    if (!deleteHistoryTarget || !deleteHistoryTarget.slot.submissionId) return
    const { slot, activityId, fileName } = deleteHistoryTarget
    const submissionId = slot.submissionId
    if (!submissionId) return

    setLoading(true)
    try {
      const res = await deleteHistoryItemAction({
        submissionId,
        activityId,
        path: `/evaluasi/${unitId}`
      })
      if (res.success) {
        toast.success(`Versi berkas "${fileName || ''}" berhasil dihapus dari riwayat.`)
        setDeleteHistoryTarget(null)
        await loadSlots()
      } else {
        toast.error(res.error || 'Gagal menghapus versi riwayat.')
      }
    } catch {
      toast.error('Gagal menghapus versi riwayat.')
    } finally {
      setLoading(false)
    }
  }

  // Handle Upload Contoh Format Bukti (Admin / Evaluator)
  const handleUploadExample = async (slotKey: string, file: File) => {
    const toastId = toast.loading(`Mengoptimasi & mengunggah "${file.name}"...`)
    try {
      let fileToUpload = file
      if (file.type.startsWith('image/')) {
        const { compressImageClient } = await import('../../lib/client-image-compressor')
        fileToUpload = await compressImageClient(file)
      }

      const formData = new FormData()
      formData.append('file', fileToUpload)
      formData.append('aspectCode', aspectCode)
      formData.append('slotKey', slotKey)
      formData.append('path', `/evaluasi/${unitId}`)

      const res = await uploadAspectSlotExampleAction(formData)
      if (res.success) {
        toast.success('Contoh format bukti dukung berhasil diunggah!', { id: toastId })
        await loadSlots()
      } else {
        toast.error(res.error || 'Gagal mengunggah contoh format.', { id: toastId })
      }
    } catch {
      toast.error('Gagal mengunggah contoh format.', { id: toastId })
    }
  }

  // Handle Hapus Contoh Format Bukti (Admin / Evaluator)
  const handleConfirmDeleteExample = async () => {
    if (!deleteExampleTarget) return
    const { exampleUrl, slotKey } = deleteExampleTarget

    const toastId = toast.loading('Menghapus contoh format...')
    try {
      const res = await deleteAspectSlotExampleAction({
        aspectCode,
        slotKey,
        exampleImageUrl: exampleUrl,
        path: `/evaluasi/${unitId}`
      })
      if (res.success) {
        toast.success('Contoh format berhasil dihapus.', { id: toastId })
        setDeleteExampleTarget(null)
        await loadSlots()
      } else {
        toast.error(res.error || 'Gagal menghapus contoh format.', { id: toastId })
      }
    } catch {
      toast.error('Gagal menghapus contoh format.', { id: toastId })
    }
  }

  // Pemicu AI Pre-Evaluasi
  const handleTriggerAiAnalysis = async () => {
    setIsAnalyzingAi(true)
    try {
      const { triggerAiPreEvaluationAction } = await import('../../actions/ai-evaluator-actions')
      const res = await triggerAiPreEvaluationAction({
        evaluationId,
        aspectCode,
        path: `/evaluasi/${unitId}`
      })
      if (res.success) {
        toast.success(`Analisis AI Pre-Evaluator Aspek ${aspectCode} berhasil diperbarui!`)
        await loadSlots()
      } else {
        toast.error(res.error || 'Gagal menjalankan analisis AI.')
      }
    } catch {
      toast.error('Gagal menjalankan analisis AI.')
    } finally {
      setIsAnalyzingAi(false)
    }
  }

  const mandatorySlots = slots.filter((s) => s.isMandatory)
  const additionalSlots = slots.filter((s) => !s.isMandatory)
  const filledMandatoryCount = mandatorySlots.filter(
    (s) => s.fileUrl && s.fileUrl.trim() !== ''
  ).length
  const mandatoryTotal = mandatorySlots.length
  const progressPercent = mandatoryTotal > 0 ? Math.round((filledMandatoryCount / mandatoryTotal) * 100) : 0
  const isAllMandatoryUploaded = mandatoryTotal > 0 && filledMandatoryCount === mandatoryTotal
  const totalUploadedFiles = slots.filter((s) => s.fileUrl && s.fileUrl.trim() !== '').length
  const hasUploadedEvidence = totalUploadedFiles > 0

  // Logika Pembatasan Token & Perubahan Berkas:
  // 1. Jika belum pernah dicek (checkedAt belum ada), hanya boleh diklik jika seluruh dokumen wajib penuh (isAllMandatoryUploaded).
  // 2. Jika sudah pernah dicek, hanya boleh diklik jika ada berkas yang baru diunggah/diperbarui setelah waktu pengecekan terakhir.
  const lastCheckedTimestamp = complianceSummary?.checkedAt ? new Date(complianceSummary.checkedAt).getTime() : 0
  const hasEverChecked = lastCheckedTimestamp > 0

  const hasNewFilesSinceLastCheck = hasEverChecked
    ? slots.some((s) => {
        // Cek apakah submisi diperbarui setelah pengecekan terakhir
        const updatedTime = s.updatedAt ? new Date(s.updatedAt).getTime() : 0
        if (updatedTime > lastCheckedTimestamp + 1000) return true

        // Cek apakah ada riwayat aktivitas upload/update setelah pengecekan terakhir
        if (s.history && s.history.length > 0) {
          return s.history.some((h) => {
            if (h.timestamp) {
              const actTime = new Date(h.timestamp).getTime()
              return actTime > lastCheckedTimestamp + 1000
            }
            return false
          })
        }
        return false
      })
    : true // Jika belum pernah dicek, syarat utama adalah isAllMandatoryUploaded

  const canExecuteComplianceCheck = isAllMandatoryUploaded && (!hasEverChecked || hasNewFilesSinceLastCheck)

  // Pemicu Cek Kelayakan Dokumen (Untuk OPD / Lokus Mandiri)
  const handleCheckDocumentCompliance = async () => {
    // 1. Guard: Seluruh dokumen wajib harus sudah diunggah
    if (!isAllMandatoryUploaded) {
      toast.error(`Seluruh dokumen wajib (${filledMandatoryCount}/${mandatoryTotal}) harus terunggah sebelum melakukan cek kelayakan.`)
      return
    }

    // 2. Guard: Jika sudah pernah dicek dan tidak ada perubahan berkas baru
    if (hasEverChecked && !hasNewFilesSinceLastCheck) {
      toast.info('Tidak ada perubahan berkas baru sejak pemeriksaan terakhir. Pengecekan tidak dijalankan untuk menghemat token.')
      return
    }

    // 3. Guard: Cooldown rate limiting
    if (cooldownRemaining > 0) {
      toast.warning(`Harap tunggu ${cooldownRemaining} detik sebelum melakukan pengecekan ulang.`)
      return
    }

    setIsCheckingCompliance(true)
    try {
      const { checkDocumentComplianceAction } = await import('../../actions/ai-evaluator-actions')
      const res = await checkDocumentComplianceAction({
        evaluationId,
        aspectCode,
        path: `/evaluasi/${unitId}`
      })
      if (res.success && res.result) {
        setComplianceSummary({
          overallReadinessScore: res.result.overallReadinessScore,
          overallSummary: res.result.overallSummary,
          checkedAt: res.result.checkedAt
        })

        // Set cooldown 60 detik di localStorage
        if (typeof window !== 'undefined') {
          const cooldownKey = `compliance_cooldown_${evaluationId}_${aspectCode}`
          const expiryTime = Date.now() + 60 * 1000
          localStorage.setItem(cooldownKey, expiryTime.toString())
          setCooldownRemaining(60)
        }

        toast.success(`Pengecekan kelayakan dokumen Aspek ${aspectCode} selesai!`)
        await loadSlots()
      } else {
        toast.error(res.error || 'Gagal memeriksa kelayakan berkas.')
      }
    } catch {
      toast.error('Gagal menghubungi layanan cek kelayakan.')
    } finally {
      setIsCheckingCompliance(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* 1. Header & Progress Banner (Compact Integrated Bento) */}
      <div className="px-4 py-3 rounded-bento bg-surface border border-stroke/50 shadow-soft-card space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2 flex-wrap min-w-0"
            title={
              isEditable
                ? `Lengkapi dokumen bukti fisik untuk seluruh indikator ${resolvedAspectName}.`
                : `Verifikasi kelengkapan dokumen bukti fisik ${resolvedAspectName}.`
            }>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand shrink-0">
              Indikator {indicatorNumberLabel}
            </span>
            <h1 className="text-sm sm:text-base font-semibold text-ink tracking-tight truncate">
              {resolvedAspectName}
            </h1>
          </div>

          {/* Compact Inline Counter */}
          <div className="flex items-center gap-2 shrink-0 text-xs self-start sm:self-auto bg-surface-subtle px-2.5 py-1 rounded-full border border-stroke/50">
            <span className="font-medium text-ink">Kelengkapan</span>
            <div className="w-16 sm:w-20 h-1.5 rounded-full bg-surface-elevated overflow-hidden">
              <div
                className="h-full bg-brand transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="font-semibold text-ink">{progressPercent}%</span>
            <span className="text-ink-muted">
              ({filledMandatoryCount}/{mandatoryTotal})
            </span>
          </div>
        </div>

        {/* Action Buttons & Helpers */}
        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-stroke/40">
          {/* Tombol Cek Kelayakan (Hanya tampil untuk OPD / Lokus Mandiri) */}
          {!isEvaluator && (
            <button
              type="button"
              disabled={!canExecuteComplianceCheck || isCheckingCompliance || cooldownRemaining > 0}
              onClick={handleCheckDocumentCompliance}
              title={
                !isAllMandatoryUploaded
                  ? `Lengkapi seluruh ${mandatoryTotal} dokumen wajib terlebih dahulu`
                  : hasEverChecked && !hasNewFilesSinceLastCheck
                  ? 'Tidak ada perubahan berkas baru. Unggah berkas revisi atau tambahan untuk memeriksa ulang.'
                  : 'Mulai pemeriksaan kelayakan dokumen aspek ini'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                !canExecuteComplianceCheck || cooldownRemaining > 0
                  ? 'bg-surface-subtle text-ink-muted cursor-not-allowed border border-stroke/50'
                  : 'bg-brand hover:bg-brand-hover text-white cursor-pointer shadow-hz-button'
              }`}>
              {isCheckingCompliance ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Memeriksa Kelayakan...</span>
                </>
              ) : cooldownRemaining > 0 ? (
                <>
                  <Clock className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Cooldown ({cooldownRemaining}s)</span>
                </>
              ) : !isAllMandatoryUploaded ? (
                <span>Cek Kelayakan • Kurang {mandatoryTotal - filledMandatoryCount} dokumen</span>
              ) : hasEverChecked && !hasNewFilesSinceLastCheck ? (
                <span>Dokumen Sudah Diperiksa (Terkini)</span>
              ) : (
                <span>Cek Kelayakan Dokumen</span>
              )}
            </button>
          )}

          {/* AI Action Trigger Button (Selalu tampil untuk Evaluator) */}
          {isEvaluator && (
            <button
              type="button"
              disabled={isAnalyzingAi || !hasUploadedEvidence}
              onClick={handleTriggerAiAnalysis}
              title={
                !hasUploadedEvidence
                  ? 'Belum ada dokumen bukti dukung yang diunggah untuk dianalisis'
                  : 'Mulai analisis nilai indikator berdasarkan berkas bukti fisik'
              }
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all ${
                !hasUploadedEvidence
                  ? 'bg-surface-subtle text-ink-muted border border-stroke/50 cursor-not-allowed opacity-60'
                  : 'bg-brand hover:bg-brand-hover text-white cursor-pointer shadow-hz-button disabled:opacity-50'
              }`}>
              {isAnalyzingAi ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                  <span>Menganalisis AI...</span>
                </>
              ) : (
                <span>Analisis Nilai AI (Evaluator)</span>
              )}
            </button>
          )}

          {/* Tombol Buka Halaman Berkas Bukti (URL Publik / Sinkron MenPAN) */}
          <a
            href={`/shared/evidence/${evaluationId}/${aspectCode}`}
            target="_blank"
            rel="noopener noreferrer"
            title="Buka tampilan bundel berkas bukti dukung aspek ini yang ditautkan ke portal MenPAN-RB"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-surface hover:bg-surface-hover text-ink border border-stroke/60 shadow-2xs transition-all">
            <ExternalLink className="w-3.5 h-3.5 text-ink-muted" />
            <span>Tautan Publik Berkas</span>
          </a>

          {/* Informative helper notes */}
          {isEvaluator && !hasUploadedEvidence && (
            <span className="text-ink-muted text-[11px] inline-flex items-center gap-1">
              <Info className="w-3 h-3 text-ink-muted shrink-0" />
              AI aktif setelah bukti diunggah
            </span>
          )}

          {!isEvaluator && isAllMandatoryUploaded && hasEverChecked && !hasNewFilesSinceLastCheck && (
            <span className="text-emerald-700 dark:text-emerald-400 text-[11px] inline-flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
              Semua berkas telah diperiksa
            </span>
          )}

          {!isEvaluator && isAllMandatoryUploaded && cooldownRemaining > 0 && (
            <span className="text-ink-muted text-[11px] inline-flex items-center gap-1">
              <Clock className="w-3 h-3 text-ink-muted shrink-0" />
              Batas pengecekan 1 mnt ({cooldownRemaining}s)
            </span>
          )}
        </div>

        {/* Hasil Cek Kelayakan Dokumen (Integrated Micro Callout Strip) */}
        {!isEvaluator && complianceSummary && hasUploadedEvidence && (
          <div className="pt-2 border-t border-stroke/40 flex flex-col sm:flex-row sm:items-start gap-2 bg-surface-subtle/80 p-2.5 rounded-xl border border-stroke/50 text-xs">
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="font-semibold text-ink">Hasil Cek:</span>
              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                complianceSummary.overallReadinessScore >= 80
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                  : complianceSummary.overallReadinessScore >= 50
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
              }`}>
                Kesiapan {complianceSummary.overallReadinessScore}%
              </span>
            </div>
            <p className="text-ink-secondary text-xs leading-relaxed flex-1">
              {complianceSummary.overallSummary}
            </p>
          </div>
        )}
      </div>

      {/* SOKET AI PRE-EVALUATOR: LAPORAN AUDIT KHUSUS EVALUATOR (LEVEL ASPEK) */}
      {isEvaluator && evaluatorAiNote && hasUploadedEvidence && (
        <div className="rounded-2xl border border-stroke/50 bg-surface-subtle p-5 space-y-3 shadow-soft-card border-l-4 border-l-brand">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-stroke/40 pb-2.5">
            <div className="flex items-center gap-2">
              <span className="font-medium text-xs text-ink">
                Laporan Audit AI Pre-Evaluator: Aspek {aspectCode}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface text-ink-secondary border border-stroke/50">
                Khusus Evaluator
              </span>
            </div>
            <span
              className={`text-xs font-medium px-2.5 py-0.5 rounded-full border self-start sm:self-auto ${
                evaluatorAiNote.confidenceLevel === 'TINGGI'
                  ? 'bg-pastel-green text-pastel-green-text border-emerald-200'
                  : evaluatorAiNote.confidenceLevel === 'SEDANG'
                    ? 'bg-brand-light text-brand border-brand/30'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
              }`}>
              Keyakinan: {evaluatorAiNote.confidenceLevel} ({evaluatorAiNote.confidenceScore}%)
            </span>
          </div>

          <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
            {evaluatorAiNote.summary}
          </p>

          {evaluatorAiNote.aspectGaps && evaluatorAiNote.aspectGaps.length > 0 && (
            <div className="space-y-1 pt-1">
              <div className="text-xs font-semibold text-slate-800">
                Catatan Celah &amp; Kekurangan Bukti:
              </div>
              <ul className="list-disc list-inside text-xs text-slate-600 space-y-0.5 pl-2">
                {evaluatorAiNote.aspectGaps.map((gap: string, idx: number) => (
                  <li key={idx}>{gap}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* 2. Vertical List of Mandatory Slots */}
      {loading ? (
        <div className="p-16 flex flex-col items-center justify-center gap-3 text-slate-500 bg-white rounded-2xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-[#2B6CB0]" />
          <span className="text-sm font-medium">Memuat berkas bukti...</span>
        </div>
      ) : (
        <div className="space-y-6">
          {/* A. Dokumen Wajib List */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-1 gap-2">
              <div>
                <h2 className="font-semibold text-sm text-slate-900">
                  Dokumen Bukti Wajib PermenPAN-RB
                </h2>
                <p className="text-xs text-slate-500">
                  Format didukung: PDF/DOCX (Maks. 4 berkas @20MB) • Foto/Gambar (Maks. 6 foto @1MB)
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                {/* View Mode Toggle: Grid vs List (Default Grid) */}
                <div className="flex items-center p-0.5 bg-surface-subtle rounded-full border border-stroke/60 text-xs">
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('grid')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-surface-elevated text-ink font-semibold shadow-2xs'
                        : 'text-ink-muted hover:text-ink font-normal'
                    }`}
                    title="Tampilan Grid (Kotak Berjajar)"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Grid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSetViewMode('list')}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-surface-elevated text-ink font-semibold shadow-2xs'
                        : 'text-ink-muted hover:text-ink font-normal'
                    }`}
                    title="Tampilan List (Daftar Memanjang)"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>List</span>
                  </button>
                </div>

                <span className="text-xs font-medium text-ink-secondary bg-surface-subtle px-3 py-1 rounded-full border border-stroke/50">
                  {filledMandatoryCount}/{mandatorySlots.length} Terunggah
                </span>
              </div>
            </div>

            <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5' : 'space-y-2.5'}>
              {mandatorySlots.map((slot, sIdx) => {
                const attachments = slot.attachments || []
                const hasUploaded = attachments.length > 0 || Boolean(slot.fileUrl && slot.fileUrl.trim() !== '')
                const isImageOnlySlot = slot.documentType === 'IMAGE'
                const isDocOnlySlot = slot.documentType === 'PDF' && slot.slotKey === 'sk_sp'
                const isHybridSlot = !isImageOnlySlot && !isDocOnlySlot
                const maxCount = 6
                const canAddMore = attachments.length < maxCount
                const isShowingLink = openLinkInputKey === slot.slotKey
                const isAccordionOpen = openAccordionKey === slot.slotKey
                const currentEditVal = editValues[slot.slotKey] ?? ''
                const isDirty = currentEditVal.trim() !== (slot.fileUrl || '').trim()
                const isUploading = uploadingKey === slot.slotKey
                const isSaving = savingKey === slot.slotKey
                const historyCount = slot.history?.length || 0

                const isTargetSlot = Boolean(targetSlotKey && slot.slotKey === targetSlotKey)

                return (
                  <div
                    key={slot.slotKey}
                    id={`evidence-slot-${slot.slotKey}`}
                    className={`p-5 rounded-2xl border space-y-3 transition-all ${
                      isTargetSlot
                        ? 'ring-2 ring-brand/60 border-brand/70 bg-brand-light/10 shadow-soft-card'
                        : 'border-stroke/50 bg-surface hover:border-stroke hover:shadow-soft-card shadow-2xs'
                    }`}>
                    {/* Top Row: Title + Action Buttons */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2 flex-wrap min-w-0">
                        <span className="text-xs font-medium text-ink bg-surface-subtle px-2.5 py-0.5 rounded-full border border-stroke/50 shrink-0">
                          #{sIdx + 1}
                        </span>
                        <h3 className="font-medium text-sm text-ink leading-snug">
                          {slot.title}
                        </h3>
                      </div>

                      {/* Action Buttons: Solid, bold, high-contrast */}
                      <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
                        {isEditable ? (
                          <>
                            <input
                              type="file"
                              multiple
                              ref={(el) => {
                                fileInputRefs.current[slot.slotKey] = el
                              }}
                              onChange={(e) => {
                                const files = e.target.files
                                if (files && files.length > 0) {
                                  handleDirectFileUpload(slot, files)
                                  e.target.value = ''
                                }
                              }}
                              accept={
                                isImageOnlySlot
                                  ? '.png,.jpg,.jpeg,.webp,image/*'
                                  : isDocOnlySlot
                                    ? '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                                    : '.pdf,.doc,.docx,application/pdf,image/*,.png,.jpg,.jpeg,.webp'
                              }
                              className="hidden"
                            />

                            {!hasUploaded && (
                              <button
                                type="button"
                                disabled={isUploading}
                                onClick={() => handleOpenUploadModal(slot)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer shadow-hz-button bg-brand hover:bg-brand-hover text-white">
                                {isUploading ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <UploadCloud className="w-3.5 h-3.5" />
                                )}
                                <span>Unggah</span>
                              </button>
                            )}
                          </>
                        ) : (
                          /* Evaluator */
                          !hasUploaded && (
                            <span className="text-xs text-ink-muted font-normal italic">Belum diunggah</span>
                          )
                        )}

                        {/* Accordion Toggle for History */}
                        <button
                          type="button"
                          onClick={() =>
                            setOpenAccordionKey(isAccordionOpen ? null : slot.slotKey)
                          }
                          className="px-3.5 py-1.5 rounded-full border border-stroke/60 bg-surface-subtle hover:bg-surface-hover text-ink text-xs font-medium inline-flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs">
                          <History className="w-3.5 h-3.5 text-ink-muted" />
                          <span>Riwayat ({historyCount})</span>
                          {isAccordionOpen ? (
                            <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />
                          ) : (
                            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Short Description text */}
                    <div className="pt-0.5 text-xs text-ink-secondary">
                      <p className="leading-relaxed">{slot.description}</p>
                    </div>

                    {/* Attached Files List (Multiple Attachments) */}
                    {attachments.length > 0 && (
                      <div className="pt-2 border-t border-stroke/30 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px] font-medium text-ink-muted tracking-tight">
                          <span>Berkas Terlampir ({attachments.length}/{maxCount})</span>
                          {attachments.length > 1 && (
                            <span className="text-[10px] font-normal text-ink-muted/80 lowercase">klik berkas untuk membuka</span>
                          )}
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {attachments.map((att, attIdx) => {
                            const isPdf = att.fileType === 'PDF' || att.fileName.toLowerCase().endsWith('.pdf')
                            const isImg = att.fileType === 'IMAGE' || /\.(jpe?g|png|webp|gif|svg)$/i.test(att.fileName)
                            const formattedSize = att.fileSize
                              ? att.fileSize > 1024 * 1024
                                ? `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                : `${Math.round(att.fileSize / 1024)} KB`
                              : null

                            return (
                              <div
                                key={att.id || attIdx}
                                className="flex items-center justify-between p-2.5 rounded-xl border border-stroke/50 bg-surface-subtle/50 hover:bg-surface-subtle transition-colors gap-2 text-xs">
                                <a
                                  href={att.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  title={`Buka ${att.fileName}`}
                                  className="flex items-center gap-2 min-w-0 flex-1 group/item hover:opacity-80 transition-opacity">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
                                      isPdf
                                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                        : isImg
                                          ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    }`}>
                                    {isPdf ? 'PDF' : isImg ? 'FOTO' : 'DOK'}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="font-medium text-ink truncate group-hover/item:text-brand transition-colors flex items-center gap-1" title={att.fileName}>
                                      <span className="truncate">{att.fileName}</span>
                                      <ExternalLink className="w-3 h-3 text-ink-muted opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
                                    </p>
                                    <div className="flex items-center gap-1.5 text-[10px] text-ink-muted font-normal flex-wrap">
                                      <span className="font-medium text-ink-secondary">
                                        Versi {att.version || 1}
                                      </span>
                                      {formattedSize && (
                                        <>
                                          <span>•</span>
                                          <span>{formattedSize}</span>
                                        </>
                                      )}
                                      {att.versions && att.versions.length > 0 && (
                                        <>
                                          <span>•</span>
                                          <span className="text-brand font-medium">
                                            {att.versions.length} riwayat
                                          </span>
                                        </>
                                      )}
                                    </div>
                                  </div>
                                </a>

                                <div className="relative shrink-0" data-attachment-dropdown>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOpenDropdownAttId(openDropdownAttId === att.id ? null : att.id)
                                    }
                                    className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
                                      openDropdownAttId === att.id
                                        ? 'bg-surface-elevated text-ink border-stroke shadow-xs'
                                        : 'text-ink-muted hover:text-ink hover:bg-surface-elevated border-transparent hover:border-stroke/50'
                                    }`}
                                    title="Pilihan Berkas">
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </button>

                                  {/* Dropdown Menu (shadcn-style) */}
                                  {openDropdownAttId === att.id && (
                                    <div className="absolute right-0 top-full mt-1 w-44 z-30 bg-surface rounded-xl border border-stroke/70 shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                                      {/* Header Info */}
                                      <div className="px-3 py-1.5 border-b border-stroke/40 text-[10px] text-ink-muted">
                                        <div className="flex items-center justify-between">
                                          <span>Versi Berkas</span>
                                          <span className="font-semibold text-ink">v{att.version || 1}</span>
                                        </div>
                                      </div>

                                      {/* Menu Items */}
                                      <div className="p-1 space-y-0.5">
                                        <a
                                          href={att.fileUrl}
                                          target="_blank"
                                          rel="noreferrer"
                                          onClick={() => setOpenDropdownAttId(null)}
                                          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-ink hover:bg-surface-subtle transition-colors group cursor-pointer text-[11px] font-medium">
                                          <div className="flex items-center gap-2">
                                            <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-ink" />
                                            <span>Lihat Berkas</span>
                                          </div>
                                        </a>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            setOpenDropdownAttId(null)
                                            setVersionModalTarget({ slot, attachment: att })
                                          }}
                                          className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-ink hover:bg-surface-subtle transition-colors group cursor-pointer text-[11px] font-medium text-left">
                                          <div className="flex items-center gap-2">
                                            <RotateCcw className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand" />
                                            <span>Kelola Versi</span>
                                          </div>
                                          {att.versions && att.versions.length > 0 && (
                                            <span className="text-[10px] px-1 py-0.2 rounded bg-brand/10 text-brand font-semibold">
                                              {att.versions.length}
                                            </span>
                                          )}
                                        </button>

                                        {isEditable && (att.fileType === 'IMAGE' || att.fileType === 'PDF' || att.fileName.toLowerCase().endsWith('.pdf') || /\.(jpe?g|png|webp)$/i.test(att.fileName)) && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setOpenDropdownAttId(null)
                                              setRedactModalTarget({ slot, attachment: att })
                                            }}
                                            className="flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-ink hover:bg-amber-500/10 hover:text-amber-700 dark:hover:text-amber-400 transition-colors group cursor-pointer text-[11px] font-medium text-left">
                                            <div className="flex items-center gap-2">
                                              <ShieldAlert className="w-3.5 h-3.5 text-amber-500 group-hover:text-amber-600" />
                                              <span>Sensor Data Pribadi</span>
                                            </div>
                                            <span className="text-[9px] px-1 py-0.5 rounded bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold uppercase tracking-wider">
                                              Studio
                                            </span>
                                          </button>
                                        )}

                                        {isEditable && (
                                          <>
                                            <div className="h-px bg-stroke/40 my-1" />
                                            <button
                                              type="button"
                                              disabled={isUploading}
                                              onClick={() => {
                                                setOpenDropdownAttId(null)
                                                setDeleteAttachmentTarget({ slot, attachmentId: att.id, fileName: att.fileName })
                                              }}
                                              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors group cursor-pointer text-[11px] font-medium text-left">
                                              <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-700" />
                                              <span>Hapus Berkas</span>
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}

                          {/* Tombol Tambah Berkas di Samping Berkas Terakhir (Ukuran & Bento Sama Persis) */}
                          {canAddMore && isEditable && (
                            <button
                              type="button"
                              disabled={isUploading}
                              onClick={() => handleOpenUploadModal(slot)}
                              className="flex items-center justify-center p-2.5 rounded-xl border border-dashed border-stroke/80 bg-surface-subtle/30 hover:bg-surface-subtle/80 hover:border-brand/60 transition-all gap-2 text-xs text-ink-secondary hover:text-brand cursor-pointer group shadow-2xs min-h-[54px]">
                              {isUploading ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin text-brand" />
                                  <span className="font-medium text-xs">Mengunggah...</span>
                                </>
                              ) : (
                                <>
                                  <Plus className="w-4 h-4 text-ink-muted group-hover:text-brand transition-colors" />
                                  <span className="font-medium text-xs tracking-tight">Tambah Berkas</span>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Middle Row: Example Format Links */}
                    <div className="flex items-center gap-2.5 text-xs pt-1 flex-wrap">
                      {slot.exampleImages && slot.exampleImages.length > 0 ? (
                        <button
                          type="button"
                          onClick={() => openExampleGallery(slot, 0)}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-subtle hover:bg-surface-hover text-ink text-xs font-medium transition-all cursor-pointer border border-stroke/60 shadow-2xs">
                          <ImageIcon className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                          <span>
                            {slot.exampleImages.length > 1
                              ? `Lihat Contoh Format (${slot.exampleImages.length} Berkas)`
                              : 'Lihat Contoh Format'}
                          </span>
                        </button>
                      ) : (
                        isEvaluator && (
                          <span className="text-xs text-ink-muted italic">Belum ada contoh format</span>
                        )
                      )}

                      {/* Tombol Unggah Contoh Khusus Evaluator */}
                      {isEvaluator && (
                        <label className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface hover:bg-surface-hover text-ink text-xs font-medium border border-stroke/60 cursor-pointer transition-all shadow-2xs">
                          <UploadCloud className="w-3.5 h-3.5 text-brand" />
                          <span>Tambah Contoh</span>
                          <input
                            type="file"
                            accept=".pdf,.png,.jpg,.jpeg,.webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0]
                              if (file) handleUploadExample(slot.slotKey, file)
                            }}
                          />
                        </label>
                      )}
                    </div>

                    {/* Footer Row: Plain text berdampingan dengan batas kecil */}
                    <div className="pt-2.5 border-t border-stroke/40 flex items-center justify-between gap-2 text-[11px] text-ink-muted flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {!hasUploaded ? (
                          <span className="font-normal text-ink-muted">
                            Belum Ada
                          </span>
                        ) : slot.aiInsights?.status === 'LAYAK' ? (
                          <span className="font-medium text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Layak &amp; Sah ({attachments.length} berkas)
                          </span>
                        ) : slot.aiInsights?.status === 'TIDAK_SESUAI' ? (
                          <span className="font-medium text-rose-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                            Tidak Sesuai ({attachments.length} berkas)
                          </span>
                        ) : slot.aiInsights?.status === 'PERLU_DILENGKAPI' ? (
                          <span className="font-medium text-amber-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                            Perlu Dilengkapi ({attachments.length} berkas)
                          </span>
                        ) : (
                          <span className="font-medium text-emerald-700 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                            Terunggah ({attachments.length} berkas)
                          </span>
                        )}

                        <span className="text-stroke">•</span>

                        <span className="font-normal text-ink-muted">
                          {isImageOnlySlot
                            ? 'Maks. 6 foto (maks. 1 MB/foto)'
                            : isDocOnlySlot
                              ? 'Maks. 4 PDF (maks. 20 MB/file)'
                              : 'Maks. 4 PDF (@20MB) & 6 Foto (@1MB)'}
                        </span>
                      </div>

                      {/* Tombol Hapus Seluruh Berkas di Kanan Footer */}
                      {hasUploaded && (isEditable || isEvaluator) && (
                        <button
                          type="button"
                          disabled={isUploading}
                          onClick={() => setDeleteTarget(slot)}
                          className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-rose-600 transition-colors cursor-pointer py-0.5 px-1 rounded hover:bg-rose-50/70"
                          title="Hapus semua berkas pada slot ini">
                          <Trash2 className="w-3.5 h-3.5 text-ink-muted hover:text-rose-600" />
                          <span>Hapus Semua</span>
                        </button>
                      )}
                    </div>

                    {/* AI Feedback (ONLY IF NOT LAYAK & FILE EXISTS) - 1 Compact, Clear Box */}
                    {hasUploaded && slot.aiInsights && slot.aiInsights.status !== 'LAYAK' && (
                      <div className="p-2.5 rounded-lg border border-amber-300 bg-amber-50 text-xs space-y-0.5">
                        <div className="flex items-center gap-1.5 font-bold text-amber-950">
                          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                          <span>Catatan Perbaikan:</span>
                        </div>
                        <p className="text-slate-900 font-medium leading-relaxed pl-5">
                          {slot.aiInsights.feedback || slot.aiInsights.summary}
                        </p>
                      </div>
                    )}

                    {/* Compact History Accordion Body */}
                    {isAccordionOpen && (
                      <div className="p-4 bg-surface-subtle/70 rounded-2xl border border-stroke/40 space-y-2 text-xs">
                        <div className="font-medium text-xs text-ink flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-ink-muted" />
                          <span>Riwayat Berkas:</span>
                        </div>

                        {!slot.history || slot.history.length === 0 ? (
                          <p className="text-ink-muted italic text-xs pl-5">Belum ada riwayat unggahan.</p>
                        ) : (
                          <div className="divide-y divide-stroke/30 bg-surface rounded-xl border border-stroke/40 overflow-hidden shadow-2xs">
                            {slot.history.map((h, i) => (
                              <div
                                key={i}
                                className="px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-ink uppercase text-[11px]">{h.action}</span>
                                  <span className="text-ink-secondary font-medium">• {h.actorName || 'Petugas'}</span>
                                  <span className="text-ink-muted text-[11px]">
                                    ({new Date(h.timestamp).toLocaleString('id-ID')})
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  {isEditable && (
                                    <button
                                      type="button"
                                      onClick={() => setDeleteHistoryTarget({ slot, activityId: h.id, fileName: h.fileName })}
                                      className="p-1 rounded-full text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                      title="Hapus versi berkas ini dari riwayat">
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* B. Dokumen Tambahan List */}
          <div className="space-y-3 pt-3 border-t border-slate-200/80">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-semibold text-sm text-slate-900">
                  Dokumen Tambahan (Opsional)
                </h2>
                <p className="text-xs text-slate-500">
                  Sertifikat, SK Pokja, atau berkas pendukung lain yang relevan.
                </p>
              </div>

              {isEditable && !showAddCustom && (
                <button
                  type="button"
                  onClick={() => setShowAddCustom(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium shadow-hz-button transition-all cursor-pointer">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Tambah Dokumen</span>
                </button>
              )}
            </div>

            {/* Form Add Custom */}
            {isEditable && showAddCustom && (
              <form
                onSubmit={handleAddCustomSlot}
                className="p-4 rounded-xl border border-slate-200 bg-white space-y-3 text-xs shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-semibold text-xs text-slate-900">
                    Tambah Berkas Pendukung Tambahan
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="text-slate-400 hover:text-slate-700 font-medium cursor-pointer text-xs">
                    Batal
                  </button>
                </div>

                <div className="space-y-1">
                  <label className="font-medium text-slate-700">Nama Dokumen:</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="e.g. Sertifikat Akreditasi / ISO"
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-slate-400"
                  />
                </div>

                <div className="space-y-2.5">
                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Tipe Berkas:</label>
                    <div className="flex items-center gap-4 pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                        <input
                          type="radio"
                          name="customDocType"
                          checked={customDocType === 'PDF'}
                          onChange={() => setCustomDocType('PDF')}
                          className="text-slate-900"
                        />
                        <span>Dokumen Resmi (PDF / DOCX)</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-700">
                        <input
                          type="radio"
                          name="customDocType"
                          checked={customDocType === 'IMAGE'}
                          onChange={() => setCustomDocType('IMAGE')}
                          className="text-slate-900"
                        />
                        <span>Foto / Gambar (JPG / PNG)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="font-medium text-slate-700">Pilih Berkas:</label>
                    <input
                      type="file"
                      onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                      accept={
                        customDocType === 'IMAGE'
                          ? '.png,.jpg,.jpeg,.webp,image/*'
                          : '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                      }
                      className="w-full text-xs text-slate-700 file:mr-2.5 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-slate-100 file:text-slate-800 cursor-pointer"
                    />
                    <p className="text-[11px] text-slate-400">
                      {customDocType === 'IMAGE'
                        ? 'Maksimal 25 MB • Format Foto: JPG, PNG, WEBP.'
                        : 'Maksimal 25 MB • Format Dokumen: PDF atau DOCX resmi.'}
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowAddCustom(false)}
                    className="px-4 py-1.5 rounded-full border border-stroke/60 text-xs font-medium text-ink-secondary hover:bg-surface cursor-pointer">
                    Batal
                  </button>
                  <button
                    type="submit"
                    disabled={savingKey === 'new_custom'}
                    className="px-4 py-1.5 rounded-full bg-brand text-white text-xs font-medium hover:bg-brand-hover shadow-hz-button cursor-pointer disabled:opacity-50">
                    {savingKey === 'new_custom' ? 'Menyimpan...' : 'Simpan Slot'}
                  </button>
                </div>
              </form>
            )}

            {/* List Additional Slots */}
            {additionalSlots.length === 0 ? (
              <div className="p-5 text-center rounded-2xl border border-dashed border-stroke/60 bg-surface-subtle/30 text-ink-muted text-xs">
                Belum ada dokumen tambahan untuk Aspek {aspectName}.
              </div>
            ) : (
              <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-3.5' : 'space-y-2'}>
                {additionalSlots.map((slot) => (
                  <div
                    key={slot.slotKey}
                    className="p-3.5 rounded-2xl border border-stroke/50 bg-surface hover:border-stroke shadow-2xs flex items-center justify-between gap-3 transition-all">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium text-ink-secondary bg-surface-subtle border border-stroke/50">
                          Tambahan
                        </span>
                        <h4 className="font-medium text-xs text-ink">{slot.title}</h4>
                      </div>
                      <p className="text-[11px] text-ink-muted">
                        {slot.storageProvider || 'FILE'} • Diunggah {slot.uploaderName || 'Admin OPD'}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <a
                        href={slot.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-1.5 rounded-full bg-surface-subtle hover:bg-surface-hover text-ink font-medium text-xs inline-flex items-center gap-1.5 transition-all border border-stroke/60 shadow-2xs">
                        <span>Buka</span>
                        <ExternalLink className="w-3 h-3 text-ink-muted" />
                      </a>

                      {isEditable && slot.submissionId && (
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(slot)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                          title="Hapus berkas tambahan">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Bottom Navigation Bar */}
      <div className="px-5 py-3.5 bg-surface rounded-2xl border border-stroke/50 flex items-center justify-between gap-4 shadow-soft-card">
        <button
          type="button"
          disabled={!onPrev}
          onClick={onPrev}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stroke/60 bg-surface-subtle hover:bg-surface-hover text-ink-secondary font-medium text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-2xs">
          <ChevronLeft className="w-3.5 h-3.5 text-ink-muted" />
          <span>{prevLabel || 'Sebelumnya'}</span>
        </button>

        <div className="text-xs text-ink-muted font-normal hidden sm:block">
          Bukti Indikator <span className="text-ink font-semibold">{aspectCode === 'I' ? '1' : aspectCode === 'II' ? '2' : aspectCode === 'III' ? '3' : aspectCode === 'IV' ? '4' : aspectCode === 'V' ? '5' : aspectCode === 'VI' ? '6' : aspectCode}</span>
        </div>

        <button
          type="button"
          disabled={!onNext}
          onClick={onNext}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-medium text-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-hz-button">
          <span>{nextLabel || 'Lanjut ke Pertanyaan Berikutnya'}</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Example Format Gallery Modal (Supports Multiple Files & PDF/Image) */}
      {activeExampleGallery && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 m-0 animate-fade-in"
          onClick={() => setActiveExampleGallery(null)}>
          <div
            className="bg-white p-5 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stroke/40 pb-3">
              <div className="space-y-0.5 min-w-0 pr-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-sm text-ink truncate">
                    Format Contoh Bukti: {activeExampleGallery.slotTitle}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-surface-subtle text-ink-secondary border border-stroke/50">
                    Berkas {activeExampleGallery.currentIndex + 1} dari {activeExampleGallery.urls.length}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveExampleGallery(null)}
                className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-hover transition-colors cursor-pointer shrink-0">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* If multiple files: Tab switcher & Navigation */}
            {activeExampleGallery.urls.length > 1 && (
              <div className="flex items-center justify-between gap-2 p-1.5 bg-surface-subtle rounded-2xl border border-stroke/40 text-xs">
                <div className="flex items-center gap-1.5 overflow-x-auto">
                  {activeExampleGallery.urls.map((url, idx) => {
                    const isPdf = url.toLowerCase().endsWith('.pdf')
                    const isActive = activeExampleGallery.currentIndex === idx
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() =>
                          setActiveExampleGallery((prev) => (prev ? { ...prev, currentIndex: idx } : null))
                        }
                        className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-brand text-white shadow-hz-button font-semibold'
                            : 'bg-surface text-ink-secondary hover:text-ink border border-stroke/40'
                        }`}>
                        {isPdf ? (
                          <FileText className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-rose-500'}`} />
                        ) : (
                          <ImageIcon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-500'}`} />
                        )}
                        <span>Contoh #{idx + 1} ({isPdf ? 'PDF' : 'Gambar'})</span>
                      </button>
                    )
                  })}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={activeExampleGallery.currentIndex === 0}
                    onClick={() =>
                      setActiveExampleGallery((prev) =>
                        prev ? { ...prev, currentIndex: prev.currentIndex - 1 } : null
                      )
                    }
                    className="p-1.5 rounded-full border border-stroke/50 bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-ink-secondary"
                    title="Contoh Sebelumnya">
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    disabled={activeExampleGallery.currentIndex === activeExampleGallery.urls.length - 1}
                    onClick={() =>
                      setActiveExampleGallery((prev) =>
                        prev ? { ...prev, currentIndex: prev.currentIndex + 1 } : null
                      )
                    }
                    className="p-1.5 rounded-full border border-stroke/50 bg-surface hover:bg-surface-hover disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer text-ink-secondary"
                    title="Contoh Berikutnya">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Viewer Body */}
            {(() => {
              const rawUrl = activeExampleGallery.urls[activeExampleGallery.currentIndex]
              const currentUrl = formatFileUrl(rawUrl)
              const isPdf = currentUrl?.toLowerCase().endsWith('.pdf')

              return (
                <div className="flex-1 overflow-auto flex items-center justify-center bg-sand-canvas/50 rounded-2xl p-3 min-h-[380px] border border-stroke/40">
                  {isPdf ? (
                    <div className="w-full h-[65vh] flex flex-col items-center justify-between gap-3">
                      <iframe
                        src={currentUrl}
                        className="w-full flex-1 rounded-xl border border-stroke/50 bg-surface"
                        title="Contoh Dokumen PDF"
                      />
                      <div className="flex items-center justify-between w-full px-2 flex-wrap gap-2">
                        <span className="text-xs text-ink-muted">
                          Format Dokumen Portable (PDF)
                        </span>
                        <div className="flex items-center gap-2">
                          {isEvaluator && (
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteExampleTarget({ exampleUrl: rawUrl, slotKey: activeExampleGallery.slotKey })
                                setActiveExampleGallery(null)
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium border border-rose-200 cursor-pointer">
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Hapus Berkas Ini</span>
                            </button>
                          )}
                          <a
                            href={currentUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-all shadow-hz-button">
                            <span>Buka di Tab Baru</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="w-full flex flex-col items-center justify-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentUrl}
                        alt={`Contoh ${activeExampleGallery.currentIndex + 1}`}
                        className="max-h-[65vh] object-contain rounded-lg shadow-sm"
                      />
                      {isEvaluator && (
                        <div className="pt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setDeleteExampleTarget({ exampleUrl: rawUrl, slotKey: activeExampleGallery.slotKey })
                              setActiveExampleGallery(null)
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium border border-rose-200 cursor-pointer">
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus Berkas Ini</span>
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })()}
          </div>
        </div>,
        document.body
      )}

      {/* Delete Confirmation Modal (Slot Utama) */}
      <ConfirmationModal
        isOpen={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDeleteSlot}
        loading={loading}
        variant="danger"
        title="Hapus Berkas"
        description={
          deleteTarget?.history && deleteTarget.history.length > 1
            ? `Hapus berkas "${deleteTarget?.fileName || deleteTarget?.title}"? Hanya berkas versi aktif ini yang akan dihapus. Berkas versi sebelumnya (${deleteTarget.history.length - 1} riwayat) akan tetap aman dan otomatis dipulihkan.`
            : `Hapus berkas "${deleteTarget?.fileName || deleteTarget?.title}"? Berkas fisik ini akan dihapus dari penyimpanan dan status dokumen akan dikosongkan.`
        }
        confirmText="Hapus Berkas"
      />

      {/* Modal Konfirmasi Hapus Lampiran Spesifik */}
      <ConfirmationModal
        isOpen={Boolean(deleteAttachmentTarget)}
        onCancel={() => setDeleteAttachmentTarget(null)}
        onConfirm={handleConfirmDeleteAttachment}
        loading={Boolean(uploadingKey)}
        variant="danger"
        title="Hapus Berkas"
        description={`Hapus berkas "${deleteAttachmentTarget?.fileName || ''}" dari slot "${deleteAttachmentTarget?.slot.title || ''}"? Berkas fisik akan dihapus dari penyimpanan.`}
        confirmText="Hapus Berkas"
      />

      {/* Modal Konfirmasi Pulihkan / Pakai Kembali Versi Lampau */}
      <ConfirmationModal
        isOpen={Boolean(restoreVersionTarget)}
        zIndex="z-[99999]"
        onCancel={() => setRestoreVersionTarget(null)}
        onConfirm={handleConfirmRestoreVersion}
        loading={isRestoringVersion}
        variant="primary"
        title="Pakai Versi Ini"
        description={`Jadikan Versi ${restoreVersionTarget?.verNum || ''} sebagai berkas aktif utama? Versi berkas yang sedang aktif saat ini akan tetap tersimpan di riwayat versi.`}
        confirmText="Ya, Jadikan Berkas Aktif"
      />

      {/* Modal Konfirmasi Hapus Permanen Arsip Versi */}
      <ConfirmationModal
        isOpen={Boolean(deleteVersionTarget)}
        zIndex="z-[99999]"
        onCancel={() => setDeleteVersionTarget(null)}
        onConfirm={handleConfirmDeleteVersion}
        loading={isDeletingVersion}
        variant="danger"
        title="Hapus Arsip Versi"
        description={`Hapus arsip Versi ${deleteVersionTarget?.verNum || ''} ("${deleteVersionTarget?.fileName || ''}") secara permanen? Berkas arsip ini tidak dapat dipulihkan kembali.`}
        confirmText="Hapus Permanen"
      />

      {/* Modal Konfirmasi Hapus Item Riwayat Submisi */}
      <ConfirmationModal
        isOpen={Boolean(deleteHistoryTarget)}
        onCancel={() => setDeleteHistoryTarget(null)}
        onConfirm={handleConfirmDeleteHistoryItem}
        loading={loading}
        variant="danger"
        title="Hapus Riwayat Berkas"
        description={`Hapus catatan riwayat berkas "${deleteHistoryTarget?.fileName || 'ini'}"? Berkas versi lampau ini akan dihapus dari daftar riwayat.`}
        confirmText="Hapus Riwayat"
      />

      {/* Modal Konfirmasi Hapus Contoh Format Bukti (Workspace) */}
      <ConfirmationModal
        isOpen={Boolean(deleteExampleTarget)}
        zIndex="z-[99999]"
        onCancel={() => setDeleteExampleTarget(null)}
        onConfirm={handleConfirmDeleteExample}
        variant="danger"
        title="Hapus Contoh Format"
        description="Hapus berkas contoh format bukti ini dari panduan? Tindakan ini akan menghapus acuan contoh untuk slot ini."
        confirmText="Hapus Contoh"
      />

      {/* Version Management Modal (Google Drive Style) */}
      {versionModalTarget && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-surface rounded-2xl border border-stroke shadow-xl p-6 space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-stroke/50">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-brand/10 text-brand">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <h3 className="font-semibold text-ink text-base">Kelola Versi Berkas</h3>
                </div>
                <p className="text-xs text-ink-muted">
                  Perbarui berkas dengan versi lebih baru, atau pulihkan versi lampau seperti Google Drive.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setVersionModalTarget(null)}
                className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              {/* Berkas Aktif Saat Ini */}
              <div className="p-3.5 rounded-xl border border-brand/30 bg-brand/5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                      Versi Aktif (v{versionModalTarget.attachment.version || 1})
                    </span>
                    <span className="text-[11px] text-ink-muted">Digunakan dalam evaluasi</span>
                  </div>
                  <a
                    href={versionModalTarget.attachment.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                    <span>Buka Berkas</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <div className="text-xs font-medium text-ink truncate" title={versionModalTarget.attachment.fileName}>
                  {versionModalTarget.attachment.fileName}
                </div>

                <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                  <span>
                    Diunggah: {new Date(versionModalTarget.attachment.uploadedAt).toLocaleString('id-ID')}
                  </span>
                  {versionModalTarget.attachment.uploaderName && (
                    <span>• Oleh: {versionModalTarget.attachment.uploaderName}</span>
                  )}
                  {versionModalTarget.attachment.fileSize && (
                    <span>
                      •{' '}
                      {versionModalTarget.attachment.fileSize > 1024 * 1024
                        ? `${(versionModalTarget.attachment.fileSize / (1024 * 1024)).toFixed(1)} MB`
                        : `${Math.round(versionModalTarget.attachment.fileSize / 1024)} KB`}
                    </span>
                  )}
                </div>
              </div>

              {/* Unggah Versi Baru Action */}
              {isEditable && (
                <div className="p-3 rounded-xl border border-dashed border-stroke/70 bg-surface-subtle/40 flex items-center justify-between gap-3">
                  <div className="min-w-0 pr-1">
                    <p className="text-xs font-semibold text-ink">Punya revisi dokumen ini?</p>
                    <p className="text-[11px] text-ink-muted leading-tight">
                      Unggah versi terbaru (v{(versionModalTarget.attachment.version || 1) + 1}). Versi aktif saat ini akan tersimpan ke riwayat.
                    </p>
                  </div>
                  <div className="shrink-0">
                    <input
                      ref={versionFileInputRef}
                      type="file"
                      accept=".pdf,.png,.jpg,.jpeg,.webp,.docx"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0]
                        if (file) {
                          handleUploadNewVersion(file)
                          e.target.value = ''
                        }
                      }}
                    />
                    <button
                      type="button"
                      disabled={isUploadingVersion || isRestoringVersion}
                      onClick={() => versionFileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-hover transition-colors shadow-hz-button cursor-pointer disabled:opacity-50 shrink-0 whitespace-nowrap">
                      {isUploadingVersion ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengunggah...</span>
                        </>
                      ) : (
                        <>
                          <UploadCloud className="w-3.5 h-3.5" />
                          <span>Unggah Versi Baru</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Daftar Riwayat Versi Lampau */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Riwayat Versi Sebelumnya ({versionModalTarget.attachment.versions?.length || 0})</span>
                </h4>

                {(!versionModalTarget.attachment.versions || versionModalTarget.attachment.versions.length === 0) ? (
                  <div className="p-4 text-center rounded-xl border border-stroke/40 bg-surface-subtle/30 text-[11px] text-ink-muted italic">
                    Belum ada versi sebelumnya untuk berkas ini. Setiap kali Anda mengunggah versi baru, versi lama akan dicatat di sini.
                  </div>
                ) : (
                  <div className="divide-y divide-stroke/30 bg-surface rounded-xl border border-stroke/50 overflow-hidden shadow-2xs">
                    {versionModalTarget.attachment.versions.map((ver) => (
                      <div
                        key={ver.id}
                        className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-subtle/40 transition-colors">
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-subtle text-ink-secondary border border-stroke/50 shrink-0">
                              v{ver.version}
                            </span>
                            <span className="font-medium text-ink truncate text-xs" title={ver.fileName}>
                              {ver.fileName}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 text-[10px] text-ink-muted flex-wrap">
                            <span>{new Date(ver.uploadedAt).toLocaleString('id-ID')}</span>
                            {ver.uploaderName && <span className="truncate max-w-[150px]">• {ver.uploaderName}</span>}
                            {ver.fileSize && (
                              <span>
                                •{' '}
                                {ver.fileSize > 1024 * 1024
                                  ? `${(ver.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                  : `${Math.round(ver.fileSize / 1024)} KB`}
                              </span>
                            )}
                            {ver.note && (
                              <span className="italic text-ink-secondary truncate max-w-[180px]" title={ver.note}>
                                • {ver.note}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <a
                            href={ver.fileUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-ink-secondary hover:text-ink bg-surface hover:bg-surface-subtle rounded-lg border border-stroke/60 transition-colors shadow-2xs"
                            title="Buka berkas versi ini">
                            <span>Lihat</span>
                            <ExternalLink className="w-3 h-3 text-ink-muted" />
                          </a>

                          {isEditable && (
                            <>
                              <button
                                type="button"
                                disabled={isUploadingVersion || isRestoringVersion || isDeletingVersion}
                                onClick={() => setRestoreVersionTarget({ targetVersionId: ver.id, verNum: ver.version })}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-brand hover:text-white hover:bg-brand bg-brand/10 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                                title="Jadikan versi ini sebagai berkas aktif">
                                {isRestoringVersion ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <RotateCcw className="w-3 h-3" />
                                )}
                                <span>Pakai Kembali</span>
                              </button>

                              <button
                                type="button"
                                disabled={isUploadingVersion || isRestoringVersion || isDeletingVersion}
                                onClick={() => setDeleteVersionTarget({ targetVersionId: ver.id, verNum: ver.version, fileName: ver.fileName })}
                                className="p-1 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
                                title="Hapus permanen arsip versi ini">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stroke/50 flex justify-end">
              <button
                type="button"
                onClick={() => setVersionModalTarget(null)}
                className="px-4 py-2 rounded-xl border border-stroke/60 text-xs font-medium text-ink-secondary hover:bg-surface-subtle transition-colors cursor-pointer">
                Tutup
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Modal Tambah Berkas (Dropzone / File Picker) */}
      {uploadModalSlot && createPortal(
        <div className="fixed inset-0 z-[9999] bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-surface rounded-2xl border border-stroke/70 shadow-2xl flex flex-col w-full max-w-lg overflow-hidden text-ink animate-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-stroke/50 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-brand/10 border border-brand/20 text-brand flex items-center justify-center shrink-0">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-sm text-ink truncate">Tambah Berkas Bukti Dukung</h3>
                  <p className="text-[11px] text-ink-muted truncate">{uploadModalSlot.title}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUploadModalSlot(null)
                  setPickedFileForUpload(null)
                }}
                className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              {/* Dropzone & File Picker */}
              <input
                ref={modalFileInputRef}
                type="file"
                className="hidden"
                accept={
                  uploadModalSlot.documentType === 'IMAGE'
                    ? '.png,.jpg,.jpeg,.webp,image/*'
                    : uploadModalSlot.documentType === 'PDF' && uploadModalSlot.slotKey === 'sk_sp'
                      ? '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                      : '.pdf,.doc,.docx,application/pdf,image/*,.png,.jpg,.jpeg,.webp'
                }
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleSelectFileInModal(f)
                }}
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault()
                  setIsDragOverUpload(true)
                }}
                onDragLeave={() => setIsDragOverUpload(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setIsDragOverUpload(false)
                  const f = e.dataTransfer.files?.[0]
                  if (f) handleSelectFileInModal(f)
                }}
                onClick={() => modalFileInputRef.current?.click()}
                className={`p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                  isDragOverUpload
                    ? 'border-brand bg-brand/10 scale-[1.01]'
                    : pickedFileForUpload
                      ? 'border-brand/60 bg-brand/5'
                      : 'border-stroke/80 bg-surface-subtle/30 hover:bg-surface-subtle/60 hover:border-brand/40'
                }`}>
                <div className="w-12 h-12 rounded-2xl bg-surface border border-stroke/60 shadow-xs flex items-center justify-center mb-3 text-brand">
                  <UploadCloud className="w-6 h-6" />
                </div>

                {pickedFileForUpload ? (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-ink break-all max-w-sm">
                      {pickedFileForUpload.name}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      {(pickedFileForUpload.size / (1024 * 1024)).toFixed(2)} MB • Klik untuk ganti berkas
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-ink">
                      Pilih atau Tarik Berkas ke Sini
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Klik untuk memilih berkas dari komputer Anda, atau seret langsung ke area ini
                    </p>
                  </div>
                )}
              </div>

              {/* Catatan Privasi / Sensor Data */}
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5 leading-relaxed text-[11px]">
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Perlindungan Data Pribadi
                  </p>
                  <p>
                    Guna menghindari kebocoran data rahasia atau informasi sensitif, Anda diperkenankan menutupi (menyensor) NIP, NIK, tanda tangan, atau data identitas lainnya di Studio Sensor sebelum berkas resmi disimpan ke sistem.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3.5 border-t border-stroke/50 flex items-center justify-end gap-2 bg-surface">
              <button
                type="button"
                onClick={() => {
                  setUploadModalSlot(null)
                  setPickedFileForUpload(null)
                }}
                className="px-4 py-2 rounded-xl border border-stroke/60 text-xs font-medium text-ink-secondary hover:bg-surface-subtle transition-colors cursor-pointer">
                Batal
              </button>
              <button
                type="button"
                disabled={!pickedFileForUpload}
                onClick={handleProceedToRedactionOrUpload}
                className="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-hz-button disabled:opacity-40 transition-all cursor-pointer">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Unggah & Buka Studio Sensor</span>
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Redaction Studio Modal (Pre-Upload: Berkas Baru Ditahan di Client Sebelum Masuk Server) */}
      {preUploadRedactTarget && (
        <DocumentRedactionModal
          isOpen={!!preUploadRedactTarget}
          onClose={() => {
            if (preUploadRedactTarget.previewUrl.startsWith('blob:')) {
              URL.revokeObjectURL(preUploadRedactTarget.previewUrl)
            }
            setPreUploadRedactTarget(null)
          }}
          fileUrl={preUploadRedactTarget.previewUrl}
          fileName={preUploadRedactTarget.file.name}
          fileType={preUploadRedactTarget.file.type.startsWith('image/') ? 'IMAGE' : 'PDF'}
          isPreUpload={true}
          rawFile={preUploadRedactTarget.file}
          onSaveRedacted={async (redactedFile) => {
            await handleSavePreUploadFile(redactedFile)
          }}
        />
      )}

      {/* Redaction Studio Modal (Post-Upload: Edit Berkas yang Sudah Tersimpan di Slot) */}
      {redactModalTarget && (
        <DocumentRedactionModal
          isOpen={!!redactModalTarget}
          onClose={() => setRedactModalTarget(null)}
          fileUrl={redactModalTarget.attachment.fileUrl}
          fileName={redactModalTarget.attachment.fileName}
          fileType={redactModalTarget.attachment.fileType}
          isPreUpload={false}
          onSaveRedacted={handleSaveRedactedAttachment}
        />
      )}
    </div>
  )
}
