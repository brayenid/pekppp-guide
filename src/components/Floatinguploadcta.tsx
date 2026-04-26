/* eslint-disable react-hooks/set-state-in-effect */
// src/components/Floatinguploadcta.tsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, ExternalLink, X, Clock, ChevronRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloatingUploadCTAProps {
  uploadUrl: string
  isWiki?: boolean
  bobbing?: boolean
  bobbingVisibleMs?: number
  bobbingHiddenMs?: number
}

type HideDuration = {
  label: string
  hours: number
  color: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'floatingCTA_hiddenUntil'

const HIDE_OPTIONS: HideDuration[] = [
  { label: '1 Jam', hours: 1, color: '#f8fafc' }, // slate-50
  { label: '3 Jam', hours: 3, color: '#f1f5f9' }, // slate-100
  { label: '12 Jam', hours: 12, color: '#e2e8f0' }, // slate-200
  { label: '1 Hari', hours: 24, color: '#cbd5e1' } // slate-300
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getHiddenUntil(): number | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const val = parseInt(raw, 10)
    return isNaN(val) ? null : val
  } catch {
    return null
  }
}

function setHiddenUntil(hours: number) {
  try {
    const until = Date.now() + hours * 60 * 60 * 1000
    localStorage.setItem(STORAGE_KEY, String(until))
  } catch {
    // Ignore
  }
}

function clearHidden() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Ignore
  }
}

// ─── Animation Variants ───────────────────────────────────────────────────────

const shakeVariant = {
  idle: { x: 0, rotate: 0 },
  shake: {
    x: [0, -10, 10, -5, 5, -2, 2, 0],
    rotate: [0, -5, 5, -3, 3, -1, 1, 0],
    transition: { duration: 0.5, type: 'tween' as const }
  }
}

const diveVariants = {
  visible: {
    y: 0,
    opacity: 1,
    transition: { type: 'spring' as const, stiffness: 260, damping: 22 }
  },
  hidden: {
    y: 120,
    opacity: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 28 }
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FloatingUploadCTA = ({
  uploadUrl,
  isWiki = false,
  bobbing = false,
  bobbingVisibleMs = 6000,
  bobbingHiddenMs = 4000
}: FloatingUploadCTAProps) => {
  const [visible, setVisible] = useState(false)
  const [surfaced, setSurfaced] = useState(true)
  const [shakeKey, setShakeKey] = useState(0)
  const [isShaking, setIsShaking] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [hoveredOption, setHoveredOption] = useState<number | null>(null)

  useEffect(() => {
    const until = getHiddenUntil()
    if (until && Date.now() < until) {
      setVisible(false)
    } else {
      clearHidden()
      setTimeout(() => setVisible(true), 1200)
    }
  }, [])

  const triggerShake = useCallback(() => {
    setIsShaking(true)
    setShakeKey((k) => k + 1)
    setTimeout(() => setIsShaking(false), 600)
  }, [])

  useEffect(() => {
    if (!visible) return
    const firstShake = setTimeout(() => triggerShake(), 2000)
    const interval = setInterval(() => triggerShake(), 9000)
    return () => {
      clearTimeout(firstShake)
      clearInterval(interval)
    }
  }, [visible, triggerShake])

  useEffect(() => {
    if (!visible || !bobbing) return

    let surfacedTimer: ReturnType<typeof setTimeout>
    let hiddenTimer: ReturnType<typeof setTimeout>

    const cycle = () => {
      setSurfaced(true)
      surfacedTimer = setTimeout(() => {
        setSurfaced(false)
        hiddenTimer = setTimeout(cycle, bobbingHiddenMs)
      }, bobbingVisibleMs)
    }

    surfacedTimer = setTimeout(cycle, bobbingVisibleMs)

    return () => {
      clearTimeout(surfacedTimer)
      clearTimeout(hiddenTimer)
    }
  }, [visible, bobbing, bobbingVisibleMs, bobbingHiddenMs])

  useEffect(() => {
    if (showDialog) setSurfaced(true)
  }, [showDialog])

  const handleHide = (hours: number) => {
    setHiddenUntil(hours)
    setShowDialog(false)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <>
      {/* ── Floating Button ─────────────────────────────────────────────── */}
      <div
        className={`fixed right-6 z-40 transition-[bottom] duration-300 ${
          isWiki ? 'bottom-12 lg:bottom-6' : 'bottom-6'
        }`}>
        <motion.div
          variants={bobbing ? diveVariants : undefined}
          initial={bobbing ? 'hidden' : false}
          animate={bobbing ? (surfaced ? 'visible' : 'hidden') : undefined}
          className="relative">
          {/* Close / hide trigger */}
          <button
            onClick={() => setShowDialog(true)}
            aria-label="Sembunyikan tombol"
            className="absolute -top-3 -right-3 z-10 w-7 h-7 bg-white text-slate-500 rounded-full flex items-center justify-center hover:bg-slate-100 hover:text-slate-800 transition-colors shadow-md border border-slate-200">
            <X className="w-4 h-4" />
          </button>

          {/* Main CTA */}
          <motion.a
            key={shakeKey}
            href={uploadUrl}
            target="_blank"
            rel="noopener noreferrer"
            variants={shakeVariant}
            initial="idle"
            animate={isShaking ? 'shake' : 'idle'}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-3 px-4 py-3 bg-gov-blue text-white rounded-xl shadow-lg shadow-gov-blue/20 hover:shadow-xl hover:shadow-gov-blue/30 hover:-translate-y-1 transition-all group border border-gov-blue/50">
            <div className="bg-white/10 text-gov-gold p-2 rounded-lg group-hover:bg-gov-gold group-hover:text-gov-blue transition-colors">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left pr-2">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-300 leading-none mb-1">Google Drive</span>
              <span className="text-sm font-bold leading-none">Unggah Berkas</span>
            </div>
            <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-white transition-colors" />
          </motion.a>
        </motion.div>
      </div>

      {/* ── Hide Dialog ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showDialog && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDialog(false)}
              className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="fixed bottom-24 right-6 z-[100] w-72 bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-gov-blue text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gov-gold" />
                  <span className="text-xs font-semibold uppercase tracking-wider">Sembunyikan?</span>
                </div>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-white/70 hover:text-white transition-colors bg-white/10 p-1 rounded-md">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-5 pt-4 pb-2">
                <p className="text-xs font-medium text-slate-500">
                  Tombol akan muncul kembali setelah:
                </p>
              </div>

              <div className="px-3 pb-3 flex flex-col gap-1.5">
                {HIDE_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.hours}
                    onClick={() => handleHide(opt.hours)}
                    onMouseEnter={() => setHoveredOption(i)}
                    onMouseLeave={() => setHoveredOption(null)}
                    className="group flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor: hoveredOption === i ? opt.color : 'transparent',
                      color: hoveredOption === i ? '#0f172a' : '#475569'
                    }}>
                    <span className="flex-1 text-left">{opt.label}</span>
                    <ChevronRight
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-gov-blue"
                    />
                  </button>
                ))}
              </div>

              <div className="bg-slate-50 px-5 py-3 border-t border-slate-100">
                <p className="text-[10px] text-slate-400 text-center uppercase tracking-wider">
                  * Tombol tidak dapat disembunyikan selamanya
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
