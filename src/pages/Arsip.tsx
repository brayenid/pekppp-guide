/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import * as XLSX from 'xlsx'
import {
  FileText,
  Building2,
  ClipboardList,
  MapPin,
  Hospital,
  Download,
  ChevronDown,
  BarChart,
  Info,
  X,
  Search
} from 'lucide-react'
import DATA_JSON from '../data/arsip.json'

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// ─────────────────────────────────────────────────────────────────────────────
const DATA: Record<string, any> = DATA_JSON

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────
const KOLOM = ['SKM', 'FKP', 'SP', 'SOP', 'SIPPN']
const KOLOM_COLORS: Record<string, string> = {
  SKM: '#FF9F1C',
  FKP: '#4ECDC4',
  SP: '#C77DFF',
  SOP: '#FFD93D',
  SIPPN: '#FF6B6B'
}
const KOLOM_LABEL: Record<string, string> = {
  SKM: 'Survei Kepuasan Masyarakat',
  FKP: 'Forum Konsultasi Publik',
  SP: 'Standar Pelayanan',
  SOP: 'Standar Operasional Prosedur',
  SIPPN: 'Sistem Informasi Pelayanan Publik Nasional'
}
const TAB_CONFIG = [
  { key: 'semua', label: 'Semua', icon: <FileText size={18} />, color: '#22c55e' },
  { key: 'perangkat_daerah', label: 'Perangkat Daerah', icon: <Building2 size={18} />, color: '#FF9F1C' },
  { key: 'bagian_setda', label: 'Bagian Setda', icon: <ClipboardList size={18} />, color: '#4ECDC4' },
  { key: 'kecamatan', label: 'Kecamatan', icon: <MapPin size={18} />, color: '#C77DFF' },
  { key: 'puskesmas', label: 'Puskesmas', icon: <Hospital size={18} />, color: '#FF6B6B' }
]

const DATA_TABS = ['perangkat_daerah', 'bagian_setda', 'kecamatan', 'puskesmas']

const KELOMPOK_COLORS: Record<string, string> = {
  perangkat_daerah: '#FF9F1C',
  bagian_setda: '#4ECDC4',
  kecamatan: '#C77DFF',
  puskesmas: '#FF6B6B'
}

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
const countFields = (rows: any[]) => Object.fromEntries(KOLOM.map((k) => [k, rows.filter((r) => r[k]).length]))
const completionScore = (row: any) => KOLOM.filter((k) => row[k]).length
const scoreColor = (s: number) => (s === 5 ? '#16a34a' : s >= 3 ? '#d97706' : s === 0 ? '#ef4444' : '#6b7280')

// ─────────────────────────────────────────────────────────────────────────────
// EXCEL EXPORT  (SheetJS — no style, broad compatibility)
// ─────────────────────────────────────────────────────────────────────────────
function exportToExcel(scope: string) {
  const wb = XLSX.utils.book_new()
  const TICK = '✓'
  const EMPTY = '-'

  const isAll = scope === 'all' || scope === 'semua'
  const groups = isAll ? TAB_CONFIG.filter((t) => t.key !== 'semua') : TAB_CONFIG.filter((t) => t.key === scope)

  groups.forEach(({ key, label }) => {
    const rows = DATA[key]
    const counts = countFields(rows)

    const wsData = [
      [`${label.toUpperCase()} — ${DATA.meta.judul.toUpperCase()} TAHUN ${DATA.meta.tahun}`],
      [],
      ['NO', 'NAMA UNIT', ...KOLOM, 'TOTAL'],
      ...rows.map((r: { [x: string]: any; id: any; nama: any }) => [
        r.id,
        r.nama,
        ...KOLOM.map((k) => (r[k] ? TICK : EMPTY)),
        completionScore(r)
      ]),
      [],
      ['', 'JUMLAH', ...KOLOM.map((k) => counts[k]), ''],
      [
        '',
        'PERSENTASE',
        ...KOLOM.map((k) => (rows.length > 0 ? `${((counts[k] / rows.length) * 100).toFixed(1)}%` : '0%')),
        ''
      ]
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)
    ws['!cols'] = [{ wch: 5 }, { wch: 50 }, ...KOLOM.map(() => ({ wch: 8 })), { wch: 8 }]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
    XLSX.utils.book_append_sheet(wb, ws, label.substring(0, 31))
  })

  // Rekap sheet (only when exporting all)
  if (isAll) {
    const allRows = DATA_TABS.flatMap((key) => DATA[key])
    const allCounts = countFields(allRows)

    const rekapData = [
      [`REKAP — ${DATA.meta.judul.toUpperCase()} TAHUN ${DATA.meta.tahun}`],
      [],
      ['KELOMPOK', 'JML UNIT', ...KOLOM, 'RATA-RATA TOTAL'],
      ...TAB_CONFIG.filter((t) => t.key !== 'semua').map(({ key, label }) => {
        const r = DATA[key]
        const c = countFields(r)
        const avg = (r.reduce((s: number, x: any) => s + completionScore(x), 0) / r.length).toFixed(2)
        return [label, r.length, ...KOLOM.map((k) => c[k]), avg]
      }),
      [],
      ['TOTAL KESELURUHAN', allRows.length, ...KOLOM.map((k) => allCounts[k]), '']
    ]

    const wsRekap = XLSX.utils.aoa_to_sheet(rekapData)
    wsRekap['!cols'] = [{ wch: 22 }, { wch: 12 }, ...KOLOM.map(() => ({ wch: 8 })), { wch: 16 }]
    wsRekap['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } }]
    XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap')
  }

  const tabLabel = TAB_CONFIG.find((t) => t.key === scope)?.label ?? 'Semua'
  const filename = isAll
    ? `Ketersediaan_Berkas_SP_SIPPN_${DATA.meta.tahun}.xlsx`
    : `${tabLabel.replace(/\s+/g, '_')}_${DATA.meta.tahun}.xlsx`

  XLSX.writeFile(wb, filename)
}

// ─────────────────────────────────────────────────────────────────────────────
// EXPORT DROPDOWN
// ─────────────────────────────────────────────────────────────────────────────
function ExportDropdown({ activeTab }: { activeTab: string }) {
  const [open, setOpen] = useState(false)
  const currentLabel = TAB_CONFIG.find((t) => t.key === activeTab)?.label ?? ''
  const currentIcon = TAB_CONFIG.find((t) => t.key === activeTab)?.icon ?? ''

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 border-2 border-black bg-[#22c55e] hover:bg-black hover:text-white font-black text-xs uppercase tracking-widest transition-colors shadow-[3px_3px_0px_0px_#000] cursor-pointer">
        <Download size={16} /> Ekspor Excel <ChevronDown size={14} className="opacity-50" />
      </button>

      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.97 }}
              className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-50 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] min-w-64">
              <div className="px-4 py-2 border-b-2 border-black bg-gray-50">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Pilih Cakupan Ekspor
                </span>
              </div>

              <button
                onClick={() => {
                  exportToExcel(activeTab)
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#22c55e]/15 border-b border-gray-100 transition-colors cursor-pointer">
                <span className="text-xl">{currentIcon}</span>
                <div>
                  <div className="font-black text-sm">{currentLabel} saja</div>
                  <div className="text-xs text-gray-500 font-medium">1 sheet · tab yang sedang aktif</div>
                </div>
              </button>

              <button
                onClick={() => {
                  exportToExcel('all')
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-[#22c55e]/15 transition-colors cursor-pointer">
                <span className="text-xl">
                  <BarChart size={20} />
                </span>
                <div>
                  <div className="font-black text-sm">Semua Kelompok</div>
                  <div className="text-xs text-gray-500 font-medium">5 sheet · 4 kelompok + rekap</div>
                </div>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────
function CheckBadge({ checked, kolom }: { checked: boolean; kolom: string }) {
  return (
    <div
      title={checked ? `✓ ${KOLOM_LABEL[kolom]}` : `— ${KOLOM_LABEL[kolom]} belum ada`}
      className="w-8 h-8 border-2 border-black flex items-center justify-center font-black text-xs transition-all"
      style={
        checked
          ? { backgroundColor: KOLOM_COLORS[kolom], boxShadow: '2px 2px 0 #000' }
          : { backgroundColor: '#f3f4f6', color: '#d1d5db' }
      }>
      {checked ? '✓' : '—'}
    </div>
  )
}

function StatBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex-1 min-w-28">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-black uppercase tracking-widest">{label}</span>
        <span className="text-xs font-bold text-gray-500">
          {count}/{total}
        </span>
      </div>
      <div className="h-3 bg-gray-100 border-2 border-black overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full"
          style={{ backgroundColor: color }}
        />
      </div>
      <div
        className="text-xs font-black mt-0.5"
        style={{ color: pct === 100 ? '#16a34a' : pct >= 50 ? '#d97706' : '#ef4444' }}>
        {pct.toFixed(0)}%
      </div>
    </div>
  )
}

function DataRow({ row, index, onClick }: { row: any; index: number; onClick: () => void }) {
  const score = completionScore(row)
  return (
    <motion.tr
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.018 }}
      className={`border-b-2 border-black hover:bg-yellow-50 transition-colors cursor-pointer ${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}>
      <td className="px-4 py-3 font-black text-xs text-gray-400 tabular-nums">{row.id}</td>
      <td className="px-4 py-3 font-bold text-sm leading-snug">{row.nama}</td>
      {KOLOM.map((k) => (
        <td key={k} className="px-2 py-3 text-center">
          <div className="flex justify-center">
            <CheckBadge checked={row[k]} kolom={k} />
          </div>
        </td>
      ))}
      <td className="px-4 py-3 text-center">
        <div
          className="inline-flex items-center justify-center w-8 h-8 border-2 border-black font-black text-sm shadow-[2px_2px_0px_0px_#000]"
          style={{ backgroundColor: scoreColor(score) + '22', color: scoreColor(score) }}>
          {score}
        </div>
      </td>
    </motion.tr>
  )
}

function DataTable({
  rows,
  searchQuery,
  onRowClick
}: {
  rows: any[]
  searchQuery: string
  onRowClick: (row: any) => void
}) {
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return rows
    const q = searchQuery.toLowerCase()
    return rows.filter((r) => r.nama.toLowerCase().includes(q))
  }, [rows, searchQuery])

  const counts = useMemo(() => countFields(rows), [rows])

  return (
    <div>
      <div className="flex flex-wrap gap-3 p-5 border-b-4 border-black bg-gray-50">
        {KOLOM.map((k) => (
          <StatBar key={k} label={k} count={counts[k]} total={rows.length} color={KOLOM_COLORS[k]} />
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-widest">Nama Unit</th>
              {KOLOM.map((k) => (
                <th key={k} className="px-2 py-3 text-center w-16">
                  <div
                    className="inline-block px-2 py-0.5 border border-white/30 font-black text-xs"
                    style={{ backgroundColor: KOLOM_COLORS[k], color: '#000' }}>
                    {k}
                  </div>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-black uppercase tracking-widest w-16">Total</th>
            </tr>
          </thead>
          <AnimatePresence mode="popLayout">
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={KOLOM.length + 3} className="py-16 text-center">
                    <p className="font-black text-gray-400 uppercase tracking-widest">Tidak ditemukan</p>
                  </td>
                </tr>
              ) : (
                filtered.map((row, i) => <DataRow key={row.id} row={row} index={i} onClick={() => onRowClick(row)} />)
              )}
            </tbody>
          </AnimatePresence>
        </table>
      </div>

      {searchQuery && (
        <div className="px-5 py-3 border-t-2 border-black bg-yellow-50 text-sm font-bold text-gray-600">
          Menampilkan <span className="text-black font-black">{filtered.length}</span> dari {rows.length} data
        </div>
      )}
    </div>
  )
}

// Row variant with kelompok badge for "Semua" tab
function AllDataRow({
  row,
  index,
  kelompok,
  onClick
}: {
  row: any
  index: number
  kelompok: string
  onClick: () => void
}) {
  const score = completionScore(row)
  const kelColor = KELOMPOK_COLORS[kelompok] ?? '#e5e7eb'
  return (
    <motion.tr
      onClick={onClick}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: Math.min(index * 0.008, 0.3) }}
      className={`border-b-2 border-black hover:bg-yellow-50 transition-colors cursor-pointer ${index % 2 !== 0 ? 'bg-gray-50' : 'bg-white'}`}>
      <td className="px-3 py-2.5 font-black text-xs text-gray-400 tabular-nums w-10">{row.id}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div
            className="shrink-0 text-[10px] font-black px-1.5 py-0.5 border border-black uppercase tracking-wider"
            style={{ backgroundColor: kelColor }}>
            {TAB_CONFIG.find((t) => t.key === kelompok)?.icon}
          </div>
          <span className="font-bold text-sm leading-snug">{row.nama}</span>
        </div>
      </td>
      {KOLOM.map((k) => (
        <td key={k} className="px-2 py-2.5 text-center">
          <div className="flex justify-center">
            <CheckBadge checked={row[k]} kolom={k} />
          </div>
        </td>
      ))}
      <td className="px-3 py-2.5 text-center">
        <div
          className="inline-flex items-center justify-center w-8 h-8 border-2 border-black font-black text-sm shadow-[2px_2px_0px_0px_#000]"
          style={{ backgroundColor: scoreColor(score) + '22', color: scoreColor(score) }}>
          {score}
        </div>
      </td>
    </motion.tr>
  )
}

function AllDataTable({ searchQuery, onRowClick }: { searchQuery: string; onRowClick: (row: any) => void }) {
  const allRows = useMemo(() => DATA_TABS.flatMap((key) => DATA[key].map((r: any) => ({ ...r, _kelompok: key }))), [])

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return allRows
    const q = searchQuery.toLowerCase()
    return allRows.filter((r) => r.nama.toLowerCase().includes(q))
  }, [allRows, searchQuery])

  const counts = useMemo(() => countFields(allRows), [allRows])

  return (
    <div>
      <div className="flex flex-wrap gap-3 p-5 border-b-4 border-black bg-gray-50">
        {KOLOM.map((k) => (
          <StatBar key={k} label={k} count={counts[k]} total={allRows.length} color={KOLOM_COLORS[k]} />
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-black text-white">
              <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-widest w-10">#</th>
              <th className="px-3 py-3 text-left text-xs font-black uppercase tracking-widest">Nama Unit</th>
              {KOLOM.map((k) => (
                <th key={k} className="px-2 py-3 text-center w-16">
                  <div
                    className="inline-block px-2 py-0.5 border border-white/30 font-black text-xs"
                    style={{ backgroundColor: KOLOM_COLORS[k], color: '#000' }}>
                    {k}
                  </div>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-black uppercase tracking-widest w-16">Total</th>
            </tr>
          </thead>
          <AnimatePresence mode="popLayout">
            <tbody>
              {/* Group by kelompok with sticky section header */}
              {DATA_TABS.map((key) => {
                const tabInfo = TAB_CONFIG.find((t) => t.key === key)
                const groupRows = filtered.filter((r) => r._kelompok === key)
                if (groupRows.length === 0 || !tabInfo) return null
                return (
                  <>
                    <tr key={`header-${key}`} className="border-b-2 border-black">
                      <td colSpan={KOLOM.length + 3} className="px-4 py-2" style={{ backgroundColor: tabInfo.color }}>
                        <span className="font-black text-xs uppercase tracking-widest">
                          {tabInfo.icon} {tabInfo.label}
                          <span className="ml-2 opacity-60">({groupRows.length} unit)</span>
                        </span>
                      </td>
                    </tr>
                    {groupRows.map((row, i) => (
                      <AllDataRow
                        key={`${key}-${row.id}`}
                        row={row}
                        index={i}
                        kelompok={key}
                        onClick={() => onRowClick(row)}
                      />
                    ))}
                  </>
                )
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={KOLOM.length + 3} className="py-16 text-center">
                    <p className="font-black text-gray-400 uppercase tracking-widest">Tidak ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </AnimatePresence>
        </table>
      </div>

      {searchQuery && (
        <div className="px-5 py-3 border-t-2 border-black bg-yellow-50 text-sm font-bold text-gray-600">
          Menampilkan <span className="text-black font-black">{filtered.length}</span> dari {allRows.length} data
        </div>
      )}
    </div>
  )
}

function LegendDropdown() {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-4 py-2.5 border-2 border-black bg-white font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-colors shadow-[3px_3px_0px_0px_#000] cursor-pointer">
        <Info size={16} /> Keterangan
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-50 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] p-4 min-w-72">
              {KOLOM.map((k) => (
                <div key={k} className="flex items-start gap-3 mb-2 last:mb-0">
                  <div
                    className="w-10 shrink-0 h-6 border-2 border-black flex items-center justify-center font-black text-xs"
                    style={{ backgroundColor: KOLOM_COLORS[k] }}>
                    {k}
                  </div>
                  <span className="text-xs font-bold text-gray-700 leading-tight pt-0.5">{KOLOM_LABEL[k]}</span>
                </div>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// DETAIL MODAL
// ─────────────────────────────────────────────────────────────────────────────
function DetailModal({ unit, onClose }: { unit: any; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b-4 border-black bg-gray-50">
          <div>
            <h2 className="text-xl font-black uppercase tracking-tight">{unit.nama}</h2>
            {unit._kelompok && (
              <span className="inline-block mt-1 text-[10px] font-black px-2 py-0.5 border border-black uppercase tracking-wider bg-gray-200">
                {TAB_CONFIG.find((t) => t.key === unit._kelompok)?.label || unit._kelompok}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 transition-colors border-2 border-transparent hover:border-black cursor-pointer">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="space-y-6">
            {KOLOM.map((k) => (
              <div key={k} className="p-4 border-2 border-black relative">
                <div className="absolute -top-3 left-3 bg-white px-2 flex items-center gap-2">
                  <CheckBadge checked={unit[k]} kolom={k} />
                  <span className="font-black text-sm">{k}</span>
                </div>

                <div className="mt-4">
                  <div className="text-xs font-bold text-gray-500 mb-3">{KOLOM_LABEL[k]}</div>
                  {unit[k] ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-1.5">
                          Tautan Berkas
                        </label>
                        <input
                          type="url"
                          placeholder="Belum ada tautan"
                          value={unit[k + '_link'] || ''}
                          readOnly
                          className="w-full border-2 border-black px-3 py-2 text-sm font-bold bg-gray-100 text-gray-600 focus:outline-none transition-all cursor-default"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest mb-1.5">
                          Terakhir Diperbaharui
                        </label>
                        <input
                          type="text"
                          placeholder="Belum ada data"
                          value={unit[k + '_date'] || ''}
                          readOnly
                          className="w-full border-2 border-black px-3 py-2 text-sm font-bold bg-gray-100 text-gray-600 focus:outline-none transition-all cursor-default"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-gray-400 italic">Berkas tidak tersedia</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-4 border-t-4 border-black bg-gray-50 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 border-2 border-black font-black text-xs uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer">
            Tutup
          </button>
        </div>
      </motion.div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────
export default function KetersediaanBerkas() {
  const [activeTab, setActiveTab] = useState('perangkat_daerah')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedUnit, setSelectedUnit] = useState<any | null>(null)

  const currentTab = TAB_CONFIG.find((t) => t.key === activeTab)
  const currentData = activeTab === 'semua' ? [] : (DATA[activeTab] ?? [])

  const globalStats = useMemo(() => {
    const all = DATA_TABS.flatMap((key) => DATA[key])
    const byKolom = Object.fromEntries(KOLOM.map((k) => [k, all.filter((r) => r[k]).length]))
    return {
      total: all.length,
      byKolom,
      fullComplete: all.filter((r) => completionScore(r) === 5).length,
      hasAny: all.filter((r) => completionScore(r) > 0).length
    }
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 font-sans text-black">
      {/* HEADER */}
      <header className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-[#C77DFF] border-2 border-black px-4 py-1 mb-4 shadow-[4px_4px_0px_0px_#000]">
          <span className="text-sm font-black uppercase tracking-widest">Tahun {DATA.meta.tahun}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-[0.9]">
          KETERSEDIAAN{' '}
          <span className="text-transparent bg-clip-text bg-linear-to-r from-purple-500 to-pink-500 underline decoration-black decoration-4 underline-offset-8">
            BERKAS
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base font-bold text-gray-600 max-w-2xl leading-relaxed">
          Rekapitulasi penyampaian data dokumen <span className="bg-purple-100 px-1">SP</span> &amp;{' '}
          <span className="bg-red-100 px-1">SIPPN</span> oleh Perangkat Daerah.
        </motion.p>
      </header>

      {/* STAT CARDS */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
        {[
          { label: 'Total Unit', value: globalStats.total, color: '#FF9F1C', sub: 'Seluruh perangkat' },
          { label: 'Punya Berkas', value: globalStats.hasAny, color: '#4ECDC4', sub: `dari ${globalStats.total} unit` },
          { label: 'Lengkap 5/5', value: globalStats.fullComplete, color: '#16a34a', sub: 'Semua kolom terisi' },
          {
            label: 'Punya SIPPN',
            value: globalStats.byKolom['SIPPN'],
            color: '#FF6B6B',
            sub: `dari ${globalStats.total} unit`
          }
        ].map((s, i) => (
          <div key={i} className="border-4 border-black p-4 bg-white shadow-[6px_6px_0px_0px_#000]">
            <div className="w-3 h-3 border-2 border-black mb-3" style={{ backgroundColor: s.color }} />
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">{s.label}</div>
            <div className="text-3xl font-black tabular-nums">{s.value}</div>
            <div className="text-xs font-bold text-gray-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </motion.div>

      {/* KOLOM PILLS */}
      <div className="flex flex-wrap gap-2 mb-8">
        {KOLOM.map((k) => (
          <div
            key={k}
            className="flex items-center gap-1.5 border-2 border-black px-3 py-1.5 text-xs font-black uppercase tracking-wider shadow-[2px_2px_0px_0px_#000]"
            style={{ backgroundColor: KOLOM_COLORS[k] }}>
            {k}
            <span className="text-black/60 font-bold normal-case tracking-normal">— {globalStats.byKolom[k]} unit</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="relative w-full flex items-end">
        <div className="absolute bottom-0 left-0 right-0 h-[4px] bg-black z-0" />
        <div className="flex overflow-x-auto gap-2 w-full relative z-10 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {TAB_CONFIG.map((tab) => {
            const isActive = activeTab === tab.key
            const isSemua = tab.key === 'semua'
            const rows = isSemua ? DATA_TABS.flatMap((k) => DATA[k]) : (DATA[tab.key] ?? [])
            const filled = rows.filter((r: any) => completionScore(r) > 0).length
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key)
                  setSearchQuery('')
                }}
                className={`flex items-center shrink-0 px-5 font-black text-sm uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap
                  ${isActive ? 'border-4 border-b-0 border-black pt-3 pb-[16px] text-black z-10' : 'border-4 border-black py-3 text-black hover:brightness-95'}`}
                style={
                  isActive
                    ? { backgroundColor: tab.color }
                    : {
                        backgroundColor: isSemua ? '#37415122' : tab.color + '40',
                        borderLeftColor: tab.color,
                        borderLeftWidth: 6
                      }
                }>
                <span className="mr-1.5 flex items-center">{tab.icon}</span>
                {tab.label}
                <span
                  className="ml-2 flex items-center justify-center text-xs font-bold px-1.5 py-0.5 border border-black"
                  style={
                    isActive
                      ? { backgroundColor: '#000', color: '#fff' }
                      : { backgroundColor: '#000', color: '#fff', opacity: 0.55 }
                  }>
                  {isSemua ? rows.length : `${filled}/${rows.length}`}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* TAB CONTENT */}
      <div className="border-4 border-t-0 border-black shadow-[8px_8px_0px_0px_#000] bg-white">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-5 border-b-4 border-black bg-gray-50">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 border-2 border-black flex items-center justify-center text-xl shadow-[2px_2px_0px_0px_#000]"
              style={{ backgroundColor: currentTab?.color }}>
              {currentTab?.icon}
            </div>
            <div>
              <div className="font-black text-lg uppercase tracking-tight">{currentTab?.label}</div>
              <div className="text-xs font-bold text-gray-500">
                {activeTab === 'semua'
                  ? `${globalStats.total} unit dari ${DATA_TABS.length} kelompok`
                  : `${currentData.length} unit terdaftar`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-64">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Cari nama unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border-4 border-black py-2.5 pl-10 pr-9 font-bold text-sm placeholder:text-gray-400 focus:outline-none focus:shadow-[4px_4px_0px_0px_#000] transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 font-black text-gray-400 hover:text-black cursor-pointer">
                  <X size={14} />
                </button>
              )}
            </div>
            <LegendDropdown />
            <ExportDropdown activeTab={activeTab} />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}>
            {activeTab === 'semua' ? (
              <AllDataTable searchQuery={searchQuery} onRowClick={setSelectedUnit} />
            ) : (
              <DataTable
                rows={currentData}
                searchQuery={searchQuery}
                onRowClick={(row) => setSelectedUnit({ ...row, _kelompok: activeTab })}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {selectedUnit && <DetailModal unit={selectedUnit} onClose={() => setSelectedUnit(null)} />}
      </AnimatePresence>
    </div>
  )
}
