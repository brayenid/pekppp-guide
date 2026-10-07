'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createPortal } from 'react-dom'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  FolderOpen,
  Folder,
  FileText,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  LayoutGrid,
  UploadCloud,
  AlertCircle,
  ExternalLink,
  Loader2,
  X,
  Eye,
  Sparkles,
  AlertTriangle,
  FolderCheck,
  GripVertical,
  RotateCcw
} from 'lucide-react'
import { F01QuestionForm } from './F01QuestionForm'
import { F01SummaryCard } from './F01SummaryCard'
import { F02GuidanceSection } from './F02GuidanceSection'
import { IndicatorCommentSection } from './IndicatorCommentSection'
import { AspectNoteSection } from './AspectNoteSection'
import { AspectEvidenceWorkspace } from './AspectEvidenceWorkspace'
import { AspectEvidenceGridHub } from './AspectEvidenceGridHub'
import { F01GlobalSaveButton } from './F01GlobalSaveButton'
import { F02GlobalSaveButton } from './F02GlobalSaveButton'
import { ZoomableImageContainer } from './ZoomableImageContainer'
import { formatScore } from '../../lib/utils'
import { normalizeAspectCode } from '../../core/domain/evidence-slots-preset'
import {
  getIndicatorEvidenceAction,
  EvidenceSlotItem,
  EvidenceAttachmentItem
} from '../../actions/evidence-slot-actions'
import {
  saveScoresAction,
  saveF01BatchAction,
  saveAspectNoteAction
} from '../../actions/evaluation-actions'
import { toast } from 'sonner'

function getDriveFileId(url: string): string | null {
  if (!url) return null
  const fileMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/)
  if (fileMatch) return fileMatch[1]
  const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/)
  if (idMatch) return idMatch[1]
  return null
}

function getDriveFolderId(url: string): string | null {
  if (!url) return null
  const folderMatch = url.match(/\/drive\/folders\/([a-zA-Z0-9_-]+)/)
  if (folderMatch) return folderMatch[1]
  return null
}

function getPreviewUrl(url: string): { type: 'IMAGE' | 'PDF' | 'DRIVE' | 'DRIVE_FOLDER' | 'LINK'; embedUrl: string } {
  if (!url) return { type: 'LINK', embedUrl: '' }
  const driveFileId = getDriveFileId(url)
  if (driveFileId) {
    return { type: 'DRIVE', embedUrl: `https://drive.google.com/file/d/${driveFileId}/preview` }
  }
  const driveFolderId = getDriveFolderId(url)
  if (driveFolderId) {
    return { type: 'DRIVE_FOLDER', embedUrl: url }
  }
  const lower = url.toLowerCase()
  if (lower.match(/\.(png|jpg|jpeg|webp|gif|svg)(\?.*)?$/)) {
    return { type: 'IMAGE', embedUrl: url }
  }
  if (lower.match(/\.pdf(\?.*)?$/)) {
    return { type: 'PDF', embedUrl: url }
  }
  return { type: 'LINK', embedUrl: url }
}

interface ScoreItem {
  id: string
  indicatorId: string
  score?: number | null
  notes?: string | null
  proofUrl?: string | null
  f01Data?: any
  f01Submitted?: boolean
  comments?: any[]
  aiSuggestedScore?: number | null
  aiConfidence?: number | null
  aiConfidenceReason?: string | null
  aiCriticalAudit?: string | null
  aiWeaknessNotes?: string | null
  aiVerificationTips?: string | null
  indicator: {
    id: string
    indicatorNumber: number
    code: string
    question: string
    maxScore: number
    indicatorWeight: number
    isSupplementary?: boolean
    aspect: {
      id: string
      code: string
      name: string
      aspectWeight: number
    }
  }
}

interface EvaluationWorkspaceLayoutProps {
  scores: ScoreItem[]
  evaluationId: string
  unitId: string
  unitName: string
  driveFolderUrl?: string | null
  calculation: any
  userRole: string
  userId: string
  aspectNotes?: Record<string, string> | null
  aiEvaluatorNotes?: Record<string, any> | null
  activeMainMode?: 'QUESTIONS' | 'EVIDENCE'
  onActiveMainModeChange?: (mode: 'QUESTIONS' | 'EVIDENCE') => void
  isF01Editable?: boolean
  isEvidenceEditable?: boolean
}

export function EvaluationWorkspaceLayout({
  scores,
  evaluationId,
  unitId,
  unitName,
  driveFolderUrl,
  calculation,
  userRole,
  userId,
  aspectNotes,
  aiEvaluatorNotes,
  activeMainMode: controlledActiveMainMode,
  onActiveMainModeChange,
  isF01Editable = true,
  isEvidenceEditable = true
}: EvaluationWorkspaceLayoutProps) {
  const router = useRouter()
  const [activeNumber, setActiveNumber] = useState<number>(1)
  const [activeAspectEvidence, setActiveAspectEvidence] = useState<string | null>(null)
  const [internalActiveMainMode, setInternalActiveMainMode] = useState<'QUESTIONS' | 'EVIDENCE'>('QUESTIONS')
  const activeMainMode = controlledActiveMainMode ?? internalActiveMainMode
  const setActiveMainMode = (mode: 'QUESTIONS' | 'EVIDENCE') => {
    setInternalActiveMainMode(mode)
    onActiveMainModeChange?.(mode)
  }
  const [leftTab, setLeftTab] = useState<'questions' | 'evidence' | 'preview'>('questions')
  const [sidebarPreviewDoc, setSidebarPreviewDoc] = useState<{
    title: string
    fileName?: string
    fileUrl: string
    isMandatory?: boolean
    slotKey?: string
    allSlotAttachments?: EvidenceAttachmentItem[]
    currentIndex?: number
  } | null>(null)

  // Helper sinkronisasi parameter URL tanpa me-reload halaman
  const syncUrlParams = useCallback((updates: {
    mode?: 'QUESTIONS' | 'EVIDENCE'
    soal?: number
    tab?: 'questions' | 'evidence' | 'preview'
    aspek?: string | null
    slot?: string | null
    doc?: number | null
    targetItem?: string | null
    targetSlot?: string | null
    pushHistory?: boolean
  }) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    const sp = url.searchParams

    if (updates.mode !== undefined) {
      if (updates.mode === 'EVIDENCE') sp.set('mode', 'evidence')
      else sp.set('mode', 'questions')
    }

    if (updates.soal !== undefined) {
      sp.set('soal', String(updates.soal))
    }

    if (updates.tab !== undefined) {
      sp.set('tab', updates.tab)
    }

    if (updates.aspek !== undefined) {
      if (updates.aspek) sp.set('aspek', updates.aspek)
      else sp.delete('aspek')
    }

    if (updates.slot !== undefined) {
      if (updates.slot) sp.set('slot', updates.slot)
      else sp.delete('slot')
    }

    if (updates.doc !== undefined) {
      if (updates.doc !== null && updates.doc !== undefined) sp.set('doc', String(updates.doc))
      else sp.delete('doc')
    }

    if (updates.targetItem !== undefined) {
      if (updates.targetItem) sp.set('targetItem', updates.targetItem)
      else sp.delete('targetItem')
    }

    if (updates.targetSlot !== undefined) {
      if (updates.targetSlot) sp.set('targetSlot', updates.targetSlot)
      else sp.delete('targetSlot')
    }

    // Bersihkan hash agar URL bersih
    url.hash = ''

    const newUrl = `${url.pathname}${sp.toString() ? `?${sp.toString()}` : ''}`
    if (newUrl !== `${window.location.pathname}${window.location.search}`) {
      if (updates.pushHistory) {
        window.history.pushState(null, '', newUrl)
      } else {
        window.history.replaceState(null, '', newUrl)
      }
    }
  }, [])

  const handleOpenSidebarPreview = (slot: EvidenceSlotItem, initialIndex = 0) => {
    const attachments: EvidenceAttachmentItem[] = (slot.attachments && slot.attachments.length > 0)
      ? slot.attachments
      : (slot.fileUrl ? [{
          id: 'main',
          fileUrl: slot.fileUrl,
          fileName: slot.fileName || slot.title || 'Berkas Terunggah',
          fileSize: slot.fileSize || 0,
          fileType: (slot.fileType as any) || 'DOCUMENT',
          uploadedAt: new Date().toISOString()
        }] : [])

    if (attachments.length === 0) return

    const targetDoc = attachments[initialIndex] || attachments[0]
    setSidebarPreviewDoc({
      title: slot.title,
      fileName: targetDoc.fileName || slot.fileName || 'Berkas',
      fileUrl: targetDoc.fileUrl,
      isMandatory: slot.isMandatory,
      slotKey: slot.slotKey,
      allSlotAttachments: attachments,
      currentIndex: initialIndex
    })
    setLeftTab('preview')
    syncUrlParams({
      tab: 'preview',
      slot: slot.slotKey,
      doc: initialIndex,
      pushHistory: true
    })
  }

  const handleNavigatePreviewDoc = (newIndex: number) => {
    if (!sidebarPreviewDoc?.allSlotAttachments) return
    const list = sidebarPreviewDoc.allSlotAttachments
    if (newIndex < 0 || newIndex >= list.length) return
    const targetDoc = list[newIndex]
    setSidebarPreviewDoc({
      ...sidebarPreviewDoc,
      fileName: targetDoc.fileName || `Berkas ${newIndex + 1}`,
      fileUrl: targetDoc.fileUrl,
      currentIndex: newIndex
    })
    syncUrlParams({
      tab: 'preview',
      doc: newIndex
    })
  }
  const [dirtyNumbers, setDirtyNumbers] = useState<Set<number>>(new Set())
  const [isAspectProofOpen, setIsAspectProofOpen] = useState<boolean>(false)
  const [sidebarEvidenceSlots, setSidebarEvidenceSlots] = useState<EvidenceSlotItem[]>([])
  const [loadingSidebarEvidence, setLoadingSidebarEvidence] = useState<boolean>(false)
  const [modalPreviewItem, setModalPreviewItem] = useState<{
    title: string
    fileUrl: string
    isMandatory?: boolean
    slotKey?: string
  } | null>(null)

  // ── Resizable Sidebar ────────────────────────────────────────────────────────
  const SIDEBAR_MIN = 18  // % of total split container
  const SIDEBAR_MAX = 60
  const SIDEBAR_DEFAULT = 33.33  // ~4/12 columns default

  // Selalu inisialisasi dengan SIDEBAR_DEFAULT agar SSR dan initial client render identik (mencegah hydration mismatch)
  const [sidebarWidthPct, setSidebarWidthPct] = useState<number>(SIDEBAR_DEFAULT)
  const splitContainerRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  // Baca dari localStorage hanya setelah komponen mounted di browser
  useEffect(() => {
    try {
      const stored = localStorage.getItem('eval-sidebar-width-pct')
      if (stored) {
        const parsed = parseFloat(stored)
        if (!isNaN(parsed) && parsed >= SIDEBAR_MIN && parsed <= SIDEBAR_MAX) {
          setSidebarWidthPct(parsed)
        }
      }
    } catch {
      // Abaikan jika localStorage tidak dapat diakses
    }
  }, [])

  const handleResetSidebarWidth = () => {
    setSidebarWidthPct(SIDEBAR_DEFAULT)
    try {
      localStorage.removeItem('eval-sidebar-width-pct')
    } catch {}
    toast.success('Ukuran panel dikembalikan ke default')
  }

  const handleResizerMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    isDragging.current = true
    document.body.style.cursor = 'col-resize'
    document.body.style.userSelect = 'none'

    const onMouseMove = (ev: MouseEvent) => {
      if (!isDragging.current || !splitContainerRef.current) return
      const rect = splitContainerRef.current.getBoundingClientRect()
      const rawPct = ((ev.clientX - rect.left) / rect.width) * 100
      const clamped = Math.min(SIDEBAR_MAX, Math.max(SIDEBAR_MIN, rawPct))
      setSidebarWidthPct(clamped)
    }

    const onMouseUp = () => {
      isDragging.current = false
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
      // Persist to localStorage after drag ends
      setSidebarWidthPct((prev) => {
        try {
          localStorage.setItem('eval-sidebar-width-pct', String(prev))
        } catch {}
        return prev
      })
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)
  }, [])
  // ────────────────────────────────────────────────────────────────────────────


  const [highlightTarget, setHighlightTarget] = useState<boolean>(false)
  const [targetItem, setTargetItem] = useState<string | null>(null)
  const [targetSlotKey, setTargetSlotKey] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const parseUrlParamsAndHash = () => {
        const url = new URL(window.location.href)
        const searchParams = url.searchParams
        const hash = url.hash.replace(/^#/, '')

        // 1. Backward-compatibility: Convert hash to query params if present
        if (hash) {
          if (hash === 'matriks-bukti') {
            searchParams.set('mode', 'evidence')
            searchParams.delete('aspek')
          } else if (hash.startsWith('bukti-')) {
            const code = hash.replace('bukti-', '')
            searchParams.set('mode', 'evidence')
            searchParams.set('aspek', code)
          } else if (hash.startsWith('soal-')) {
            const numStr = hash.replace('soal-', '')
            searchParams.set('mode', 'questions')
            searchParams.set('soal', numStr)
          }
          url.hash = ''
          window.history.replaceState(null, '', url.toString())
        }

        // 2. Parse all query parameters
        const modeParam = searchParams.get('mode')
        const soalParam = parseInt(searchParams.get('soal') || '', 10)
        const tabParam = searchParams.get('tab')
        const aspekParam = searchParams.get('aspek')
        const tItem = searchParams.get('targetItem')
        const tSlot = searchParams.get('targetSlot')

        setTargetItem(tItem)
        setTargetSlotKey(tSlot)

        if (modeParam === 'evidence') {
          setActiveMainMode('EVIDENCE')
          if (aspekParam) {
            setActiveAspectEvidence(aspekParam)
          } else {
            setActiveAspectEvidence(null)
          }
        } else {
          setActiveMainMode('QUESTIONS')
          setActiveAspectEvidence(null)
          if (!isNaN(soalParam) && soalParam >= 1 && soalParam <= 31) {
            setActiveNumber(soalParam)
          }
        }

        if (tabParam === 'questions' || tabParam === 'evidence' || tabParam === 'preview') {
          setLeftTab(tabParam)
          if (tabParam !== 'preview') {
            setSidebarPreviewDoc(null)
          }
        } else {
          setLeftTab('questions')
          setSidebarPreviewDoc(null)
        }

        // Highlight & scroll jika berpindah soal atau ada target item
        if (tItem || (!isNaN(soalParam) && soalParam > 0)) {
          setHighlightTarget(true)
          setTimeout(() => setHighlightTarget(false), 3000)

          setTimeout(() => {
            const targetItemEl = tItem
              ? document.getElementById(`f01-item-${tItem}`) || document.getElementById(`f01-input-${tItem}`)
              : null

            const el = targetItemEl || document.getElementById('active-workspace-card')
            if (el) {
              const yOffset = -85
              const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset
              window.scrollTo({ top: y, behavior: 'smooth' })
            }
          }, 150)
        }
      }

      parseUrlParamsAndHash()
      window.addEventListener('hashchange', parseUrlParamsAndHash)
      window.addEventListener('popstate', parseUrlParamsAndHash)
      return () => {
        window.removeEventListener('hashchange', parseUrlParamsAndHash)
        window.removeEventListener('popstate', parseUrlParamsAndHash)
      }
    }
  }, [])

  useEffect(() => {
    if (modalPreviewItem) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setModalPreviewItem(null)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = 'unset'
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [modalPreviewItem])

  const [internalScores, setInternalScores] = useState<ScoreItem[]>(scores)
  useEffect(() => {
    setInternalScores(scores)
  }, [scores])

  // Active indicator item
  const activeScoreItem = useMemo(() => {
    return internalScores.find((s) => s.indicator.indicatorNumber === activeNumber) || internalScores[0]
  }, [internalScores, activeNumber])

  const currentAspectCode = activeScoreItem.indicator.aspect.code
  const currentAspectAiNote = aiEvaluatorNotes
    ? aiEvaluatorNotes[currentAspectCode] || aiEvaluatorNotes[normalizeAspectCode(currentAspectCode)]
    : null

  // Load evidence slots for the currently active question's aspect
  useEffect(() => {
    if (leftTab === 'evidence' || leftTab === 'preview') {
      let isMounted = true
      setLoadingSidebarEvidence(true)
      getIndicatorEvidenceAction(evaluationId, currentAspectCode)
        .then((res) => {
          if (isMounted && res.success && res.slots) {
            setSidebarEvidenceSlots(res.slots)

            // Auto-restore preview document if URL specifies slot & tab=preview
            if (typeof window !== 'undefined') {
              const sp = new URLSearchParams(window.location.search)
              const tabParam = sp.get('tab')
              const slotParam = sp.get('slot')
              const docParam = sp.get('doc') ? parseInt(sp.get('doc')!, 10) : 0

              if (tabParam === 'preview' && slotParam) {
                const targetSlot = res.slots.find((s) => s.slotKey === slotParam)
                if (targetSlot) {
                  const attachments: EvidenceAttachmentItem[] = (targetSlot.attachments && targetSlot.attachments.length > 0)
                    ? targetSlot.attachments
                    : (targetSlot.fileUrl ? [{
                        id: 'main',
                        fileUrl: targetSlot.fileUrl,
                        fileName: targetSlot.fileName || targetSlot.title || 'Berkas Terunggah',
                        fileSize: targetSlot.fileSize || 0,
                        fileType: (targetSlot.fileType as any) || 'DOCUMENT',
                        uploadedAt: new Date().toISOString()
                      }] : [])

                  if (attachments.length > 0) {
                    const safeIdx = Math.min(Math.max(0, docParam), attachments.length - 1)
                    const targetDoc = attachments[safeIdx]
                    setSidebarPreviewDoc({
                      title: targetSlot.title,
                      fileName: targetDoc.fileName || targetSlot.fileName || 'Berkas',
                      fileUrl: targetDoc.fileUrl,
                      isMandatory: targetSlot.isMandatory,
                      slotKey: targetSlot.slotKey,
                      allSlotAttachments: attachments,
                      currentIndex: safeIdx
                    })
                  }
                }
              }
            }
          }
        })
        .catch(() => {
          if (isMounted) setSidebarEvidenceSlots([])
        })
        .finally(() => {
          if (isMounted) setLoadingSidebarEvidence(false)
        })
      return () => {
        isMounted = false
      }
    }
  }, [evaluationId, currentAspectCode, leftTab])

  // Group scores by Aspect Code
  const groupedAspects = useMemo(() => {
    const map: Record<string, { aspect: ScoreItem['indicator']['aspect']; items: ScoreItem[] }> = {}
    for (const score of internalScores) {
      const code = score.indicator.aspect.code
      if (!map[code]) {
        map[code] = {
          aspect: score.indicator.aspect,
          items: []
        }
      }
      map[code].items.push(score)
    }
    return Object.values(map)
  }, [internalScores])

  // In-memory draft states so user answers/scores persist across question navigation
  const [draftF02, setDraftF02] = useState<Record<number, { indicatorId: string; score: number | null; notes?: string }>>({})
  const [draftF01, setDraftF01] = useState<Record<number, { evaluationScoreId: string; f01Data: Record<string, any>; proofUrl?: string }>>({})
  const [draftAspectNotes, setDraftAspectNotes] = useState<Record<string, string>>({})

  // Listen for global F02 save event and save all dirty questions in batch
  useEffect(() => {
    const handleSaveAllF02 = async () => {
      if (!evaluationId) return
      const f02Entries = Object.entries(draftF02)
      const aspectEntries = Object.entries(draftAspectNotes)

      if (f02Entries.length === 0 && aspectEntries.length === 0) {
        return
      }

      try {
        if (f02Entries.length > 0) {
          const payload = f02Entries.map(([_, item]) => ({
            indicatorId: item.indicatorId,
            score: item.score,
            notes: item.notes
          }))
          await saveScoresAction(evaluationId, payload)

          // Update internal scores locally
          setInternalScores((prev) =>
            prev.map((item) => {
              const num = item.indicator.indicatorNumber
              const draft = draftF02[num]
              if (draft) {
                return {
                  ...item,
                  score: draft.score,
                  notes: draft.notes ?? item.notes
                }
              }
              return item
            })
          )
        }

        if (aspectEntries.length > 0) {
          for (const [aspectCode, note] of aspectEntries) {
            await saveAspectNoteAction({ evaluationId, aspectCode, note: note.trim(), unitId })
          }
        }

        setDraftF02({})
        setDraftAspectNotes({})
        toast.success('Semua penilaian F02 berhasil disimpan!')
      } catch (err) {
        console.error('Failed to batch save F02:', err)
        toast.error('Gagal menyimpan beberapa penilaian F02.')
      }
    }

    window.addEventListener('save-all-f02', handleSaveAllF02)
    return () => window.removeEventListener('save-all-f02', handleSaveAllF02)
  }, [evaluationId, draftF02, draftAspectNotes, unitId])

  // Listen for global F01 save event and save all dirty questions in batch
  useEffect(() => {
    const handleSaveAllF01 = async () => {
      const f01Entries = Object.entries(draftF01)
      if (f01Entries.length === 0) return

      try {
        const payload = f01Entries.map(([_, item]) => ({
          evaluationScoreId: item.evaluationScoreId,
          f01Data: item.f01Data,
          proofUrl: item.proofUrl?.trim() || undefined
        }))
        await saveF01BatchAction({
          items: payload,
          path: `/evaluasi/${unitId}`
        })

        // Update internal scores locally
        setInternalScores((prev) =>
          prev.map((item) => {
            const num = item.indicator.indicatorNumber
            const draft = draftF01[num]
            if (draft) {
              return {
                ...item,
                f01Data: draft.f01Data,
                proofUrl: draft.proofUrl !== undefined ? draft.proofUrl : item.proofUrl,
                f01Submitted: true
              }
            }
            return item
          })
        )

        setDraftF01({})
        toast.success('Semua isian F01 berhasil disimpan!')
      } catch (err) {
        console.error('Failed to batch save F01:', err)
        toast.error('Gagal menyimpan beberapa isian F01.')
      }
    }

    window.addEventListener('save-all-f01', handleSaveAllF01)
    return () => window.removeEventListener('save-all-f01', handleSaveAllF01)
  }, [draftF01, unitId])

  // Listen for dirty indicators (unsaved changes)
  const checkDirtyStatus = () => {
    const dirtySet = new Set<number>()
    // Include all keys currently in drafts
    Object.keys(draftF02).forEach((numStr) => {
      const n = parseInt(numStr, 10)
      if (!isNaN(n) && n > 0) dirtySet.add(n)
    })
    Object.keys(draftF01).forEach((numStr) => {
      const n = parseInt(numStr, 10)
      if (!isNaN(n) && n > 0) dirtySet.add(n)
    })

    const dirtyElements = document.querySelectorAll('[data-indicator-dirty="true"]')
    dirtyElements.forEach((el) => {
      const rawNum =
        el.getAttribute('data-indicator-number') ||
        el.closest('[data-indicator-number]')?.getAttribute('data-indicator-number')
      if (rawNum) {
        const n = parseInt(rawNum, 10)
        if (!isNaN(n) && n > 0) dirtySet.add(n)
      }
    })
    setDirtyNumbers(dirtySet)
  }

  useEffect(() => {
    checkDirtyStatus()
    window.addEventListener('input', checkDirtyStatus)
    window.addEventListener('change', checkDirtyStatus)
    window.addEventListener('submit', checkDirtyStatus)
    return () => {
      window.removeEventListener('input', checkDirtyStatus)
      window.removeEventListener('change', checkDirtyStatus)
      window.removeEventListener('submit', checkDirtyStatus)
    }
  }, [draftF02, draftF01])

  // Global prevent reload/leave if any draft or dirty indicator exists (F01 & F02)
  const unsavedCount = Array.from(dirtyNumbers).filter((n) => !isNaN(n) && n > 0).length

  const hasUnsavedChanges =
    unsavedCount > 0 || Object.keys(draftAspectNotes).length > 0

  // Broadcast save status to Navbar / other components
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('evaluation-status-change', {
          detail: {
            hasUnsaved: hasUnsavedChanges,
            count: unsavedCount
          }
        })
      )
    }
  }, [hasUnsavedChanges, unsavedCount])

  useEffect(() => {
    if (!hasUnsavedChanges) return
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = 'Terdapat isian atau penilaian yang belum disimpan. Yakin ingin memuat ulang halaman?'
      return e.returnValue
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [hasUnsavedChanges])

  // Progress metrics
  const totalIndicators = scores.length || 31
  const filledF01Count = scores.filter((s) => {
    const draft = draftF01[s.indicator.indicatorNumber]
    if (draft) {
      return draft.f01Data && Object.keys(draft.f01Data).length > 0
    }
    return s.f01Submitted || (s.f01Data && Object.keys(s.f01Data as any).length > 0)
  }).length

  const completedF01WithProofCount = scores.filter((s) => {
    const draft = draftF01[s.indicator.indicatorNumber]
    if (draft) {
      const hasData = draft.f01Data && Object.keys(draft.f01Data).length > 0
      const hasProof = Boolean(draft.proofUrl && draft.proofUrl.trim() !== '')
      return hasData && hasProof
    }
    return (
      (s.f01Submitted || (s.f01Data && Object.keys(s.f01Data as any).length > 0)) &&
      Boolean(s.proofUrl && s.proofUrl.trim() !== '')
    )
  }).length

  const filledF02Count = scores.filter((s) => {
    const draft = draftF02[s.indicator.indicatorNumber]
    if (draft !== undefined) {
      return draft.score !== null && draft.score !== undefined
    }
    return s.score !== null && s.score !== undefined
  }).length

  const overallProgress =
    userRole === 'OPD'
      ? Math.round((filledF01Count / totalIndicators) * 100)
      : Math.round((filledF02Count / totalIndicators) * 100)

  // Status helper per item
  const getItemStatus = (item: ScoreItem) => {
    const indNum = item.indicator.indicatorNumber
    const f01Draft = draftF01[indNum]
    const f02Draft = draftF02[indNum]

    const effectiveF01Data = f01Draft ? f01Draft.f01Data : item.f01Data
    const effectiveProofUrl = f01Draft && f01Draft.proofUrl !== undefined ? f01Draft.proofUrl : item.proofUrl
    const effectiveScore = f02Draft !== undefined ? f02Draft.score : item.score

    const hasF01 = Boolean(item.f01Submitted || (effectiveF01Data && Object.keys(effectiveF01Data as any).length > 0))
    const hasProof = Boolean(effectiveProofUrl && effectiveProofUrl.trim() !== '')
    const hasScore = effectiveScore !== null && effectiveScore !== undefined

    if (userRole === 'OPD') {
      if (hasF01 && hasProof) return { state: 'complete', title: 'Lengkap (Jawaban & Bukti)' }
      if (hasF01 && !hasProof) return { state: 'no_proof', title: 'Jawaban terisi, bukti belum ada' }
      if (!hasF01 && hasProof) return { state: 'proof_only', title: 'Bukti ada, form belum diisi' }
      return { state: 'empty', title: 'Belum diisi' }
    } else {
      if (hasScore) return { state: 'scored', title: `Dinilai: ${effectiveScore}` }
      if (hasF01 && hasProof) return { state: 'ready', title: 'F01 Lengkap, siap dinilai' }
      return { state: 'unscored', title: 'Belum dinilai' }
    }
  }

  // Navigation handlers
  const currentIndex = scores.findIndex((s) => s.indicator.indicatorNumber === activeNumber)
  const prevScoreItem = currentIndex > 0 ? scores[currentIndex - 1] : null
  const nextScoreItem = currentIndex < scores.length - 1 ? scores[currentIndex + 1] : null

  const currentAspectGroup = useMemo(() => {
    return groupedAspects.find((g) => g.aspect.code === activeScoreItem.indicator.aspect.code)
  }, [groupedAspects, activeScoreItem])

  const isLastQuestionInAspect = useMemo(() => {
    if (!currentAspectGroup || currentAspectGroup.items.length === 0) return false
    const lastItem = currentAspectGroup.items[currentAspectGroup.items.length - 1]
    return lastItem.indicator.indicatorNumber === activeNumber
  }, [currentAspectGroup, activeNumber])

  const handleGoToNumber = (num: number) => {
    setActiveMainMode('QUESTIONS')
    setActiveAspectEvidence(null)
    setActiveNumber(num)
    syncUrlParams({
      mode: 'QUESTIONS',
      soal: num,
      aspek: null,
      pushHistory: true
    })
    const workspaceElement = document.getElementById('active-workspace-card')
    if (workspaceElement) {
      const yOffset = -85
      const y = workspaceElement.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleGoToAspectEvidence = (aspectCode: string) => {
    setActiveMainMode('EVIDENCE')
    setActiveAspectEvidence(aspectCode)
    syncUrlParams({
      mode: 'EVIDENCE',
      aspek: aspectCode,
      pushHistory: true
    })
    const workspaceElement = document.getElementById('active-workspace-card')
    if (workspaceElement) {
      const yOffset = -85
      const y = workspaceElement.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const handleGoToEvidenceHub = () => {
    setActiveMainMode('EVIDENCE')
    setActiveAspectEvidence(null)
    syncUrlParams({
      mode: 'EVIDENCE',
      aspek: null,
      pushHistory: true
    })
    const workspaceElement = document.getElementById('active-workspace-card')
    if (workspaceElement) {
      const yOffset = -85
      const y = workspaceElement.getBoundingClientRect().top + window.pageYOffset + yOffset
      window.scrollTo({ top: y, behavior: 'smooth' })
    }
  }

  const activeAspectResult = calculation?.aspectResults?.[activeScoreItem.indicator.aspect.code]

  // Cek apakah ada indikator yang telah dinilai oleh Evaluator
  const hasEvaluatorScoredAny = useMemo(() => {
    return internalScores.some((s) => s.score !== null || (s.notes && s.notes.trim() !== ''))
  }, [internalScores])

  return (
    <div className="space-y-5">
      {/* Contextual Status Banner */}
      {userRole === 'OPD' && !isF01Editable && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-amber-900">Mode Arsip / Hanya Baca</span>
              <p className="text-amber-800/90 text-[11px] mt-0.5">
                Pengisian formulir F-01 dan bukti dukung untuk tahun ini telah ditutup atau sedang dalam masa arsip. Data ditampilkan hanya untuk referensi baca.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-full shrink-0 hidden sm:inline-block">
            Arsip / Read-Only
          </span>
        </div>
      )}

      {userRole === 'OPD' && isF01Editable && hasEvaluatorScoredAny && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl px-5 py-3 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <div className="min-w-0">
              <span className="font-semibold text-emerald-800">Unit Anda Telah / Sedang Dinilai Oleh Evaluator</span>
              <p className="text-emerald-700/90 text-[11px] mt-0.5 truncate">
                Evaluator telah mengisi skor atau catatan rekomendasi pada beberapa indikator. Anda dapat melihat masukan evaluator dan memperbarui bukti dukung jika diperlukan.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full shrink-0 hidden sm:inline-block">
            {filledF02Count} dari 31 Dinilai
          </span>
        </div>
      )}

      {userRole === 'SUPER_ADMIN' && (
        <div className="bg-surface-subtle/70 border border-stroke/50 rounded-2xl px-5 py-2.5 flex items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-2 text-ink-secondary">
            <span className="w-2 h-2 rounded-full bg-brand shrink-0" />
            <span>
              Status Evaluasi: <strong className="text-ink">{filledF02Count}</strong> dari <strong className="text-ink">31</strong> indikator telah dinilai.
              {hasEvaluatorScoredAny && ' Notifikasi revisi otomatis aktif jika OPD memperbarui F01/bukti dukung pasca dinilai.'}
            </span>
          </div>
        </div>
      )}

      {/* Minimalist Action Ribbon */}
      <div className="bg-surface rounded-2xl border border-stroke/50 px-5 py-3 flex items-center justify-between gap-4 shadow-soft-card mb-5">
        {/* Left: Indicator Breadcrumb */}
        <div className="flex items-center gap-2 text-xs">
          {activeMainMode === 'EVIDENCE' ? (
            <div className="flex items-center gap-2">
              <span className="font-medium text-brand bg-brand-light px-3 py-1 rounded-full text-xs flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-brand shrink-0" />
                <span>Pusat Unggah Bukti</span>
              </span>
              <span className="text-stroke">•</span>
              <span className="text-ink font-medium truncate max-w-[280px] sm:max-w-md">
                {activeAspectEvidence
                  ? `Aspek ${activeAspectEvidence}: ${groupedAspects.find((g) => g.aspect.code === activeAspectEvidence)?.aspect.name || ''}`
                  : 'Pilihan 6 Aspek'}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="font-medium text-ink bg-surface-subtle px-3 py-1 rounded-full border border-stroke/60 text-xs">
                #{activeScoreItem.indicator.indicatorNumber} • {activeScoreItem.indicator.code}
              </span>
              <span className="text-stroke">•</span>
              <span className="text-ink-muted truncate max-w-[280px] sm:max-w-md">
                {activeScoreItem.indicator.aspect.name}
              </span>
            </div>
          )}
        </div>

        {/* Right: Progress & Action (Khusus Mode Formulir Pertanyaan F01 / F02) */}
        {activeMainMode !== 'EVIDENCE' && (
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="text-ink-muted font-normal">
                {userRole === 'OPD'
                  ? `Kelengkapan: ${completedF01WithProofCount}/31`
                  : `Penilaian: ${filledF02Count}/31`}
              </span>
              <div className="w-20 bg-surface-subtle h-1.5 rounded-full overflow-hidden hidden sm:block border border-stroke/40">
                <div
                  className="bg-brand h-full transition-all duration-300 rounded-full"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
              <span className="text-xs font-medium text-ink">
                {overallProgress}%
              </span>
            </div>

            {userRole === 'OPD' && isF01Editable && <F01GlobalSaveButton />}
            {userRole === 'SUPER_ADMIN' && <F02GlobalSaveButton />}
          </div>
        )}
      </div>

      {activeMainMode === 'EVIDENCE' ? (
        /* ------------------------------------------------------------- */
        /* MODE: MATRIKS BUKTI DUKUNG (6 ASPEK)                           */
        /* ------------------------------------------------------------- */
        <div id="active-workspace-card" className="space-y-4">
          {!activeAspectEvidence ? (
            /* A. Bento Grid Index 6 Aspek */
            <AspectEvidenceGridHub
              evaluationId={evaluationId}
              unitName={unitName}
              isEvaluator={userRole === 'SUPER_ADMIN'}
              onSelectAspect={(code) => handleGoToAspectEvidence(code)}
            />
          ) : (
            /* B. Workspace Berkas Aspek Terpilih */
            <div className="space-y-4">
              {/* Aspect Quick Navigation Tabs */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 bg-surface rounded-2xl border border-stroke/50 shadow-soft-card">
                <button
                  type="button"
                  onClick={handleGoToEvidenceHub}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface-subtle hover:bg-surface-hover text-ink text-xs font-medium transition-all cursor-pointer border border-stroke/60 shadow-2xs shrink-0 self-start sm:self-auto">
                  <ChevronLeft className="w-3.5 h-3.5 text-ink-muted" />
                  <span>Grid 6 Aspek</span>
                </button>

                <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 max-w-full">
                  {['I', 'II', 'III', 'IV', 'V', 'VI', 'TAMBAHAN'].map((code) => {
                    const isActive = activeAspectEvidence === code
                    const grp = groupedAspects.find((g) => g.aspect.code === code)
                    return (
                      <button
                        key={code}
                        type="button"
                        onClick={() => handleGoToAspectEvidence(code)}
                        className={`px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer whitespace-nowrap text-xs ${
                          isActive
                            ? 'bg-brand text-white shadow-hz-button font-semibold'
                            : 'bg-surface-subtle text-ink-secondary hover:text-ink hover:bg-surface-hover border border-stroke/40'
                        }`}>
                        <span>{code === 'TAMBAHAN' ? 'Tambahan (Q31)' : `Aspek ${code}`}</span>
                        {grp && code !== 'TAMBAHAN' && (
                          <span className={`text-[10px] ml-1 hidden md:inline ${isActive ? 'text-white/80' : 'text-ink-muted'}`}>
                            ({grp.aspect.name})
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <AspectEvidenceWorkspace
                evaluationId={evaluationId}
                aspectCode={activeAspectEvidence}
                aspectName={
                  groupedAspects.find((g) => g.aspect.code === activeAspectEvidence)?.aspect.name ||
                  activeAspectEvidence
                }
                isEditable={userRole === 'OPD' && isEvidenceEditable}
                isEvaluator={userRole === 'SUPER_ADMIN'}
                evaluatorAiNote={
                  userRole === 'SUPER_ADMIN' && aiEvaluatorNotes
                    ? aiEvaluatorNotes[activeAspectEvidence] ||
                      aiEvaluatorNotes[normalizeAspectCode(activeAspectEvidence)]
                    : null
                }
                unitId={unitId}
                uploaderName={unitName}
                prevLabel="Kembali ke Grid 6 Aspek"
                onPrev={handleGoToEvidenceHub}
                nextLabel={(() => {
                  const codes = ['I', 'II', 'III', 'IV', 'V', 'VI']
                  const idx = codes.indexOf(activeAspectEvidence)
                  return idx >= 0 && idx < codes.length - 1
                    ? `Lanjut ke Aspek ${codes[idx + 1]}`
                    : 'Selesai 6 Aspek'
                })()}
                onNext={(() => {
                  const codes = ['I', 'II', 'III', 'IV', 'V', 'VI']
                  const idx = codes.indexOf(activeAspectEvidence)
                  return idx >= 0 && idx < codes.length - 1
                    ? () => handleGoToAspectEvidence(codes[idx + 1])
                    : handleGoToEvidenceHub
                })()}
                targetSlotKey={targetSlotKey}
              />
            </div>
          )}
        </div>
      ) : (
        /* ------------------------------------------------------------- */
        /* MODE: PENGISIAN INSTRUMEN SOAL (SPLIT-PANEL)                  */
        /* ------------------------------------------------------------- */
        <div className="space-y-5">
        {/* Mobile: simple stack layout (no resizer on mobile) */}
        <div className="flex flex-col gap-5 lg:hidden">
          <div className="rounded-bento border border-stroke/50 bg-surface p-4 space-y-4 shadow-soft-card">
            <div className="text-xs text-ink-muted text-center">Gunakan perangkat yang lebih besar untuk tampilan dua panel.</div>
          </div>
        </div>

        {/* Desktop: resizable split panel */}
        <div
          ref={splitContainerRef}
          className="hidden lg:flex items-start gap-0 mt-5"
        >
          {/* ------------------------------------------------------------- */}
          {/* LEFT PANEL: PETA PERTANYAAN                                  */}
          {/* ------------------------------------------------------------- */}
          <div
            style={{ width: `${sidebarWidthPct}%`, minWidth: `${SIDEBAR_MIN}%`, maxWidth: `${SIDEBAR_MAX}%` }}
            className="rounded-bento border border-stroke/50 bg-surface p-5 space-y-4 shadow-soft-card sticky top-24 shrink-0"
          >
            <div className="space-y-3.5">
              <div className="flex items-center justify-between pb-3 text-xs border-b border-stroke/40">
                <div className="flex items-center gap-1.5">
                  <span className="font-medium text-ink text-xs">Peta Navigasi</span>
                  {Math.abs(sidebarWidthPct - SIDEBAR_DEFAULT) > 0.5 && (
                    <button
                      type="button"
                      onClick={handleResetSidebarWidth}
                      title="Kembalikan ukuran panel ke default (33%)"
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer border border-stroke/40"
                    >
                      <RotateCcw className="w-2.5 h-2.5" />
                      <span>Reset</span>
                    </button>
                  )}
                </div>
                <span className="text-[11px] font-medium text-brand bg-brand-light px-2.5 py-0.5 rounded-full">
                  Soal #{activeNumber}
                </span>
              </div>

              {/* Left Panel Segmented Tab: HANYA DITAMPILKAN UNTUK EVALUATOR JIKA TIDAK SEDANG PREVIEW */}
              {userRole === 'SUPER_ADMIN' && leftTab !== 'preview' && (
                <div className="flex items-center p-1 bg-surface-subtle/80 rounded-full border border-stroke/50 text-xs gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setLeftTab('questions')
                      syncUrlParams({ tab: 'questions', slot: null, doc: null, pushHistory: true })
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      leftTab === 'questions'
                        ? 'bg-surface-elevated text-ink shadow-pill font-medium'
                        : 'text-ink-secondary hover:text-ink font-normal'
                    }`}>
                    <LayoutGrid className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Pertanyaan</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setLeftTab('evidence')
                      syncUrlParams({ tab: 'evidence', slot: null, doc: null, pushHistory: true })
                    }}
                    className={`flex-1 py-1.5 px-2 rounded-full text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      leftTab === 'evidence'
                        ? 'bg-surface-elevated text-ink shadow-pill font-medium'
                        : 'text-ink-secondary hover:text-ink font-normal'
                    }`}>
                    <FolderOpen className="w-3.5 h-3.5 text-ink-muted" />
                    <span>Bukti ({activeScoreItem.indicator.aspect.code})</span>
                  </button>
                </div>
              )}

            {leftTab === 'preview' && sidebarPreviewDoc ? (
              /* TAB 3: Inline Side-by-Side Live Document Preview */
              <div className="flex flex-col space-y-2.5 h-[calc(100vh-270px)]">
                {/* Header preview with controls */}
                <div className="p-2.5 rounded-xl bg-surface-subtle border border-stroke/50 space-y-1.5 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-ink truncate" title={sidebarPreviewDoc.title}>
                        {sidebarPreviewDoc.title}
                      </p>
                      {(!sidebarPreviewDoc.allSlotAttachments || sidebarPreviewDoc.allSlotAttachments.length <= 1) && sidebarPreviewDoc.fileName && (
                        <p className="text-[10px] text-ink-muted truncate" title={sidebarPreviewDoc.fileName}>
                          {sidebarPreviewDoc.fileName}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <a
                        href={sidebarPreviewDoc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-brand hover:bg-brand-light transition-colors border border-brand/20 bg-surface-elevated"
                        title="Buka dokumen di tab baru browser"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Tab Baru</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          setLeftTab('evidence')
                          setSidebarPreviewDoc(null)
                          syncUrlParams({ tab: 'evidence', slot: null, doc: null, pushHistory: true })
                        }}
                        className="p-1 rounded-md text-ink-muted hover:text-ink hover:bg-surface-elevated transition-colors cursor-pointer"
                        title="Tutup preview & kembali ke daftar bukti"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Navigasi multi-berkas ultra-compact dalam satu komponen bukti */}
                  {sidebarPreviewDoc.allSlotAttachments && sidebarPreviewDoc.allSlotAttachments.length > 1 && (
                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-stroke/30 text-[11px]">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-[10px] font-semibold text-ink-secondary shrink-0">
                          {(sidebarPreviewDoc.currentIndex ?? 0) + 1}/{sidebarPreviewDoc.allSlotAttachments.length}:
                        </span>
                        <select
                          value={sidebarPreviewDoc.currentIndex ?? 0}
                          onChange={(e) => handleNavigatePreviewDoc(parseInt(e.target.value, 10))}
                          className="text-[11px] bg-surface-elevated border border-stroke/60 rounded-md py-0.5 px-1.5 text-ink font-medium focus:ring-1 focus:ring-brand focus:outline-none cursor-pointer truncate w-full"
                        >
                          {sidebarPreviewDoc.allSlotAttachments.map((att, idx) => (
                            <option key={att.id || idx} value={idx}>
                              #{idx + 1}: {att.fileName || `Berkas ${idx + 1}`}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-0.5 shrink-0">
                        <button
                          type="button"
                          disabled={(sidebarPreviewDoc.currentIndex ?? 0) <= 0}
                          onClick={() => handleNavigatePreviewDoc((sidebarPreviewDoc.currentIndex ?? 0) - 1)}
                          className="p-1 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-elevated disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed border border-stroke/40"
                          title="Berkas sebelumnya"
                        >
                          <ChevronLeft className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          disabled={(sidebarPreviewDoc.currentIndex ?? 0) >= sidebarPreviewDoc.allSlotAttachments.length - 1}
                          onClick={() => handleNavigatePreviewDoc((sidebarPreviewDoc.currentIndex ?? 0) + 1)}
                          className="p-1 rounded-md text-ink-secondary hover:text-ink hover:bg-surface-elevated disabled:opacity-30 disabled:hover:bg-transparent cursor-pointer disabled:cursor-not-allowed border border-stroke/40"
                          title="Berkas berikutnya"
                        >
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Embedded Viewer */}
                <div className="flex-1 w-full bg-slate-900/5 rounded-xl border border-stroke/60 overflow-hidden relative">
                  {(() => {
                    const preview = getPreviewUrl(sidebarPreviewDoc.fileUrl)
                    const driveFileId = getDriveFileId(sidebarPreviewDoc.fileUrl)

                    if (preview.type === 'IMAGE') {
                      return (
                        <ZoomableImageContainer
                          src={sidebarPreviewDoc.fileUrl}
                          alt={sidebarPreviewDoc.title}
                        />
                      )
                    }

                    if (preview.type === 'DRIVE' && driveFileId) {
                      return (
                        <iframe
                          src={`https://drive.google.com/file/d/${driveFileId}/preview`}
                          className="w-full h-full border-0 bg-white"
                          title={sidebarPreviewDoc.title}
                          allow="autoplay; encrypted-media"
                        />
                      )
                    }

                    if (preview.type === 'PDF') {
                      return (
                        <iframe
                          src={sidebarPreviewDoc.fileUrl}
                          className="w-full h-full border-0 bg-white"
                          title={sidebarPreviewDoc.title}
                        />
                      )
                    }

                    return (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 bg-surface-subtle">
                        <FileText className="w-10 h-10 text-ink-muted mx-auto" />
                        <div>
                          <h4 className="text-xs font-bold text-ink">Pratinjau Langsung Tidak Tersedia</h4>
                          <p className="text-[11px] text-ink-muted mt-1">
                            Format berkas ini dapat dibuka langsung di tab baru.
                          </p>
                        </div>
                        <a
                          href={sidebarPreviewDoc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand text-white font-medium text-xs shadow-hz-button"
                        >
                          <span>Buka Dokumen</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    )
                  })()}
                </div>
              </div>
            ) : leftTab === 'questions' ? (
              /* TAB 1: Minimalist 5-column Question Numbers Matrix */
              <div className="space-y-6 max-h-[calc(100vh-340px)] overflow-y-auto pr-1">
                {groupedAspects.map(({ aspect, items }) => {
                  const isCurrentAspect = aspect.code === activeScoreItem.indicator.aspect.code

                  return (
                    <div key={aspect.code} className="space-y-2.5">
                      {/* Aspect Header */}
                      <div className="flex items-center justify-between text-[11px]">
                        <span className={`font-medium truncate ${isCurrentAspect ? 'text-ink font-semibold' : 'text-ink-muted'}`}>
                          {aspect.code}. {aspect.name}
                        </span>
                        <span className="text-[10px] text-ink-muted font-normal shrink-0">
                          {items.length} soal
                        </span>
                      </div>

                      {/* Number Grid (Refined, minimal, warm rounded-xl pills) */}
                      <div 
                        className="grid grid-cols-5 text-xs"
                        style={{ rowGap: '12px', columnGap: '6px' }}
                      >
                        {items.map((item) => {
                          const indNum = item.indicator.indicatorNumber
                          const isActive = indNum === activeNumber && !activeAspectEvidence
                          const isDirty = dirtyNumbers.has(indNum)
                          const { state, title } = getItemStatus(item)
                          const rootComments = item.comments || []
                          const commentCount = rootComments.reduce(
                            (acc, c) => acc + 1 + (c.replies?.length || 0),
                            0
                          )

                          return (
                            <button
                              key={item.id}
                              type="button"
                              title={`#${indNum}: ${item.indicator.question} (${title})${commentCount > 0 ? ` • ${commentCount} komentar` : ''}`}
                              onClick={() => handleGoToNumber(indNum)}
                              className={`relative h-10 rounded-xl text-xs flex flex-col items-center justify-center transition-all border cursor-pointer ${
                                isActive
                                  ? 'bg-brand text-white border-brand shadow-hz-button font-medium'
                                  : isDirty
                                    ? 'bg-pastel-rose text-pastel-rose-text border-rose-200 font-medium'
                                    : 'bg-surface-elevated text-ink-secondary border-stroke/60 hover:border-stroke hover:bg-surface-subtle'
                              }`}>
                              <span className="leading-none text-xs font-normal">{indNum}</span>

                              {/* Subtle status indicator dots */}
                              {!isActive && (
                                <span className="flex items-center gap-0.5 mt-1">
                                  {isDirty ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  ) : state === 'complete' || state === 'scored' ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                  ) : state === 'no_proof' || state === 'ready' ? (
                                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  ) : (
                                    <span className="w-1 h-1 rounded-full bg-stroke" />
                                  )}
                                  {commentCount > 0 && (
                                    <span className="w-1 h-1 rounded-full bg-brand" />
                                  )}
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* TAB 2: Bukti Dukung Khusus Aspek dari Pertanyaan yang Sedang Aktif */
              <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                {/* Active Aspect Banner */}
                <div className="p-3.5 rounded-2xl bg-surface-subtle border border-stroke/40 space-y-1">
                  <div className="font-semibold text-xs text-ink">
                    {activeScoreItem.indicator.aspect.name}
                  </div>
                  <p className="text-[11px] text-ink-muted leading-snug">
                    Daftar berkas bukti dukung:
                  </p>
                </div>

                {loadingSidebarEvidence ? (
                  <div className="p-6 text-center text-xs text-slate-500 space-y-2">
                    <Loader2 className="w-4 h-4 text-slate-600 animate-spin mx-auto" />
                    <span>Memuat berkas bukti...</span>
                  </div>
                ) : sidebarEvidenceSlots.length === 0 ? (
                  <div className="p-4 rounded-lg border border-dashed border-slate-200 text-center text-xs text-slate-400">
                    Belum ada berkas bukti dukung untuk aspek ini.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {sidebarEvidenceSlots.map((slot, sIdx) => {
                      const attachments: EvidenceAttachmentItem[] = (slot.attachments && slot.attachments.length > 0)
                        ? slot.attachments
                        : (slot.fileUrl ? [{
                            id: 'main',
                            fileUrl: slot.fileUrl,
                            fileName: slot.fileName || slot.title || 'Berkas Terunggah',
                            fileSize: slot.fileSize || 0,
                            fileType: (slot.fileType as any) || 'DOCUMENT',
                            uploadedAt: new Date().toISOString()
                          }] : [])
                      const hasFiles = attachments.length > 0

                      return (
                        <div
                          key={slot.slotKey || sIdx}
                          className="p-2.5 rounded-lg border border-slate-200 bg-white space-y-2 hover:border-slate-300 transition-all shadow-2xs">
                          {/* Title & Badge */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 leading-snug">
                                {slot.title}
                              </div>
                              {attachments.length > 1 && (
                                <span className="text-[10px] text-ink-muted font-normal">
                                  {attachments.length} berkas terunggah
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {hasFiles && slot.aiInsights?.status && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                                    slot.aiInsights.status === 'LAYAK'
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                                      : slot.aiInsights.status === 'TIDAK_SESUAI'
                                        ? 'bg-rose-50 text-rose-800 border-rose-300'
                                        : 'bg-amber-50 text-amber-800 border-amber-300'
                                  }`}>
                                  {slot.aiInsights.status === 'LAYAK'
                                    ? 'Layak'
                                    : slot.aiInsights.status === 'TIDAK_SESUAI'
                                      ? 'Tidak Sesuai'
                                      : 'Perlu Lengkap'}
                                </span>
                              )}
                              <span className="text-[10px] font-medium text-ink-muted bg-surface-subtle px-2 py-0.5 rounded-full border border-stroke/50">
                                {slot.isMandatory ? 'Wajib' : 'Opsional'}
                              </span>
                            </div>
                          </div>

                          {/* Preview Rows: Render all uploaded files */}
                          {hasFiles ? (
                            <div className="space-y-1">
                              {attachments.map((att, attIdx) => (
                                <button
                                  key={att.id || attIdx}
                                  type="button"
                                  onClick={() => handleOpenSidebarPreview(slot, attIdx)}
                                  className="w-full flex items-center justify-between gap-2 p-1.5 px-2 rounded-md bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/80 transition-colors text-left group/btn cursor-pointer">
                                  <div className="flex items-center gap-1.5 min-w-0">
                                    {attachments.length > 1 && (
                                      <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1 py-0.2 rounded shrink-0">
                                        #{attIdx + 1}
                                      </span>
                                    )}
                                    <FileText className="w-3 h-3 text-emerald-600 shrink-0" />
                                    <span className="text-[11px] text-emerald-950 font-medium truncate">
                                      {att.fileName || 'Lihat Berkas'}
                                    </span>
                                  </div>
                                  <Eye className="w-3 h-3 text-emerald-600 shrink-0 group-hover/btn:scale-110 transition-transform" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 p-2 rounded-lg bg-surface-subtle text-ink-muted text-xs border border-stroke/40">
                              <AlertCircle className="w-3.5 h-3.5 shrink-0 text-ink-muted" />
                              <span>Belum ada berkas diunggah</span>
                            </div>
                          )}

                          {/* Lampiran Catatan Pre-Eval AI per Berkas (Hanya jika ada berkas) */}
                          {hasFiles && slot.aiInsights && (slot.aiInsights.feedback || slot.aiInsights.summary) && (
                            <div
                              className={`p-2 rounded-md text-[11px] font-medium leading-relaxed border space-y-0.5 ${
                                slot.aiInsights.status === 'LAYAK'
                                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                                  : slot.aiInsights.status === 'TIDAK_SESUAI'
                                    ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                                    : 'bg-amber-50/70 border-amber-200 text-amber-950'
                              }`}>
                              <div className="font-bold flex items-center gap-1 text-[11px]">
                                <AlertTriangle className="w-3 h-3 text-slate-700 shrink-0" />
                                <span>Catatan AI:</span>
                              </div>
                              <p className="text-slate-900 pl-4 leading-relaxed font-medium">
                                {slot.aiInsights.feedback || slot.aiInsights.summary}
                              </p>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Button to open full workspace */}
                <button
                  type="button"
                  onClick={() => handleGoToAspectEvidence(activeScoreItem.indicator.aspect.code)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs mt-1">
                  <span>Buka Halaman Bukti Lengkap</span>
                </button>
              </div>
            )}

            {/* Clean Status Legend */}
            {leftTab === 'questions' && (
              <div className="border-t border-slate-100 pt-2.5 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  Lengkap
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  Belum Bukti
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                  Kosong
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  Belum Simpan
                </span>
              </div>
            )}
          </div>
          </div>

          {/* ── Resizer Handle ─────────────────────────────────────────── */}
          <div
            onMouseDown={handleResizerMouseDown}
            onDoubleClick={handleResetSidebarWidth}
            className="hidden lg:flex w-3 items-center justify-center self-stretch shrink-0 cursor-col-resize group z-10 mx-0.5"
            title="Seret untuk mengubah ukuran, klik ganda untuk kembali ke default"
          >
            <div className="h-12 w-0.5 rounded-full bg-stroke/50 group-hover:bg-brand/50 group-active:bg-brand transition-colors duration-150" />
            <GripVertical className="w-3 h-3 text-stroke/60 group-hover:text-brand/60 absolute transition-colors duration-150" />
          </div>

          {/* ------------------------------------------------------------- */}
          {/* RIGHT PANEL: SPACIOUS WORKSPACE (~67% width)                 */}
          {/* ------------------------------------------------------------- */}
          <div id="active-workspace-card" className="flex-1 min-w-0 space-y-4">
          {/* Standard Question Form View */}
          <div className={`rounded-bento border bg-surface shadow-soft-card overflow-hidden transition-all duration-500 ${
            highlightTarget
              ? 'border-brand ring-4 ring-brand/20 shadow-soft-float'
              : 'border-stroke/50'
          }`}>
            <div key={activeNumber} className="animate-fade-in-content">
                {/* Clean Indicator Header (Warm Minimalist) */}
                <div className="p-5 sm:p-6 border-b border-stroke/40 bg-surface-subtle/20 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-xs text-ink bg-surface-elevated px-3 py-1 rounded-full border border-stroke/60 shadow-2xs">
                        #{activeScoreItem.indicator.indicatorNumber} • {activeScoreItem.indicator.code}
                      </span>
                      <span className="text-stroke">•</span>
                      <span className="font-medium text-ink-muted text-xs">
                        Aspek {activeScoreItem.indicator.aspect.code}: {activeScoreItem.indicator.aspect.name}
                      </span>
                      <span className="text-stroke">•</span>
                      <button
                        type="button"
                        onClick={() => handleGoToAspectEvidence(activeScoreItem.indicator.aspect.code)}
                        className="inline-flex items-center gap-1 text-xs text-brand hover:text-brand-hover font-medium cursor-pointer">
                        <UploadCloud className="w-3.5 h-3.5 text-brand shrink-0" />
                        <span>Unggah Bukti Dukung ↗</span>
                      </button>
                      {activeAspectResult && userRole === 'SUPER_ADMIN' && (
                        <>
                          <span className="text-stroke">•</span>
                          <span className="text-xs text-ink-muted font-normal">
                            Nilai: <strong className="text-ink font-medium">{formatScore(activeAspectResult.percentage)}%</strong>
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Deep Link Alert Callout */}
                  {highlightTarget && (
                    <div className="p-2.5 rounded-xl bg-brand-light border border-brand/40 text-brand text-xs flex items-center justify-between gap-3 animate-fade-in-content">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-brand animate-ping shrink-0" />
                        <span className="font-medium">
                          Membuka Indikator #{activeScoreItem.indicator.indicatorNumber} ({activeScoreItem.indicator.code}) dari notifikasi.
                        </span>
                      </div>
                      <span className="text-[10px] text-brand/80 font-mono bg-white/60 px-2 py-0.5 rounded-full shrink-0">
                        Fokus Target
                      </span>
                    </div>
                  )}

                  {/* Question Title */}
                  <div className="space-y-1.5 pt-0.5">
                    {activeScoreItem.indicator.isSupplementary && (
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] bg-surface-subtle text-ink-muted border border-stroke/50 mb-1">
                        Pertanyaan Tambahan
                      </span>
                    )}
                    <h2 className="text-base sm:text-lg font-medium text-ink leading-relaxed">
                      {activeScoreItem.indicator.question}
                    </h2>
                  </div>
                </div>

                {/* Body Content */}
                <div className="p-5 sm:p-6 space-y-6">
                  {/* Evaluator View: OPD Self-Assessment Summary (F01) */}
                  {userRole === 'SUPER_ADMIN' && (
                    <F01SummaryCard
                      indicatorNumber={activeScoreItem.indicator.indicatorNumber}
                      f01Data={activeScoreItem.f01Data}
                      proofUrl={activeScoreItem.proofUrl}
                      targetItem={targetItem}
                    />
                  )}

                  {/* Question Form / Scoring Form */}
                  {userRole === 'OPD' ? (
                    <>
                      {/* Catatan Rekomendasi Aspek dari Evaluator */}
                      {(() => {
                        const aspectCode = activeScoreItem.indicator.aspect.code
                        const note =
                          aspectNotes?.[aspectCode] ||
                          aspectNotes?.[normalizeAspectCode(aspectCode)] ||
                          ''
                        if (!note) return null
                        return (
                          <div className="p-4 rounded-xl bg-pastel-amber/40 border border-pastel-amber-border text-xs space-y-1.5 shadow-2xs">
                            <div className="flex items-center gap-2 font-medium text-ink">
                              <MessageSquare className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                              <span>Catatan Rekomendasi Evaluator: Aspek {activeScoreItem.indicator.aspect.name}</span>
                            </div>
                            <p className="text-ink leading-relaxed whitespace-pre-wrap pl-5.5 font-normal">
                              {note}
                            </p>
                          </div>
                        )
                      })()}

                      <F01QuestionForm
                        evaluationScoreId={activeScoreItem.id}
                        indicatorNumber={activeScoreItem.indicator.indicatorNumber}
                        serverF01Data={activeScoreItem.f01Data}
                        draftF01Data={draftF01[activeNumber]?.f01Data}
                        serverProofUrl={activeScoreItem.proofUrl}
                        draftProofUrl={draftF01[activeNumber]?.proofUrl}
                        unitId={unitId}
                        isEditable={isF01Editable}
                        driveFolderUrl={driveFolderUrl}
                        targetItem={targetItem}
                        onF01Change={(f01Data, proofUrl) => {
                          setDraftF01((prev) => ({
                            ...prev,
                            [activeNumber]: {
                              evaluationScoreId: activeScoreItem.id,
                              f01Data,
                              proofUrl
                            }
                          }))
                        }}
                        onSaveSuccess={(savedData) => {
                          setDraftF01((prev) => {
                            const next = { ...prev }
                            delete next[activeNumber]
                            return next
                          })
                          // Update local internalScores state so UI stays completely up to date
                          setInternalScores((prev) =>
                            prev.map((item) =>
                              item.indicator.indicatorNumber === activeNumber
                                ? {
                                    ...item,
                                    f01Data: savedData.f01Data,
                                    proofUrl: savedData.proofUrl,
                                    f01Submitted: true
                                  }
                                : item
                            )
                          )
                        }}
                      />
                    </>
                  ) : (
                    <F02GuidanceSection
                      indicatorNumber={activeScoreItem.indicator.indicatorNumber}
                      indicatorId={activeScoreItem.indicator.id}
                      evaluationId={evaluationId}
                      serverScore={activeScoreItem.score}
                      draftScore={draftF02[activeNumber]?.score}
                      serverNotes={activeScoreItem.notes}
                      draftNotes={draftF02[activeNumber]?.notes}
                      aspectCode={activeScoreItem.indicator.aspect.code}
                      aspectName={activeScoreItem.indicator.aspect.name}
                      serverAspectNote={
                        aspectNotes?.[activeScoreItem.indicator.aspect.code] ||
                        aspectNotes?.[normalizeAspectCode(activeScoreItem.indicator.aspect.code)] ||
                        ''
                      }
                      draftAspectNote={draftAspectNotes[activeScoreItem.indicator.aspect.code]}
                      unitId={unitId}
                      aiSuggestedScore={activeScoreItem.aiSuggestedScore}
                      aiConfidence={activeScoreItem.aiConfidence}
                      aiConfidenceReason={activeScoreItem.aiConfidenceReason}
                      aiCriticalAudit={activeScoreItem.aiCriticalAudit}
                      aiWeaknessNotes={activeScoreItem.aiWeaknessNotes}
                      aiVerificationTips={activeScoreItem.aiVerificationTips}
                      onScoreChange={(score) => {
                        setDraftF02((prev) => ({
                          ...prev,
                          [activeNumber]: {
                            indicatorId: activeScoreItem.indicator.id,
                            score,
                            notes: prev[activeNumber]?.notes ?? activeScoreItem.notes ?? undefined
                          }
                        }))
                      }}
                      onNotesChange={(notes) => {
                        setDraftF02((prev) => ({
                          ...prev,
                          [activeNumber]: {
                            indicatorId: activeScoreItem.indicator.id,
                            score: prev[activeNumber]?.score ?? activeScoreItem.score ?? null,
                            notes
                          }
                        }))
                      }}
                      onAspectNoteChange={(aspectCode, note) => {
                        setDraftAspectNotes((prev) => ({
                          ...prev,
                          [aspectCode]: note
                        }))
                      }}
                      onSaveSuccess={(savedData) => {
                        setDraftF02((prev) => {
                          const next = { ...prev }
                          delete next[activeNumber]
                          return next
                        })
                        // Update local internalScores state so UI stays completely up to date
                        setInternalScores((prev) =>
                          prev.map((item) =>
                            item.indicator.indicatorNumber === activeNumber
                              ? {
                                  ...item,
                                  score: savedData.score,
                                  notes: savedData.notes ?? item.notes
                                }
                              : item
                          )
                        )
                      }}
                    />
                  )}

                  {/* Clarification Comments Section */}
                  <div className="pt-2">
                    <IndicatorCommentSection
                      evaluationScoreId={activeScoreItem.id}
                      comments={activeScoreItem.comments || []}
                      unitId={unitId}
                      authorId={userId}
                    />
                  </div>
                </div>

                {/* Footer Navigation Bar */}
                <div className="px-6 py-4 bg-surface-subtle/20 border-t border-stroke/40 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    disabled={!prevScoreItem}
                    onClick={() => prevScoreItem && handleGoToNumber(prevScoreItem.indicator.indicatorNumber)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-stroke/60 bg-surface hover:bg-surface-subtle text-ink-secondary font-normal text-xs transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-2xs">
                    <ChevronLeft className="w-3.5 h-3.5" />
                    <span>Sebelumnya (#{prevScoreItem ? prevScoreItem.indicator.indicatorNumber : '-'})</span>
                  </button>

                  <div className="text-xs text-ink-muted hidden sm:block">
                    Soal <strong className="text-ink font-medium">#{activeNumber}</strong> dari {totalIndicators}
                  </div>

                  {isLastQuestionInAspect ? (
                    <button
                      type="button"
                      onClick={() => handleGoToAspectEvidence(activeScoreItem.indicator.aspect.code)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-medium text-xs transition-all cursor-pointer shadow-hz-button">
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>Upload Bukti Aspek {activeScoreItem.indicator.aspect.code}</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={!nextScoreItem}
                      onClick={() => nextScoreItem && handleGoToNumber(nextScoreItem.indicator.indicatorNumber)}
                      className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand hover:bg-brand-hover text-white font-medium text-xs transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer shadow-hz-button">
                      <span>Berikutnya (#{nextScoreItem ? nextScoreItem.indicator.indicatorNumber : 'Selesai'})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Lightbox Document Preview Modal (Mounted to body via createPortal, Zero Gap) */}
      {modalPreviewItem && mounted && createPortal(
        <div
          className="fixed inset-0 top-0 left-0 right-0 bottom-0 w-screen h-screen z-[99999] bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 m-0 animate-fade-in"
          onClick={() => setModalPreviewItem(null)}>
          <div
            className="bg-surface rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-stroke/50"
            onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="p-4 sm:px-6 sm:py-4 border-b border-stroke/40 flex items-center justify-between gap-3 bg-surface-subtle/30">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-xs text-brand bg-brand-light px-2.5 py-0.5 rounded-full border border-brand/20">
                    Preview Dokumen
                  </span>
                  {modalPreviewItem.isMandatory && (
                    <span className="text-[10px] font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                      • Dokumen Wajib
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-medium text-ink truncate mt-1">
                  {modalPreviewItem.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={modalPreviewItem.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-all shadow-hz-button cursor-pointer">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Buka di Tab Baru</span>
                </a>
                <button
                  type="button"
                  onClick={() => setModalPreviewItem(null)}
                  className="p-1.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-200 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 bg-slate-900 overflow-auto flex items-center justify-center p-2 sm:p-4 min-h-[420px] max-h-[75vh]">
              {(() => {
                const preview = getPreviewUrl(modalPreviewItem.fileUrl)
                const driveFileId = getDriveFileId(modalPreviewItem.fileUrl)

                if (preview.type === 'IMAGE') {
                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={modalPreviewItem.fileUrl}
                      alt={modalPreviewItem.title}
                      className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-sm"
                    />
                  )
                }

                if (preview.type === 'DRIVE' && driveFileId) {
                  return (
                    <iframe
                      src={`https://drive.google.com/file/d/${driveFileId}/preview`}
                      className="w-full h-full min-h-[500px] border-0 rounded-lg bg-white"
                      title={modalPreviewItem.title}
                    />
                  )
                }

                if (preview.type === 'PDF') {
                  return (
                    <iframe
                      src={modalPreviewItem.fileUrl}
                      className="w-full h-full min-h-[500px] border-0 rounded-lg bg-white"
                      title={modalPreviewItem.title}
                    />
                  )
                }

                return (
                  <div className="text-center p-8 space-y-3 bg-slate-800 rounded-xl max-w-md">
                    <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Pratinjau Langsung Tidak Tersedia</h4>
                      <p className="text-xs text-slate-400 mt-1">
                        Format berkas ini dapat diunduh atau dibuka langsung di tab baru.
                      </p>
                    </div>
                    <a
                      href={modalPreviewItem.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#2B6CB0] text-white font-bold text-xs shadow-hz-button">
                      <span>Buka Dokumen di Tab Baru</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )
              })()}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}
