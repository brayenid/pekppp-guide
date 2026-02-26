import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BarChart3,
  Search,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Award,
  Layers,
  Filter,
  X,
  ChevronRight,
  Building2,
  Stethoscope,
  MapPin,
  FileDown,
  Loader2
} from 'lucide-react'
import { downloadBA } from '../components/BeritaAcaraPDF'

// ─────────────────────────────────────────────────────────────────────────────
// KONFIGURASI: Edit array ini untuk menentukan OPD mana saja yang ditampilkan.
// Kosongkan array (VISIBLE_OPDS = []) untuk menampilkan semua OPD.
// ─────────────────────────────────────────────────────────────────────────────
const VISIBLE_OPDS: string[] = []

// ─────────────────────────────────────────────────────────────────────────────
// KONFIGURASI: Google Sheets
// ─────────────────────────────────────────────────────────────────────────────
const SPREADSHEET_ID = '1Wz8lejVHuJ2v73dINhYiM6gbnA-zAMMGG6HMk5coQG4'
const SHEET_NAME = 'EXPORT_API'
const GS_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&sheet=${encodeURIComponent(SHEET_NAME)}`

// ─────────────────────────────────────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────────────────────────────────────
interface RawRow {
  opd_id: number
  opd_name: string
  section: string
  kode_indikator: string
  nama_indikator: string
  nilai: number | null
  keterangan: string
  sumber_data: string
  nilai_maks: number
  nilai_skala5: number | null // ← dari kolom baru EXPORT_API (nilai unit-level, sama tiap baris)
}

interface OpdSummary {
  opd_name: string
  kategori: 'OPD' | 'Puskesmas' | 'Kecamatan'
  total: number
  maks: number
  persen: number
  skala5: number // ← nilai dalam skala 0–5 (dibaca dari data Excel)
  bySection: Record<string, { total: number; maks: number }>
  rows: RawRow[]
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const SECTION_COLORS: Record<string, string> = {
  'KEBIJAKAN PELAYANAN': '#FF9F1C',
  'PROFESIONALISME SDM': '#4ECDC4',
  'SARANA PRASARANA': '#A8E6CF',
  'SISTEM INFORMASI PELAYANAN PUBLIK': '#FFD93D',
  'KONSULTASI DAN PENGADUAN': '#FF6B6B',
  'INOVASI PELAYANAN PUBLIK': '#C77DFF'
}

const SECTION_SHORT: Record<string, string> = {
  'KEBIJAKAN PELAYANAN': 'Kebijakan',
  'PROFESIONALISME SDM': 'SDM',
  'SARANA PRASARANA': 'Sarpras',
  'SISTEM INFORMASI PELAYANAN PUBLIK': 'SIPP',
  'KONSULTASI DAN PENGADUAN': 'Konsultasi',
  'INOVASI PELAYANAN PUBLIK': 'Inovasi'
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function detectKategori(name: string): OpdSummary['kategori'] {
  if (name.startsWith('Puskesmas')) return 'Puskesmas'
  if (name.startsWith('Kecamatan')) return 'Kecamatan'
  return 'OPD'
}

// Helper untuk memastikan nilai adalah number
function toNumber(val: unknown): number {
  if (val === null || val === undefined || val === '') return 0
  const num = typeof val === 'number' ? val : parseFloat(String(val))
  return isNaN(num) ? 0 : num
}

// Helper untuk nilai yang bisa null
function toNumberOrNull(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null
  const num = typeof val === 'number' ? val : parseFloat(String(val))
  return isNaN(num) ? null : num
}

function parseGvizJson(raw: string): RawRow[] {
  const jsonStr = raw.replace(/^[^(]+\(/, '').replace(/\);?\s*$/, '')
  const data = JSON.parse(jsonStr)
  const cols: string[] = data.table.cols.map((c: { label: string }) => c.label)
  return data.table.rows
    .filter((r: { c: ({ v: unknown } | null)[] }) => r && r.c)
    .map((r: { c: ({ v: unknown } | null)[] }) => {
      const obj: Record<string, unknown> = {}
      cols.forEach((col, i) => {
        obj[col] = r.c[i]?.v ?? null
      })

      // Pastikan semua nilai numerik di-parse dengan benar
      return {
        opd_id: toNumber(obj.opd_id),
        opd_name: String(obj.opd_name ?? ''),
        section: String(obj.section ?? ''),
        kode_indikator: String(obj.kode_indikator ?? ''),
        nama_indikator: String(obj.nama_indikator ?? ''),
        nilai: toNumberOrNull(obj.nilai),
        keterangan: String(obj.keterangan ?? ''),
        sumber_data: String(obj.sumber_data ?? ''),
        nilai_maks: toNumber(obj.nilai_maks) || 5, // Default 5 jika tidak ada
        nilai_skala5: toNumberOrNull(obj.nilai_skala5)
      } as RawRow
    })
}

function buildSummaries(rows: RawRow[], visibleFilter: string[]): OpdSummary[] {
  const map = new Map<string, OpdSummary>()

  for (const row of rows) {
    if (visibleFilter.length > 0 && !visibleFilter.includes(row.opd_name)) continue

    if (!map.has(row.opd_name)) {
      map.set(row.opd_name, {
        opd_name: row.opd_name,
        kategori: detectKategori(row.opd_name),
        total: 0,
        maks: 0,
        persen: 0,
        skala5: 0,
        bySection: {},
        rows: []
      })
    }

    const entry = map.get(row.opd_name)!

    // Pastikan nilai adalah number sebelum dijumlahkan
    const nilai = toNumber(row.nilai)
    const nilaiMaks = toNumber(row.nilai_maks) || 5

    entry.total += nilai
    entry.maks += nilaiMaks
    entry.rows.push(row)

    // Inisialisasi section jika belum ada
    if (!entry.bySection[row.section]) {
      entry.bySection[row.section] = { total: 0, maks: 0 }
    }
    entry.bySection[row.section].total += nilai
    entry.bySection[row.section].maks += nilaiMaks

    // nilai_skala5 adalah nilai unit-level — sama untuk semua baris OPD yang sama.
    // Ambil dari baris pertama yang memiliki nilai valid.
    if (entry.skala5 === 0 && row.nilai_skala5 !== null && row.nilai_skala5 > 0) {
      entry.skala5 = toNumber(row.nilai_skala5)
    }
  }

  // Hitung persentase dan skala5 fallback
  for (const e of map.values()) {
    e.persen = e.maks > 0 ? (e.total / e.maks) * 100 : 0
    // Fallback: hitung manual jika kolom nilai_skala5 belum ada / semua kosong
    if (e.skala5 === 0 && e.maks > 0) {
      e.skala5 = (e.total / e.maks) * 5
    }
  }

  return Array.from(map.values()).sort((a, b) => b.persen - a.persen)
}

function scoreColor(persen: number) {
  if (persen >= 80) return '#16a34a'
  if (persen >= 60) return '#FF9F1C'
  if (persen >= 40) return '#f59e0b'
  return '#ef4444'
}

function nilaiColor(nilai: number | null) {
  if (nilai === null) return '#9ca3af'
  if (nilai >= 4) return '#16a34a'
  if (nilai >= 2) return '#d97706'
  return '#dc2626'
}

// ─────────────────────────────────────────────────────────────────────────────
// MINI BAR
// ─────────────────────────────────────────────────────────────────────────────
function MiniBar({ persen, color }: { persen: number; color: string }) {
  return (
    <div className="relative h-2 bg-gray-100 border border-black w-full overflow-hidden">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(persen, 100)}%` }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="absolute inset-y-0 left-0"
        style={{ backgroundColor: color }}
      />
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// KATEGORI ICON
// ─────────────────────────────────────────────────────────────────────────────
function KategoriIcon({ kategori }: { kategori: OpdSummary['kategori'] }) {
  if (kategori === 'Puskesmas') return <Stethoscope className="w-4 h-4" />
  if (kategori === 'Kecamatan') return <MapPin className="w-4 h-4" />
  return <Building2 className="w-4 h-4" />
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT CARD
// ─────────────────────────────────────────────────────────────────────────────
function OpdCard({ opd, rank, onClick }: { opd: OpdSummary; rank: number; onClick: () => void }) {
  const color = scoreColor(opd.persen)
  const rankBg = rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-300' : rank === 3 ? 'bg-amber-600' : 'bg-white'

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      whileHover={{ y: -4 }}
      onClick={onClick}
      className="group relative w-full text-left bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] hover:shadow-[10px_10px_0px_0px_#000] transition-all duration-200 flex flex-col p-0 overflow-hidden cursor-pointer">
      {/* Top color strip */}
      <div className="h-1.5 w-full shrink-0" style={{ backgroundColor: color }} />

      <div className="p-4 flex flex-col gap-3 flex-1">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <div
              className={`w-7 h-7 border-2 border-black flex items-center justify-center font-black text-xs shrink-0 shadow-[2px_2px_0px_0px_#000] ${rankBg}`}>
              {rank}
            </div>
            <div className="flex items-center gap-1 bg-gray-100 border border-black px-2 py-0.5">
              <KategoriIcon kategori={opd.kategori} />
              <span className="text-sm font-black uppercase tracking-wider">{opd.kategori}</span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-black group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
        </div>

        {/* Name */}
        <h3 className="font-black leading-tight line-clamp-2 group-hover:underline decoration-2 underline-offset-2">
          {opd.opd_name}
        </h3>

        {/* Score */}
        <div className="mt-auto space-y-1.5">
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Nilai</span>
            <span className="font-black text-lg tabular-nums leading-none" style={{ color }}>
              {opd.persen.toFixed(1)}
              <span className="text-xs text-gray-600 font-bold">%</span>
            </span>
          </div>
          <MiniBar persen={opd.persen} color={color} />
          {/* Skala 5 — dibaca dari data Excel */}
          <div className="flex justify-between items-baseline">
            <span className="text-xs font-bold text-gray-600 uppercase tracking-wider">Skala 5</span>
            <span className="text-sm font-black tabular-nums" style={{ color }}>
              {opd.skala5.toFixed(2)}
              <span className="text-xs text-gray-600 font-bold"> / 5</span>
            </span>
          </div>
        </div>

        {/* Section mini-bars */}
        <div className="flex gap-1 pt-1 border-t border-gray-100">
          {Object.entries(opd.bySection).map(([sec, s]) => {
            const pct = s.maks > 0 ? (s.total / s.maks) * 100 : 0
            const bg = SECTION_COLORS[sec] ?? '#e5e7eb'
            return (
              <div
                key={sec}
                title={`${SECTION_SHORT[sec] ?? sec}: ${pct.toFixed(0)}%`}
                className="flex-1 h-2 border border-black relative overflow-hidden bg-gray-100">
                <div className="absolute inset-y-0 left-0" style={{ width: `${pct}%`, backgroundColor: bg }} />
              </div>
            )
          })}
        </div>
      </div>
    </motion.button>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SLIDE-OVER DETAIL PANEL
// ─────────────────────────────────────────────────────────────────────────────
function DetailPanel({ opd, rank, onClose }: { opd: OpdSummary; rank: number; onClose: () => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [downloading, setDownloading] = useState(false)
  const color = scoreColor(opd.persen)

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadBA(opd)
    } finally {
      setDownloading(false)
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  // Group rows by section
  const grouped = opd.rows.reduce<Record<string, RawRow[]>>((acc, row) => {
    ;(acc[row.section] ??= []).push(row)
    return acc
  }, {})

  const rankBg = rank === 1 ? 'bg-yellow-400' : rank === 2 ? 'bg-gray-300' : rank === 3 ? 'bg-amber-600' : 'bg-white'

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 28, stiffness: 260 }}
        className="fixed top-0 right-0 h-full w-full z-50 flex flex-col bg-white border-l-4 border-black shadow-[-8px_0_0_0_#000]">
        {/* ── Panel Header ── */}
        <div className="shrink-0 border-b-4 border-black">
          <div className="h-2 w-full" style={{ backgroundColor: color }} />

          <div className="p-5 flex items-start gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div
                  className={`w-7 h-7 border-2 border-black flex items-center justify-center font-black text-xs shadow-[2px_2px_0px_0px_#000] shrink-0 ${rankBg}`}>
                  {rank}
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 border border-black px-2 py-0.5 flex items-center gap-1">
                  <KategoriIcon kategori={opd.kategori} />
                  {opd.kategori}
                </span>
              </div>
              <h2 className="font-black text-xl leading-tight">{opd.opd_name}</h2>
            </div>

            {/* Big score */}
            <div className="text-right shrink-0">
              <div className="font-black text-4xl tabular-nums leading-none" style={{ color }}>
                {opd.persen.toFixed(1)}
                <span className="text-xl text-gray-400">%</span>
              </div>
              {/* Skala 5 dari data Excel */}
              <div className="flex items-baseline justify-end gap-1 mt-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Skala 5</span>
                <span className="font-black text-lg tabular-nums" style={{ color }}>
                  {opd.skala5.toFixed(2)}
                </span>
                <span className="text-xs font-bold text-gray-400">/ 5</span>
              </div>
              <div className="text-xs font-bold text-gray-400 tabular-nums mt-0.5">
                {opd.total} / {opd.maks} poin
              </div>
            </div>

            <button
              onClick={onClose}
              className="shrink-0 w-9 h-9 border-2 border-black bg-white hover:bg-black hover:text-white transition-colors flex items-center justify-center shadow-[2px_2px_0px_0px_#000]">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Section scroll */}
          <div className="px-5 pb-4 flex gap-2 overflow-x-auto">
            {Object.entries(opd.bySection).map(([sec, s]) => {
              const pct = s.maks > 0 ? (s.total / s.maks) * 100 : 0
              const bg = SECTION_COLORS[sec] ?? '#e5e7eb'
              const sc = scoreColor(pct)
              return (
                <div key={sec} className="border-2 border-black p-2 bg-gray-50 shrink-0 min-w-52">
                  <div className="text-xs font-black uppercase tracking-wide text-gray-500 mb-1 leading-tight">
                    {SECTION_SHORT[sec] ?? sec}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-2 bg-gray-200 border border-black overflow-hidden">
                      <div className="h-full" style={{ width: `${pct}%`, backgroundColor: bg }} />
                    </div>
                    <span className="text-xs font-black tabular-nums" style={{ color: sc }}>
                      {pct.toFixed(0)}%
                    </span>
                  </div>
                  <div className="text-xs text-gray-400 font-bold mt-0.5">
                    {s.total}/{s.maks}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Scrollable indikator list ── */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {Object.entries(grouped).map(([sec, secRows]) => {
            const bg = SECTION_COLORS[sec] ?? '#e5e7eb'
            // Hitung total per section dengan benar
            const secTotal = secRows.reduce((s, r) => s + toNumber(r.nilai), 0)
            const secMaks = secRows.reduce((s, r) => s + (toNumber(r.nilai_maks) || 5), 0)
            return (
              <div key={sec}>
                {/* Sticky section header */}
                <div
                  className="sticky top-0 z-10 px-5 py-2 border-b-2 border-black flex items-center justify-between"
                  style={{ backgroundColor: bg }}>
                  <span className="text-[11px] font-black uppercase tracking-widest">{sec}</span>
                  <span className="text-[10px] font-bold">
                    {secTotal} / {secMaks}
                  </span>
                </div>

                {secRows.map((row, i) => (
                  <div
                    key={row.kode_indikator}
                    className={`border-b-2 border-black ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                    <div className="px-5 py-3 flex items-start gap-3">
                      {/* Nilai badge */}
                      <div
                        className="shrink-0 w-9 h-9 border-2 border-black flex items-center justify-center font-black text-base shadow-[2px_2px_0px_0px_#000] bg-white"
                        style={{ color: nilaiColor(row.nilai) }}>
                        {row.nilai ?? '—'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-sm font-black text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 shrink-0">
                            {row.kode_indikator}
                          </span>
                        </div>
                        <p className="font-bold text-gray-800 leading-snug mb-1">{row.nama_indikator}</p>
                        {row.keterangan && (
                          <>
                            <p className="text-sm text-slate-500">Catatan Evaluator:</p>
                            <p className="italic text-gray-600 leading-snug border-l-2 pl-2 mt-1 border-rose-500">
                              {row.keterangan}
                            </p>
                          </>
                        )}
                        {row.sumber_data && (
                          <p className="text-sm text-gray-400 font-medium mt-1">📎 {row.sumber_data}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          })}
        </div>

        {/* ── Panel footer ── */}
        <div className="shrink-0 border-t-4 border-black p-4 bg-gray-50 flex items-center justify-between flex-col gap-3 sm:flex-row">
          <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Data bersifat sementara</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              disabled={downloading}
              className="flex items-center gap-2 px-4 py-2 border-2 border-black font-black text-xs uppercase bg-[#FF9F1C] hover:bg-black hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-[3px_3px_0px_0px_#000] cursor-pointer">
              {downloading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Membuat PDF...
                </>
              ) : (
                <>
                  <FileDown className="w-4 h-4" />
                  Unduh Berita Acara
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 border-2 border-black font-black text-xs uppercase bg-white hover:bg-black hover:text-white transition-colors shadow-[3px_3px_0px_0px_#000] cursor-pointer">
              Tutup
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function HasilPenilaian() {
  const [rawRows, setRawRows] = useState<RawRow[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedKategori, setKategori] = useState<string>('Semua')
  const [selectedSection, setSection] = useState<string>('Semua')
  const [sortBy, setSortBy] = useState<'rank' | 'az'>('rank')
  const [activeOpd, setActiveOpd] = useState<OpdSummary | null>(null)

  // ── FETCH ─────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(GS_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      setRawRows(parseGvizJson(await res.text()))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  // ── DERIVED ───────────────────────────────────────────────────────────────
  const summaries = useMemo(() => buildSummaries(rawRows, VISIBLE_OPDS), [rawRows])

  // const allSections = useMemo(() => {
  //   const s = new Set(rawRows.map((r) => r.section))
  //   return ['Semua', ...Array.from(s)]
  // }, [rawRows])

  const displayed = useMemo(() => {
    let list = summaries
    if (selectedKategori !== 'Semua') list = list.filter((o) => o.kategori === selectedKategori)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      list = list.filter((o) => o.opd_name.toLowerCase().includes(q))
    }
    if (selectedSection !== 'Semua') {
      list = list
        .filter((o) => o.bySection[selectedSection])
        .map((o) => {
          const sec = o.bySection[selectedSection]
          return { ...o, total: sec.total, maks: sec.maks, persen: sec.maks > 0 ? (sec.total / sec.maks) * 100 : 0 }
        })
        .sort((a, b) => b.persen - a.persen)
    }
    if (sortBy === 'az') list = [...list].sort((a, b) => a.opd_name.localeCompare(b.opd_name))
    return list
  }, [summaries, selectedKategori, searchQuery, selectedSection, sortBy])

  const stats = useMemo(() => {
    if (!summaries.length) return null
    const avg = summaries.reduce((s, o) => s + o.persen, 0) / summaries.length
    const avgSkala5 = summaries.reduce((s, o) => s + o.skala5, 0) / summaries.length
    const best = summaries[0]
    const filled = summaries.filter((o) => o.total > 0).length
    return { avg, avgSkala5, best, filled, total: summaries.length }
  }, [summaries])

  const rankMap = useMemo(() => {
    const m = new Map<string, number>()
    summaries.forEach((o, i) => m.set(o.opd_name, i + 1))
    return m
  }, [summaries])

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="relative max-w-7xl mx-auto px-6 py-16 font-sans text-black">
      {/* ── HEADER ── */}
      <header className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-[#FF9F1C] border-2 border-black px-4 py-1 mb-4 shadow-[4px_4px_0px_0px_#000]">
          <span className="text-sm font-black uppercase tracking-widest">PEKPPP 2026</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter text-black mb-6 leading-[0.9]">
          HASIL{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 underline decoration-black decoration-4 underline-offset-8">
            PENILAIAN
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-bold text-gray-600 max-w-2xl leading-relaxed">
          Rekapitulasi hasil evaluasi kinerja penyelenggara pelayanan publik. Data bersifat{' '}
          <span className="bg-rose-300 p-0.5 px-1">sementara</span> dan belum final. Klik kartu untuk melihat rincian
          penilaian per indikator.
        </motion.p>
      </header>

      {/* ── LOADING ── */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-32 border-4 border-dashed border-gray-300">
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
            <RefreshCw className="w-12 h-12 text-[#FF9F1C]" />
          </motion.div>
          <p className="mt-4 font-black text-gray-400 uppercase tracking-widest text-sm">Memuat data...</p>
        </div>
      )}

      {/* ── ERROR ── */}
      {!loading && error && (
        <div className="border-4 border-black bg-red-50 p-8 shadow-[8px_8px_0px_0px_#000] mb-12">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <h2 className="font-black text-xl text-red-700">Gagal Memuat Data</h2>
          </div>
          <p className="font-bold text-red-600 mb-2">{error}</p>
          <p className="text-sm font-medium text-gray-600 mb-6">
            Pastikan <code className="bg-black text-white px-1">SPREADSHEET_ID</code> sudah diisi dan sheet{' '}
            <code className="bg-black text-white px-1">EXPORT_API</code> sudah dipublish ke web.
          </p>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 bg-black text-white px-5 py-2 font-black uppercase text-sm hover:bg-[#FF9F1C] hover:text-black border-2 border-black transition-colors">
            <RefreshCw className="w-4 h-4" /> Coba Lagi
          </button>
        </div>
      )}

      {/* ── CONTENT ── */}
      {!loading && !error && (
        <>
          {/* ── STAT CARDS ── */}
          {stats && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-14">
              {(
                [
                  {
                    icon: <BarChart3 className="w-6 h-6" />,
                    label: 'Rata-rata Nilai',
                    value: `${stats.avg.toFixed(1)}%`,
                    color: '#FF9F1C',
                    small: false,
                    // Tampilkan rata-rata skala 5 dari data Excel
                    sub: `Skala 5: ${stats.avgSkala5.toFixed(2)} / 5`
                  },
                  {
                    icon: <Award className="w-6 h-6" />,
                    label: 'Terbaik',
                    value: stats.best.opd_name,
                    color: '#22c55e',
                    small: true,
                    sub: `${stats.best.persen.toFixed(1)}% · Skala 5: ${stats.best.skala5.toFixed(2)}`
                  },
                  {
                    icon: <TrendingUp className="w-6 h-6" />,
                    label: 'Unit Dinilai',
                    value: `${stats.filled}/${stats.total}`,
                    color: '#4ECDC4',
                    small: false,
                    sub: undefined
                  },
                  {
                    icon: <Layers className="w-6 h-6" />,
                    label: 'Total Indikator',
                    value: '30',
                    color: '#C77DFF',
                    small: false,
                    sub: undefined
                  }
                ] as const
              ).map((stat, i) => (
                <div
                  key={i}
                  className="border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_#000] flex flex-col gap-2">
                  <div
                    className="w-10 h-10 border-2 border-black flex items-center justify-center"
                    style={{ backgroundColor: stat.color }}>
                    {stat.icon}
                  </div>
                  <div className="text-[11px] font-black uppercase tracking-widest text-gray-400">{stat.label}</div>
                  <div className={`font-black leading-tight ${stat.small ? '' : 'text-2xl'} text-black`}>
                    {stat.value}
                  </div>
                  {stat.sub && <div className="text-xs font-bold text-gray-500">{stat.sub}</div>}
                </div>
              ))}
            </motion.div>
          )}

          {/* ── TOOLBAR ── */}
          <section className="mb-10 flex flex-col gap-5">
            <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
              <div className="w-full md:w-96 relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
                  <Search className="w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama OPP..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-4 border-black py-3 pl-12 pr-4 font-bold placeholder:font-medium placeholder:text-gray-600 focus:outline-none focus:shadow-[8px_8px_0px_0px_#000] transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-gray-600">Urut:</span>
                {(['rank', 'az'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setSortBy(s)}
                    className={`px-3 py-2 border-2 border-black font-bold text-xs uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] ${sortBy === s ? 'bg-black text-white' : 'bg-white text-black'}`}>
                    {s === 'rank' ? '🏆 Ranking' : '🔤 A–Z'}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Filter className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-gray-600 mr-1">Kategori:</span>
              {(['Semua', 'OPD & Rumah Sakit', 'Puskesmas', 'Kecamatan'] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKategori(k)}
                  className={`px-4 py-2 border-2 border-black font-bold text-xs uppercase tracking-wider transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] ${selectedKategori === k ? 'bg-black text-white' : 'bg-white text-black'}`}>
                  {k}
                </button>
              ))}
            </div>

            {/* <div className="flex flex-wrap gap-2 items-center">
              <BarChart3 className="w-4 h-4 text-gray-400 shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-gray-600 mr-1">Indikator:</span>
              {allSections.map((sec) => {
                const color = sec !== 'Semua' ? (SECTION_COLORS[sec] ?? '#e5e7eb') : undefined
                return (
                  <button
                    key={sec}
                    onClick={() => setSection(sec)}
                    style={selectedSection === sec && color ? { backgroundColor: color } : {}}
                    className={`px-3 py-1.5 border-2 border-black font-bold text-[10px] uppercase tracking-wider transition-all hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_0px_#000] ${selectedSection === sec ? 'text-black' : 'bg-white text-black'}`}>
                    {sec === 'Semua' ? 'Semua' : (SECTION_SHORT[sec] ?? sec)}
                  </button>
                )
              })}
            </div> */}

            <div className="text-sm font-bold text-gray-400">
              Menampilkan <span className="text-black font-black">{displayed.length}</span> unit
              {searchQuery && ` · "${searchQuery}"`}
            </div>
          </section>

          {/* ── CARD GRID ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            <AnimatePresence mode="popLayout">
              {displayed.length > 0 ? (
                displayed.map((opd) => (
                  <OpdCard
                    key={opd.opd_name}
                    opd={opd}
                    rank={rankMap.get(opd.opd_name) ?? 0}
                    onClick={() => setActiveOpd(opd)}
                  />
                ))
              ) : (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="col-span-full py-20 text-center border-4 border-dashed border-gray-300">
                  <BarChart3 className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <h3 className="text-xl font-black text-gray-400">Tidak ada data ditemukan</h3>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setKategori('Semua')
                      setSection('Semua')
                    }}
                    className="mt-4 text-sm font-bold underline text-black hover:text-[#FF9F1C]">
                    Reset Filter
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </>
      )}

      {/* ── SLIDE-OVER ── */}
      <AnimatePresence>
        {activeOpd && (
          <DetailPanel
            key={activeOpd.opd_name}
            opd={activeOpd}
            rank={rankMap.get(activeOpd.opd_name) ?? 0}
            onClose={() => setActiveOpd(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
