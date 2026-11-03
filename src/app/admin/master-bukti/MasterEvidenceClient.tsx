// src/app/admin/master-bukti/MasterEvidenceClient.tsx
'use client'

import { useState, useMemo, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  FolderArchive,
  Search,
  RefreshCw,
  Building2,
  ExternalLink,
  ArrowLeft,
  FolderOpen,
  ShieldCheck,
  Clock,
  Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Breadcrumb } from '../../../components/ui/Breadcrumb'
import { Button } from '../../../components/ui/Button'
import { AdminTabs } from '../../../components/ui/AdminTabs'
import { Card } from '../../../components/ui/Card'
import { StatCard } from '../../../components/ui/StatCard'
import { RegionalComplianceMatrix } from '../../../components/admin/RegionalComplianceMatrix'
import {
  MasterEvidenceWorkspace,
  MasterRecordItem
} from '../../../components/features/MasterEvidenceWorkspace'
import { syncAllUnitsEvidenceMasterAction } from '../../../actions/evidence-slot-actions'
import type { EvidenceSlotPreset, SlotUploadRule } from '../../../core/domain/evidence-slots-preset'
import type { RegionalComplianceOverview } from '../../../services/evidence-compliance-service'

interface SerializedUnit {
  id: string
  code: string | null
  name: string
  isActive: boolean
  category: { id: string; name: string } | null
  years: number[]
  evaluationId?: string | null
}

type ActiveMasterTab = 'repository' | 'matrix' | 'radar'

export default function MasterEvidenceClient({
  units,
  categories,
  masterRecords: initialMasterRecords,
  presetSlots,
  initialUnitId,
  initialTab,
  slotRules,
  complianceOverview
}: {
  units: SerializedUnit[]
  categories: { id: string; name: string }[]
  masterRecords: MasterRecordItem[]
  presetSlots: EvidenceSlotPreset[]
  initialUnitId: string | null
  initialTab?: string | null
  slotRules?: Record<string, SlotUploadRule>
  complianceOverview?: RegionalComplianceOverview
}) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const normalizeTab = useCallback((t?: string | null): ActiveMasterTab => {
    if (t === 'matrix' || t === 'radar') return t
    return 'repository'
  }, [])

  const initialTabValue = normalizeTab(searchParams.get('tab') || initialTab)
  const initialUnitValue = searchParams.get('unitId') || initialUnitId

  const [activeTab, setActiveTab] = useState<ActiveMasterTab>(initialTabValue)
  const [masterRecords, setMasterRecords] = useState<MasterRecordItem[]>(initialMasterRecords)
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(initialUnitValue)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL')
  const [filterMode, setFilterMode] = useState<'ALL' | 'WITH_MASTER'>('ALL')
  const [isSyncing, setIsSyncing] = useState(false)

  // Server-side paginated repository state with real HTTP refetching
  const [repoItems, setRepoItems] = useState<any[]>([])
  const [repoPage, setRepoPage] = useState<number>(1)
  const [repoTotal, setRepoTotal] = useState<number>(0)
  const [repoHasMore, setRepoHasMore] = useState<boolean>(false)
  const [isRepoLoadingMore, setIsRepoLoadingMore] = useState<boolean>(false)
  const repoSentinelRef = useRef<HTMLDivElement>(null)
  const isInitialRepoMount = useRef(true)

  // Sinkronisasi state internal saat URL SearchParams berubah (misal: tombol Back / Forward browser)
  useEffect(() => {
    const qTab = normalizeTab(searchParams.get('tab'))
    const qUnit = searchParams.get('unitId')
    setActiveTab(qTab)
    setSelectedUnitId(qUnit)

    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      setActiveTab(normalizeTab(params.get('tab')))
      setSelectedUnitId(params.get('unitId'))
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [searchParams, normalizeTab])

  const handleTabChange = (nextTab: string) => {
    const targetTab = normalizeTab(nextTab)
    setActiveTab(targetTab)

    const params = new URLSearchParams()
    params.set('tab', targetTab)
    if (targetTab === 'repository' && selectedUnitId) {
      params.set('unitId', selectedUnitId)
    } else {
      setSelectedUnitId(null)
    }
    window.history.replaceState(null, '', `/admin/master-bukti?${params.toString()}`)
  }

  const handleSelectUnit = (unitId: string | null) => {
    setSelectedUnitId(unitId)
    setActiveTab('repository')
    const params = new URLSearchParams()
    params.set('tab', 'repository')
    if (unitId) {
      params.set('unitId', unitId)
    }
    window.history.replaceState(null, '', `/admin/master-bukti?${params.toString()}`)
  }

  const totalMandatorySlotsCount = useMemo(
    () => presetSlots.filter((s) => s.isMandatory).length,
    [presetSlots]
  )

  const mastersByUnit = useMemo(() => {
    const map = new Map<string, MasterRecordItem[]>()
    for (const rec of masterRecords) {
      const list = map.get(rec.unitId) || []
      list.push(rec)
      map.set(rec.unitId, list)
    }
    return map
  }, [masterRecords])

  const unitRows = useMemo(() => {
    return units.map((unit) => {
      const records = mastersByUnit.get(unit.id) || []
      const mandatoryKeys = new Set(
        presetSlots.filter((p) => p.isMandatory).map((p) => `${p.aspectCode}::${p.slotKey}`)
      )

      let filledMandatory = 0
      let totalAttachments = 0
      let maxVersion = 1
      let latestSourceYear: number | null = null
      let latestUpdatedAt: string | null = null

      for (const r of records) {
        if (mandatoryKeys.has(`${r.aspectCode}::${r.slotKey}`)) {
          filledMandatory++
        }
        totalAttachments += r.attachments.length
        for (const att of r.attachments) {
          const v = att.version || 1
          if (v > maxVersion) maxVersion = v
        }
        if (r.lastSourceYear && (!latestSourceYear || r.lastSourceYear > latestSourceYear)) {
          latestSourceYear = r.lastSourceYear
        }
        if (!latestUpdatedAt || r.updatedAt > latestUpdatedAt) {
          latestUpdatedAt = r.updatedAt
        }
      }

      const completionPct = Math.min(
        100,
        Math.round((filledMandatory / Math.max(totalMandatorySlotsCount, 1)) * 100)
      )

      return {
        unit,
        records,
        totalSlotsFilled: records.length,
        filledMandatory,
        completionPct,
        totalAttachments,
        maxVersion,
        latestSourceYear,
        latestUpdatedAt
      }
    })
  }, [units, mastersByUnit, presetSlots, totalMandatorySlotsCount])

  const filteredUnitRows = useMemo(() => {
    return unitRows.filter((row) => {
      if (filterMode === 'WITH_MASTER' && row.totalSlotsFilled === 0) return false
      if (selectedCategoryId !== 'ALL' && row.unit.category?.id !== selectedCategoryId) return false
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        const matchName = row.unit.name.toLowerCase().includes(q)
        const matchCode = row.unit.code?.toLowerCase().includes(q)
        const matchCat = row.unit.category?.name.toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchCat) return false
      }
      return true
    })
  }, [unitRows, filterMode, selectedCategoryId, searchQuery])

  // Inisialisasi awal repoItems dari filteredUnitRows
  useEffect(() => {
    if (isInitialRepoMount.current) {
      isInitialRepoMount.current = false
      setRepoItems(filteredUnitRows.slice(0, 15))
      setRepoPage(1)
      setRepoTotal(filteredUnitRows.length)
      setRepoHasMore(filteredUnitRows.length > 15)
      return
    }

    // Refetch nyata dari server saat filter atau query pencarian berubah
    let isCancelled = false
    const fetchFiltered = async () => {
      setIsRepoLoadingMore(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('limit', '15')
        params.set('filterMode', filterMode)
        params.set('categoryId', selectedCategoryId)
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim())
        }
        const res = await fetch(`/api/admin/master-bukti/repository?${params.toString()}`)
        if (!res.ok) throw new Error('Gagal memuat repositori')
        const data = await res.json()
        if (!isCancelled && data.success && Array.isArray(data.items)) {
          setRepoItems(data.items)
          setRepoPage(1)
          setRepoTotal(data.total)
          setRepoHasMore(data.hasMore)
        }
      } catch (err) {
        console.error('Error fetching filtered repository items:', err)
      } finally {
        if (!isCancelled) setIsRepoLoadingMore(false)
      }
    }

    fetchFiltered()
    return () => {
      isCancelled = true
    }
  }, [filterMode, selectedCategoryId, searchQuery])

  // Refetch nyata dari server saat scroll (auto loadmore)
  const loadMoreRepo = useCallback(async () => {
    if (isRepoLoadingMore || !repoHasMore) return
    setIsRepoLoadingMore(true)

    try {
      const nextPage = repoPage + 1
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('limit', '15')
      params.set('filterMode', filterMode)
      params.set('categoryId', selectedCategoryId)
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }
      const res = await fetch(`/api/admin/master-bukti/repository?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat halaman berikutnya')
      const data = await res.json()
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setRepoItems((prev) => [...prev, ...data.items])
        setRepoPage(nextPage)
        setRepoTotal(data.total)
        setRepoHasMore(data.hasMore)
      } else {
        setRepoHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more repository items:', err)
      setRepoHasMore(false)
    } finally {
      setIsRepoLoadingMore(false)
    }
  }, [isRepoLoadingMore, repoHasMore, repoPage, filterMode, selectedCategoryId, searchQuery])

  // IntersectionObserver untuk auto refetch repositori
  useEffect(() => {
    if (!repoHasMore || isRepoLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && !isRepoLoadingMore && repoHasMore) {
          loadMoreRepo()
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1
      }
    )

    const el = repoSentinelRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [repoHasMore, isRepoLoadingMore, loadMoreRepo])

  const globalStats = useMemo(() => {
    const unitsWithMaster = unitRows.filter((r) => r.totalSlotsFilled > 0).length
    const totalSlots = masterRecords.length
    let totalFiles = 0
    let totalVersions = 0
    for (const r of masterRecords) {
      totalFiles += r.attachments.length
      for (const a of r.attachments) {
        totalVersions += (a.versions?.length || 0) + 1
      }
    }
    return {
      unitsWithMaster,
      totalSlots,
      totalFiles,
      totalVersions
    }
  }, [unitRows, masterRecords])

  const selectedUnitRow = useMemo(
    () => unitRows.find((r) => r.unit.id === selectedUnitId) || null,
    [unitRows, selectedUnitId]
  )

  const radarAlertCount = useMemo(() => {
    if (!complianceOverview) return 0
    return complianceOverview.unitProfiles.filter(
      (p) =>
        !p.sp.hasFile ||
        p.sp.isAging ||
        !p.saprasRentan.hasFile ||
        !p.skm.hasFile ||
        p.skm.isExpired ||
        !p.pengaduan.hasFile
    ).length
  }, [complianceOverview])

  const handleSyncAll = async () => {
    setIsSyncing(true)
    const toastId = toast.loading('Menyinkronkan repositori Master Bukti Dukung lintas periode...')
    try {
      const res = await syncAllUnitsEvidenceMasterAction()
      if (res.success) {
        toast.success(`Berhasil menyinkronkan Master Bukti Dukung untuk ${res.syncedUnitsCount} lokus.`, {
          id: toastId
        })
        router.refresh()
      } else {
        toast.error(res.error || 'Gagal menyinkronkan Master Bukti Dukung.', { id: toastId })
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyinkronkan Master Bukti Dukung.', { id: toastId })
    } finally {
      setIsSyncing(false)
    }
  }

  const handleUnitRecordsUpdated = (unitId: string, nextUnitRecords: MasterRecordItem[]) => {
    setMasterRecords((prev) => [
      ...prev.filter((r) => r.unitId !== unitId),
      ...nextUnitRecords
    ])
  }

  // ============================================================================
  // TAMPILAN DETAIL REPOSITORI MASTER SATU UNIT (DENGAN FITUR UNGGAH & VERSI)
  // ============================================================================
  if (selectedUnitRow) {
    const { unit, records } = selectedUnitRow

    return (
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <Breadcrumb
            className="!mb-0"
            showBackOnFirst
            items={[
              { label: 'Master Bukti Lokus', onClick: () => handleSelectUnit(null) },
              { label: unit.name }
            ]}
          />

          <Link
            href={`/evaluasi/${unit.id}`}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-surface hover:bg-surface-hover text-ink border border-stroke/60 text-xs font-semibold transition-colors shadow-2xs self-start sm:self-auto shrink-0">
            <span>Lihat Ruang Evaluasi Tahunan</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        <MasterEvidenceWorkspace
          unit={{
            id: unit.id,
            code: unit.code,
            name: unit.name,
            categoryName: unit.category?.name || null,
            evaluationId: unit.evaluationId || null
          }}
          initialRecords={records}
          presetSlots={presetSlots}
          uploaderName="Super Admin"
          slotRules={slotRules}
          isAdmin={true}
          onRecordsUpdated={handleUnitRecordsUpdated}
        />
      </div>
    )
  }

  // ============================================================================
  // TAMPILAN UTAMA: DAFTAR MASTER BUKTI DUKUNG SELURUH LOKUS
  // ============================================================================
  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FolderArchive className="w-5 h-5 text-brand" />}
        title="Master Bukti Dukung"
        description="Repositori induk bukti dukung seluruh lokus pelayanan publik. Berkas di dalam master otomatis diwariskan saat tahun penilaian baru dimulai dan menjaga kesinambungan versi (v1, v2, dst.) lintas tahun."
        actions={
          <Button
            type="button"
            variant="brand"
            disabled={isSyncing}
            isLoading={isSyncing}
            onClick={handleSyncAll}
            leftIcon={<RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />}>
            {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Master & Warisan'}
          </Button>
        }
      />

      {/* Tab Navigasi Utama: Repositori Berkas vs Matriks Profil Layanan & Radar */}
      {complianceOverview && (
        <AdminTabs
          items={[
            {
              id: 'repository',
              badge: <FolderArchive className="w-3.5 h-3.5" />,
              label: 'Repositori Berkas Master',
              count: unitRows.length
            },
            {
              id: 'matrix',
              badge: <Building2 className="w-3.5 h-3.5" />,
              label: 'Matriks Profil Layanan OPD',
              count: complianceOverview.totalUnits
            },
            {
              id: 'radar',
              badge: <Clock className="w-3.5 h-3.5" />,
              label: 'Radar Kedaluwarsa Dokumen',
              count: radarAlertCount
            }
          ]}
          activeId={activeTab}
          onChange={handleTabChange}
          bordered={true}
        />
      )}

      {activeTab === 'matrix' && complianceOverview && (
        <RegionalComplianceMatrix
          compliance={complianceOverview}
          activeSubTab="MATRIX"
          onSelectUnitMaster={handleSelectUnit}
          categories={categories}
        />
      )}

      {activeTab === 'radar' && complianceOverview && (
        <RegionalComplianceMatrix
          compliance={complianceOverview}
          activeSubTab="RADAR"
          onSelectUnitMaster={handleSelectUnit}
          categories={categories}
        />
      )}

      {activeTab === 'repository' && (
        <>
          {/* Ringkasan KPI Master Bukti Dukung */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            <StatCard
              compact
              label="Lokus Memiliki Master"
              value={globalStats.unitsWithMaster}
              suffix={`/ ${units.length} Lokus`}
            />
            <StatCard
              compact
              label="Total Slot Master Terisi"
              value={`${globalStats.totalSlots} Slot`}
            />
            <StatCard
              compact
              label="Total Berkas Master Aktif"
              value={`${globalStats.totalFiles} Berkas`}
            />
            <StatCard
              compact
              label="Total Akumulasi Versi"
              value={`${globalStats.totalVersions} Versi`}
              valueClassName="text-brand"
            />
          </div>

          {/* Filter & Pencarian */}
          <Card padding="sm" className="space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <AdminTabs
            items={[
              {
                id: 'ALL',
                badge: <Building2 className="w-3.5 h-3.5" />,
                label: 'Semua Lokus',
                count: unitRows.length
              },
              {
                id: 'WITH_MASTER',
                badge: <FolderArchive className="w-3.5 h-3.5" />,
                label: 'Sudah Ada Bukti Master',
                count: globalStats.unitsWithMaster
              }
            ]}
            activeId={filterMode}
            onChange={(val) => setFilterMode(val as 'ALL' | 'WITH_MASTER')}
            bordered={false}
          />

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-surface-subtle border border-stroke/60 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30">
              <option value="ALL">Semua Kategori</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama lokus atau kategori..."
                className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-subtle border border-stroke/60 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
              />
            </div>
          </div>
        </div>

        {/* Tabel Daftar Lokus & Status Master Bukti Dukung */}
        <div className="overflow-x-auto rounded-xl border border-stroke/50">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-subtle border-b border-stroke/60 text-xs font-semibold text-ink-secondary">
                <th className="py-2.5 px-3.5">Unit Kerja / Lokus</th>
                <th className="py-2.5 px-3.5">Kategori</th>
                <th className="py-2.5 px-3.5">Kelengkapan Slot Wajib</th>
                <th className="py-2.5 px-3.5">Berkas &amp; Versi</th>
                <th className="py-2.5 px-3.5">Sumber Terakhir</th>
                <th className="py-2.5 px-3.5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke/40 text-xs bg-surface">
              {repoItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-ink-muted text-xs">
                    {isRepoLoadingMore
                      ? 'Memuat data dari server...'
                      : 'Tidak ada lokus yang sesuai dengan filter pencarian.'}
                  </td>
                </tr>
              ) : (
                repoItems.map((row) => (
                  <tr
                    key={row.unit.id}
                    className="hover:bg-surface-subtle/60 transition-colors">
                    <td className="py-2.5 px-3.5">
                      <button
                        type="button"
                        onClick={() => handleSelectUnit(row.unit.id)}
                        className="font-semibold text-xs text-ink hover:text-brand text-left transition-colors cursor-pointer block leading-tight">
                        {row.unit.name}
                      </button>
                      {row.unit.code && (
                        <span className="text-[10px] text-ink-muted font-mono">{row.unit.code}</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-ink-secondary text-xs">
                      {row.unit.category?.name || '-'}
                    </td>
                    <td className="py-2.5 px-3.5">
                      <div className="flex items-center gap-2 max-w-[180px]">
                        <div className="flex-1 h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-stroke/40">
                          <div
                            className={`h-full rounded-full transition-all ${
                              row.completionPct >= 100
                                ? 'bg-emerald-500'
                                : row.completionPct > 0
                                  ? 'bg-brand'
                                  : 'bg-transparent'
                            }`}
                            style={{ width: `${row.completionPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-ink shrink-0">
                          {row.filledMandatory}/{totalMandatorySlotsCount}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3.5">
                      {row.totalAttachments > 0 ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-brand-light text-brand border border-brand/20">
                            {row.totalAttachments} Berkas
                          </span>
                          {row.maxVersion > 1 && (
                            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200">
                              v{row.maxVersion}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-muted text-xs">0 Berkas</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {row.latestSourceYear ? (
                        <div className="space-y-0.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-surface-subtle text-ink border border-stroke/60">
                            Periode {row.latestSourceYear}
                          </span>
                          {row.latestUpdatedAt && (
                            <div className="text-[10px] text-ink-muted">
                              {new Date(row.latestUpdatedAt).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric'
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-ink-muted text-xs">-</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <button
                        type="button"
                        onClick={() => handleSelectUnit(row.unit.id)}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-subtle hover:bg-brand hover:text-white text-ink text-xs font-semibold border border-stroke/60 transition-colors cursor-pointer">
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>Kelola Master</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Sentinel & Auto Loadmore State Footer (Server-Side Refetch) */}
        {repoHasMore && (
          <div
            ref={repoSentinelRef}
            className="p-3.5 border-t border-stroke/40 bg-surface-subtle/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-brand" />
              <span>
                {isRepoLoadingMore
                  ? 'Memuat data berikutnya dari server...'
                  : `Menampilkan ${repoItems.length} dari ${repoTotal} lokus`}
              </span>
            </div>

            <button
              type="button"
              disabled={isRepoLoadingMore}
              onClick={() => loadMoreRepo()}
              className="text-xs font-semibold text-brand hover:text-brand-hover hover:underline cursor-pointer disabled:opacity-50">
              {isRepoLoadingMore
                ? 'Memuat...'
                : `Muat lebih banyak (${Math.min(15, repoTotal - repoItems.length)} tersisa)`}
            </button>
          </div>
        )}

        {/* Footer saat semua data sudah dimuat */}
        {!repoHasMore && repoTotal > 15 && (
          <div className="py-2.5 px-4 border-t border-stroke/40 bg-surface-subtle/20 text-center text-xs text-ink-muted font-normal">
            Menampilkan seluruh {repoTotal} lokus
          </div>
        )}
      </Card>
        </>
      )}
    </div>
  )
}
