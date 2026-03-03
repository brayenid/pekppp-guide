/* eslint-disable react-hooks/set-state-in-effect */
// src/components/FloatingUploadCTA.tsx
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { UploadCloud, ExternalLink, X, Clock, ChevronRight } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FloatingUploadCTAProps {
  uploadUrl: string
  isWiki?: boolean
  /** Aktifkan animasi "nyelam": tombol turun ke bawah layar, diam sebentar, lalu muncul kembali */
  bobbing?: boolean
  /** Durasi tampil sebelum nyelam (ms). Default: 6000 */
  bobbingVisibleMs?: number
  /** Durasi sembunyi di bawah layar (ms). Default: 4000 */
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
  { label: '1 Jam', hours: 1, color: '#FFDE59' },
  { label: '3 Jam', hours: 3, color: '#FF90E8' },
  { label: '12 Jam', hours: 12, color: '#57E7FB' },
  { label: '1 Hari', hours: 24, color: '#B8FF9F' }
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
    // Jika localStorage tidak tersedia, fallback ke state biasa (tapi tidak akan bertahan reload)
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
    x: [0, -34, 34, -17, 17, -12, 12, 0],
    rotate: [0, -20, 20, -12, 12, -4, 4, 0],
    transition: { duration: 0.55, type: 'tween' as const }
  }
}

// Slide masuk dari bawah / turun keluar layar
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
  const [visible, setVisible] = useState(false) // apakah komponen di-render
  const [surfaced, setSurfaced] = useState(true) // apakah sedang naik atau nyelam
  const [shakeKey, setShakeKey] = useState(0)
  const [isShaking, setIsShaking] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [hoveredOption, setHoveredOption] = useState<number | null>(null)

  // ── On mount: cek localStorage ────────────────────────────────────────────
  useEffect(() => {
    const until = getHiddenUntil()
    if (until && Date.now() < until) {
      setVisible(false)
    } else {
      clearHidden()
      setTimeout(() => setVisible(true), 1200)
    }
  }, [])

  // ── Shake cycle ───────────────────────────────────────────────────────────
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

  // ── Bobbing cycle ─────────────────────────────────────────────────────────
  // naik (bobbingVisibleMs) → nyelam (bobbingHiddenMs) → naik → …
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

    // Mulai siklus pertama setelah durasi tampil pertama
    surfacedTimer = setTimeout(cycle, bobbingVisibleMs)

    return () => {
      clearTimeout(surfacedTimer)
      clearTimeout(hiddenTimer)
    }
  }, [visible, bobbing, bobbingVisibleMs, bobbingHiddenMs])

  // ── Saat dialog terbuka, paksa tombol naik ke permukaan ──────────────────
  useEffect(() => {
    if (showDialog) setSurfaced(true)
  }, [showDialog])

  // ── Hide dengan durasi ────────────────────────────────────────────────────
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
          isWiki ? 'bottom-12 lg:bottom-3' : 'bottom-3'
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
            className="absolute -top-2.5 -right-2.5 z-10 w-6 h-6 bg-black text-white border-2 border-black flex items-center justify-center hover:bg-red-500 transition-colors shadow-[2px_2px_0px_0px_#555]">
            <X className="w-3 h-3" strokeWidth={3} />
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
            className="flex items-center gap-3 px-2 py-2 bg-[#57E7FB] border-4 border-black shadow-[2px_2px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 transition-all group">
            <div className="bg-black text-white p-1 border-2 border-transparent group-hover:bg-white group-hover:text-black group-hover:border-black transition-colors">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Google Drive</span>
              <span className="text-sm font-black uppercase leading-none">Unggah Berkas</span>
            </div>
            <ExternalLink className="w-4 h-4 ml-2" />
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
              className="fixed inset-0 z-[90] bg-black/40 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 20 }}
              transition={{ type: 'spring', stiffness: 400, damping: 28 }}
              className="fixed bottom-20 right-6 z-[100] w-72 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000]">
              <div className="bg-black text-white px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#FFDE59]" strokeWidth={2.5} />
                  <span className="text-xs font-black uppercase tracking-widest">Sembunyikan Selama?</span>
                </div>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-white/60 hover:text-white transition-colors">
                  <X className="w-4 h-4" strokeWidth={2.5} />
                </button>
              </div>

              <div className="px-4 pt-3 pb-1 border-b-2 border-black">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">
                  Tombol akan muncul kembali setelah:
                </p>
              </div>

              <div className="p-3 flex flex-col gap-2">
                {HIDE_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.hours}
                    onClick={() => handleHide(opt.hours)}
                    onMouseEnter={() => setHoveredOption(i)}
                    onMouseLeave={() => setHoveredOption(null)}
                    className="group relative flex items-center justify-between px-4 py-3 border-2 border-black font-black text-sm uppercase tracking-wide transition-all hover:-translate-y-0.5"
                    style={{
                      backgroundColor: hoveredOption === i ? opt.color : 'white',
                      boxShadow: hoveredOption === i ? '4px 4px 0px 0px #000' : '2px 2px 0px 0px #000'
                    }}>
                    <span
                      className="w-3 h-3 border-2 border-black shrink-0 transition-transform group-hover:rotate-45"
                      style={{ backgroundColor: opt.color }}
                    />
                    <span className="flex-1 text-left ml-3">{opt.label}</span>
                    <ChevronRight
                      className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity"
                      strokeWidth={3}
                    />
                  </button>
                ))}
              </div>

              <div className="px-4 pb-4">
                <p className="text-[10px] font-bold text-gray-400 text-center uppercase tracking-widest">
                  ※ Tombol tidak dapat disembunyikan selamanya
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
