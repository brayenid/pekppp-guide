// src/components/features/MasterEvidenceWorkspace.tsx
'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  FolderArchive,
  FileText,
  UploadCloud,
  History,
  Clock,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Trash2,
  RotateCcw,
  Plus,
  Loader2,
  X,
  MoreVertical,
  ShieldAlert,
  LayoutGrid,
  List,
  BookOpen,
  Image as ImageIcon,
  MessageSquare,
  Info,
  Eye,
  Sparkles,
  Calendar,
  Edit3,
  Copy,
  Check
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '../ui/Button'
import { FormModal } from '../ui/FormModal'
import { ConfirmationModal } from '../ui/ConfirmationModal'
import { DocumentRedactionModal } from './DocumentRedactionModal'
import { formatFileUrl } from '../../lib/utils'
import { getAllF01Questions } from '../../lib/f01-parser'
import type { UnitComplianceProfile } from '../../services/evidence-compliance-service'
import { getUnitComplianceProfileAction } from '../../actions/evidence-compliance-actions'
import {
  getUnitMasterEvidenceAction,
  uploadMasterAttachmentVersionAction,
  restoreMasterAttachmentVersionAction,
  deleteMasterAttachmentVersionAction,
  deleteMasterEvidenceAttachmentAction,
  deleteMasterEvidenceSlotAction,
  extractMasterEvidenceMetadataAction,
  updateMasterEvidenceManualMetadataAction,
  batchExtractMasterEvidenceMetadataAction
} from '../../actions/master-evidence-actions'
import type {
  EvidenceSlotPreset,
  EvidenceAttachmentItem,
  SlotUploadRule,
  SlotMetadataCategory
} from '../../core/domain/evidence-slots-preset'
import {
  getDefaultRuleForSlot,
  getSlotMetadataSchema,
  getConditionStatusLabel,
  getOperationalStatusLabel
} from '../../core/domain/evidence-slots-preset'

export interface MasterRecordItem {
  id: string
  unitId: string
  aspectCode: string
  slotKey: string
  title: string
  fileUrl: string
  storageProvider: string
  fileType: string | null
  fileSize: number | null
  fileName: string | null
  uploaderName: string | null
  lastSourceYear: number | null
  attachments: EvidenceAttachmentItem[]
  history: any[]
  updatedAt: string
}

interface SlotItemView {
  slotKey: string
  title: string
  description?: string
  isMandatory: boolean
  documentType?: 'PDF' | 'IMAGE' | 'LINK' | 'DOCUMENT' | 'HYBRID'
  exampleImages?: string[]
  indicatorNumbers?: number[]
  guideChecklist?: string[]
}

const ASPECTS = [
  { code: 'I', name: 'Kebijakan Pelayanan', indicatorRange: [1, 2, 3, 4, 5, 6, 7, 8, 9] },
  { code: 'II', name: 'Profesionalisme SDM', indicatorRange: [10, 11, 12, 13, 14] },
  { code: 'III', name: 'Sarana Prasarana', indicatorRange: [15, 16, 17, 18, 19, 20] },
  { code: 'IV', name: 'Sistem Informasi Pelayanan Publik', indicatorRange: [21, 22, 23, 24] },
  { code: 'V', name: 'Konsultasi & Pengaduan', indicatorRange: [25, 26, 27, 28] },
  { code: 'VI', name: 'Inovasi Pelayanan Publik', indicatorRange: [29, 30] },
  { code: 'TAMBAHAN', name: 'Informasi Tambahan', indicatorRange: [31] }
]

function ExampleFormatDropdown({
  urls,
  size = 'md'
}: {
  urls: string[]
  size?: 'sm' | 'md'
}) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!isOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  if (!urls || urls.length === 0) return null

  // Jika hanya 1 berkas, tampilkan tombol langsung buka tab baru
  if (urls.length === 1) {
    const isPdf = urls[0].toLowerCase().endsWith('.pdf')
    return (
      <a
        href={formatFileUrl(urls[0])}
        target="_blank"
        rel="noopener noreferrer"
        className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[10px] bg-brand/10 hover:bg-brand/15 text-brand border border-brand/25'
            : 'px-2.5 py-1 text-[11px] bg-surface-subtle hover:bg-surface-hover text-ink border border-stroke/60'
        }`}>
        {isPdf ? (
          <FileText className={size === 'sm' ? 'w-3 h-3 text-brand' : 'w-3.5 h-3.5 text-brand'} />
        ) : (
          <ImageIcon className={size === 'sm' ? 'w-3 h-3 text-brand' : 'w-3.5 h-3.5 text-brand'} />
        )}
        <span>Lihat Contoh Format</span>
        <ExternalLink className={size === 'sm' ? 'w-2.5 h-2.5 opacity-70' : 'w-3 h-3 opacity-70'} />
      </a>
    )
  }

  // Jika banyak berkas, tampilkan tombol dropdown
  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`inline-flex items-center gap-1.5 rounded-lg font-semibold transition-colors cursor-pointer ${
          size === 'sm'
            ? 'px-2 py-0.5 text-[10px] bg-brand/10 hover:bg-brand/15 text-brand border border-brand/25'
            : 'px-2.5 py-1 text-[11px] bg-surface-subtle hover:bg-surface-hover text-ink border border-stroke/60'
        }`}>
        <BookOpen className={size === 'sm' ? 'w-3 h-3 text-brand' : 'w-3.5 h-3.5 text-brand'} />
        <span>Contoh Format ({urls.length})</span>
        <ChevronDown
          className={`transition-transform duration-150 ${size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1.5 w-64 z-50 bg-surface rounded-xl border border-stroke/80 shadow-xl py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-1.5 border-b border-stroke/50 text-[10px] font-bold uppercase tracking-wider text-ink-muted flex items-center justify-between">
            <span>Berkas Acuan</span>
            <span>{urls.length} Berkas</span>
          </div>

          <div className="p-1 space-y-0.5 max-h-56 overflow-y-auto">
            {urls.map((url, idx) => {
              const isPdf = url.toLowerCase().endsWith('.pdf')
              const fileName = url.split('/').pop() || `Contoh ${idx + 1}`
              return (
                <a
                  key={idx}
                  href={formatFileUrl(url)}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-ink hover:bg-surface-subtle hover:text-brand transition-colors text-left group">
                  <div className="flex items-center gap-2 min-w-0">
                    {isPdf ? (
                      <FileText className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                    ) : (
                      <ImageIcon className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    )}
                    <div className="min-w-0">
                      <div className="font-semibold text-xs truncate leading-tight">
                        Contoh #{idx + 1}
                      </div>
                      <div className="text-[10px] text-ink-muted truncate mt-0.5 leading-tight">
                        {isPdf ? 'PDF' : 'Gambar'} • {decodeURIComponent(fileName)}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand shrink-0" />
                </a>
              )
            })}
          </div>

          {/* Opsi Buka Semua di Tab Baru */}
          <div className="p-1 border-t border-stroke/50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                urls.forEach((u) => {
                  window.open(formatFileUrl(u), '_blank', 'noopener,noreferrer')
                })
              }}
              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-subtle hover:bg-brand/10 hover:text-brand text-[11px] font-semibold text-ink-secondary transition-colors cursor-pointer">
              <ExternalLink className="w-3 h-3" />
              <span>Buka Semua di Tab Baru</span>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export function MasterEvidenceWorkspace({
  unit,
  initialRecords,
  presetSlots,
  uploaderName = 'Admin OPD',
  slotRules,
  isAdmin = false,
  complianceProfile: initialComplianceProfile,
  onRecordsUpdated
}: {
  unit: {
    id: string
    code?: string | null
    name: string
    categoryName?: string | null
    evaluationId?: string | null
  }
  initialRecords: MasterRecordItem[]
  presetSlots: EvidenceSlotPreset[]
  uploaderName?: string
  slotRules?: Record<string, SlotUploadRule>
  isAdmin?: boolean
  complianceProfile?: UnitComplianceProfile | null
  onRecordsUpdated?: (unitId: string, nextRecords: MasterRecordItem[]) => void
}) {
  const router = useRouter()
  const [records, setRecords] = useState<MasterRecordItem[]>(initialRecords)
  const [profile, setProfile] = useState<UnitComplianceProfile | null>(
    initialComplianceProfile || null
  )
  const [isPillarsCollapsed, setIsPillarsCollapsed] = useState(false)
  const [activeAspect, setActiveAspect] = useState<string>('I')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [openAccordionKey, setOpenAccordionKey] = useState<string | null>(null)
  const [openGuideSlotKey, setOpenGuideSlotKey] = useState<string | null>(null)
  const [uploadingKey, setUploadingKey] = useState<string | null>(null)
  const [openDropdownAttId, setOpenDropdownAttId] = useState<string | null>(null)
  const [isModalGuideOpen, setIsModalGuideOpen] = useState<boolean>(false)
  const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false)

  // Sinkronisasi perubahan aspek/indikator aktif dengan query parameter URL (?aspek=III)
  const changeActiveAspect = useCallback((nextAspect: string) => {
    setActiveAspect(nextAspect)
    setOpenAccordionKey(null)

    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.searchParams.set('aspek', nextAspect)
      // Hapus variasi alias lama agar parameter URL bersih
      url.searchParams.delete('aspect')
      url.searchParams.delete('indicator')
      url.searchParams.delete('indikator')
      url.searchParams.delete('tab')
      window.history.replaceState(null, '', url.toString())
    }
  }, [])

  // Baca dan sinkronkan query state URL (?aspek=... atau ?slot=...) saat komponen dimuat & saat navigasi browser (popstate)
  useEffect(() => {
    if (typeof window === 'undefined') return

    const resolveAspectFromUrl = () => {
      const sp = new URLSearchParams(window.location.search)
      const rawVal =
        sp.get('aspek') ||
        sp.get('aspect') ||
        sp.get('indikator') ||
        sp.get('indicator') ||
        sp.get('tab')

      let foundAspect: string | null = null
      let targetSlotKey: string | null = sp.get('slot')

      if (!targetSlotKey && window.location.hash) {
        const hash = window.location.hash.replace(/^#/, '')
        if (hash.startsWith('slot-')) {
          targetSlotKey = hash.replace(/^slot-/, '')
        }
      }

      if (rawVal) {
        const trimmed = rawVal.trim().toUpperCase()
        const numMap: Record<string, string> = {
          '1': 'I',
          '2': 'II',
          '3': 'III',
          '4': 'IV',
          '5': 'V',
          '6': 'VI'
        }

        if (numMap[trimmed]) {
          foundAspect = numMap[trimmed]
        } else if (trimmed === 'TAMBAHAN') {
          foundAspect = 'TAMBAHAN'
        } else if (ASPECTS.some((a) => a.code.toUpperCase() === trimmed)) {
          foundAspect = trimmed
        } else {
          // Jika parameter berupa nomor pertanyaan Q15 / 15
          const qMatch = trimmed.match(/^Q?(\d+)$/)
          if (qMatch) {
            const qNum = parseInt(qMatch[1], 10)
            const matchedSlot = presetSlots.find((s) =>
              s.indicatorNumbers?.includes(qNum)
            )
            if (matchedSlot?.aspectCode) {
              foundAspect = matchedSlot.aspectCode
              targetSlotKey = targetSlotKey || matchedSlot.slotKey
            }
          }
        }
      }

      // Jika ada targetSlotKey tapi belum dapat aspeknya
      if (!foundAspect && targetSlotKey) {
        const matchedSlot = presetSlots.find((s) => s.slotKey === targetSlotKey)
        if (matchedSlot?.aspectCode) {
          foundAspect = matchedSlot.aspectCode
        }
      }

      return { aspectCode: foundAspect, targetSlotKey }
    }

    const { aspectCode, targetSlotKey } = resolveAspectFromUrl()
    if (aspectCode) {
      setActiveAspect(aspectCode)
      const url = new URL(window.location.href)
      if (url.searchParams.get('aspek') !== aspectCode) {
        url.searchParams.set('aspek', aspectCode)
        url.searchParams.delete('aspect')
        url.searchParams.delete('indicator')
        url.searchParams.delete('indikator')
        window.history.replaceState(null, '', url.toString())
      }
    } else {
      const url = new URL(window.location.href)
      if (!url.searchParams.has('aspek')) {
        url.searchParams.set('aspek', 'I')
        window.history.replaceState(null, '', url.toString())
      }
    }

    if (targetSlotKey) {
      setTimeout(() => {
        const el = document.getElementById(`slot-${targetSlotKey}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)
    }

    const handlePopState = () => {
      const popResult = resolveAspectFromUrl()
      if (popResult.aspectCode) {
        setActiveAspect(popResult.aspectCode)
        setOpenAccordionKey(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [presetSlots])

  // Status visual feedback untuk tombol salin tautan
  const [copiedAspectCode, setCopiedAspectCode] = useState<string | null>(null)
  const [copiedIndicatorKey, setCopiedIndicatorKey] = useState<string | null>(null)
  const [copiedIndicatorBadgeKey, setCopiedIndicatorBadgeKey] = useState<string | null>(null)
  const [copiedFileId, setCopiedFileId] = useState<string | null>(null)
  const [copiedCustomId, setCopiedCustomId] = useState<string | null>(null)

  const handleCopyAspectLink = () => {
    if (typeof window === 'undefined') return
    const publicUrl = getPublicEvidenceFullUrl(undefined, activeAspect)
    navigator.clipboard.writeText(publicUrl)
    setCopiedAspectCode(activeAspect)
    const aspObj = ASPECTS.find((a) => a.code === activeAspect)
    const label = aspObj
      ? aspObj.code === 'TAMBAHAN'
        ? aspObj.name
        : `Indikator ${aspObj.code} (${aspObj.name})`
      : `Indikator ${activeAspect}`
    toast.success(`Tautan publik bukti dukung ${label} berhasil disalin!`)
    setTimeout(() => setCopiedAspectCode(null), 2000)
  }

  const getAbsoluteFileUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    const formatted = formatFileUrl(url)
    if (formatted.startsWith('http://') || formatted.startsWith('https://')) {
      return formatted
    }
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${formatted.startsWith('/') ? '' : '/'}${formatted}`
    }
    return formatted
  }

  const getPublicEvidencePath = (slotKey?: string, aspectCode?: string): string => {
    const targetId = unit.evaluationId || unit.id
    const asp = aspectCode || activeAspect
    const base = `/shared/evidence/${targetId}/${asp}`
    return slotKey ? `${base}#slot-${slotKey}` : base
  }

  const getPublicEvidenceFullUrl = (slotKey?: string, aspectCode?: string): string => {
    const path = getPublicEvidencePath(slotKey, aspectCode)
    if (typeof window !== 'undefined') {
      return `${window.location.origin}${path}`
    }
    return path
  }

  const handleCopyFileLink = (att: EvidenceAttachmentItem) => {
    if (typeof window === 'undefined') return
    const fullUrl = getAbsoluteFileUrl(att.fileUrl)
    navigator.clipboard.writeText(fullUrl)
    setCopiedFileId(att.id)
    toast.success(`Tautan berkas "${att.fileName}" berhasil disalin!`)
    setTimeout(() => setCopiedFileId(null), 2000)
  }

  const handleCopyIndicatorLink = (slot: EvidenceSlotPreset) => {
    if (typeof window === 'undefined') return
    const publicUrl = getPublicEvidenceFullUrl(slot.slotKey, slot.aspectCode)
    navigator.clipboard.writeText(publicUrl)
    setCopiedIndicatorKey(slot.slotKey)
    const indicatorLabel =
      slot.indicatorNumbers && slot.indicatorNumbers.length > 0
        ? `Indikator ${slot.indicatorNumbers.map((n) => `Q${n}`).join(', ')}`
        : slot.title
    toast.success(`Tautan publik bukti dukung ${indicatorLabel} berhasil disalin!`)
    setTimeout(() => setCopiedIndicatorKey(null), 2000)
  }

  const handleCopyIndicatorPageLink = (slot: EvidenceSlotPreset) => {
    if (typeof window === 'undefined') return
    const publicUrl = getPublicEvidenceFullUrl(slot.slotKey, slot.aspectCode)
    navigator.clipboard.writeText(publicUrl)
    setCopiedIndicatorBadgeKey(slot.slotKey)
    const indicatorLabel =
      slot.indicatorNumbers && slot.indicatorNumbers.length > 0
        ? `Indikator ${slot.indicatorNumbers.map((n) => `Q${n}`).join(', ')}`
        : slot.title
    toast.success(`Tautan publik ${indicatorLabel} berhasil disalin!`)
    setTimeout(() => setCopiedIndicatorBadgeKey(null), 2000)
  }

  const handleCopyCustomRecordLink = (customRec: MasterRecordItem) => {
    if (typeof window === 'undefined') return
    const fullUrl = getAbsoluteFileUrl(customRec.fileUrl)
    navigator.clipboard.writeText(fullUrl)
    setCopiedCustomId(customRec.id)
    toast.success(`Tautan berkas tambahan "${customRec.title}" berhasil disalin!`)
    setTimeout(() => setCopiedCustomId(null), 2000)
  }

  const getRule = (slotKey: string, docType?: string): SlotUploadRule => {
    if (slotRules && slotRules[slotKey]) {
      return slotRules[slotKey]
    }
    return getDefaultRuleForSlot(slotKey, docType)
  }

  const f01QuestionMap = useMemo(() => getAllF01Questions(), [])

  useEffect(() => {
    if (!isInfoModalOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsInfoModalOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isInfoModalOpen])

  // Modal Tambah Berkas (Dropzone & Multi-File Picker)
  const [uploadModalSlot, setUploadModalSlot] = useState<SlotItemView | null>(null)
  const [pickedFilesForUpload, setPickedFilesForUpload] = useState<File[]>([])
  const [redactedQueueIndices, setRedactedQueueIndices] = useState<number[]>([])
  const [isDragOverUpload, setIsDragOverUpload] = useState(false)
  const modalFileInputRef = useRef<HTMLInputElement | null>(null)

  // Pre-Upload Redaction Studio Target (Ditahan di Client / Memory sebelum masuk Server)
  const [preUploadRedactTarget, setPreUploadRedactTarget] = useState<{
    slot: SlotItemView
    file: File
    previewUrl: string
    queueIndex?: number
  } | null>(null)

  // Post-Upload Redaction Studio Modal Target (Untuk Berkas yang Sudah Ada di Slot)
  const [redactModalTarget, setRedactModalTarget] = useState<{
    slot: SlotItemView
    attachment: EvidenceAttachmentItem
  } | null>(null)

  // Version Management Modal Target (Google Drive Style)
  const [versionModalTarget, setVersionModalTarget] = useState<{
    slot: SlotItemView
    attachment: EvidenceAttachmentItem
  } | null>(null)
  const [isUploadingVersion, setIsUploadingVersion] = useState(false)
  const [isRestoringVersion, setIsRestoringVersion] = useState(false)
  const [isDeletingVersion, setIsDeletingVersion] = useState(false)
  const versionFileInputRef = useRef<HTMLInputElement | null>(null)

  // Confirmation Modals
  const [deleteSlotTarget, setDeleteSlotTarget] = useState<SlotItemView | null>(null)
  const [deleteAttachmentTarget, setDeleteAttachmentTarget] = useState<{
    slot: SlotItemView
    attachmentId: string
    fileName: string
  } | null>(null)
  const [restoreVersionTarget, setRestoreVersionTarget] = useState<{
    targetVersionId: string
    verNum: number
  } | null>(null)
  const [deleteVersionTarget, setDeleteVersionTarget] = useState<{
    targetVersionId: string
    verNum: number
    fileName: string
  } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Metadata Extraction & Manual Override States
  const [extractingSlotKey, setExtractingSlotKey] = useState<string | null>(null)
  const [isBatchExtracting, setIsBatchExtracting] = useState<boolean>(false)
  const [manualMetadataTarget, setManualMetadataTarget] = useState<{
    masterId: string
    attachmentId?: string | null
    fileName?: string | null
    slotKey: string
    slotTitle: string
    slotDocumentType?: string
    attachmentFileType?: string | null
    category: SlotMetadataCategory
    detectedYear: number | ''
    documentNumber: string
    documentDate: string
    facilityType: string
    conditionStatus: string
    locationDescription: string
    photoDate: string
    systemName: string
    url: string
    operationalStatus: string
    screenshotDate: string
    notes: string
  } | null>(null)
  const [isSavingManualMetadata, setIsSavingManualMetadata] = useState<boolean>(false)

  const openManualMetadataModal = (
    slot: { slotKey: string; title: string; documentType?: string },
    master?: MasterRecordItem,
    att?: EvidenceAttachmentItem
  ) => {
    const targetAtt = att || master?.attachments?.[0]
    const meta = targetAtt?.metadata
    const schema = getSlotMetadataSchema(
      slot.slotKey,
      slot.documentType,
      targetAtt?.fileType || master?.fileType
    )
    const fallbackYear = meta?.detectedYear || master?.lastSourceYear || ''

    setManualMetadataTarget({
      masterId: master?.id || '',
      attachmentId: targetAtt?.id || null,
      fileName: targetAtt?.fileName || master?.fileName || null,
      slotKey: slot.slotKey,
      slotTitle: slot.title,
      slotDocumentType: slot.documentType,
      attachmentFileType: targetAtt?.fileType || master?.fileType || null,
      category: meta?.category || schema.category,
      detectedYear: fallbackYear,
      documentNumber: meta?.documentNumber || '',
      documentDate: meta?.documentDate || '',
      facilityType: meta?.facilityType || '',
      conditionStatus: meta?.conditionStatus || 'LAYAK_BERFUNGSI',
      locationDescription: meta?.locationDescription || '',
      photoDate: meta?.photoDate || '',
      systemName: meta?.systemName || '',
      url: meta?.url || '',
      operationalStatus: meta?.operationalStatus || 'AKTIF_TERVERIFIKASI',
      screenshotDate: meta?.screenshotDate || '',
      notes: meta?.notes || ''
    })
  }

  // Form Dokumen Tambahan (Opsional)
  const [showAddCustom, setShowAddCustom] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customDocType, setCustomDocType] = useState<'PDF' | 'IMAGE'>('PDF')
  const [customFile, setCustomFile] = useState<File | null>(null)

  // Sync apabila prop unit atau initialRecords berubah
  const [prevUnitId, setPrevUnitId] = useState(unit.id)
  if (unit.id !== prevUnitId) {
    setPrevUnitId(unit.id)
    setRecords(initialRecords)
  }

  useEffect(() => {
    setRecords(initialRecords)
  }, [initialRecords, unit.id])

  useEffect(() => {
    if (initialComplianceProfile) {
      setProfile(initialComplianceProfile)
    } else if (unit.id) {
      getUnitComplianceProfileAction(unit.id).then((res) => {
        if (res.success && res.profile) {
          setProfile(res.profile)
        }
      })
    }
  }, [initialComplianceProfile, unit.id])

  const refreshProfile = useCallback(() => {
    if (unit.id) {
      getUnitComplianceProfileAction(unit.id).then((res) => {
        if (res.success && res.profile) {
          setProfile(res.profile)
        }
      })
    }
  }, [unit.id])

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

  const refreshUnitRecords = async (): Promise<MasterRecordItem[]> => {
    const res = await getUnitMasterEvidenceAction(unit.id)
    if (res.success && res.records) {
      setRecords(res.records)
      onRecordsUpdated?.(unit.id, res.records)
      refreshProfile()
      return res.records
    }
    return records
  }

  const totalMandatorySlots = useMemo(
    () => presetSlots.filter((s) => s.isMandatory).length,
    [presetSlots]
  )

  const recordMap = useMemo(() => {
    const map = new Map<string, MasterRecordItem>()
    for (const r of records) {
      map.set(`${r.aspectCode}::${r.slotKey}`, r)
    }
    return map
  }, [records])

  const stats = useMemo(() => {
    const mandatoryKeys = new Set(
      presetSlots.filter((p) => p.isMandatory).map((p) => `${p.aspectCode}::${p.slotKey}`)
    )
    let filledMandatory = 0
    let totalFiles = 0
    let totalVersions = 0
    let latestSourceYear: number | null = null

    for (const r of records) {
      if (mandatoryKeys.has(`${r.aspectCode}::${r.slotKey}`)) {
        filledMandatory++
      }
      totalFiles += r.attachments.length
      for (const a of r.attachments) {
        totalVersions += (a.versions?.length || 0) + 1
      }
      if (r.lastSourceYear && (!latestSourceYear || r.lastSourceYear > latestSourceYear)) {
        latestSourceYear = r.lastSourceYear
      }
    }

    const pct = Math.min(
      100,
      Math.round((filledMandatory / Math.max(totalMandatorySlots, 1)) * 100)
    )

    return { filledMandatory, pct, totalFiles, totalVersions, latestSourceYear }
  }, [records, presetSlots, totalMandatorySlots])

  const aspectPresets = useMemo(
    () => presetSlots.filter((p) => p.aspectCode === activeAspect),
    [presetSlots, activeAspect]
  )

  const filledMandatoryInAspect = useMemo(
    () =>
      aspectPresets.filter((p) => {
        const rec = recordMap.get(`${activeAspect}::${p.slotKey}`)
        return rec && rec.attachments.length > 0
      }).length,
    [aspectPresets, recordMap, activeAspect]
  )

  const customRecordsInAspect = useMemo(
    () =>
      records.filter(
        (r) =>
          r.aspectCode === activeAspect &&
          !aspectPresets.some((p) => p.slotKey === r.slotKey)
      ),
    [records, activeAspect, aspectPresets]
  )

  // ============================================================================
  // ALUR UNGGAH BERKAS + KOMPRESI GAMBAR + STUDIO SENSOR (PRE-UPLOAD & POST-UPLOAD)
  // ============================================================================
  const handleDirectFileUpload = async (slot: SlotItemView, files: FileList | File[]) => {
    const fileArray = Array.from(files)
    if (fileArray.length === 0) return

    const existingRec = recordMap.get(`${activeAspect}::${slot.slotKey}`)
    const currentAttachments = existingRec?.attachments || []
    const rule = getRule(slot.slotKey, slot.documentType)
    const maxCount = rule.maxTotalFiles

    if (currentAttachments.length + fileArray.length > maxCount) {
      toast.error(
        `Batas kuota terlampaui! Maksimal ${maxCount} berkas untuk slot "${slot.title}". Saat ini sudah ada ${currentAttachments.length} berkas.`
      )
      return
    }

    setUploadingKey(slot.slotKey)
    const toastId = toast.loading(`Mengunggah berkas ke Master "${slot.title}"...`)

    try {
      const formData = new FormData()
      formData.append('unitId', unit.id)
      formData.append('aspectCode', activeAspect)
      formData.append('slotKey', slot.slotKey)
      formData.append('title', slot.title)
      formData.append('uploaderName', uploaderName)

      const { compressImageClient } = await import('../../lib/client-image-compressor')
      for (const file of fileArray) {
        const isImg =
          file.type.startsWith('image/') ||
          /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)
        if (isImg) {
          const compressed = await compressImageClient(file)
          formData.append('files', compressed)
        } else {
          formData.append('files', file)
        }
      }

      const res = await fetch('/api/evidence/master-upload', {
        method: 'POST',
        body: formData
      })
      const data = await res.json()

      if (data.success) {
        toast.success(`Berkas berhasil disimpan ke Master Bukti Dukung!`, { id: toastId })
        await refreshUnitRecords()
      } else {
        toast.error(data.error || 'Gagal mengunggah berkas ke Master.', { id: toastId })
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan saat mengunggah berkas.', { id: toastId })
    } finally {
      setUploadingKey(null)
    }
  }

  const handleOpenUploadModal = (slot: SlotItemView) => {
    setUploadModalSlot(slot)
    setIsModalGuideOpen(false)
    setPickedFilesForUpload([])
    setRedactedQueueIndices([])
  }

  const handleSelectFilesInModal = (incoming: FileList | File[]) => {
    if (!uploadModalSlot) return
    const incomingList = Array.from(incoming)
    if (incomingList.length === 0) return

    const existingRec = recordMap.get(`${activeAspect}::${uploadModalSlot.slotKey}`)
    const currentAttachmentsCount = existingRec?.attachments?.length || 0
    const rule = getRule(uploadModalSlot.slotKey, uploadModalSlot.documentType)
    const maxTotal = rule.maxTotalFiles
    const remainingSlots = Math.max(
      0,
      maxTotal - currentAttachmentsCount - pickedFilesForUpload.length
    )

    if (remainingSlots <= 0) {
      toast.error(
        `Kuota penuh! Maksimal ${maxTotal} berkas untuk slot "${uploadModalSlot.title}" (sudah terisi ${currentAttachmentsCount}, dipilih ${pickedFilesForUpload.length}).`
      )
      return
    }

    const isImageOnly = rule.allowedDocumentType === 'IMAGE_ONLY'
    const isDocOnly = rule.allowedDocumentType === 'PDF_ONLY'
    const validNewFiles: File[] = []
    let skippedByQuota = 0

    for (const file of incomingList) {
      // Cegah duplikat berkas yang sudah ada di antrean pilih
      const isDuplicate =
        pickedFilesForUpload.some((f) => f.name === file.name && f.size === file.size) ||
        validNewFiles.some((f) => f.name === file.name && f.size === file.size)
      if (isDuplicate) {
        continue
      }

      const isImageFile =
        file.type.startsWith('image/') ||
        /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
      const isDocFile =
        file.name.toLowerCase().endsWith('.pdf') ||
        file.name.toLowerCase().endsWith('.doc') ||
        file.name.toLowerCase().endsWith('.docx') ||
        file.type === 'application/pdf' ||
        file.type.includes('word') ||
        file.type.includes('officedocument')

      const allowedLimitMb = isImageFile
        ? (rule.maxImageSizeMb ?? rule.maxFileSizeMb ?? 3)
        : (rule.maxPdfSizeMb ?? rule.maxFileSizeMb ?? 20)
      const maxSizeBytes = allowedLimitMb * 1024 * 1024

      if (isImageOnly && !isImageFile) {
        toast.error(
          `Berkas "${file.name}" ditolak! Slot "${uploadModalSlot.title}" khusus untuk foto/gambar (JPG, PNG, WEBP).`
        )
        continue
      }
      if (isDocOnly && !isDocFile) {
        toast.error(
          `Berkas "${file.name}" ditolak! Slot "${uploadModalSlot.title}" hanya menerima dokumen resmi PDF atau DOCX.`
        )
        continue
      }
      if (!isImageFile && !isDocFile) {
        toast.error(
          `Berkas "${file.name}" tidak didukung. Format yang diizinkan: PDF, DOCX, JPG, PNG, WEBP.`
        )
        continue
      }

      if (file.size > maxSizeBytes) {
        const actualMb = (file.size / (1024 * 1024)).toFixed(1)
        toast.error(
          `Ukuran ${isImageFile ? 'foto' : 'dokumen'} "${file.name}" (${actualMb} MB) melebihi batas maksimal ${allowedLimitMb} MB.`
        )
        continue
      }

      if (validNewFiles.length >= remainingSlots) {
        skippedByQuota++
        continue
      }

      validNewFiles.push(file)
    }

    if (skippedByQuota > 0) {
      toast.warning(
        `${skippedByQuota} berkas tidak dimasukkan karena melebihi kuota maksimal ${maxTotal} berkas pada slot ini.`
      )
    }

    if (validNewFiles.length > 0) {
      setPickedFilesForUpload((prev) => [...prev, ...validNewFiles])
    }
  }

  const handleRemovePickedFile = (indexToRemove: number) => {
    setPickedFilesForUpload((prev) => prev.filter((_, idx) => idx !== indexToRemove))
    setRedactedQueueIndices((prev) =>
      prev
        .filter((i) => i !== indexToRemove)
        .map((i) => (i > indexToRemove ? i - 1 : i))
    )
  }

  // Buka Studio Sensor untuk 1 berkas tertentu di dalam antrean multi-upload
  const handleRedactFileInQueue = (index: number) => {
    if (!uploadModalSlot) return
    const file = pickedFilesForUpload[index]
    if (!file) return
    const blobUrl = URL.createObjectURL(file)
    setPreUploadRedactTarget({
      slot: uploadModalSlot,
      file,
      previewUrl: blobUrl,
      queueIndex: index
    })
  }

  // Unggah langsung seluruh berkas yang ada di antrean (Multi-Upload)
  const handleUploadAllPickedFiles = async () => {
    if (!uploadModalSlot || pickedFilesForUpload.length === 0) return
    const targetSlot = uploadModalSlot
    const filesToUpload = [...pickedFilesForUpload]
    setUploadModalSlot(null)
    setPickedFilesForUpload([])
    setRedactedQueueIndices([])
    await handleDirectFileUpload(targetSlot, filesToUpload)
  }

  // Tombol "Sensor & Unggah" jika hanya 1 berkas yang dipilih
  const handleProceedToRedactionOrUpload = () => {
    if (!uploadModalSlot || pickedFilesForUpload.length === 0) return
    if (pickedFilesForUpload.length > 1) {
      handleUploadAllPickedFiles()
      return
    }
    const file = pickedFilesForUpload[0]
    const isImageOrPdf =
      file.type === 'application/pdf' ||
      file.name.toLowerCase().endsWith('.pdf') ||
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|webp)$/i.test(file.name)

    const targetSlot = uploadModalSlot
    setUploadModalSlot(null)
    setPickedFilesForUpload([])
    setRedactedQueueIndices([])

    if (isImageOrPdf) {
      const blobUrl = URL.createObjectURL(file)
      setPreUploadRedactTarget({
        slot: targetSlot,
        file,
        previewUrl: blobUrl
      })
    } else {
      handleDirectFileUpload(targetSlot, [file])
    }
  }

  const handleSavePreUploadFile = async (redactedOrOriginalFile: File) => {
    if (!preUploadRedactTarget) return
    const { slot, queueIndex, previewUrl } = preUploadRedactTarget
    if (previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl)
    }

    // Jika dibuka dari daftar antrean multi-file di modal upload, perbarui berkas di antrean
    if (typeof queueIndex === 'number' && uploadModalSlot) {
      setPickedFilesForUpload((prev) =>
        prev.map((f, idx) => (idx === queueIndex ? redactedOrOriginalFile : f))
      )
      setRedactedQueueIndices((prev) =>
        prev.includes(queueIndex) ? prev : [...prev, queueIndex]
      )
      setPreUploadRedactTarget(null)
      toast.success(`Berkas "${redactedOrOriginalFile.name}" telah disensor dan siap diunggah.`)
      return
    }

    setPreUploadRedactTarget(null)
    await handleDirectFileUpload(slot, [redactedOrOriginalFile])
  }

  // Simpan hasil sensor pada berkas yang sudah ada (Post-Upload Redaction)
  const handleSaveRedactedAttachment = async (
    redactedFile: File,
    saveMode: 'new_version' | 'overwrite' = 'new_version'
  ) => {
    if (!redactModalTarget) return
    const { slot, attachment } = redactModalTarget
    const formData = new FormData()
    formData.append('file', redactedFile)
    formData.append('unitId', unit.id)
    formData.append('aspectCode', activeAspect)
    formData.append('slotKey', slot.slotKey)
    formData.append('attachmentId', attachment.id)
    formData.append('uploaderName', uploaderName)
    formData.append('saveMode', saveMode)
    formData.append(
      'note',
      saveMode === 'overwrite'
        ? 'Menimpa berkas dengan hasil sensor data rahasia'
        : 'Hasil sensor data pribadi/rahasia (Redacted)'
    )

    try {
      const res = await uploadMasterAttachmentVersionAction(formData)
      if (res.success) {
        if (saveMode === 'overwrite') {
          toast.success(`Berkas berhasil disensor dan ditimpa langsung!`)
        } else {
          toast.success(
            `Berkas hasil sensor berhasil disimpan sebagai versi baru (v${res.newVersion})!`
          )
        }
        await refreshUnitRecords()
        setRedactModalTarget(null)
      } else {
        toast.error(res.error || 'Gagal menyimpan berkas tersensor.')
      }
    } catch (err: any) {
      toast.error('Gagal menyimpan berkas tersensor: ' + (err.message || 'Error'))
    }
  }

  // Unggah Versi Baru dari Modal Kelola Versi (Google Drive Style)
  const handleUploadNewVersion = async (file: File) => {
    if (!versionModalTarget) return
    const { slot, attachment } = versionModalTarget

    const rule = getRule(slot.slotKey, slot.documentType)
    const isImageOnly = rule.allowedDocumentType === 'IMAGE_ONLY'
    const isDocOnly = rule.allowedDocumentType === 'PDF_ONLY'
    const isImageFile = file.type.startsWith('image/') || /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(file.name)
    const isDocFile =
      file.name.toLowerCase().endsWith('.pdf') ||
      file.name.toLowerCase().endsWith('.doc') ||
      file.name.toLowerCase().endsWith('.docx') ||
      file.type === 'application/pdf' ||
      file.type.includes('word') ||
      file.type.includes('officedocument')

    if (isImageOnly && !isImageFile) {
      toast.error(`Berkas "${file.name}" ditolak! Slot "${slot.title}" khusus untuk foto/gambar (JPG, PNG, WEBP).`)
      return
    }
    if (isDocOnly && !isDocFile) {
      toast.error(`Format berkas tidak didukung. Slot "${slot.title}" hanya menerima dokumen resmi PDF atau DOCX.`)
      return
    }
    if (!isImageFile && !isDocFile) {
      toast.error(`Format tidak didukung. Format yang diizinkan: PDF, DOCX, JPG, PNG, WEBP.`)
      return
    }

    const allowedLimitMb = isImageFile
      ? (rule.maxImageSizeMb ?? rule.maxFileSizeMb ?? 3)
      : (rule.maxPdfSizeMb ?? rule.maxFileSizeMb ?? 20)
    const maxSizeBytes = allowedLimitMb * 1024 * 1024
    if (file.size > maxSizeBytes) {
      const actualMb = (file.size / (1024 * 1024)).toFixed(1)
      toast.error(`Ukuran berkas ${isImageFile ? 'foto' : 'dokumen'} "${file.name}" (${actualMb} MB) melebihi batas maksimal ${allowedLimitMb} MB untuk slot ini.`)
      return
    }

    setIsUploadingVersion(true)

    try {
      let fileToSend = file
      if (file.type.startsWith('image/')) {
        const { compressImageClient } = await import('../../lib/client-image-compressor')
        fileToSend = await compressImageClient(file)
      }

      const formData = new FormData()
      formData.append('file', fileToSend)
      formData.append('unitId', unit.id)
      formData.append('aspectCode', activeAspect)
      formData.append('slotKey', slot.slotKey)
      formData.append('attachmentId', attachment.id)
      formData.append('uploaderName', uploaderName)
      formData.append('saveMode', 'new_version')

      const res = await uploadMasterAttachmentVersionAction(formData)
      if (res.success) {
        toast.success(`Versi baru (v${res.newVersion}) berhasil diunggah!`)
        const updatedList = await refreshUnitRecords()
        const refreshedRec = updatedList.find(
          (r) => r.aspectCode === activeAspect && r.slotKey === slot.slotKey
        )
        const refreshedAtt = refreshedRec?.attachments.find((a) => a.id === attachment.id)
        if (refreshedAtt) {
          setVersionModalTarget({ slot, attachment: refreshedAtt })
        } else {
          setVersionModalTarget(null)
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

  // Konfirmasi Pakai Kembali Versi Lampau
  const handleConfirmRestoreVersion = async () => {
    if (!versionModalTarget || !restoreVersionTarget) return
    setIsRestoringVersion(true)
    const { slot, attachment } = versionModalTarget
    const { targetVersionId } = restoreVersionTarget

    try {
      const res = await restoreMasterAttachmentVersionAction({
        unitId: unit.id,
        aspectCode: activeAspect,
        slotKey: slot.slotKey,
        attachmentId: attachment.id,
        targetVersionId,
        uploaderName
      })
      if (res.success) {
        toast.success(
          `Versi ${res.restoredVersion} berhasil dipulihkan menjadi berkas aktif!`
        )
        const updatedList = await refreshUnitRecords()
        const refreshedRec = updatedList.find(
          (r) => r.aspectCode === activeAspect && r.slotKey === slot.slotKey
        )
        const refreshedAtt = refreshedRec?.attachments.find((a) => a.id === attachment.id)
        if (refreshedAtt) {
          setVersionModalTarget({ slot, attachment: refreshedAtt })
        } else {
          setVersionModalTarget(null)
        }
        setRestoreVersionTarget(null)
      } else {
        toast.error(res.error || 'Gagal memulihkan versi berkas.')
      }
    } catch {
      toast.error('Gagal memulihkan versi berkas.')
    } finally {
      setIsRestoringVersion(false)
    }
  }

  // Konfirmasi Hapus Permanen Arsip Versi
  const handleConfirmDeleteVersion = async () => {
    if (!versionModalTarget || !deleteVersionTarget) return
    setIsDeletingVersion(true)
    const { slot, attachment } = versionModalTarget
    const { targetVersionId, verNum } = deleteVersionTarget

    try {
      const res = await deleteMasterAttachmentVersionAction({
        unitId: unit.id,
        aspectCode: activeAspect,
        slotKey: slot.slotKey,
        attachmentId: attachment.id,
        versionId: targetVersionId,
        actorName: uploaderName
      })
      if (res.success) {
        toast.success(`Arsip Versi ${verNum} berhasil dihapus permanen!`)
        setDeleteVersionTarget(null)
        const updatedList = await refreshUnitRecords()
        const refreshedRec = updatedList.find(
          (r) => r.aspectCode === activeAspect && r.slotKey === slot.slotKey
        )
        const refreshedAtt = refreshedRec?.attachments.find((a) => a.id === attachment.id)
        if (refreshedAtt) {
          setVersionModalTarget({ slot, attachment: refreshedAtt })
        } else {
          setVersionModalTarget(null)
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

  // Konfirmasi Hapus Lampiran Spesifik
  const handleConfirmDeleteAttachment = async () => {
    if (!deleteAttachmentTarget) return
    setIsDeleting(true)
    try {
      const res = await deleteMasterEvidenceAttachmentAction({
        unitId: unit.id,
        aspectCode: activeAspect,
        slotKey: deleteAttachmentTarget.slot.slotKey,
        attachmentId: deleteAttachmentTarget.attachmentId,
        actorName: uploaderName
      } as any)
      if (res.success) {
        toast.success('Berkas lampiran berhasil dihapus.')
        setDeleteAttachmentTarget(null)
        await refreshUnitRecords()
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal menghapus berkas.')
      }
    } catch {
      toast.error('Gagal menghapus berkas.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Konfirmasi Hapus Semua Berkas di Slot
  const handleConfirmDeleteSlot = async () => {
    if (!deleteSlotTarget) return
    setIsDeleting(true)
    try {
      const targetSlotKey = deleteSlotTarget.slotKey
      const res = await deleteMasterEvidenceSlotAction({
        unitId: unit.id,
        aspectCode: activeAspect,
        slotKey: targetSlotKey,
        actorName: uploaderName
      })
      if (res.success) {
        toast.success(`Seluruh berkas pada "${deleteSlotTarget.title}" berhasil dihapus.`)
        setDeleteSlotTarget(null)
        setRecords((prev) =>
          prev.filter((r) => !(r.slotKey === targetSlotKey && r.aspectCode === activeAspect))
        )
        await refreshUnitRecords()
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal menghapus berkas slot.')
      }
    } catch {
      toast.error('Gagal menghapus berkas slot.')
    } finally {
      setIsDeleting(false)
    }
  }

  // Handler Ekstrak Metadata AI untuk 1 Slot Master
  const handleExtractMetadata = async (masterId?: string, slotKey?: string) => {
    if (!masterId || !slotKey) return
    setExtractingSlotKey(slotKey)
    const schema = getSlotMetadataSchema(slotKey)
    const loadingMsg =
      schema.category === 'PHYSICAL_FACILITY'
        ? 'AI Vision sedang menganalisis foto fasilitas & kondisi kelayakan...'
        : schema.category === 'DIGITAL_SYSTEM'
          ? 'AI Vision sedang memindai tangkapan layar sistem & kanal digital...'
          : 'AI Vision sedang memindai dokumen untuk mencari tahun & nomor SK...'
    const toastId = toast.loading(loadingMsg)
    try {
      const res = await extractMasterEvidenceMetadataAction({
        masterId,
        actorName: `${uploaderName} (AI Vision)`
      })
      if (res.success && res.metadata) {
        const meta = res.metadata
        if (meta.category === 'PHYSICAL_FACILITY') {
          toast.success(
            `Berhasil! Teridentifikasi: ${meta.facilityType || 'Fasilitas'} (${getConditionStatusLabel(meta.conditionStatus) || 'Layak'}).`,
            { id: toastId }
          )
        } else if (meta.category === 'DIGITAL_SYSTEM') {
          toast.success(
            `Berhasil! Teridentifikasi: ${meta.systemName || 'Sistem Digital'} (${getOperationalStatusLabel(meta.operationalStatus) || 'Aktif'}).`,
            { id: toastId }
          )
        } else {
          const yr = meta.detectedYear
          toast.success(
            yr
              ? `Berhasil! Dokumen terdeteksi bertahun ${yr}${meta.documentNumber ? ` (No: ${meta.documentNumber})` : ''}.`
              : 'Pindaian selesai, namun angka tahun tidak ditemukan secara eksplisit.',
            { id: toastId }
          )
        }
        await refreshUnitRecords()
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal mengekstrak metadata berkas.', { id: toastId })
      }
    } catch {
      toast.error('Terjadi kesalahan saat memindai berkas.', { id: toastId })
    } finally {
      setExtractingSlotKey(null)
    }
  }

  // Handler Pindai Massal Seluruh Berkas Master Unit yang Belum Memiliki Tahun
  const handleBatchExtract = async () => {
    setIsBatchExtracting(true)
    const toastId = toast.loading('Memulai pemindaian massal AI Vision untuk dokumen master...')
    try {
      const res = await batchExtractMasterEvidenceMetadataAction({
        unitId: unit.id,
        forceAll: false
      })
      if (res.success) {
        toast.success(
          `Selesai! ${res.updatedCount} dari ${res.processedCount} dokumen berhasil diperbarui metadatanya.`,
          { id: toastId }
        )
        await refreshUnitRecords()
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal menjalankan pemindaian massal.', { id: toastId })
      }
    } catch {
      toast.error('Terjadi kesalahan saat pemindaian massal.', { id: toastId })
    } finally {
      setIsBatchExtracting(false)
    }
  }

  // Handler Simpan Manual Metadata (Human-in-the-Loop Override)
  const handleSaveManualMetadata = async () => {
    if (!manualMetadataTarget) return
    setIsSavingManualMetadata(true)
    try {
      const res = await updateMasterEvidenceManualMetadataAction({
        masterId: manualMetadataTarget.masterId,
        attachmentId: manualMetadataTarget.attachmentId || null,
        category: manualMetadataTarget.category,
        detectedYear:
          manualMetadataTarget.detectedYear !== ''
            ? Number(manualMetadataTarget.detectedYear)
            : null,
        documentNumber: manualMetadataTarget.documentNumber || null,
        documentDate: manualMetadataTarget.documentDate || null,
        facilityType: manualMetadataTarget.facilityType || null,
        conditionStatus: manualMetadataTarget.conditionStatus || null,
        locationDescription: manualMetadataTarget.locationDescription || null,
        photoDate: manualMetadataTarget.photoDate || null,
        systemName: manualMetadataTarget.systemName || null,
        url: manualMetadataTarget.url || null,
        operationalStatus: manualMetadataTarget.operationalStatus || null,
        screenshotDate: manualMetadataTarget.screenshotDate || null,
        notes: manualMetadataTarget.notes || null,
        actorName: uploaderName
      })
      if (res.success) {
        toast.success('Metadata bukti dukung berhasil diperbarui.')
        setManualMetadataTarget(null)
        await refreshUnitRecords()
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal menyimpan metadata manual.')
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan metadata.')
    } finally {
      setIsSavingManualMetadata(false)
    }
  }

  // Handler Tambah Dokumen Tambahan (Opsional) -> Masuk Studio Sensor jika PDF/Gambar
  const handleAddCustomSlot = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim()) {
      toast.error('Nama dokumen tambahan wajib diisi.')
      return
    }
    if (!customFile) {
      toast.error('Pilih berkas file yang akan diunggah.')
      return
    }

    const isImageFile =
      customFile.type.startsWith('image/') ||
      /\.(jpe?g|png|webp|gif|bmp|svg)$/i.test(customFile.name)
    if (customDocType === 'PDF' && isImageFile) {
      toast.error(
        'Format ditolak! Dokumen resmi tidak mengizinkan file gambar/foto. Harap unggah berkas PDF atau DOCX.'
      )
      return
    }
    if (customDocType === 'IMAGE' && !isImageFile) {
      toast.error(
        'Format ditolak! Anda memilih tipe Foto/Gambar. Harap unggah berkas JPG, PNG, atau WEBP.'
      )
      return
    }

    const customSlotKey = `additional_${Date.now()}_${Math.random().toString(36).substring(7)}`
    const newSlotView: SlotItemView = {
      slotKey: customSlotKey,
      title: customTitle.trim(),
      description: 'Dokumen pendukung tambahan.',
      isMandatory: false,
      documentType: customDocType
    }

    const fileToProcess = customFile
    setShowAddCustom(false)
    setCustomTitle('')
    setCustomFile(null)

    const isImageOrPdf =
      fileToProcess.type === 'application/pdf' ||
      fileToProcess.name.toLowerCase().endsWith('.pdf') ||
      fileToProcess.type.startsWith('image/') ||
      /\.(jpe?g|png|webp)$/i.test(fileToProcess.name)

    if (isImageOrPdf) {
      const blobUrl = URL.createObjectURL(fileToProcess)
      setPreUploadRedactTarget({
        slot: newSlotView,
        file: fileToProcess,
        previewUrl: blobUrl
      })
    } else {
      await handleDirectFileUpload(newSlotView, [fileToProcess])
    }
  }

  const activeAspectIndex = ASPECTS.findIndex((a) => a.code === activeAspect)
  const currentAspect = activeAspectIndex >= 0 ? ASPECTS[activeAspectIndex] : null
  const prevAspect = activeAspectIndex > 0 ? ASPECTS[activeAspectIndex - 1] : null
  const nextAspect =
    activeAspectIndex >= 0 && activeAspectIndex < ASPECTS.length - 1
      ? ASPECTS[activeAspectIndex + 1]
      : null

  const unscannedCount = useMemo(() => {
    return records.filter((r) => {
      const atts = r.attachments || []
      const hasFile = atts.length > 0 || (r.fileUrl && r.fileUrl.trim() !== '')
      return hasFile && (!r.lastSourceYear || !atts[0]?.metadata?.detectedYear)
    }).length
  }, [records])

  return (
    <div className="space-y-4">
      {/* Compact Header & Aspect Selector Toolbar */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-stroke/60 shadow-2xs space-y-3">
        {/* Baris 1: Identitas Lokus & Ringkasan Statistik */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
          <div className="min-w-0 space-y-0.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm sm:text-base font-bold text-ink tracking-tight truncate">
                {unit.name}
              </h2>
              {unit.categoryName && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-surface-subtle text-ink-secondary border border-stroke/60 shrink-0">
                  {unit.categoryName}
                </span>
              )}
              {stats.latestSourceYear && (
                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
                  Periode {stats.latestSourceYear}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="text-xs text-ink-muted">
                Dokumen induk lokus bersifat tetap &amp; tidak berubah saat berganti tahun evaluasi.
              </p>
              <button
                type="button"
                onClick={() => setIsInfoModalOpen(true)}
                className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-brand/10 hover:bg-brand/20 text-brand border border-brand/30 text-[10px] font-bold transition-all cursor-pointer shrink-0 shadow-2xs"
                title="Pelajari apa itu Master Bukti Dukung"
                aria-label="Apa itu Master Bukti Dukung?">
                !
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap text-xs">
            {/* Tombol Batch Pindai Metadata AI HANYA untuk Admin */}
            {isAdmin && (
              <button
                type="button"
                disabled={isBatchExtracting || unscannedCount === 0}
                onClick={handleBatchExtract}
                title={
                  unscannedCount > 0
                    ? `Pindai otomatis tahun & nomor SK untuk ${unscannedCount} dokumen menggunakan Gemini AI Vision`
                    : 'Seluruh dokumen master unit ini telah memiliki metadata tahun'
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-900 font-semibold shadow-2xs transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                {isBatchExtracting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                )}
                <span>
                  {isBatchExtracting
                    ? 'Memindai AI...'
                    : unscannedCount > 0
                      ? `Pindai Metadata AI (${unscannedCount})`
                      : 'Metadata Lengkap'}
                </span>
              </button>
            )}

            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-surface-subtle border border-stroke/50">
              <span className="text-ink-muted">Terunggah:</span>
              <strong className="font-bold text-ink">
                {stats.filledMandatory}/{totalMandatorySlots}
              </strong>
              <span className="text-[11px] font-semibold text-brand">({stats.pct}%)</span>
            </div>
          </div>
        </div>

        {/* Baris 2: Selector Indikator + Navigasi Cepat + View Mode Toggle */}
        <div className="pt-2.5 border-t border-stroke/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1.5 flex-1 min-w-0">
            <label
              htmlFor="master-aspect-selector"
              className="text-xs font-semibold text-ink-secondary shrink-0 hidden sm:inline">
              Indikator:
            </label>
            <div className="relative flex-1 max-w-md">
              <select
                id="master-aspect-selector"
                aria-label="Pilih Indikator Bukti Dukung"
                value={activeAspect}
                onChange={(e) => {
                  changeActiveAspect(e.target.value)
                }}
                className="w-full pl-3 pr-8 py-1.5 rounded-lg bg-surface-subtle hover:bg-surface-subtle/80 border border-stroke/70 text-xs sm:text-sm font-semibold text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer appearance-none truncate">
                {ASPECTS.map((asp) => {
                  const labelPrefix =
                    asp.code === 'TAMBAHAN' ? 'Tambahan (+1)' : `Indikator ${asp.code}`
                  return (
                    <option key={asp.code} value={asp.code}>
                      {labelPrefix} - {asp.name}
                    </option>
                  )
                })}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-ink-muted pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>

            {/* Tombol Prev / Next Indikator */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                disabled={!prevAspect}
                onClick={() => {
                  if (prevAspect) {
                    changeActiveAspect(prevAspect.code)
                  }
                }}
                title={prevAspect ? `Ke Indikator ${prevAspect.code}` : 'Indikator Pertama'}
                className="p-1.5 rounded-lg border border-stroke/60 bg-surface-subtle hover:bg-surface-hover text-ink-secondary disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer">
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                disabled={!nextAspect}
                onClick={() => {
                  if (nextAspect) {
                    changeActiveAspect(nextAspect.code)
                  }
                }}
                title={nextAspect ? `Ke Indikator ${nextAspect.code}` : 'Indikator Terakhir'}
                className="p-1.5 rounded-lg border border-stroke/60 bg-surface-subtle hover:bg-surface-hover text-ink-secondary disabled:opacity-35 disabled:cursor-not-allowed transition-colors cursor-pointer">
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Tombol Salin Tautan Publik Indikator & Buka Tab Baru */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={handleCopyAspectLink}
                title={`Salin tautan publik bukti dukung ${
                  currentAspect
                    ? currentAspect.code === 'TAMBAHAN'
                      ? currentAspect.name
                      : `Indikator ${currentAspect.code}`
                    : activeAspect
                }`}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                  copiedAspectCode === activeAspect
                    ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                    : 'border-stroke/70 bg-surface-subtle hover:bg-surface-hover text-ink-secondary hover:text-brand'
                }`}>
                {copiedAspectCode === activeAspect ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-75 duration-150" />
                    <span className="text-[11px] font-semibold text-emerald-700">Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand" />
                    <span className="text-[11px]">Salin Tautan</span>
                  </>
                )}
              </button>

              <a
                href={getPublicEvidencePath(undefined, activeAspect)}
                target="_blank"
                rel="noopener noreferrer"
                title={`Buka tautan publik bukti dukung ${
                  currentAspect
                    ? currentAspect.code === 'TAMBAHAN'
                      ? currentAspect.name
                      : `Indikator ${currentAspect.code}`
                    : activeAspect
                } di tab baru (tanpa login)`}
                className="p-1.5 rounded-lg border border-stroke/70 bg-surface-subtle hover:bg-surface-hover text-ink-secondary hover:text-brand transition-colors cursor-pointer">
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 flex-wrap">
            <span
              className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border ${
                filledMandatoryInAspect >= aspectPresets.length && aspectPresets.length > 0
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  : 'bg-surface-subtle text-ink-secondary border-stroke/50'
              }`}>
              {filledMandatoryInAspect >= aspectPresets.length && aspectPresets.length > 0 && (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              )}
              <span>
                {filledMandatoryInAspect}/{aspectPresets.length} Slot Terisi
              </span>
            </span>

            <div className="flex items-center p-0.5 bg-surface-subtle rounded-lg border border-stroke/60 text-xs">
              <button
                type="button"
                onClick={() => handleSetViewMode('grid')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-surface-elevated text-ink font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink font-normal'
                }`}
                title="Tampilan Grid">
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => handleSetViewMode('list')}
                className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs transition-all cursor-pointer ${
                  viewMode === 'list'
                    ? 'bg-surface-elevated text-ink font-semibold shadow-2xs'
                    : 'text-ink-muted hover:text-ink font-normal'
                }`}
                title="Tampilan List">
                <List className="w-3.5 h-3.5" />
                <span>List</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Profil Pemeriksaan Awal 5 Dokumen Prioritas & Peringatan Berkas */}
      {profile && (
        <div className="space-y-3">
          {/* Action Items Alert jika ada */}
          {profile.actionItems.length > 0 && (
            <div className="p-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/50 shadow-2xs space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0" />
                  <h3 className="font-bold text-xs sm:text-sm text-amber-950 dark:text-amber-200">
                    Catatan 5 Dokumen Prioritas ({profile.actionItems.length} Perlu Diperhatikan)
                  </h3>
                </div>
                <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium hidden sm:inline">
                  Pemeriksaan awal berkas kunci
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                {profile.actionItems.map((it, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-2 p-2.5 rounded-xl bg-white/80 dark:bg-surface-subtle/50 border border-amber-200/60 dark:border-amber-900/40 text-ink">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 mt-0.5 border ${
                        it.severity === 'DANGER'
                          ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-800/50'
                          : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                      }`}>
                      {it.pillar}
                    </span>
                    <p className="text-[11px] leading-snug flex-1 text-ink-secondary dark:text-ink-secondary">{it.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Widget 5 Dokumen Prioritas */}
          <div className="p-3.5 sm:p-4 rounded-xl bg-surface border border-stroke/60 shadow-2xs space-y-3">
            <div className="flex items-start justify-between gap-3 border-b border-stroke/40 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-bold text-xs sm:text-sm text-ink">
                    Pemeriksaan Awal 5 Dokumen Prioritas
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand/10 text-brand border border-brand/20">
                    Kelengkapan: {profile.readinessScore}%
                  </span>
                </div>
                <p className="text-[11px] text-ink-muted">
                  Audit cepat 5 berkas dasar unit lokus (Standar Pelayanan, Sarpras Rentan, SKM, SP4N-LAPOR!, Inovasi).
                </p>
                <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-amber-800 dark:text-amber-300 bg-amber-500/10 dark:bg-amber-500/15 px-2.5 py-1 rounded-md border border-amber-500/25 mt-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
                  <span>
                    <strong>Penting:</strong> Pemenuhan 5 dokumen ini bukan berarti evaluasi sudah selesai. Anda <strong>tetap wajib</strong> melengkapi seluruh slot bukti dukung lainnya pada 6 Aspek evaluasi PEKPPP.
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsPillarsCollapsed(!isPillarsCollapsed)}
                className="text-xs font-semibold text-ink-secondary hover:text-brand inline-flex items-center gap-1 cursor-pointer shrink-0 py-1 px-2 rounded-lg hover:bg-surface-subtle transition-colors">
                <span>{isPillarsCollapsed ? 'Tampilkan 5 Dokumen' : 'Ciutkan'}</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    isPillarsCollapsed ? '' : 'rotate-180'
                  }`}
                />
              </button>
            </div>

            {!isPillarsCollapsed && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 text-xs">
                {/* Pilar 1: Standar Pelayanan */}
                <button
                  type="button"
                  onClick={() => changeActiveAspect('I')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 group ${
                    activeAspect === 'I'
                      ? 'bg-brand/5 border-brand/40 ring-1 ring-brand/20'
                      : 'bg-surface-subtle/50 hover:bg-surface-subtle border-stroke/60'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider group-hover:text-brand">
                      1. Standar Pelayanan
                    </span>
                    <FileText className="w-3.5 h-3.5 text-brand" />
                  </div>
                  {profile.sp.hasFile ? (
                    <div>
                      <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tersedia</span>
                      </div>
                      <p className="text-[10px] text-ink-secondary truncate mt-0.5" title={profile.sp.documentNumber || ''}>
                        {profile.sp.documentNumber || 'SK Terlampir'}
                      </p>
                      <p className="text-[10px] text-ink-muted">
                        Tahun {profile.sp.year || '-'}
                        {profile.sp.isAging && <span className="text-amber-700 dark:text-amber-400 font-medium"> (Perlu FKP)</span>}
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Belum Diunggah</span>
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5">Wajib memiliki SK SP</p>
                    </div>
                  )}
                </button>

                {/* Pilar 2: Sarpras Ramah Rentan */}
                <button
                  type="button"
                  onClick={() => changeActiveAspect('III')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 group ${
                    activeAspect === 'III'
                      ? 'bg-brand/5 border-brand/40 ring-1 ring-brand/20'
                      : 'bg-surface-subtle/50 hover:bg-surface-subtle border-stroke/60'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider group-hover:text-brand">
                      2. Sarpras Rentan
                    </span>
                    <ImageIcon className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  </div>
                  {profile.saprasRentan.hasFile ? (
                    <div>
                      <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tersedia</span>
                      </div>
                      <p className="text-[10px] text-ink-secondary mt-0.5">
                        {profile.saprasRentan.photoCount} Foto Fasilitas
                      </p>
                      <p className="text-[10px] text-ink-muted">Ramp, toilet, kursi roda</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Belum Ada Foto</span>
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5">Foto fasilitas rentan</p>
                    </div>
                  )}
                </button>

                {/* Pilar 3: SKM & Publikasi */}
                <button
                  type="button"
                  onClick={() => changeActiveAspect('I')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 group ${
                    activeAspect === 'I'
                      ? 'bg-brand/5 border-brand/40 ring-1 ring-brand/20'
                      : 'bg-surface-subtle/50 hover:bg-surface-subtle border-stroke/60'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider group-hover:text-brand">
                      3. Laporan SKM
                    </span>
                    <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  {profile.skm.hasFile ? (
                    <div>
                      <div className="flex items-center gap-1 font-bold">
                        <CheckCircle2 className={`w-3.5 h-3.5 ${profile.skm.isExpired ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-700 dark:text-emerald-400'}`} />
                        <span className={profile.skm.isExpired ? 'text-amber-800 dark:text-amber-300' : 'text-emerald-700 dark:text-emerald-400'}>
                          Tahun {profile.skm.year || '-'}
                        </span>
                      </div>
                      <p className="text-[10px] text-ink-secondary mt-0.5">
                        Publikasi: {profile.skm.hasPublication ? 'Lengkap' : 'Belum Foto'}
                      </p>
                      {profile.skm.isExpired && (
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium">Perlu pembaruan</p>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1 text-rose-600 dark:text-rose-400 font-bold">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Belum Lapor</span>
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5">Wajib laporan tahunan</p>
                    </div>
                  )}
                </button>

                {/* Pilar 4: Pengaduan (SP4N-LAPOR!) */}
                <button
                  type="button"
                  onClick={() => changeActiveAspect('V')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 group ${
                    activeAspect === 'V'
                      ? 'bg-brand/5 border-brand/40 ring-1 ring-brand/20'
                      : 'bg-surface-subtle/50 hover:bg-surface-subtle border-stroke/60'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider group-hover:text-brand">
                      4. SP4N-LAPOR!
                    </span>
                    <MessageSquare className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  {profile.pengaduan.hasFile ? (
                    <div>
                      <div className="flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Tersedia</span>
                      </div>
                      <p className="text-[10px] text-ink-secondary mt-0.5">
                        {profile.pengaduan.hasSpanLapor ? 'Kanal SP4N Aktif' : 'SOP Pengaduan'}
                      </p>
                      <p className="text-[10px] text-ink-muted">SK & sarana pengaduan</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-bold">
                        <span>Belum Tercatat</span>
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5">Kanal pengaduan</p>
                    </div>
                  )}
                </button>

                {/* Pilar 5: Inovasi Layanan */}
                <button
                  type="button"
                  onClick={() => changeActiveAspect('VI')}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer space-y-1.5 group ${
                    activeAspect === 'VI'
                      ? 'bg-brand/5 border-brand/40 ring-1 ring-brand/20'
                      : 'bg-surface-subtle/50 hover:bg-surface-subtle border-stroke/60'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-ink-muted uppercase tracking-wider group-hover:text-brand">
                      5. Inovasi
                    </span>
                    <Sparkles className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  {profile.inovasi.hasFile ? (
                    <div>
                      <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300 font-bold">
                        <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                        <span>Tersedia</span>
                      </div>
                      <p className="text-[10px] text-ink-secondary truncate mt-0.5" title={profile.inovasi.documentNumber || ''}>
                        {profile.inovasi.documentNumber || 'SK Inovasi'}
                      </p>
                      <p className="text-[10px] text-ink-muted">Nilai tambah Aspek VI</p>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center gap-1 text-zinc-500 dark:text-zinc-400 font-medium">
                        <span>Opsional</span>
                      </div>
                      <p className="text-[10px] text-ink-muted mt-0.5">Dapat ditambahkan</p>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* A. Daftar Slot Bukti Wajib PermenPAN-RB (Compact) */}
      <div className="space-y-2.5">
        <div
          className={
            viewMode === 'grid'
              ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
              : 'space-y-2'
          }>
          {aspectPresets.map((slot, sIdx) => {
            const master = recordMap.get(`${activeAspect}::${slot.slotKey}`)
            const attachments = master?.attachments || []
            const primaryAtt = attachments[0]
            const docMeta = primaryAtt?.metadata
            const detectedYear = docMeta?.detectedYear || master?.lastSourceYear
            const docNumber = docMeta?.documentNumber
            const hasUploaded = attachments.length > 0
            const slotMetaSchema = getSlotMetadataSchema(
              slot.slotKey,
              slot.documentType,
              primaryAtt?.fileType || master?.fileType
            )
            const activeMetaCategory = docMeta?.category || slotMetaSchema.category
            const rule = getRule(slot.slotKey, slot.documentType)
            const isImageOnlySlot = rule.allowedDocumentType === 'IMAGE_ONLY'
            const isDocOnlySlot = rule.allowedDocumentType === 'PDF_ONLY'
            const maxCount = rule.maxTotalFiles
            const canAddMore = attachments.length < maxCount
            const isAccordionOpen = openAccordionKey === slot.slotKey
            const isGuideOpen = openGuideSlotKey === slot.slotKey
            const isUploading = uploadingKey === slot.slotKey
            const historyList = master?.history || []
            const historyCount = historyList.length
            const exampleUrls = slot.exampleImages || []
            const checklistItems = slot.guideChecklist || []
            const indicatorNums = slot.indicatorNumbers || []

            return (
              <div
                key={slot.slotKey}
                id={`slot-${slot.slotKey}`}
                className="p-3.5 rounded-xl border border-stroke/60 bg-surface hover:border-stroke hover:shadow-soft-card shadow-2xs space-y-2.5 transition-all flex flex-col justify-between scroll-mt-20">
                <div className="space-y-2">
                  {/* Top Row: Title + Indicator Badge + Action Buttons */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap min-w-0">
                      <span className="text-[11px] font-semibold text-ink-secondary bg-surface-subtle px-2 py-0.5 rounded-md border border-stroke/50 shrink-0">
                        #{sIdx + 1}
                      </span>
                      {indicatorNums.length > 0 && (
                        <button
                          type="button"
                          onClick={() => handleCopyIndicatorPageLink(slot)}
                          className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border shrink-0 inline-flex items-center gap-1 transition-all cursor-pointer ${
                            copiedIndicatorBadgeKey === slot.slotKey
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                              : 'bg-brand-light hover:bg-brand hover:text-white text-brand border-brand/20'
                          }`}
                          title={`Klik untuk menyalin tautan halaman Indikator ${indicatorNums.map((n) => `#${n}`).join(', ')}`}>
                          <span>Indikator {indicatorNums.map((n) => `Q${n}`).join(', ')}</span>
                          {copiedIndicatorBadgeKey === slot.slotKey ? (
                            <Check className="w-2.5 h-2.5 text-emerald-600 animate-in zoom-in-75 duration-150" />
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />
                          )}
                        </button>
                      )}
                      <h3 className="font-semibold text-xs sm:text-sm text-ink leading-snug">
                        {slot.title}
                      </h3>
                      {hasUploaded && activeMetaCategory === 'PHYSICAL_FACILITY' ? (
                        docMeta?.facilityType ? (
                          <button
                            type="button"
                            onClick={() => openManualMetadataModal(slot, master, primaryAtt)}
                            title={`Fasilitas: ${docMeta.facilityType}${docMeta.locationDescription ? ` • Lokasi: ${docMeta.locationDescription}` : ''} (Klik untuk edit detail fasilitas)`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/50 text-emerald-900 dark:text-emerald-300 border border-emerald-200/90 dark:border-emerald-800/60 hover:border-emerald-300 dark:hover:border-emerald-700 transition-all cursor-pointer shrink-0 group">
                            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="max-w-[160px] truncate">{docMeta.facilityType}</span>
                            {docMeta.conditionStatus && (
                              <span className="font-normal text-emerald-800 dark:text-emerald-300/80">
                                • {getConditionStatusLabel(docMeta.conditionStatus)}
                              </span>
                            )}
                            <Edit3 className="w-2.5 h-2.5 text-emerald-700/60 dark:text-emerald-400/60 group-hover:text-emerald-900 dark:group-hover:text-emerald-200 ml-0.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openManualMetadataModal(slot, master, primaryAtt)}
                            title="Klik untuk mengisi jenis & kondisi fasilitas pada foto ini"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200/80 dark:bg-surface-subtle dark:hover:bg-surface text-zinc-700 dark:text-ink-secondary border border-zinc-200 dark:border-stroke hover:border-zinc-300 dark:hover:border-stroke transition-all cursor-pointer shrink-0 group">
                            <span>Detail fasilitas belum diisi</span>
                            <Edit3 className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-ink ml-0.5" />
                          </button>
                        )
                      ) : hasUploaded && activeMetaCategory === 'DIGITAL_SYSTEM' ? (
                        docMeta?.systemName ? (
                          <button
                            type="button"
                            onClick={() => openManualMetadataModal(slot, master, primaryAtt)}
                            title={`Sistem/Kanal: ${docMeta.systemName}${docMeta.url ? ` (${docMeta.url})` : ''} (Klik untuk edit metadata sistem)`}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-sky-50 hover:bg-sky-100 dark:bg-sky-950/40 dark:hover:bg-sky-900/50 text-sky-900 dark:text-sky-300 border border-sky-200/90 dark:border-sky-800/60 hover:border-sky-300 dark:hover:border-sky-700 transition-all cursor-pointer shrink-0 group">
                            <CheckCircle2 className="w-2.5 h-2.5 text-sky-600 dark:text-sky-400" />
                            <span className="max-w-[160px] truncate">{docMeta.systemName}</span>
                            {docMeta.operationalStatus && (
                              <span className="font-normal text-sky-800 dark:text-sky-300/80">
                                • {getOperationalStatusLabel(docMeta.operationalStatus)}
                              </span>
                            )}
                            <Edit3 className="w-2.5 h-2.5 text-sky-700/60 dark:text-sky-400/60 group-hover:text-sky-900 dark:group-hover:text-sky-200 ml-0.5" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openManualMetadataModal(slot, master, primaryAtt)}
                            title="Klik untuk mengisi nama kanal/sistem & status operasional"
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200/80 dark:bg-surface-subtle dark:hover:bg-surface text-zinc-700 dark:text-ink-secondary border border-zinc-200 dark:border-stroke hover:border-zinc-300 dark:hover:border-stroke transition-all cursor-pointer shrink-0 group">
                            <span>Detail kanal belum diisi</span>
                            <Edit3 className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-ink ml-0.5" />
                          </button>
                        )
                      ) : detectedYear ? (
                        <button
                          type="button"
                          onClick={() => openManualMetadataModal(slot, master, primaryAtt)}
                          title={
                            docNumber
                              ? `Nomor SK: ${docNumber} (Klik untuk edit tahun & nomor SK)`
                              : 'Klik untuk edit tahun & nomor SK'
                          }
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-900 dark:text-amber-300 border border-amber-200/90 dark:border-amber-800/60 hover:border-amber-300 dark:hover:border-amber-700 transition-all cursor-pointer shrink-0 group">
                          <Calendar className="w-2.5 h-2.5 text-amber-700 dark:text-amber-400" />
                          <span>Tahun {detectedYear}</span>
                          {docNumber && (
                            <span className="font-normal text-amber-800 dark:text-amber-300/80 max-w-[130px] truncate">
                              • {docNumber}
                            </span>
                          )}
                          <Edit3 className="w-2.5 h-2.5 text-amber-700/60 dark:text-amber-400/60 group-hover:text-amber-900 dark:group-hover:text-amber-200 ml-0.5" />
                        </button>
                      ) : hasUploaded ? (
                        <button
                          type="button"
                          onClick={() => openManualMetadataModal(slot, master, primaryAtt)}
                          title="Klik untuk mengisi tahun & nomor SK secara manual"
                          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 hover:bg-zinc-200/80 dark:bg-surface-subtle dark:hover:bg-surface text-zinc-700 dark:text-ink-secondary border border-zinc-200 dark:border-stroke hover:border-zinc-300 dark:hover:border-stroke transition-all cursor-pointer shrink-0 group">
                          <span>Tahun belum tercatat</span>
                          <Edit3 className="w-2.5 h-2.5 text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-700 dark:group-hover:text-ink ml-0.5" />
                        </button>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {hasUploaded && (
                        <>
                          {isAdmin && (
                            <button
                              type="button"
                              disabled={extractingSlotKey === slot.slotKey}
                              onClick={() => handleExtractMetadata(master?.id, slot.slotKey)}
                              title={
                                activeMetaCategory === 'PHYSICAL_FACILITY'
                                  ? 'Identifikasi jenis & kondisi fasilitas otomatis dengan AI Vision'
                                  : activeMetaCategory === 'DIGITAL_SYSTEM'
                                    ? 'Identifikasi sistem & status kanal otomatis dengan AI Vision'
                                    : 'Ekstrak Tahun & Nomor SK menggunakan AI Vision'
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold border border-purple-200 dark:border-purple-800/60 bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/40 dark:hover:bg-purple-900/50 text-purple-900 dark:text-purple-300 transition-colors cursor-pointer disabled:opacity-50">
                              {extractingSlotKey === slot.slotKey ? (
                                <Loader2 className="w-3 h-3 animate-spin text-purple-600 dark:text-purple-400" />
                              ) : (
                                <Sparkles className="w-3 h-3 text-purple-600 dark:text-purple-400" />
                              )}
                              <span className="hidden sm:inline">Ekstrak AI</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => openManualMetadataModal(slot, master, primaryAtt)}
                            title={
                              activeMetaCategory === 'PHYSICAL_FACILITY'
                                ? 'Edit Jenis, Kondisi & Lokasi Fasilitas'
                                : activeMetaCategory === 'DIGITAL_SYSTEM'
                                  ? 'Edit Nama Kanal, URL & Status Sistem Digital'
                                  : 'Edit Tahun & Nomor Dokumen secara Manual'
                            }
                            className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border border-stroke/60 bg-surface-subtle hover:bg-surface-hover text-ink-secondary hover:text-ink transition-colors cursor-pointer">
                            <Edit3 className="w-3 h-3 text-ink-muted" />
                            <span className="hidden sm:inline">Edit Metadata</span>
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() =>
                          setOpenAccordionKey(isAccordionOpen ? null : slot.slotKey)
                        }
                        title="Riwayat Unggahan"
                        className="px-2.5 py-1 rounded-lg border border-stroke/60 bg-surface-subtle hover:bg-surface-hover text-ink text-[11px] font-medium inline-flex items-center gap-1 transition-all cursor-pointer">
                        <History className="w-3 h-3 text-ink-muted" />
                        <span>{historyCount}</span>
                        {isAccordionOpen ? (
                          <ChevronUp className="w-3 h-3 text-ink-muted" />
                        ) : (
                          <ChevronDown className="w-3 h-3 text-ink-muted" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Short Description */}
                  <p className="text-xs text-ink-secondary leading-snug">{slot.description}</p>

                  {/* Baris Pintasan Panduan Bukti Dukung & Contoh Format per Indikator/Slot */}
                  {(checklistItems.length > 0 || exampleUrls.length > 0) && (
                    <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                      {checklistItems.length > 0 && (
                        <button
                          type="button"
                          onClick={() =>
                            setOpenGuideSlotKey(isGuideOpen ? null : slot.slotKey)
                          }
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-colors cursor-pointer ${
                            isGuideOpen
                              ? 'bg-brand-light text-brand border-brand/30'
                              : 'bg-surface-subtle/70 hover:bg-surface-subtle text-ink-secondary border-stroke/50'
                          }`}>
                          <Info className="w-3 h-3 text-brand shrink-0" />
                          <span>Panduan &amp; Kriteria ({checklistItems.length})</span>
                          {isGuideOpen ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      )}

                      {exampleUrls.length > 0 && (
                        <ExampleFormatDropdown urls={exampleUrls} size="md" />
                      )}
                    </div>
                  )}

                  {/* Box Detail Panduan & Checklist Indikator (Saat Dibuka) */}
                  {isGuideOpen && (
                    <div className="p-2.5 rounded-lg bg-brand-light/30 border border-brand/20 space-y-1.5 text-xs animate-in fade-in duration-150">
                      <div className="font-semibold text-[11px] text-ink flex items-center gap-1.5">
                        <BookOpen className="w-3 h-3 text-brand shrink-0" />
                        <span>Kriteria Wajib Dokumen Bukti Dukung:</span>
                      </div>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-ink-secondary pl-1">
                        {checklistItems.map((item, idx) => (
                          <li key={idx} className="leading-snug">
                            {item}
                          </li>
                        ))}
                      </ul>
                      {indicatorNums.length > 0 && (
                        <div className="pt-1 border-t border-brand/15 space-y-1">
                          {indicatorNums.map((qNo) => {
                            const q = f01QuestionMap.get(qNo)
                            if (!q) return null
                            return (
                              <div key={qNo} className="text-[11px] text-ink-muted">
                                <strong className="text-ink-secondary">Q{qNo}:</strong> {q.topic}
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tombol Unggah Menonjol & Ramah Pengguna Saat Slot Masih Kosong */}
                  {!hasUploaded && (
                    <div className="pt-1">
                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => handleOpenUploadModal(slot)}
                        className="w-full flex items-center justify-between p-3 rounded-xl border border-dashed border-brand/40 hover:border-brand bg-brand-light/20 hover:bg-brand-light/40 dark:bg-brand/5 dark:hover:bg-brand/10 transition-all cursor-pointer group shadow-2xs text-left">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
                            {isUploading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <UploadCloud className="w-4 h-4" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-xs text-ink group-hover:text-brand transition-colors">
                              {isUploading ? 'Sedang membuka pengunggahan...' : 'Unggah Bukti Dukung'}
                            </div>
                            <p className="text-[11px] text-ink-muted truncate">
                              {rule.allowedDocumentType === 'IMAGE_ONLY'
                                ? `Pilih foto bukti dukung (Maks. ${maxCount} foto @${rule.maxImageSizeMb ?? rule.maxFileSizeMb ?? 3}MB)`
                                : rule.allowedDocumentType === 'PDF_ONLY'
                                  ? `Pilih dokumen PDF resmi (Maks. ${maxCount} berkas @${rule.maxPdfSizeMb ?? rule.maxFileSizeMb ?? 20}MB)`
                                  : `Pilih dokumen PDF atau foto (Maks. ${maxCount} berkas)`}
                            </p>
                          </div>
                        </div>

                        <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand text-white text-xs font-semibold shadow-2xs group-hover:bg-brand-hover transition-colors shrink-0">
                          <Plus className="w-3.5 h-3.5" />
                          <span>Pilih Berkas</span>
                        </span>
                      </button>
                    </div>
                  )}

                  {/* Attached Files List */}
                  {attachments.length > 0 && (
                    <div className="pt-2 border-t border-stroke/30 space-y-1.5">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {attachments.map((att, attIdx) => {
                          const isPdf =
                            att.fileType === 'PDF' ||
                            att.fileName.toLowerCase().endsWith('.pdf')
                          const isImg =
                            att.fileType === 'IMAGE' ||
                            /\.(jpe?g|png|webp|gif|svg)$/i.test(att.fileName)
                          const formattedSize = att.fileSize
                            ? att.fileSize > 1024 * 1024
                              ? `${(att.fileSize / (1024 * 1024)).toFixed(1)} MB`
                              : `${Math.round(att.fileSize / 1024)} KB`
                            : null

                          return (
                            <div
                              key={att.id || attIdx}
                              className="flex items-center justify-between px-2.5 py-1.5 rounded-lg border border-stroke/50 bg-surface-subtle/50 hover:bg-surface-subtle transition-colors gap-1.5 text-xs">
                              <a
                                href={formatFileUrl(att.fileUrl)}
                                target="_blank"
                                rel="noreferrer"
                                title={`Buka ${att.fileName}`}
                                className="flex items-center gap-1.5 min-w-0 flex-1 group/item hover:opacity-80 transition-opacity">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                                    isPdf
                                      ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                      : isImg
                                        ? 'bg-sky-100 text-sky-800 border border-sky-200'
                                        : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  }`}>
                                  {isPdf ? 'PDF' : isImg ? 'FOTO' : 'DOK'}
                                </span>
                                <div className="min-w-0">
                                  <p
                                    className="font-medium text-ink truncate group-hover/item:text-brand transition-colors text-xs"
                                    title={att.fileName}>
                                    {att.fileName}
                                  </p>
                                  <div className="flex items-center gap-1 text-[10px] text-ink-muted font-normal flex-wrap">
                                    <span className="font-semibold text-ink-secondary">
                                      v{att.version || 1}
                                    </span>
                                    {formattedSize && (
                                      <>
                                        <span>•</span>
                                        <span>{formattedSize}</span>
                                      </>
                                    )}
                                    {att.metadata?.facilityType && (
                                      <>
                                        <span>•</span>
                                        <span className="text-emerald-700 dark:text-emerald-400 font-medium truncate max-w-[140px]">
                                          {att.metadata.facilityType}
                                        </span>
                                      </>
                                    )}
                                    {att.metadata?.systemName && (
                                      <>
                                        <span>•</span>
                                        <span className="text-sky-700 dark:text-sky-400 font-medium truncate max-w-[140px]">
                                          {att.metadata.systemName}
                                        </span>
                                      </>
                                    )}
                                    {att.versions && att.versions.length > 0 && (
                                      <>
                                        <span>•</span>
                                        <span className="text-brand font-medium">
                                          +{att.versions.length} versi
                                        </span>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </a>

                              <div className="relative shrink-0 flex items-center gap-0.5" data-attachment-dropdown>
                                {/* Tombol Salin Tautan Satuan Berkas */}
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleCopyFileLink(att)
                                  }}
                                  title={`Salin tautan berkas "${att.fileName}"`}
                                  className={`p-1 rounded-md transition-colors cursor-pointer border ${
                                    copiedFileId === att.id
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                      : 'text-ink-muted hover:text-brand hover:bg-surface-elevated border-transparent hover:border-stroke/50'
                                  }`}>
                                  {copiedFileId === att.id ? (
                                    <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-75 duration-150" />
                                  ) : (
                                    <Copy className="w-3.5 h-3.5" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setOpenDropdownAttId(
                                      openDropdownAttId === att.id ? null : att.id
                                    )
                                  }
                                  className={`p-1 rounded-md transition-colors cursor-pointer border ${
                                    openDropdownAttId === att.id
                                      ? 'bg-surface-elevated text-ink border-stroke shadow-xs'
                                      : 'text-ink-muted hover:text-ink hover:bg-surface-elevated border-transparent hover:border-stroke/50'
                                  }`}
                                  title="Pilihan Berkas">
                                  <MoreVertical className="w-3.5 h-3.5" />
                                </button>

                                {/* Dropdown Menu */}
                                {openDropdownAttId === att.id && (
                                  <div className="absolute right-0 top-full mt-1 w-44 z-30 bg-surface rounded-xl border border-stroke/70 shadow-lg py-1 text-xs animate-in fade-in zoom-in-95 duration-150">
                                    <div className="px-3 py-1 border-b border-stroke/40 text-[10px] text-ink-muted flex items-center justify-between">
                                      <span>Versi Aktif</span>
                                      <span className="font-semibold text-ink">
                                        v{att.version || 1}
                                      </span>
                                    </div>

                                    <div className="p-1 space-y-0.5">
                                      <a
                                        href={formatFileUrl(att.fileUrl)}
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
                                          handleCopyFileLink(att)
                                        }}
                                        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-ink hover:bg-surface-subtle transition-colors group cursor-pointer text-[11px] font-medium text-left">
                                        <Copy className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand" />
                                        <span>Salin Tautan Berkas</span>
                                      </button>

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

                                      <button
                                        type="button"
                                        onClick={() => {
                                          setOpenDropdownAttId(null)
                                          openManualMetadataModal(slot, master, att)
                                        }}
                                        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-ink hover:bg-surface-subtle transition-colors group cursor-pointer text-[11px] font-medium text-left">
                                        <Edit3 className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand" />
                                        <span>Edit Metadata</span>
                                      </button>

                                      {(att.fileType === 'IMAGE' ||
                                        att.fileType === 'PDF' ||
                                        att.fileName.toLowerCase().endsWith('.pdf') ||
                                        /\.(jpe?g|png|webp)$/i.test(att.fileName)) && (
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

                                      <div className="h-px bg-stroke/40 my-1" />
                                      <button
                                        type="button"
                                        disabled={isUploading}
                                        onClick={() => {
                                          setOpenDropdownAttId(null)
                                          setDeleteAttachmentTarget({
                                            slot,
                                            attachmentId: att.id,
                                            fileName: att.fileName
                                          })
                                        }}
                                        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors group cursor-pointer text-[11px] font-medium text-left">
                                        <Trash2 className="w-3.5 h-3.5 text-rose-500 group-hover:text-rose-700" />
                                        <span>Hapus Berkas</span>
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        })}

                        {/* Tombol Tambah Berkas Compact */}
                        {canAddMore && (
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => handleOpenUploadModal(slot)}
                            className="flex items-center justify-center px-2.5 py-1.5 rounded-lg border border-dashed border-stroke/80 bg-surface-subtle/30 hover:bg-surface-subtle/80 hover:border-brand/60 transition-all gap-1.5 text-xs text-ink-secondary hover:text-brand cursor-pointer group min-h-[42px]">
                            {isUploading ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-brand" />
                                <span className="font-medium text-xs">Mengunggah...</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand transition-colors" />
                                <span className="font-medium text-xs">Tambah Berkas</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Compact Footer Row */}
                <div className="pt-2 border-t border-stroke/40 flex items-center justify-between gap-2 text-[11px] text-ink-muted flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {!hasUploaded ? (
                      <span className="font-normal text-ink-muted">Belum Ada</span>
                    ) : (
                      <span className="font-medium text-emerald-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                        {attachments.length}/{maxCount} Berkas
                      </span>
                    )}

                    <span className="text-stroke">•</span>

                    <span className="font-normal text-ink-muted">
                      {rule.allowedDocumentType === 'IMAGE_ONLY'
                        ? `Foto (Maks. ${maxCount} @${rule.maxImageSizeMb ?? rule.maxFileSizeMb ?? 3}MB)`
                        : rule.allowedDocumentType === 'PDF_ONLY'
                          ? `PDF (Maks. ${maxCount} @${rule.maxPdfSizeMb ?? rule.maxFileSizeMb ?? 20}MB)`
                          : `Hybrid (Maks. ${maxCount} • PDF @${rule.maxPdfSizeMb ?? 20}MB, Foto @${rule.maxImageSizeMb ?? 3}MB)`}
                    </span>
                  </div>

                  {hasUploaded && (
                    <button
                      type="button"
                      disabled={isUploading}
                      onClick={() => setDeleteSlotTarget(slot)}
                      className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-rose-600 transition-colors cursor-pointer py-0.5 px-1 rounded hover:bg-rose-50/70"
                      title="Hapus semua berkas pada slot ini">
                      <Trash2 className="w-3 h-3 text-ink-muted hover:text-rose-600" />
                      <span>Hapus Semua</span>
                    </button>
                  )}
                </div>

                {/* Compact History Accordion Body */}
                {isAccordionOpen && (
                  <div className="p-3 bg-surface-subtle/70 rounded-xl border border-stroke/40 space-y-1.5 text-xs">
                    <div className="font-medium text-[11px] text-ink flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-ink-muted" />
                      <span>Riwayat Berkas:</span>
                    </div>

                    {historyList.length === 0 ? (
                      <p className="text-ink-muted italic text-[11px] pl-4">
                        Belum ada riwayat unggahan.
                      </p>
                    ) : (
                      <div className="divide-y divide-stroke/30 bg-surface rounded-lg border border-stroke/40 overflow-hidden max-h-44 overflow-y-auto">
                        {historyList.map((h: any, i: number) => (
                          <div
                            key={h.id || i}
                            className="px-3 py-2 flex items-center justify-between gap-2 text-[11px]">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-ink uppercase">
                                  {h.action}
                                </span>
                                <span className="text-ink-secondary">
                                  • {h.actorName || 'Petugas'}
                                </span>
                                {h.timestamp && (
                                  <span className="text-ink-muted">
                                    ({new Date(h.timestamp).toLocaleString('id-ID')})
                                  </span>
                                )}
                              </div>
                              {h.note && <p className="text-ink-secondary">{h.note}</p>}
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

      {/* B. Dokumen Tambahan (Opsional) - Compact */}
      <div className="space-y-2.5 pt-2 border-t border-stroke/60">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-semibold text-xs sm:text-sm text-ink">
              Dokumen Tambahan (Opsional)
            </h2>
            <p className="text-[11px] text-ink-muted">
              Sertifikat, SK Pokja, atau berkas pendukung lain pada aspek ini.
            </p>
          </div>

          {!showAddCustom && (
            <button
              type="button"
              onClick={() => setShowAddCustom(true)}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium shadow-hz-button transition-all cursor-pointer shrink-0">
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Dokumen</span>
            </button>
          )}
        </div>

        {showAddCustom && (
          <form
            onSubmit={handleAddCustomSlot}
            className="p-3.5 rounded-xl border border-stroke/60 bg-surface space-y-2.5 text-xs shadow-2xs">
            <div className="flex items-center justify-between border-b border-stroke/40 pb-1.5">
              <h3 className="font-semibold text-xs text-ink">
                Tambah Berkas Pendukung Tambahan
              </h3>
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="text-ink-muted hover:text-ink font-medium cursor-pointer text-xs">
                Batal
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="space-y-1">
                <label className="font-medium text-ink">Nama Dokumen:</label>
                <input
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="e.g. Sertifikat Akreditasi / ISO"
                  className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-stroke bg-surface text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-ink">Tipe Berkas:</label>
                <div className="flex items-center gap-3 pt-1.5">
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-ink">
                    <input
                      type="radio"
                      name="masterCustomDocType"
                      checked={customDocType === 'PDF'}
                      onChange={() => setCustomDocType('PDF')}
                    />
                    <span>PDF / DOCX</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-ink">
                    <input
                      type="radio"
                      name="masterCustomDocType"
                      checked={customDocType === 'IMAGE'}
                      onChange={() => setCustomDocType('IMAGE')}
                    />
                    <span>Foto (JPG/PNG)</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <label className="font-medium text-ink">Pilih Berkas:</label>
              <input
                type="file"
                onChange={(e) => setCustomFile(e.target.files?.[0] || null)}
                accept={
                  customDocType === 'IMAGE'
                    ? '.png,.jpg,.jpeg,.webp,image/*'
                    : '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                }
                className="w-full text-xs text-ink file:mr-2.5 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-medium file:bg-surface-subtle file:text-ink cursor-pointer"
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowAddCustom(false)}
                className="px-3 py-1 rounded-lg border border-stroke/60 text-xs font-medium text-ink-secondary hover:bg-surface-subtle cursor-pointer">
                Batal
              </button>
              <button
                type="submit"
                className="px-3.5 py-1 rounded-lg bg-brand text-white text-xs font-medium hover:bg-brand-hover shadow-hz-button cursor-pointer inline-flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Unggah &amp; Buka Studio Sensor</span>
              </button>
            </div>
          </form>
        )}

        {customRecordsInAspect.length === 0 ? (
          <div className="p-3.5 text-center rounded-xl border border-dashed border-stroke/60 bg-surface-subtle/30 text-ink-muted text-xs">
            Belum ada dokumen tambahan untuk Aspek{' '}
            {ASPECTS.find((a) => a.code === activeAspect)?.name || activeAspect}.
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5'
                : 'space-y-2'
            }>
            {customRecordsInAspect.map((customRec) => {
              const slotView: SlotItemView = {
                slotKey: customRec.slotKey,
                title: customRec.title,
                isMandatory: false
              }
              return (
                <div
                  key={customRec.id}
                  className="px-3.5 py-2.5 rounded-xl border border-stroke/50 bg-surface hover:border-stroke shadow-2xs flex items-center justify-between gap-3 transition-all">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-medium text-ink-secondary bg-surface-subtle border border-stroke/50">
                        Tambahan
                      </span>
                      <h4 className="font-medium text-xs text-ink truncate">
                        {customRec.title}
                      </h4>
                    </div>
                    <p className="text-[11px] text-ink-muted">
                      {customRec.attachments.length} berkas • Diunggah{' '}
                      {customRec.uploaderName || 'Admin OPD'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleCopyCustomRecordLink(customRec)}
                      className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        copiedCustomId === customRec.id
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          : 'bg-surface-subtle hover:bg-surface-hover text-ink-muted hover:text-brand border-stroke/60'
                      }`}
                      title={`Salin tautan berkas "${customRec.title}"`}>
                      {copiedCustomId === customRec.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-600 animate-in zoom-in-75 duration-150" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <a
                      href={formatFileUrl(customRec.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 rounded-lg bg-surface-subtle hover:bg-surface-hover text-ink font-medium text-xs inline-flex items-center gap-1 transition-all border border-stroke/60">
                      <span>Buka</span>
                      <ExternalLink className="w-3 h-3 text-ink-muted" />
                    </a>

                    <button
                      type="button"
                      onClick={() => setDeleteSlotTarget(slotView)}
                      className="p-1 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                      title="Hapus berkas tambahan">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ===================================================================== */}
      {/* MODAL KONFIRMASI                                                      */}
      {/* ===================================================================== */}
      <ConfirmationModal
        isOpen={Boolean(deleteSlotTarget)}
        onCancel={() => !isDeleting && setDeleteSlotTarget(null)}
        onConfirm={handleConfirmDeleteSlot}
        loading={isDeleting}
        variant="danger"
        title="Hapus Semua Berkas Slot"
        description={`Hapus seluruh berkas pada slot "${deleteSlotTarget?.title || ''}" dari Master Bukti Dukung? Berkas pada snapshot tahun penilaian yang telah ditutup tetap aman.`}
        confirmText="Hapus Berkas"
      />

      <ConfirmationModal
        isOpen={Boolean(deleteAttachmentTarget)}
        onCancel={() => !isDeleting && setDeleteAttachmentTarget(null)}
        onConfirm={handleConfirmDeleteAttachment}
        loading={isDeleting}
        variant="danger"
        title="Hapus Berkas"
        description={`Hapus berkas "${deleteAttachmentTarget?.fileName || ''}" dari slot "${deleteAttachmentTarget?.slot.title || ''}" di Master Bukti Dukung?`}
        confirmText="Hapus Berkas"
      />

      <ConfirmationModal
        isOpen={Boolean(restoreVersionTarget)}
        zIndex="z-[99999]"
        onCancel={() => setRestoreVersionTarget(null)}
        onConfirm={handleConfirmRestoreVersion}
        loading={isRestoringVersion}
        variant="primary"
        title="Pakai Versi Ini"
        description={`Jadikan Versi ${restoreVersionTarget?.verNum || ''} sebagai berkas aktif utama di Master? Versi berkas yang sedang aktif saat ini akan tetap tersimpan di riwayat versi.`}
        confirmText="Ya, Jadikan Berkas Aktif"
      />

      <ConfirmationModal
        isOpen={Boolean(deleteVersionTarget)}
        zIndex="z-[99999]"
        onCancel={() => setDeleteVersionTarget(null)}
        onConfirm={handleConfirmDeleteVersion}
        loading={isDeletingVersion}
        variant="danger"
        title="Hapus Arsip Versi"
        description={`Hapus arsip Versi ${deleteVersionTarget?.verNum || ''} ("${deleteVersionTarget?.fileName || ''}") secara permanen dari Master?`}
        confirmText="Hapus Permanen"
      />

      {/* ===================================================================== */}
      {/* MODAL KELOLA VERSI BERKAS (GOOGLE DRIVE STYLE)                        */}
      {/* ===================================================================== */}
      <FormModal
        isOpen={Boolean(versionModalTarget)}
        onClose={() => setVersionModalTarget(null)}
        title="Kelola Versi Berkas"
        description="Perbarui berkas dengan versi lebih baru, atau pulihkan versi lampau seperti Google Drive."
        icon={<RotateCcw className="w-4 h-4" />}
        maxWidth="xl"
        zIndex="z-[9999]"
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setVersionModalTarget(null)}>
              Tutup
            </Button>
          </div>
        }>
        {versionModalTarget && (
          <div className="space-y-4">
            {/* Berkas Aktif Saat Ini */}
            <div className="p-3.5 rounded-xl border border-brand/30 bg-brand/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand text-white">
                    Versi Aktif (v{versionModalTarget.attachment.version || 1})
                  </span>
                  <span className="text-[11px] text-ink-muted">
                    Aktif di Master Bukti Dukung
                  </span>
                </div>
                <a
                  href={formatFileUrl(versionModalTarget.attachment.fileUrl)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
                  <span>Buka Berkas</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div
                className="text-xs font-medium text-ink truncate"
                title={versionModalTarget.attachment.fileName}>
                {versionModalTarget.attachment.fileName}
              </div>

              <div className="flex items-center gap-3 text-[11px] text-ink-muted">
                <span>
                  Diunggah:{' '}
                  {new Date(
                    versionModalTarget.attachment.uploadedAt
                  ).toLocaleString('id-ID')}
                </span>
                {versionModalTarget.attachment.uploaderName && (
                  <span>• Oleh: {versionModalTarget.attachment.uploaderName}</span>
                )}
                {versionModalTarget.attachment.fileSize ? (
                  <span>
                    •{' '}
                    {versionModalTarget.attachment.fileSize > 1024 * 1024
                      ? `${(versionModalTarget.attachment.fileSize / (1024 * 1024)).toFixed(1)} MB`
                      : `${Math.round(versionModalTarget.attachment.fileSize / 1024)} KB`}
                  </span>
                ) : null}
              </div>
            </div>

            {/* Unggah Versi Baru Action */}
            <div className="p-3 rounded-xl border border-dashed border-line bg-surface-subtle/40 flex items-center justify-between gap-3">
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
                  accept={(() => {
                    if (!versionModalTarget) return '.pdf,.png,.jpg,.jpeg,.webp,.docx'
                    const r = getRule(versionModalTarget.slot.slotKey, versionModalTarget.slot.documentType)
                    if (r.allowedDocumentType === 'IMAGE_ONLY') return '.png,.jpg,.jpeg,.webp,image/*'
                    if (r.allowedDocumentType === 'PDF_ONLY') return '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    return '.pdf,.doc,.docx,application/pdf,image/*,.png,.jpg,.jpeg,.webp'
                  })()}
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

            {/* Daftar Riwayat Versi Lampau */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-ink-muted" />
                <span>
                  Riwayat Versi Sebelumnya (
                  {versionModalTarget.attachment.versions?.length || 0})
                </span>
              </h4>

              {!versionModalTarget.attachment.versions ||
              versionModalTarget.attachment.versions.length === 0 ? (
                <div className="p-4 text-center rounded-xl border border-line bg-surface-subtle/30 text-[11px] text-ink-muted italic">
                  Belum ada versi sebelumnya untuk berkas ini. Setiap kali Anda mengunggah versi baru, versi lama akan dicatat di sini.
                </div>
              ) : (
                <div className="divide-y divide-line/60 bg-surface rounded-xl border border-line overflow-hidden shadow-2xs">
                  {versionModalTarget.attachment.versions.map((ver) => (
                    <div
                      key={ver.id}
                      className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-surface-subtle/40 transition-colors">
                      <div className="min-w-0 flex-1 space-y-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-surface-subtle text-ink-secondary border border-line shrink-0">
                            v{ver.version}
                          </span>
                          <span
                            className="font-medium text-ink truncate text-xs"
                            title={ver.fileName}>
                            {ver.fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-ink-muted flex-wrap">
                          <span>{new Date(ver.uploadedAt).toLocaleString('id-ID')}</span>
                          {ver.uploaderName && (
                            <span className="truncate max-w-[150px]">
                              • {ver.uploaderName}
                            </span>
                          )}
                          {ver.fileSize ? (
                            <span>
                              •{' '}
                              {ver.fileSize > 1024 * 1024
                                ? `${(ver.fileSize / (1024 * 1024)).toFixed(1)} MB`
                                : `${Math.round(ver.fileSize / 1024)} KB`}
                            </span>
                          ) : null}
                          {ver.note && (
                            <span
                              className="italic text-ink-secondary truncate max-w-[180px]"
                              title={ver.note}>
                              • {ver.note}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <a
                          href={formatFileUrl(ver.fileUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-ink-secondary hover:text-ink bg-surface hover:bg-surface-subtle rounded-lg border border-line transition-colors shadow-2xs"
                          title="Buka berkas versi ini">
                          <span>Lihat</span>
                          <ExternalLink className="w-3 h-3 text-ink-muted" />
                        </a>

                        <button
                          type="button"
                          disabled={
                            isUploadingVersion ||
                            isRestoringVersion ||
                            isDeletingVersion
                          }
                          onClick={() =>
                            setRestoreVersionTarget({
                              targetVersionId: ver.id,
                              verNum: ver.version
                            })
                          }
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
                          disabled={
                            isUploadingVersion ||
                            isRestoringVersion ||
                            isDeletingVersion
                          }
                          onClick={() =>
                            setDeleteVersionTarget({
                              targetVersionId: ver.id,
                              verNum: ver.version,
                              fileName: ver.fileName
                            })
                          }
                          className="p-1 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/30 transition-colors cursor-pointer disabled:opacity-50"
                          title="Hapus permanen arsip versi ini">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </FormModal>

      {/* ===================================================================== */}
      {/* MODAL TAMBAH BERKAS (DROPZONE & FILE PICKER + PANDUAN + STUDIO SENSOR)*/}
      {/* ===================================================================== */}
      {(() => {
        const modalRule = uploadModalSlot
          ? getRule(uploadModalSlot.slotKey, uploadModalSlot.documentType)
          : null
        const existingSlotRec = uploadModalSlot
          ? recordMap.get(`${activeAspect}::${uploadModalSlot.slotKey}`)
          : undefined
        const existingCount = existingSlotRec?.attachments?.length || 0
        const maxTotal = modalRule?.maxTotalFiles || 10
        const remainingQuota = Math.max(
          0,
          maxTotal - existingCount - pickedFilesForUpload.length
        )
        const formatLabel = !modalRule
          ? ''
          : modalRule.allowedDocumentType === 'IMAGE_ONLY'
            ? `Khusus Foto (JPG, PNG, WEBP • Maks. ${modalRule.maxImageSizeMb ?? modalRule.maxFileSizeMb ?? 3} MB/berkas)`
            : modalRule.allowedDocumentType === 'PDF_ONLY'
              ? `Khusus Dokumen (PDF, DOCX • Maks. ${modalRule.maxPdfSizeMb ?? modalRule.maxFileSizeMb ?? 20} MB/berkas)`
              : `Hybrid (PDF @${modalRule.maxPdfSizeMb ?? 20}MB • Foto @${modalRule.maxImageSizeMb ?? 3}MB)`

        return (
          <FormModal
            isOpen={Boolean(uploadModalSlot)}
            onClose={() => {
              setUploadModalSlot(null)
              setPickedFilesForUpload([])
              setRedactedQueueIndices([])
            }}
            title="Unggah Bukti Dukung Master"
            description={uploadModalSlot?.title}
            icon={<UploadCloud className="w-4 h-4" />}
            maxWidth="xl"
            zIndex="z-[9999]"
            headerActions={
              uploadModalSlot?.indicatorNumbers &&
              uploadModalSlot.indicatorNumbers.length > 0 ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-brand/10 border border-brand/20 text-[10px] font-bold text-brand shrink-0">
                  Indikator{' '}
                  {uploadModalSlot.indicatorNumbers.map((n) => `Q${n}`).join(', ')}
                </span>
              ) : null
            }
            footer={
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    setUploadModalSlot(null)
                    setPickedFilesForUpload([])
                    setRedactedQueueIndices([])
                  }}>
                  Batal
                </Button>

                <div className="flex items-center gap-2">
                  {pickedFilesForUpload.length === 1 && (
                    <button
                      type="button"
                      onClick={handleProceedToRedactionOrUpload}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 text-xs font-semibold transition-all cursor-pointer">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>Buka Studio Sensor</span>
                    </button>
                  )}

                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={pickedFilesForUpload.length === 0}
                    onClick={handleUploadAllPickedFiles}
                    className="gap-1.5">
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>
                      {pickedFilesForUpload.length > 1
                        ? `Unggah Semua (${pickedFilesForUpload.length} Berkas)`
                        : 'Unggah Berkas'}
                    </span>
                  </Button>
                </div>
              </div>
            }>
            {uploadModalSlot && modalRule && (
              <div className="space-y-3.5">
                {/* Panduan & Kriteria Bukti Dukung (Collapsible - Default Collapsed) */}
                <div className="rounded-xl bg-surface-subtle/60 border border-line overflow-hidden transition-all">
                  <div className="p-3 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsModalGuideOpen((prev) => !prev)}
                      className="flex items-center gap-2 text-left cursor-pointer flex-1 min-w-0 group">
                      <BookOpen className="w-3.5 h-3.5 text-brand shrink-0" />
                      <span className="text-xs font-semibold text-ink group-hover:text-brand transition-colors">
                        Panduan &amp; Kriteria Bukti Dukung
                      </span>
                      {isModalGuideOpen ? (
                        <ChevronUp className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                      )}
                    </button>

                    {(() => {
                      const examples =
                        uploadModalSlot.exampleImages &&
                        uploadModalSlot.exampleImages.length > 0
                          ? uploadModalSlot.exampleImages
                          : []
                      return <ExampleFormatDropdown urls={examples} size="sm" />
                    })()}
                  </div>

                  {/* Body Collapsible */}
                  {isModalGuideOpen && (
                    <div className="px-3 pb-3 pt-0 space-y-2 border-t border-line/60 animate-in fade-in duration-150">
                      <p className="text-[11px] text-ink-secondary leading-relaxed pt-2">
                        {uploadModalSlot.description}
                      </p>

                      {uploadModalSlot.guideChecklist &&
                        uploadModalSlot.guideChecklist.length > 0 && (
                          <div className="pt-1.5 border-t border-line/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                              Poin Wajib yang Harus Tercantum:
                            </p>
                            <ul className="space-y-1">
                              {uploadModalSlot.guideChecklist.map((item, idx) => (
                                <li
                                  key={idx}
                                  className="flex items-start gap-1.5 text-[11px] text-ink-secondary leading-snug">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                                  <span>{item}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}

                      {uploadModalSlot.indicatorNumbers &&
                        uploadModalSlot.indicatorNumbers.length > 0 && (
                          <div className="pt-1.5 border-t border-line/60">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-ink-muted mb-1">
                              Keterkaitan Indikator Evaluasi F-01:
                            </p>
                            <div className="space-y-1">
                              {uploadModalSlot.indicatorNumbers.map((qNum) => {
                                const q = f01QuestionMap.get(qNum)
                                if (!q) return null
                                return (
                                  <div
                                    key={qNum}
                                    className="text-[10.5px] text-ink-secondary leading-snug flex items-start gap-1.5">
                                    <span className="font-mono font-bold text-brand shrink-0">
                                      Q{qNum}:
                                    </span>
                                    <span className="line-clamp-2">
                                      <strong className="font-medium text-ink">
                                        {q.topic}
                                      </strong>
                                      {q.bukti_dukung && q.bukti_dukung.length > 0
                                        ? ` — ${q.bukti_dukung.join(', ')}`
                                        : ''}
                                    </span>
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )}
                    </div>
                  )}
                </div>

                {/* Baris Info Kriteria Format & Sisa Kuota Slot */}
                <div className="flex items-center justify-between gap-2 flex-wrap px-3 py-2 rounded-xl bg-surface-subtle/70 border border-line text-[11px]">
                  <span className="text-ink-secondary font-medium">{formatLabel}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-bold text-[10px] border ${
                      remainingQuota === 0
                        ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700'
                        : 'bg-brand/10 text-brand border-brand/20'
                    }`}>
                    Kuota: {existingCount + pickedFilesForUpload.length}/{maxTotal} Berkas
                    {remainingQuota > 0 ? ` (Sisa ${remainingQuota})` : ' (Penuh)'}
                  </span>
                </div>

                <input
                  ref={modalFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  accept={(() => {
                    if (modalRule.allowedDocumentType === 'IMAGE_ONLY')
                      return '.png,.jpg,.jpeg,.webp,image/*'
                    if (modalRule.allowedDocumentType === 'PDF_ONLY')
                      return '.pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                    return '.pdf,.doc,.docx,application/pdf,image/*,.png,.jpg,.jpeg,.webp'
                  })()}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleSelectFilesInModal(e.target.files)
                      e.target.value = ''
                    }
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
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                      handleSelectFilesInModal(e.dataTransfer.files)
                    }
                  }}
                  onClick={() => {
                    if (remainingQuota <= 0) {
                      toast.warning(
                        `Batas maksimal ${maxTotal} berkas untuk slot ini telah tercapai.`
                      )
                      return
                    }
                    modalFileInputRef.current?.click()
                  }}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center text-center cursor-pointer ${
                    isDragOverUpload
                      ? 'border-brand bg-brand/10 scale-[1.01]'
                      : pickedFilesForUpload.length > 0
                        ? 'border-brand/60 bg-brand/5'
                        : 'border-line bg-surface-subtle/30 hover:bg-surface-subtle/60 hover:border-brand/40'
                  }`}>
                  <div className="w-9 h-9 rounded-xl bg-surface border border-line shadow-xs flex items-center justify-center mb-2 text-brand">
                    <UploadCloud className="w-4 h-4" />
                  </div>

                  <div className="space-y-0.5">
                    <p className="text-xs font-semibold text-ink">
                      {pickedFilesForUpload.length > 0
                        ? remainingQuota > 0
                          ? `Tambah Berkas Lagi (Bisa pilih hingga ${remainingQuota} berkas lagi)`
                          : 'Kuota Maksimal Berkas Tercapai'
                        : 'Pilih Banyak Berkas Sekaligus atau Tarik ke Sini'}
                    </p>
                    <p className="text-[11px] text-ink-muted">
                      Anda dapat memblok beberapa berkas dari komputer atau menyeretnya sekaligus ke area ini
                    </p>
                  </div>
                </div>

                {/* Daftar Antrean Berkas yang Dipilih */}
                {pickedFilesForUpload.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-ink">
                        Berkas Siap Diunggah ({pickedFilesForUpload.length} Berkas)
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setPickedFilesForUpload([])
                          setRedactedQueueIndices([])
                        }}
                        className="text-rose-600 hover:underline font-medium cursor-pointer text-[11px]">
                        Kosongkan Pilihan
                      </button>
                    </div>

                    <div className="divide-y divide-line/60 rounded-xl border border-line bg-surface-subtle/40 max-h-44 overflow-y-auto">
                      {pickedFilesForUpload.map((file, idx) => {
                        const isPdf =
                          file.type === 'application/pdf' ||
                          file.name.toLowerCase().endsWith('.pdf')
                        const isImg =
                          file.type.startsWith('image/') ||
                          /\.(jpe?g|png|webp|gif|bmp)$/i.test(file.name)
                        const canRedact = isPdf || isImg
                        const isRedacted = redactedQueueIndices.includes(idx)
                        const sizeStr =
                          file.size > 1024 * 1024
                            ? `${(file.size / (1024 * 1024)).toFixed(2)} MB`
                            : `${Math.round(file.size / 1024)} KB`

                        return (
                          <div
                            key={`${file.name}_${idx}`}
                            className="px-3 py-2 flex items-center justify-between gap-2 text-xs hover:bg-surface-subtle transition-colors">
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold shrink-0 border ${
                                  isPdf
                                    ? 'bg-rose-100 text-rose-800 border-rose-200'
                                    : isImg
                                      ? 'bg-sky-100 text-sky-800 border-sky-200'
                                      : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                                }`}>
                                {isPdf ? 'PDF' : isImg ? 'FOTO' : 'DOK'}
                              </span>
                              <div className="min-w-0 flex-1">
                                <p
                                  className="font-medium text-ink truncate text-xs"
                                  title={file.name}>
                                  {file.name}
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-ink-muted">
                                  <span>{sizeStr}</span>
                                  {isRedacted && (
                                    <span className="px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 font-semibold">
                                      ✓ Sudah Disensor
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1 shrink-0">
                              {canRedact && (
                                <button
                                  type="button"
                                  onClick={() => handleRedactFileInQueue(idx)}
                                  title="Buka Studio Sensor untuk menyensor data sensitif pada berkas ini"
                                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[10.5px] font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/25 transition-colors cursor-pointer">
                                  <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                                  <span>Sensor</span>
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemovePickedFile(idx)}
                                title="Hapus dari daftar unggah"
                                className="p-1 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer">
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Catatan Privasi / Sensor Data */}
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-amber-900 dark:text-amber-200 text-xs">
                  <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 leading-relaxed text-[11px]">
                    <p className="font-semibold text-amber-800 dark:text-amber-300">
                      Perlindungan Data Pribadi
                    </p>
                    <p>
                      Klik tombol <strong>Sensor</strong> pada berkas di atas jika ingin menutupi NIP, NIK, tanda tangan, atau informasi sensitif sebelum disimpan, atau langsung unggah sekaligus.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </FormModal>
        )
      })()}

      {/* ===================================================================== */}
      {/* REDACTION STUDIO MODAL (PRE-UPLOAD & POST-UPLOAD)                     */}
      {/* ===================================================================== */}
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
          fileType={
            preUploadRedactTarget.file.type.startsWith('image/') ? 'IMAGE' : 'PDF'
          }
          isPreUpload={true}
          rawFile={preUploadRedactTarget.file}
          onSaveRedacted={async (redactedFile) => {
            await handleSavePreUploadFile(redactedFile)
          }}
        />
      )}

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

      {/* ===================================================================== */}
      {/* MODAL EDUKASI: APA ITU MASTER BUKTI DUKUNG                            */}
      {/* ===================================================================== */}
      <FormModal
        isOpen={isInfoModalOpen}
        onClose={() => setIsInfoModalOpen(false)}
        title="Apa itu Master Bukti Dukung?"
        description="Panduan konsep repositori dokumen induk unit lokus"
        icon={<Info className="w-4 h-4" />}
        maxWidth="lg"
        zIndex="z-[9999]"
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setIsInfoModalOpen(false)}>
              Saya Mengerti
            </Button>
          </div>
        }>
        <div className="space-y-3 text-xs">
          {/* Poin 1: Bersifat Tetap & Melekat pada Lokus */}
          <div className="p-3 rounded-xl bg-surface-subtle/70 border border-line flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
              <FolderArchive className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-semibold text-xs text-ink">
                Dokumen Induk Tetap (Melekat pada Lokus)
              </h4>
              <p className="text-ink-secondary leading-relaxed text-[11px]">
                Master Bukti Dukung adalah repositori berkas utama milik unit lokus Anda. Dokumen yang tersimpan di sini <strong>bersifat tetap dan tidak terhapus</strong> saat pemerintah atau instansi berpindah ke tahun evaluasi berikutnya.
              </p>
            </div>
          </div>

          {/* Poin 2: Otomatis Diwariskan ke Evaluasi Berjalan */}
          <div className="p-3 rounded-xl bg-surface-subtle/70 border border-line flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 mt-0.5">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-semibold text-xs text-ink">
                Otomatis Diwariskan ke Tahun Aktif
              </h4>
              <p className="text-ink-secondary leading-relaxed text-[11px]">
                Ketika periode evaluasi baru dibuka, sistem secara otomatis menghubungkan dokumen aktif di Master Bukti ke lembar penilaian Anda. Anda <strong>tidak perlu mengunggah ulang</strong> dokumen yang sama setiap tahun.
              </p>
            </div>
          </div>

          {/* Poin 3: Manajemen Versi (Living Document) */}
          <div className="p-3 rounded-xl bg-surface-subtle/70 border border-line flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
              <History className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-semibold text-xs text-ink">
                Pembaruan &amp; Riwayat Versi
              </h4>
              <p className="text-ink-secondary leading-relaxed text-[11px]">
                Jika ada pembaruan dokumen (misalnya SK Standar Pelayanan baru, SOP revisi, atau foto sarana yang direnovasi), cukup unggah versi baru pada slot terkait. Seluruh versi terdahulu tetap tersimpan dan dapat dipulihkan kapan saja.
              </p>
            </div>
          </div>

          {/* Poin 4: Keamanan Arsip Tahun Lampau */}
          <div className="p-3 rounded-xl bg-surface-subtle/70 border border-line flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <h4 className="font-semibold text-xs text-ink">
                Arsip Penilaian Tahun Lalu Tetap Aman
              </h4>
              <p className="text-ink-secondary leading-relaxed text-[11px]">
                Evaluasi tahun-tahun terdahulu yang telah selesai dikunci permanen menggunakan snapshot dokumen pada saat penilaian dilakukan. Pembaruan di Master Bukti tidak akan mengubah arsip pembuktian periode lampau.
              </p>
            </div>
          </div>
        </div>
      </FormModal>

      {/* Modal Edit Metadata Manual (Human-in-the-Loop Override — Kontekstual per Kategori Slot) */}
      {(() => {
        const modalSchema = manualMetadataTarget
          ? getSlotMetadataSchema(
              manualMetadataTarget.slotKey,
              manualMetadataTarget.slotDocumentType,
              manualMetadataTarget.attachmentFileType
            )
          : null
        const activeCategory =
          manualMetadataTarget?.category || modalSchema?.category || 'LEGAL_DOCUMENT'

        const modalTitle =
          activeCategory === 'PHYSICAL_FACILITY'
            ? 'Edit Identitas & Kondisi Fasilitas'
            : activeCategory === 'DIGITAL_SYSTEM'
              ? 'Edit Metadata Sistem / Kanal Digital'
              : 'Edit Metadata Dokumen Resmi'

        return (
          <FormModal
            isOpen={Boolean(manualMetadataTarget)}
            onClose={() => setManualMetadataTarget(null)}
            title={modalTitle}
            description={
              manualMetadataTarget
                ? `${manualMetadataTarget.slotTitle}${manualMetadataTarget.fileName ? ` • ${manualMetadataTarget.fileName}` : ''}`
                : ''
            }
            icon={<Edit3 className="w-4 h-4" />}
            maxWidth="lg"
            zIndex="z-[9999]"
            headerActions={
              modalSchema ? (
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold border shrink-0 ${
                    activeCategory === 'PHYSICAL_FACILITY'
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60'
                      : activeCategory === 'DIGITAL_SYSTEM'
                        ? 'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-200 dark:border-sky-800/60'
                        : 'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  }`}>
                  {modalSchema.categoryLabel}
                </span>
              ) : null
            }
            footer={
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setManualMetadataTarget(null)}
                  disabled={isSavingManualMetadata}>
                  Batal
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  isLoading={isSavingManualMetadata}
                  onClick={handleSaveManualMetadata}>
                  Simpan Perubahan
                </Button>
              </div>
            }>
            {manualMetadataTarget && modalSchema && (
              <div className="space-y-4 text-xs">
                <p className="text-[11px] text-ink-secondary leading-relaxed bg-surface-subtle/60 border border-line rounded-xl px-3 py-2">
                  {modalSchema.modalSubtitle}
                </p>

                {/* ======================================================= */}
                {/* KATEGORI B: PHYSICAL_FACILITY (SARPRAS & FOTO FISIK)    */}
                {/* ======================================================= */}
                {activeCategory === 'PHYSICAL_FACILITY' && (
                  <>
                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        {modalSchema.primaryFieldLabel} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={modalSchema.primaryFieldPlaceholder}
                        value={manualMetadataTarget.facilityType}
                        onChange={(e) =>
                          setManualMetadataTarget({
                            ...manualMetadataTarget,
                            facilityType: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                      />
                      {modalSchema.quickOptions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[10px] font-medium text-ink-muted block">
                            Pilih cepat jenis fasilitas:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {modalSchema.quickOptions.map((opt) => {
                              const isSelected = manualMetadataTarget.facilityType === opt
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setManualMetadataTarget({
                                      ...manualMetadataTarget,
                                      facilityType: opt
                                    })
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium border transition-all cursor-pointer text-left ${
                                    isSelected
                                      ? 'bg-brand text-white border-brand shadow-2xs'
                                      : 'bg-surface hover:bg-surface-subtle text-ink-secondary hover:text-ink border-line'
                                  }`}>
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1.5">
                        Kondisi &amp; Kelayakan Fasilitas
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            value: 'LAYAK_BERFUNGSI',
                            label: 'Layak & Berfungsi',
                            activeCls:
                              'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 ring-1 ring-emerald-400/30'
                          },
                          {
                            value: 'BARU_DIRENOVASI',
                            label: 'Baru / Direnovasi',
                            activeCls:
                              'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-400 dark:border-sky-700 ring-1 ring-sky-400/30'
                          },
                          {
                            value: 'PERLU_PERBAIKAN',
                            label: 'Perlu Perbaikan',
                            activeCls:
                              'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-700 ring-1 ring-amber-400/30'
                          }
                        ].map((st) => {
                          const active = manualMetadataTarget.conditionStatus === st.value
                          return (
                            <button
                              key={st.value}
                              type="button"
                              onClick={() =>
                                setManualMetadataTarget({
                                  ...manualMetadataTarget,
                                  conditionStatus: st.value
                                })
                              }
                              className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                                active
                                  ? st.activeCls
                                  : 'bg-surface-subtle/60 hover:bg-surface-subtle text-ink-secondary border-line'
                              }`}>
                              {st.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-ink mb-1">
                          {modalSchema.locationOrUrlLabel || 'Lokasi / Area Penempatan'}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            modalSchema.locationOrUrlPlaceholder ||
                            'Contoh: Lobby Utama / Area Parkir Depan'
                          }
                          value={manualMetadataTarget.locationDescription}
                          onChange={(e) =>
                            setManualMetadataTarget({
                              ...manualMetadataTarget,
                              locationDescription: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-ink mb-1">
                          {modalSchema.dateFieldLabel}
                        </label>
                        <input
                          type="date"
                          value={manualMetadataTarget.photoDate}
                          onChange={(e) =>
                            setManualMetadataTarget({
                              ...manualMetadataTarget,
                              photoDate: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Keterangan / Catatan Tambahan (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Dilengkapi rambu kursi roda dan akses langsung ke ramp"
                        value={manualMetadataTarget.notes}
                        onChange={(e) =>
                          setManualMetadataTarget({
                            ...manualMetadataTarget,
                            notes: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                      />
                    </div>
                  </>
                )}

                {/* ======================================================= */}
                {/* KATEGORI C: DIGITAL_SYSTEM (SIPPN, WEBSITE, SP4N-LAPOR) */}
                {/* ======================================================= */}
                {activeCategory === 'DIGITAL_SYSTEM' && (
                  <>
                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        {modalSchema.primaryFieldLabel} <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder={modalSchema.primaryFieldPlaceholder}
                        value={manualMetadataTarget.systemName}
                        onChange={(e) =>
                          setManualMetadataTarget({
                            ...manualMetadataTarget,
                            systemName: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                      />
                      {modalSchema.quickOptions.length > 0 && (
                        <div className="mt-2 space-y-1">
                          <span className="text-[10px] font-medium text-ink-muted block">
                            Pilih cepat kanal / modul sistem:
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {modalSchema.quickOptions.map((opt) => {
                              const isSelected = manualMetadataTarget.systemName === opt
                              return (
                                <button
                                  key={opt}
                                  type="button"
                                  onClick={() =>
                                    setManualMetadataTarget({
                                      ...manualMetadataTarget,
                                      systemName: opt
                                    })
                                  }
                                  className={`px-2.5 py-1 rounded-lg text-[10.5px] font-medium border transition-all cursor-pointer text-left ${
                                    isSelected
                                      ? 'bg-brand text-white border-brand shadow-2xs'
                                      : 'bg-surface hover:bg-surface-subtle text-ink-secondary hover:text-ink border-line'
                                  }`}>
                                  {opt}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1.5">
                        Status Operasional Kanal / Sistem
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          {
                            value: 'AKTIF_TERVERIFIKASI',
                            label: 'Aktif & Terverifikasi',
                            activeCls:
                              'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-400 dark:border-emerald-700 ring-1 ring-emerald-400/30'
                          },
                          {
                            value: 'AKTIF_BERJALAN',
                            label: 'Aktif Berjalan',
                            activeCls:
                              'bg-sky-50 dark:bg-sky-950/50 text-sky-800 dark:text-sky-300 border-sky-400 dark:border-sky-700 ring-1 ring-sky-400/30'
                          },
                          {
                            value: 'DALAM_PEMELIHARAAN',
                            label: 'Pemeliharaan',
                            activeCls:
                              'bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 border-amber-400 dark:border-amber-700 ring-1 ring-amber-400/30'
                          }
                        ].map((st) => {
                          const active = manualMetadataTarget.operationalStatus === st.value
                          return (
                            <button
                              key={st.value}
                              type="button"
                              onClick={() =>
                                setManualMetadataTarget({
                                  ...manualMetadataTarget,
                                  operationalStatus: st.value
                                })
                              }
                              className={`px-2.5 py-2 rounded-xl text-[11px] font-semibold border transition-all cursor-pointer text-center ${
                                active
                                  ? st.activeCls
                                  : 'bg-surface-subtle/60 hover:bg-surface-subtle text-ink-secondary border-line'
                              }`}>
                              {st.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-ink mb-1">
                          {modalSchema.locationOrUrlLabel || 'Tautan URL / Akun Kanal'}
                        </label>
                        <input
                          type="text"
                          placeholder={
                            modalSchema.locationOrUrlPlaceholder || 'Contoh: https://...'
                          }
                          value={manualMetadataTarget.url}
                          onChange={(e) =>
                            setManualMetadataTarget({
                              ...manualMetadataTarget,
                              url: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                        />
                      </div>

                      <div>
                        <label className="block font-semibold text-ink mb-1">
                          {modalSchema.dateFieldLabel}
                        </label>
                        <input
                          type="date"
                          value={manualMetadataTarget.screenshotDate}
                          onChange={(e) =>
                            setManualMetadataTarget({
                              ...manualMetadataTarget,
                              screenshotDate: e.target.value
                            })
                          }
                          className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Catatan Fitur / Konten Pemutakhiran (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: Menampilkan 14 standar pelayanan yang telah terverifikasi"
                        value={manualMetadataTarget.notes}
                        onChange={(e) =>
                          setManualMetadataTarget({
                            ...manualMetadataTarget,
                            notes: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                      />
                    </div>
                  </>
                )}

                {/* ======================================================= */}
                {/* KATEGORI A: LEGAL_DOCUMENT (SK, SOP, BA FKP, LAPORAN)   */}
                {/* ======================================================= */}
                {activeCategory === 'LEGAL_DOCUMENT' && (
                  <>
                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Tahun Terbit / Penetapan Dokumen <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min={2000}
                        max={2040}
                        placeholder="Contoh: 2024"
                        value={manualMetadataTarget.detectedYear}
                        onChange={(e) =>
                          setManualMetadataTarget({
                            ...manualMetadataTarget,
                            detectedYear:
                              e.target.value === '' ? '' : parseInt(e.target.value, 10)
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                      />
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <span className="text-[10px] text-ink-muted mr-0.5">Pilih cepat:</span>
                        {[
                          new Date().getFullYear(),
                          new Date().getFullYear() - 1,
                          new Date().getFullYear() - 2,
                          new Date().getFullYear() - 3,
                          new Date().getFullYear() - 4
                        ].map((yr) => (
                          <button
                            key={yr}
                            type="button"
                            onClick={() =>
                              setManualMetadataTarget({
                                ...manualMetadataTarget,
                                detectedYear: yr
                              })
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer ${
                              manualMetadataTarget.detectedYear === yr
                                ? 'bg-brand text-white border-brand shadow-2xs'
                                : 'bg-surface hover:bg-surface-subtle text-ink border-line'
                            }`}>
                            {yr}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-ink-muted mt-1">
                        Tahun ini digunakan sistem untuk mendeteksi kedaluwarsa dokumen pada periode evaluasi baru.
                      </p>
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Nomor Surat / SK Resmi
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: 188.4/45/Kep/Disdukcapil/2024"
                        value={manualMetadataTarget.documentNumber}
                        onChange={(e) =>
                          setManualMetadataTarget({
                            ...manualMetadataTarget,
                            documentNumber: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Tanggal Lengkap Penetapan (Opsional)
                      </label>
                      <input
                        type="date"
                        value={manualMetadataTarget.documentDate}
                        onChange={(e) =>
                          setManualMetadataTarget({
                            ...manualMetadataTarget,
                            documentDate: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                      />
                    </div>

                    <div>
                      <label className="block font-semibold text-ink mb-1">
                        Catatan / Perihal Dokumen (Opsional)
                      </label>
                      <input
                        type="text"
                        placeholder="Contoh: SK Penetapan Standar Pelayanan 14 Komponen"
                        value={manualMetadataTarget.notes}
                        onChange={(e) =>
                          setManualMetadataTarget({
                            ...manualMetadataTarget,
                            notes: e.target.value
                          })
                        }
                        className="w-full px-3 py-2 rounded-xl bg-surface-subtle border border-line text-ink focus:outline-none focus:border-brand text-xs"
                      />
                    </div>
                  </>
                )}
              </div>
            )}
          </FormModal>
        )
      })()}
    </div>
  )
}
