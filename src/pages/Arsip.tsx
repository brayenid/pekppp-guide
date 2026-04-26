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
        className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-[#0f172a] hover:bg-[#1e293b] text-white font-bold text-xs uppercase tracking-wider transition-colors rounded-lg shadow-sm cursor-pointer">
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
              className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg min-w-64 overflow-hidden">
              <div className="px-4 py-2.5 border-b border-slate-100 bg-slate-50">
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  Pilih Cakupan Ekspor
                </span>
              </div>

              <button
                onClick={() => {
                  exportToExcel(activeTab)
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 border-b border-slate-100 transition-colors cursor-pointer">
                <span className="text-xl">{currentIcon}</span>
                <div>
                  <div className="font-bold text-sm text-slate-800">{currentLabel} saja</div>
                  <div className="text-xs text-gray-500 font-medium">1 sheet · tab yang sedang aktif</div>
                </div>
              </button>

              <button
                onClick={() => {
                  exportToExcel('all')
                  setOpen(false)
                }}
                className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-50 transition-colors cursor-pointer">
                <span className="text-xl">
                  <BarChart size={20} />
                </span>
                <div>
                  <div className="font-bold text-sm text-slate-800">Semua Kelompok</div>
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
      className={`w-7 h-7 rounded-md flex items-center justify-center font-bold text-sm transition-all ${
        checked
          ? 'bg-[#0f172a] text-white shadow-sm'
          : 'bg-slate-50 text-slate-300 border border-slate-100'
      }`}>
      {checked ? '✓' : '–'}
    </div>
  )
}

function StatBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0
  return (
    <div className="flex-1 min-w-28">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-600">{label}</span>
        <span className="text-xs text-slate-400">{count}/{total}</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="h-full rounded-full bg-gov-blue"
        />
      </div>
      <div className="text-xs font-bold mt-0.5"
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
      className={`border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer ${index % 2 !== 0 ? 'bg-slate-50/60' : 'bg-white'}`}>
      <td className="px-4 py-3 text-xs text-slate-400 tabular-nums">{row.id}</td>
      <td className="px-4 py-3 font-medium text-sm text-slate-800 leading-snug">{row.nama}</td>
      {KOLOM.map((k) => (
        <td key={k} className="px-2 py-3 text-center">
          <div className="flex justify-center">
            <CheckBadge checked={row[k]} kolom={k} />
          </div>
        </td>
      ))}
      <td className="px-4 py-3 text-center">
        <div
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${
            scoreColor(score) === '#16a34a' ? 'bg-green-100 text-green-700' :
            scoreColor(score) === '#d97706' ? 'bg-amber-100 text-amber-700' :
            scoreColor(score) === '#ef4444' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
          }`}>
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
      <div className="flex flex-wrap gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        {KOLOM.map((k) => (
          <StatBar key={k} label={k} count={counts[k]} total={rows.length} color={KOLOM_COLORS[k]} />
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0f172a] text-white">
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest w-10">#</th>
              <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest">Nama Unit</th>
              {KOLOM.map((k) => (
                <th key={k} className="px-2 py-3 text-center w-16">
                  <span className="font-bold text-xs text-slate-300">{k}</span>
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest w-16">Total</th>
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
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          Menampilkan <span className="text-gov-blue font-bold">{filtered.length}</span> dari {rows.length} data
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
      className={`border-b border-slate-100 hover:bg-blue-50/40 transition-colors cursor-pointer ${index % 2 !== 0 ? 'bg-slate-50/60' : 'bg-white'}`}>
      <td className="px-3 py-2.5 text-xs text-slate-400 tabular-nums w-10">{row.id}</td>
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <div className="shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 uppercase tracking-wider">
            {TAB_CONFIG.find((t) => t.key === kelompok)?.icon}
          </div>
          <span className="font-medium text-sm text-slate-800 leading-snug">{row.nama}</span>
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
          className={`inline-flex items-center justify-center w-7 h-7 rounded-full font-bold text-sm ${
            scoreColor(score) === '#16a34a' ? 'bg-green-100 text-green-700' :
            scoreColor(score) === '#d97706' ? 'bg-amber-100 text-amber-700' :
            scoreColor(score) === '#ef4444' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500'
          }`}>
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
      <div className="flex flex-wrap gap-3 px-5 py-4 border-b border-slate-100 bg-slate-50">
        {KOLOM.map((k) => (
          <StatBar key={k} label={k} count={counts[k]} total={allRows.length} color={KOLOM_COLORS[k]} />
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-[#0f172a] text-white">
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest w-10">#</th>
              <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-widest">Nama Unit</th>
              {KOLOM.map((k) => (
                <th key={k} className="px-2 py-3 text-center w-16">
                  <span className="font-bold text-xs text-slate-300">{k}</span>
                </th>
              ))}
              <th className="px-3 py-3 text-center text-xs font-bold uppercase tracking-widest w-16">Total</th>
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
                    <tr key={`header-${key}`} className="border-b border-slate-200">
                      <td colSpan={KOLOM.length + 3} className="px-4 py-2.5 bg-slate-100">
                        <span className="font-bold text-xs uppercase tracking-widest text-slate-600 flex items-center gap-2">
                          {tabInfo.icon} {tabInfo.label}
                          <span className="text-slate-400 font-medium">({groupRows.length} unit)</span>
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
        <div className="px-5 py-2.5 border-t border-slate-100 bg-slate-50 text-xs text-slate-500">
          Menampilkan <span className="text-gov-blue font-bold">{filtered.length}</span> dari {allRows.length} data
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
        className="flex items-center gap-2 px-4 py-2 border border-slate-200 bg-white font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-colors rounded-lg shadow-sm cursor-pointer">
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
              className="absolute left-0 md:left-auto md:right-0 top-full mt-2 z-50 bg-white border border-slate-200 rounded-xl shadow-lg p-4 min-w-72">
              {KOLOM.map((k) => (
                <div key={k} className="flex items-start gap-3 mb-2 last:mb-0">
                  <div className="w-9 shrink-0 h-6 rounded-md border border-slate-200 bg-[#0f172a] flex items-center justify-center text-white font-bold text-xs">
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
        className="relative bg-white border border-slate-200 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-bold text-gov-blue">{unit.nama}</h2>
            {unit._kelompok && (
              <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-500 uppercase tracking-wider">
                {TAB_CONFIG.find((t) => t.key === unit._kelompok)?.label || unit._kelompok}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer text-slate-500 hover:text-slate-800">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 bg-white">
          <div className="space-y-6">
            {KOLOM.map((k) => (
              <div key={k} className="p-4 border border-slate-200 rounded-xl relative">
                <div className="absolute -top-3 left-3 bg-white px-2 flex items-center gap-2">
                  <CheckBadge checked={unit[k]} kolom={k} />
                  <span className="font-bold text-sm text-slate-800">{k}</span>
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
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-slate-50 focus:outline-none cursor-default"
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
                          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-600 bg-slate-50 focus:outline-none cursor-default"
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

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 border border-slate-200 bg-white rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-slate-50 transition-all shadow-sm cursor-pointer">
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
          className="inline-block bg-[#0f172a] text-white border border-slate-200 rounded-lg px-4 py-1 mb-4 shadow-sm">
          <span className="text-sm font-bold uppercase tracking-wider text-white">Tahun {DATA.meta.tahun}</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl md:text-5xl font-serif font-bold text-gov-blue mb-4 leading-tight">
          Ketersediaan{' '}
          <span className="text-gov-gold">
            Berkas
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base text-slate-500 max-w-2xl leading-relaxed">
          Rekapitulasi penyampaian dokumen SP &amp; SIPPN oleh Perangkat Daerah.
        </motion.p>
      </header>

      {/* STAT CARDS */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Total Unit', value: globalStats.total, sub: 'Seluruh perangkat' },
          { label: 'Punya Berkas', value: globalStats.hasAny, sub: `dari ${globalStats.total} unit` },
          { label: 'Lengkap 5/5', value: globalStats.fullComplete, sub: 'Semua kolom terisi' },
          { label: 'Punya SIPPN', value: globalStats.byKolom['SIPPN'], sub: `dari ${globalStats.total} unit` }
        ].map((s, i) => (
          <div key={i} className="border border-slate-200 rounded-xl p-5 bg-white shadow-sm">
            <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">{s.label}</div>
            <div className="text-3xl font-bold tabular-nums text-gov-blue">{s.value}</div>
            <div className="text-xs text-slate-400 mt-1">{s.sub}</div>
          </div>
        ))}
      </motion.div>

      {/* KOLOM PILLS */}
      <div className="flex flex-wrap gap-2 mb-6">
        {KOLOM.map((k) => (
          <div
            key={k}
            className="flex items-center gap-2 border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-xs font-bold uppercase tracking-wider shadow-sm text-slate-700">
            <span className="text-gov-blue font-bold">{k}</span>
            <span className="text-slate-400 font-medium normal-case">— {globalStats.byKolom[k]} unit</span>
          </div>
        ))}
      </div>

      {/* TABS */}
      <div className="flex overflow-x-auto gap-2 mb-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
              className={`flex items-center shrink-0 gap-1.5 px-4 py-2 font-bold text-xs uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap rounded-lg border ${
                isActive
                  ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-md'
                  : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50 hover:text-slate-800'
              }`}>
              <span className="flex items-center opacity-70">{tab.icon}</span>
              {tab.label}
              <span className={`ml-1 flex items-center justify-center text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
              }`}>
                {isSemua ? rows.length : `${filled}/${rows.length}`}
              </span>
            </button>
          )
        })}
      </div>

      {/* TAB CONTENT */}
      <div className="border border-slate-200 rounded-xl shadow-sm bg-white overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg border border-slate-200 bg-white flex items-center justify-center text-gov-blue shadow-sm">
              {currentTab?.icon}
            </div>
            <div>
              <div className="font-bold text-base text-gov-blue">{currentTab?.label}</div>
              <div className="text-xs text-slate-400">
                {activeTab === 'semua'
                  ? `${globalStats.total} unit dari ${DATA_TABS.length} kelompok`
                  : `${currentData.length} unit terdaftar`}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            <div className="relative flex-1 md:w-64">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama unit..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-lg py-2 pl-9 pr-8 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-blue/20 transition-all shadow-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer">
                  <X size={13} />
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
