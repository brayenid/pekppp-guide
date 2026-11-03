'use client'

import { useState, useMemo, useEffect } from 'react'
import { createPortal } from 'react-dom'
import Link from 'next/link'
import {
  X,
  Search,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getMenpanReconciliationDataAction,
  saveMenpanBulkReconciliationAction,
  unbindEvaluationFromMenpanAction,
  ReconciliationRowItem,
  BulkReconciliationEntry
} from '../../actions/menpan-actions'
import { Button } from '../ui/Button'
import { Badge } from '../ui/Badge'

export interface UnitOption {
  id: string
  name: string
  categoryId?: string | null
  category?: { id: string; name: string } | null
}

interface DraftMapping {
  unitId: string
  newUnitName?: string
  newUnitCategoryId?: string
}

export function MenpanReconciliationSheet({
  year,
  isOpen,
  onClose,
  onSuccess
}: {
  year: number
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
}) {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [isConfigured, setIsConfigured] = useState(true)
  const [allUnits, setAllUnits] = useState<UnitOption[]>([])
  const [rows, setRows] = useState<ReconciliationRowItem[]>([])

  // Draft changes: map remoteUuid -> DraftMapping
  const [drafts, setDrafts] = useState<Record<string, DraftMapping>>({})

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTab, setFilterTab] = useState<'ALL' | 'UNBOUND' | 'BOUND' | 'PRIORITY'>('ALL')

  // Load data
  const loadData = async () => {
    setLoading(true)
    try {
      const res = await getMenpanReconciliationDataAction(year)
      setIsConfigured(Boolean(res.isConfigured))

      if (res.success) {
        setAllUnits(res.allUnits as any)
        setRows(res.rows)

        // Initialize drafts based on current state or exact matches
        const initialDrafts: Record<string, DraftMapping> = {}
        res.rows.forEach((r) => {
          if (r.status === 'ALREADY_BOUND' && r.unitId) {
            initialDrafts[r.remoteUuid] = { unitId: r.unitId }
          } else if (r.status === 'EXACT_MATCH' && r.unitId) {
            initialDrafts[r.remoteUuid] = { unitId: r.unitId }
          } else if (r.status === 'SUGGESTED_MATCH' && r.suggestedUnitId) {
            initialDrafts[r.remoteUuid] = { unitId: '' }
          } else {
            initialDrafts[r.remoteUuid] = { unitId: '' }
          }
        })
        setDrafts(initialDrafts)
      } else {
        setAllUnits([])
        setRows([])
        setDrafts({})
        if (!res.isConfigured) {
          toast.warning(res.message)
        } else {
          toast.error(res.message || 'Gagal mengambil data lokus dari MenPAN-RB.')
        }
      }
    } catch {
      toast.error('Terjadi kesalahan koneksi saat memuat rekonsiliasi.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen, year])

  // Categories list for new unit creation
  const categories = useMemo(() => {
    const map = new Map<string, string>()
    allUnits.forEach((u) => {
      if (u.category) {
        map.set(u.category.id, u.category.name)
      }
    })
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }))
  }, [allUnits])

  // Handler for row unit change
  const handleUnitSelectChange = (remoteUuid: string, unitId: string, defaultName: string) => {
    setDrafts((prev) => ({
      ...prev,
      [remoteUuid]: {
        unitId,
        newUnitName: unitId === 'CREATE_NEW' ? prev[remoteUuid]?.newUnitName || defaultName : undefined,
        newUnitCategoryId: unitId === 'CREATE_NEW' ? prev[remoteUuid]?.newUnitCategoryId : undefined
      }
    }))
  }

  // Handler for new unit name change
  const handleNewUnitNameChange = (remoteUuid: string, name: string) => {
    setDrafts((prev) => ({
      ...prev,
      [remoteUuid]: {
        ...prev[remoteUuid],
        newUnitName: name
      }
    }))
  }

  // Handler for new unit category change
  const handleNewUnitCategoryChange = (remoteUuid: string, categoryId: string) => {
    setDrafts((prev) => ({
      ...prev,
      [remoteUuid]: {
        ...prev[remoteUuid],
        newUnitCategoryId: categoryId
      }
    }))
  }

  // Auto-Match All Suggestions
  const handleAutoMatchAll = () => {
    let appliedCount = 0
    setDrafts((prev) => {
      const next = { ...prev }
      rows.forEach((r) => {
        if ((!next[r.remoteUuid]?.unitId || next[r.remoteUuid]?.unitId === '') && r.suggestedUnitId) {
          next[r.remoteUuid] = { unitId: r.suggestedUnitId }
          appliedCount++
        }
      })
      return next
    })
    if (appliedCount > 0) {
      toast.success(`Berhasil memasangkan otomatis ${appliedCount} saran lokus.`)
    } else {
      toast.info('Tidak ada saran lokus baru yang belum dipasangkan.')
    }
  }

  // Handle Unbind
  const handleUnbind = async (evaluationId: string, remoteUuid: string) => {
    if (!confirm('Apakah Anda yakin ingin melepaskan tautan lokus ini dari portal MenPAN-RB?')) return
    try {
      const res = await unbindEvaluationFromMenpanAction(evaluationId)
      if (res.success) {
        toast.success(res.message)
        setDrafts((prev) => ({
          ...prev,
          [remoteUuid]: { unitId: '' }
        }))
        loadData()
        if (onSuccess) onSuccess()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Gagal melepaskan tautan lokus.')
    }
  }

  // Filtered rows
  const filteredRows = useMemo(() => {
    return rows.filter((r) => {
      const draft = drafts[r.remoteUuid]
      const isBound = r.status === 'ALREADY_BOUND' || Boolean(draft?.unitId && draft.unitId !== '' && draft.unitId !== 'SKIP')

      if (filterTab === 'UNBOUND' && isBound) return false
      if (filterTab === 'BOUND' && !isBound) return false
      if (filterTab === 'PRIORITY' && !r.isPriority) return false

      if (!searchTerm) return true
      const term = searchTerm.toLowerCase()
      const matchRemote = r.remoteName.toLowerCase().includes(term)
      const matchLocal = r.unitName?.toLowerCase().includes(term)
      const matchSuggested = r.suggestedUnitName?.toLowerCase().includes(term)
      const matchSheet = r.formSheetName?.toLowerCase().includes(term)

      return matchRemote || matchLocal || matchSuggested || matchSheet
    })
  }, [rows, drafts, filterTab, searchTerm])

  // Count metrics
  const metrics = useMemo(() => {
    const total = rows.length
    let bound = 0
    let unbound = 0
    let createNew = 0
    let priority = 0

    rows.forEach((r) => {
      if (r.isPriority) priority++
      const draft = drafts[r.remoteUuid]
      const chosenUnitId = draft?.unitId !== undefined ? draft.unitId : r.unitId

      if (chosenUnitId === 'CREATE_NEW') {
        createNew++
        bound++
      } else if (chosenUnitId && chosenUnitId !== '' && chosenUnitId !== 'SKIP') {
        bound++
      } else {
        unbound++
      }
    })

    return { total, bound, unbound, createNew, priority }
  }, [rows, drafts])

  // Calculate dirty entries to be saved
  const readyToSaveEntries = useMemo(() => {
    const list: BulkReconciliationEntry[] = []
    rows.forEach((r) => {
      const draft = drafts[r.remoteUuid]
      if (!draft || !draft.unitId || draft.unitId === '') return

      list.push({
        remoteUuid: r.remoteUuid,
        remoteName: r.remoteName,
        formSheetName: r.formSheetName,
        isPriority: r.isPriority,
        unitId: draft.unitId,
        newUnitName: draft.newUnitName,
        newUnitCategoryId: draft.newUnitCategoryId
      })
    })
    return list
  }, [rows, drafts])

  // Save changes
  const handleSave = async () => {
    if (readyToSaveEntries.length === 0) {
      toast.info('Pilih setidaknya satu lokus lokal untuk dihubungkan.')
      return
    }

    setSaving(true)
    try {
      const res = await saveMenpanBulkReconciliationAction({
        year,
        entries: readyToSaveEntries
      })

      if (res.success) {
        toast.success(res.message)
        if (onSuccess) onSuccess()
        onClose()
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Gagal menyimpan rekonsiliasi lokus.')
    } finally {
      setSaving(false)
    }
  }

  // Close on Escape & Lock Body Scroll
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    /* Fullscreen Modal: True full-screen portal, docks 100% to (0,0) of viewport */
    <div
      className="fixed inset-0 top-0 left-0 right-0 bottom-0 z-[99999] bg-surface w-screen h-screen max-w-[100vw] max-h-[100vh] flex flex-col overflow-hidden select-none m-0 p-0"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 99999,
        margin: 0,
        padding: 0
      }}>
      {/* 1. Header Bar: Clean typography, no cluttered icon box */}
      <div className="px-6 py-3.5 border-b border-stroke/50 flex items-center justify-between bg-surface shrink-0">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-base font-bold text-ink tracking-tight">
              Rekonsiliasi Lokus MenPAN-RB
            </h1>
            <Badge variant="info" size="sm">
              Tahun {year}
            </Badge>
            {!isConfigured && (
              <Badge variant="danger" size="sm">
                Kredensial Belum Ditetapkan
              </Badge>
            )}
          </div>
          <p className="text-xs text-ink-muted">
            Pemetaan massal daftar lokus resmi portal MenPAN-RB ke Master Lokus lokal.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={loadData}
            disabled={loading}
            className="text-xs">
            {loading ? 'Memuat...' : 'Muat Ulang'}
          </Button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
            title="Tutup (Esc)">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 2. Sub-Header Toolbar: Minimalist text-only tabs & clean search */}
      <div className="px-6 py-2.5 border-b border-stroke/30 bg-surface-subtle/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
        {/* Flat Tabs without icon clutter */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterTab === 'ALL'
                ? 'bg-ink text-white font-semibold'
                : 'text-ink-secondary hover:text-ink hover:bg-surface'
            }`}>
            Semua ({metrics.total})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('UNBOUND')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterTab === 'UNBOUND'
                ? 'bg-amber-600 text-white font-semibold'
                : 'text-amber-800 hover:bg-amber-50'
            }`}>
            Belum Terikat ({metrics.unbound})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('BOUND')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterTab === 'BOUND'
                ? 'bg-emerald-600 text-white font-semibold'
                : 'text-emerald-800 hover:bg-emerald-50'
            }`}>
            Terikat ({metrics.bound})
          </button>

          <button
            type="button"
            onClick={() => setFilterTab('PRIORITY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              filterTab === 'PRIORITY'
                ? 'bg-brand text-white font-semibold'
                : 'text-ink-secondary hover:text-ink hover:bg-surface'
            }`}>
            Prioritas ({metrics.priority})
          </button>
        </div>

        {/* Search & Auto Match */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-ink-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari lokus MenPAN atau lokal..."
              className="w-56 sm:w-72 pl-8 pr-3 py-1.5 text-xs rounded-lg bg-surface border border-stroke/60 text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
            />
          </div>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleAutoMatchAll}
            disabled={!isConfigured || rows.length === 0}
            className="text-xs"
            title="Pasangkan otomatis lokus yang memiliki rekomendasi kecocokan">
            Pasangkan Saran
          </Button>
        </div>
      </div>

      {/* 3. Main Content: 100% full-bleed table or clean configuration prompt */}
      <div className="flex-1 overflow-y-auto overflow-x-auto min-h-0 bg-surface">
        {loading ? (
          <div className="py-32 text-center space-y-2.5">
            <Loader2 className="w-6 h-6 text-brand animate-spin mx-auto" />
            <p className="text-xs text-ink-muted">Menghubungkan ke server MenPAN-RB...</p>
          </div>
        ) : !isConfigured ? (
          /* Clean, editorial prompt when API credentials are not yet set */
          <div className="py-24 px-6 max-w-md mx-auto text-center space-y-4">
            <div className="space-y-2">
              <span className="inline-block px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-full">
                Kredensial Belum Ditetapkan
              </span>
              <h2 className="text-lg font-bold text-ink tracking-tight">
                Konfigurasi API MenPAN-RB Diperlukan
              </h2>
              <p className="text-xs text-ink-muted leading-relaxed">
                Base URL dan API Bearer Token wajib diisi terlebih dahulu untuk dapat menarik data evaluasi portal MenPAN-RB (berlaku baik untuk server Sandbox resmi maupun Production).
              </p>
            </div>

            <div className="pt-2 flex items-center justify-center gap-2.5">
              <Link
                href="/admin/pengaturan-api"
                className="px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-2xs transition-colors">
                Buka Pengaturan API
              </Link>
              <Button type="button" variant="secondary" size="sm" onClick={loadData}>
                Cek Ulang
              </Button>
            </div>
          </div>
        ) : filteredRows.length === 0 ? (
          <div className="py-24 text-center space-y-1.5 text-xs text-ink-muted">
            <p className="font-semibold text-ink text-sm">Tidak ada lokus yang sesuai.</p>
            <p>
              {searchTerm
                ? 'Coba gunakan kata kunci pencarian yang lain.'
                : `Portal MenPAN-RB belum memiliki daftar evaluasi untuk Tahun ${year}.`}
            </p>
          </div>
        ) : (
          /* High-density, professional desktop spreadsheet table */
          <table className="w-full text-left text-xs border-collapse">
            <thead className="sticky top-0 z-20 bg-surface-subtle border-b border-stroke/50 text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
              <tr>
                <th className="w-12 pl-6 pr-2 py-2.5 text-center">#</th>
                <th className="w-80 px-4 py-2.5">Lokus MenPAN-RB (Remote)</th>
                <th className="w-36 px-3 py-2.5 text-center">Akurasi</th>
                <th className="px-4 py-2.5">Master Lokus Lokal (/admin/lokus)</th>
                <th className="w-32 px-3 py-2.5 text-center">Partisipasi</th>
                <th className="w-24 pr-6 pl-2 py-2.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke/20">
              {filteredRows.map((r, idx) => {
                const draft = drafts[r.remoteUuid] || { unitId: '' }
                const currentSelectedUnitId = draft.unitId
                const isBoundInDb = r.status === 'ALREADY_BOUND'
                const isCreateNew = currentSelectedUnitId === 'CREATE_NEW'
                const isSkip = currentSelectedUnitId === 'SKIP'

                const selectedLocalUnit = allUnits.find((u) => u.id === currentSelectedUnitId)

                return (
                  <tr
                    key={r.remoteUuid}
                    className={`hover:bg-surface-subtle/50 transition-colors ${
                      isBoundInDb
                        ? 'bg-emerald-50/20'
                        : currentSelectedUnitId && !isSkip
                        ? 'bg-sky-50/20'
                        : ''
                    }`}>
                    {/* Index */}
                    <td className="pl-6 pr-2 py-3 text-center text-ink-muted text-[11px] tabular-nums">
                      {idx + 1}
                    </td>

                    {/* Lokus MenPAN-RB */}
                    <td className="px-4 py-3">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-semibold text-ink text-xs">
                            {r.remoteName}
                          </span>
                          {r.isPriority && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                              Prioritas
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-ink-muted">
                          <span className="truncate max-w-[130px]" title={r.remoteUuid}>
                            {r.remoteUuid.slice(0, 8)}...
                          </span>
                          <span>•</span>
                          <span className="text-ink-muted truncate max-w-[140px]">
                            {r.formSheetName || 'F-01'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Akurasi: Clean text badges, no icon clutter */}
                    <td className="px-3 py-3 text-center">
                      {isBoundInDb ? (
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          Terikat
                        </span>
                      ) : r.status === 'EXACT_MATCH' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold bg-teal-100 text-teal-800 border border-teal-200">
                          Cocok 100%
                        </span>
                      ) : r.status === 'SUGGESTED_MATCH' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                          Saran {r.matchScore}%
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-surface-subtle text-ink-muted border border-stroke/40">
                          Belum Terikat
                        </span>
                      )}
                    </td>

                    {/* Dropdown Master Lokus Lokal */}
                    <td className="px-4 py-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2">
                          <select
                            value={currentSelectedUnitId}
                            onChange={(e) =>
                              handleUnitSelectChange(r.remoteUuid, e.target.value, r.remoteName)
                            }
                            className={`w-full text-xs rounded-lg border px-3 py-1.5 bg-surface font-medium focus:outline-none focus:border-brand cursor-pointer ${
                              currentSelectedUnitId && currentSelectedUnitId !== 'SKIP'
                                ? 'border-brand text-ink bg-brand/5'
                                : 'border-stroke/60 text-ink-muted'
                            }`}>
                            <option value="">-- Pilih Master Lokus Lokal --</option>
                            {r.suggestedUnitId && (
                              <option value={r.suggestedUnitId}>
                                [SARAN] {r.suggestedUnitName}
                              </option>
                            )}
                            <option value="CREATE_NEW">
                              + Daftarkan Sebagai Unit Baru di Master Lokus
                            </option>
                            <option value="SKIP">Jangan Hubungkan (Lewati)</option>
                            <option disabled>────────────── Master Lokus ──────────────</option>
                            {allUnits.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name} {u.category ? `(${u.category.name})` : ''}
                              </option>
                            ))}
                          </select>

                          {/* Quick Suggestion Button */}
                          {r.suggestedUnitId && currentSelectedUnitId !== r.suggestedUnitId && (
                            <button
                              type="button"
                              onClick={() =>
                                handleUnitSelectChange(r.remoteUuid, r.suggestedUnitId!, r.remoteName)
                              }
                              title={`Pilih saran: ${r.suggestedUnitName}`}
                              className="px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg shrink-0 transition-colors cursor-pointer">
                              Gunakan Saran
                            </button>
                          )}
                        </div>

                        {/* Sub-form inline jika pilih Buat Unit Baru */}
                        {isCreateNew && (
                          <div className="p-2.5 bg-surface-subtle rounded-lg border border-brand/30 space-y-2">
                            <div className="text-[11px] font-bold text-brand">
                              Pendaftaran Unit Baru ke Master Lokus
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <div>
                                <label className="text-[10px] text-ink-muted block mb-0.5">
                                  Nama Unit Kerja
                                </label>
                                <input
                                  type="text"
                                  value={draft.newUnitName || ''}
                                  onChange={(e) =>
                                    handleNewUnitNameChange(r.remoteUuid, e.target.value)
                                  }
                                  placeholder="Nama Unit Kerja..."
                                  className="w-full text-xs px-2.5 py-1 rounded border border-stroke/70 bg-surface text-ink focus:outline-none focus:border-brand"
                                />
                              </div>
                              <div>
                                <label className="text-[10px] text-ink-muted block mb-0.5">
                                  Kategori
                                </label>
                                <select
                                  value={draft.newUnitCategoryId || ''}
                                  onChange={(e) =>
                                    handleNewUnitCategoryChange(r.remoteUuid, e.target.value)
                                  }
                                  className="w-full text-xs px-2 py-1 rounded border border-stroke/70 bg-surface text-ink focus:outline-none focus:border-brand cursor-pointer">
                                  <option value="">-- Perangkat Daerah (Umum) --</option>
                                  {categories.map((c) => (
                                    <option key={c.id} value={c.id}>
                                      {c.name}
                                    </option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Info Lokus Terpilih */}
                        {selectedLocalUnit && !isCreateNew && (
                          <div className="text-[10px] text-ink-muted flex items-center gap-1.5">
                            <span>Tersimpan di Master Lokus:</span>
                            <span className="font-semibold text-ink">
                              {selectedLocalUnit.name}
                            </span>
                            {selectedLocalUnit.category && (
                              <Badge variant="neutral" size="sm">
                                {selectedLocalUnit.category.name}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status Partisipasi */}
                    <td className="px-3 py-3 text-center">
                      {r.isEnrolled || (currentSelectedUnitId && currentSelectedUnitId !== 'SKIP') ? (
                        <span className="inline-block text-[11px] font-medium text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Peserta {year}
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-muted">
                          Belum Terdaftar
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="pr-6 pl-2 py-3 text-right">
                      {isBoundInDb && r.evaluationId ? (
                        <button
                          type="button"
                          onClick={() => handleUnbind(r.evaluationId!, r.remoteUuid)}
                          className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200 transition-colors cursor-pointer">
                          Lepas
                        </button>
                      ) : currentSelectedUnitId && currentSelectedUnitId !== 'SKIP' ? (
                        <span className="text-[11px] text-brand font-semibold">
                          Siap Diikat
                        </span>
                      ) : (
                        <span className="text-[11px] text-ink-muted">-</span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* 4. Footer Bar: Docked to bottom, full width */}
      <div className="px-6 py-3 border-t border-stroke/50 bg-surface flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="text-xs text-ink-muted">
          {!isConfigured ? (
            <span className="text-rose-600 font-medium">
              Kredensial API MenPAN-RB belum dikonfigurasi. Penarikan data dan rekonsiliasi dinonaktifkan.
            </span>
          ) : (
            <span>
              <strong className="text-ink font-semibold">{readyToSaveEntries.length}</strong> dari {rows.length} lokus siap dihubungkan ke Evaluasi PEKPPP {year}.
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={onClose} disabled={saving}>
            Batal / Tutup
          </Button>
          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={handleSave}
            disabled={saving || !isConfigured || readyToSaveEntries.length === 0}
            className="text-xs font-semibold">
            {saving
              ? 'Menyimpan...'
              : `Simpan Rekonsiliasi (${readyToSaveEntries.length})`}
          </Button>
        </div>
      </div>
    </div>,
    document.body
  )
}
