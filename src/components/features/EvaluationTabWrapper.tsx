'use client'

import React, { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { ClipboardList, FolderHeart, Maximize2, Minimize2, UploadCloud } from 'lucide-react'
import { EvaluationNavbarStatus } from '../layout/Navbar'

export function EvaluationTabWrapper({
  f02Content,
  f03Content,
  f03Count = 0,
  userRole = 'SUPER_ADMIN',
  incompleteAspectsCount = 0,
  evaluationId
}: {
  f02Content: React.ReactNode
  f03Content: React.ReactNode
  f03Count?: number
  userRole?: string
  incompleteAspectsCount?: number
  evaluationId?: string
}) {
  const [activeTab, setActiveTab] = useState<'f02' | 'evidence' | 'f03'>('f02')
  const [isFocusMode, setIsFocusMode] = useState<boolean>(false)
  const [mounted, setMounted] = useState<boolean>(false)
  const [incompleteCount, setIncompleteCount] = useState<number>(incompleteAspectsCount)
  const isOpd = userRole === 'OPD'

  useEffect(() => {
    setIncompleteCount(incompleteAspectsCount)
  }, [incompleteAspectsCount])

  useEffect(() => {
    const handleEvidenceUpdate = () => {
      if (evaluationId) {
        import('../../actions/evidence-slot-actions').then(({ getAspectEvidenceOverviewAction }) => {
          getAspectEvidenceOverviewAction(evaluationId).then((res) => {
            if (res.success && res.overview) {
              setIncompleteCount(res.overview.filter((a) => !a.isComplete).length)
            }
          })
        })
      }
    }
    window.addEventListener('evidence-updated', handleEvidenceUpdate)
    return () => window.removeEventListener('evidence-updated', handleEvidenceUpdate)
  }, [evaluationId])

  useEffect(() => {
    setMounted(true)
    if (typeof window !== 'undefined') {
      const handleHashOrQuery = () => {
        const sp = new URLSearchParams(window.location.search)
        const hash = window.location.hash.replace(/^#/, '')
        const mode = sp.get('mode')

        // Backward compatibility: Convert hash to query if hash exists
        if (hash) {
          const url = new URL(window.location.href)
          url.hash = ''
          if (hash === 'matriks-bukti') {
            url.searchParams.set('mode', 'evidence')
          } else if (hash.startsWith('bukti-')) {
            url.searchParams.set('mode', 'evidence')
            url.searchParams.set('aspek', hash.replace('bukti-', ''))
          } else if (hash.startsWith('soal-')) {
            url.searchParams.set('mode', 'questions')
            url.searchParams.set('soal', hash.replace('soal-', ''))
          } else if (hash === 'f03') {
            url.searchParams.set('mode', 'f03')
          }
          window.history.replaceState(null, '', url.toString())
        }

        const effectiveMode = sp.get('mode') || (hash === 'matriks-bukti' || hash.startsWith('bukti-') ? 'evidence' : hash.startsWith('soal-') ? 'questions' : hash === 'f03' ? 'f03' : null)

        if (effectiveMode === 'evidence') {
          setActiveTab('evidence')
        } else if (effectiveMode === 'f03') {
          setActiveTab('f03')
        } else {
          setActiveTab('f02')
        }
      }

      handleHashOrQuery()
      window.addEventListener('hashchange', handleHashOrQuery)
      window.addEventListener('popstate', handleHashOrQuery)
      return () => {
        window.removeEventListener('hashchange', handleHashOrQuery)
        window.removeEventListener('popstate', handleHashOrQuery)
      }
    }
  }, [])

  const handleTabClick = (tab: 'f02' | 'evidence' | 'f03') => {
    setActiveTab(tab)
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href)
      url.hash = ''
      if (tab === 'evidence') {
        url.searchParams.set('mode', 'evidence')
        url.searchParams.delete('soal')
      } else if (tab === 'f02') {
        url.searchParams.set('mode', 'questions')
        if (!url.searchParams.get('soal')) {
          url.searchParams.set('soal', '1')
        }
      } else if (tab === 'f03') {
        url.searchParams.set('mode', 'f03')
        url.searchParams.delete('soal')
        url.searchParams.delete('aspek')
      }
      window.history.replaceState(null, '', url.toString())
    }
  }

  // Handle ESC key to exit focus mode & prevent background scroll
  useEffect(() => {
    if (isFocusMode) {
      document.body.style.overflow = 'hidden'
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsFocusMode(false)
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => {
        document.body.style.overflow = 'unset'
        window.removeEventListener('keydown', handleKeyDown)
      }
    } else {
      document.body.style.overflow = 'unset'
    }
  }, [isFocusMode])

  const content = (
    <div className="space-y-4">
      {/* Clean Unified 3-Pillar Tab Switcher + Mode Fokus Toggle */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke/40 pb-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center p-1 bg-surface-subtle/80 border border-stroke/60 rounded-full shadow-2xs gap-1">
            {/* 1. Formulir Utama: F01 (OPD) atau F02 (Evaluator) */}
            <button
              type="button"
              onClick={() => handleTabClick('f02')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'f02'
                  ? 'bg-surface-elevated text-ink shadow-pill'
                  : 'text-ink-secondary hover:text-ink'
              }`}>
              <ClipboardList className="w-3.5 h-3.5 text-inherit" />
              <span>{isOpd ? 'Formulir F01' : 'Penilaian F02'}</span>
            </button>

            {/* 2. Formulir Uji Petik: F03 */}
            <button
              type="button"
              onClick={() => handleTabClick('f03')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'f03'
                  ? 'bg-surface-elevated text-ink shadow-pill'
                  : 'text-ink-secondary hover:text-ink'
              }`}>
              <FolderHeart className="w-3.5 h-3.5 text-inherit" />
              <span>Survei F03</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                  activeTab === 'f03'
                    ? 'bg-brand-light text-brand'
                    : 'bg-surface-subtle text-ink-muted'
                }`}>
                {f03Count}
              </span>
            </button>

            {/* 3. Bukti Dukung (Aksen Amber Warm Minimalist) */}
            <button
              type="button"
              onClick={() => handleTabClick('evidence')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                activeTab === 'evidence'
                  ? 'bg-brand text-white shadow-hz-button'
                  : 'text-ink-secondary hover:text-ink'
              }`}>
              <UploadCloud className="w-3.5 h-3.5 text-inherit" />
              <span>Unggah Bukti Dukung</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-medium transition-colors ${
                  activeTab === 'evidence'
                    ? 'bg-white/20 text-white'
                    : incompleteCount === 0
                    ? 'bg-pastel-green text-pastel-green-text'
                    : 'bg-pastel-rose text-pastel-rose-text'
                }`}
                title={
                  incompleteCount === 0
                    ? 'Seluruh 6 aspek telah lengkap'
                    : `${incompleteCount} dari 6 aspek belum lengkap / belum diisi`
                }>
                {incompleteCount}
              </span>
            </button>
          </div>

          {/* Status Disimpan / Belum Disimpan - Beranimasi saat Mode Fokus Aktif */}
          <div
            className={`transition-all duration-300 ease-out overflow-hidden flex items-center ${
              isFocusMode
                ? 'opacity-100 max-w-[260px] translate-x-0 scale-100'
                : 'opacity-0 max-w-0 -translate-x-2 scale-95 pointer-events-none'
            }`}>
            <EvaluationNavbarStatus userRole={userRole} className="flex" />
          </div>
        </div>

        {/* Focus Mode Toggle Button */}
        <button
          type="button"
          onClick={() => setIsFocusMode(!isFocusMode)}
          className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all border cursor-pointer select-none ${
            isFocusMode
              ? 'bg-surface-elevated hover:bg-surface-subtle text-ink border-stroke/80 shadow-soft-card'
              : 'bg-surface-elevated hover:bg-surface-subtle text-ink-secondary hover:text-ink border-stroke/60 shadow-2xs'
          }`}>
          {isFocusMode ? (
            <>
              <Minimize2 className="w-3.5 h-3.5 text-brand" />
              <span>Keluar Mode Fokus</span>
            </>
          ) : (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-ink-muted" />
              <span>Mode Fokus</span>
            </>
          )}
        </button>
      </div>

      {/* Tab Panels */}
      <div>
        {(activeTab === 'f02' || activeTab === 'evidence') && (
          <div>
            {React.isValidElement(f02Content)
              ? React.cloneElement(f02Content as React.ReactElement<any>, {
                  activeMainMode: activeTab === 'evidence' ? 'EVIDENCE' : 'QUESTIONS',
                  onActiveMainModeChange: (mode: 'QUESTIONS' | 'EVIDENCE') =>
                    setActiveTab(mode === 'EVIDENCE' ? 'evidence' : 'f02')
                })
              : f02Content}
          </div>
        )}
        {activeTab === 'f03' && <div>{f03Content}</div>}
      </div>
    </div>
  )

  if (isFocusMode && mounted) {
    return createPortal(
      <div className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] bg-canvas overflow-y-auto p-4 sm:p-6 lg:p-8 m-0">
        <div className="max-w-[1720px] mx-auto">
          {content}
        </div>
      </div>,
      document.body
    )
  }

  return content
}
