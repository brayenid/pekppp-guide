// src/components/admin/RegionalComplianceMatrix.tsx
// Komponen Matriks Profil Kesiapan Layanan Seluruh OPD & Radar Kedaluwarsa Dokumen
// Diselaraskan 100% dengan struktur visual Repositori Berkas Master:
// 1. Grid 4 Kartu KPI Atas seragam di seluruh tab.
// 2. Toolbar AdminTabs (size="default") + Filter Kategori + Input Cari terpadu menyatu di dalam kartu tabel.
// 3. Konten Tabel Terpadu di dalam satu bento card (rounded-2xl border-stroke/60 shadow-2xs).
'use client'

import { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Search,
  Clock,
  Sparkles,
  ShieldCheck,
  X,
  Building2,
  Calendar,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Loader2
} from 'lucide-react'
import { AdminTabs } from '../ui/AdminTabs'
import { Card } from '../ui/Card'
import { StatCard } from '../ui/StatCard'
import { FormModal } from '../ui/FormModal'
import { Button } from '../ui/Button'
import { formatFileUrl } from '../../lib/utils'
import type {
  RegionalComplianceOverview,
  UnitComplianceProfile
} from '../../services/evidence-compliance-service'

export function RegionalComplianceMatrix({
  compliance,
  activeSubTab = 'MATRIX',
  onSelectUnitMaster,
  categories = []
}: {
  compliance: RegionalComplianceOverview
  activeSubTab?: 'MATRIX' | 'RADAR'
  onSelectUnitMaster?: (unitId: string) => void
  categories?: Array<{ id: string; name: string }>
}) {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  const [matrixFilter, setMatrixFilter] = useState<
    'ALL' | 'NO_SP' | 'NO_SAPRAS' | 'NO_SKM' | 'AGING_SP' | 'NO_PENGADUAN'
  >('ALL')

  // Server-side paginated matrix state with real HTTP refetching
  const [matrixItems, setMatrixItems] = useState<UnitComplianceProfile[]>([])
  const [matrixPage, setMatrixPage] = useState<number>(1)
  const [matrixTotal, setMatrixTotal] = useState<number>(0)
  const [matrixHasMore, setMatrixHasMore] = useState<boolean>(false)
  const [isMatrixLoadingMore, setIsMatrixLoadingMore] = useState<boolean>(false)
  const matrixSentinelRef = useRef<HTMLDivElement>(null)
  const isInitialMatrixMount = useRef(true)

  const [selectedRadarIssue, setSelectedRadarIssue] = useState<
    'ALL' | 'SKM_EXPIRED' | 'SP_AGING' | 'SAPRAS_RENTAN' | 'SKM_PUB' | 'PENGADUAN'
  >('ALL')

  // Server-side paginated radar state with real HTTP refetching
  const [radarItemsList, setRadarItemsList] = useState<any[]>([])
  const [radarPage, setRadarPage] = useState<number>(1)
  const [radarTotal, setRadarTotal] = useState<number>(0)
  const [radarHasMore, setRadarHasMore] = useState<boolean>(false)
  const [isRadarLoadingMore, setIsRadarLoadingMore] = useState<boolean>(false)
  const radarSentinelRef = useRef<HTMLDivElement>(null)
  const isInitialRadarMount = useRef(true)

  // Modal Gallery Preview Foto Sarpras
  const [galleryTarget, setGalleryTarget] = useState<{
    unitName: string
    photos: Array<{ fileUrl: string; fileName: string }>
  } | null>(null)

  // 1. Data Matriks Profil Layanan (dengan filter kategori & search)
  const filteredProfiles = useMemo(() => {
    return compliance.unitProfiles.filter((p) => {
      if (selectedCategoryId !== 'ALL') {
        const matchedCat = categories.find((c) => c.id === selectedCategoryId)
        if (matchedCat && p.categoryName !== matchedCat.name) return false
        if (!matchedCat && p.categoryName !== selectedCategoryId) return false
      }

      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase()
        const matchName = p.unitName.toLowerCase().includes(q)
        const matchCode = (p.unitCode || '').toLowerCase().includes(q)
        const matchCat = p.categoryName.toLowerCase().includes(q)
        const matchDoc = (p.sp.documentNumber || '').toLowerCase().includes(q)
        if (!matchName && !matchCode && !matchCat && !matchDoc) return false
      }

      if (matrixFilter === 'NO_SP') return !p.sp.hasFile
      if (matrixFilter === 'AGING_SP') return p.sp.isAging
      if (matrixFilter === 'NO_SAPRAS') return !p.saprasRentan.hasFile
      if (matrixFilter === 'NO_SKM') return !p.skm.hasFile || p.skm.isExpired
      if (matrixFilter === 'NO_PENGADUAN') return !p.pengaduan.hasFile

      return true
    })
  }, [compliance.unitProfiles, searchQuery, matrixFilter, selectedCategoryId, categories])

  // 2. Data Radar: Mengelompokkan Temuan Regulasi
  const radarIssues = useMemo(() => {
    const skmExpiredUnits = compliance.unitProfiles.filter((p) => !p.skm.hasFile || p.skm.isExpired)
    const spAgingUnits = compliance.unitProfiles.filter((p) => !p.sp.hasFile || p.sp.isAging)
    const saprasMissingUnits = compliance.unitProfiles.filter((p) => !p.saprasRentan.hasFile)
    const skmPubMissingUnits = compliance.unitProfiles.filter(
      (p) => p.skm.hasFile && !p.skm.hasPublication
    )
    const pengaduanMissingUnits = compliance.unitProfiles.filter((p) => !p.pengaduan.hasFile)

    return [
      {
        id: 'SKM_EXPIRED',
        title: 'Laporan SKM Kedaluwarsa atau Belum Dilaporkan',
        aspectCode: 'I',
        severity: 'DANGER' as const,
        regulationContext:
          'PermenPAN-RB No. 14/2017 & Indikator #6 PEKPPP mewajibkan Laporan Pelaksanaan Survei Kepuasan Masyarakat diperbarui minimal 1 kali setiap tahun.',
        evaluationImpact:
          'Berisiko mendapat nilai minimal (0 atau 1) pada Pertanyaan #6 (Pelaksanaan SKM) dan #8 (Tindak Lanjut Hasil SKM).',
        units: skmExpiredUnits.map((u) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: !u.skm.hasFile
            ? 'Belum ada dokumen laporan SKM'
            : `Terakhir lapor ${u.skm.year || '-'} (Usang)`
        }))
      },
      {
        id: 'SP_AGING',
        title: 'SK Standar Pelayanan (SP) Berusia ≥ 3 Tahun atau Belum Ada',
        aspectCode: 'I',
        severity: 'WARNING' as const,
        regulationContext:
          'UU No. 25/2009 Pasal 20 & PermenPAN-RB No. 29/2022. SK SP yang telah berusia 3 tahun atau lebih wajib ditinjau ulang melalui Forum Konsultasi Publik (FKP).',
        evaluationImpact:
          'Evaluator KemenPAN-RB memberikan catatan perbaikan dan mengurangi skor jika komponen standar tidak mutakhir.',
        units: spAgingUnits.map((u) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: !u.sp.hasFile
            ? 'Belum menetapkan SK Standar Pelayanan'
            : `SK Terbit ${u.sp.year || '-'} (Perlu FKP)`
        }))
      },
      {
        id: 'SAPRAS_RENTAN',
        title: 'Fasilitas Sarpras Ramah Kelompok Rentan Belum Memiliki Foto',
        aspectCode: 'III',
        severity: 'DANGER' as const,
        regulationContext:
          'Surat Edaran MenPANRB No. 66/2020 & Aspek III Indikator #18 & #19. Pemenuhan hak disabilitas wajib dibuktikan dengan foto fisik nyata.',
        evaluationImpact:
          'Pertanyaan #18 akan mendapat nilai 0 atau 1 jika foto dokumentasi fisik fasilitas tidak dilampirkan.',
        units: saprasMissingUnits.map((u) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: 'Belum ada foto fasilitas ramah kelompok rentan yang diunggah'
        }))
      },
      {
        id: 'SKM_PUB',
        title: 'Bukti Publikasi Hasil Nilai SKM ke Masyarakat Belum Dilampirkan',
        aspectCode: 'I',
        severity: 'WARNING' as const,
        regulationContext:
          'Aspek I Indikator #7 (Publikasi Hasil SKM). Laporan SKM wajib disosialisasikan secara terbuka kepada publik.',
        evaluationImpact:
          'Pertanyaan #7 tetap mendapat nilai 0 jika bukti visual publikasi media tidak dilampirkan.',
        units: skmPubMissingUnits.map((u) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: 'Laporan SKM tersedia, namun bukti publikasi belum dilampirkan'
        }))
      },
      {
        id: 'PENGADUAN',
        title: 'Bukti Pengelolaan Pengaduan / SP4N-LAPOR! Belum Tercatat',
        aspectCode: 'V',
        severity: 'DANGER' as const,
        regulationContext:
          'Aspek V (Konsultasi & Pengaduan) Indikator #25 & #27. Kepatuhan sistem integrasi SP4N-LAPOR! sebagai kanal resmi nasional.',
        evaluationImpact:
          'Mengurangi nilai kepatuhan pengelolaan pengaduan dan koordinasi tindak lanjut.',
        units: pengaduanMissingUnits.map((u) => ({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          statusNote: 'Belum ada bukti pengelolaan pengaduan / SP4N-LAPOR!'
        }))
      }
    ]
  }, [compliance])

  // Flat list temuan lokus untuk tabel Radar yang menyatu dengan AdminTabs
  const radarAffectedItems = useMemo(() => {
    const items: Array<{
      unitId: string
      unitName: string
      unitCode: string | null
      categoryName: string
      issueId: string
      issueTitle: string
      aspectCode: string
      severity: 'DANGER' | 'WARNING'
      statusNote: string
    }> = []

    for (const issue of radarIssues) {
      if (selectedRadarIssue !== 'ALL' && issue.id !== selectedRadarIssue) continue

      for (const u of issue.units) {
        if (selectedCategoryId !== 'ALL') {
          const matchedCat = categories.find((c) => c.id === selectedCategoryId)
          if (matchedCat && u.categoryName !== matchedCat.name) continue
          if (!matchedCat && u.categoryName !== selectedCategoryId) continue
        }

        if (searchQuery.trim() !== '') {
          const q = searchQuery.toLowerCase()
          const matchName = u.unitName.toLowerCase().includes(q)
          const matchCode = (u.unitCode || '').toLowerCase().includes(q)
          const matchCat = u.categoryName.toLowerCase().includes(q)
          if (!matchName && !matchCode && !matchCat) continue
        }

        items.push({
          unitId: u.unitId,
          unitName: u.unitName,
          unitCode: u.unitCode,
          categoryName: u.categoryName,
          issueId: issue.id,
          issueTitle: issue.title,
          aspectCode: issue.aspectCode,
          severity: issue.severity,
          statusNote: u.statusNote
        })
      }
    }

    return items
  }, [radarIssues, selectedRadarIssue, selectedCategoryId, searchQuery, categories])

  const currentRadarIssueContext = useMemo(() => {
    if (selectedRadarIssue === 'ALL') return null
    return radarIssues.find((i) => i.id === selectedRadarIssue) || null
  }, [radarIssues, selectedRadarIssue])

  const radarTotalAffectedCount = useMemo(() => {
    return compliance.unitProfiles.filter(
      (p) =>
        !p.sp.hasFile ||
        p.sp.isAging ||
        !p.saprasRentan.hasFile ||
        !p.skm.hasFile ||
        p.skm.isExpired ||
        !p.pengaduan.hasFile
    ).length
  }, [compliance])

  // Inisialisasi awal matrixItems & refetch saat filter berubah
  useEffect(() => {
    if (isInitialMatrixMount.current) {
      isInitialMatrixMount.current = false
      setMatrixItems(filteredProfiles.slice(0, 15))
      setMatrixPage(1)
      setMatrixTotal(filteredProfiles.length)
      setMatrixHasMore(filteredProfiles.length > 15)
      return
    }

    let isCancelled = false
    const fetchMatrixFiltered = async () => {
      setIsMatrixLoadingMore(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('limit', '15')
        params.set('matrixFilter', matrixFilter)
        params.set('categoryId', selectedCategoryId)
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim())
        }
        const res = await fetch(`/api/admin/master-bukti/matrix?${params.toString()}`)
        if (!res.ok) throw new Error('Gagal memuat matriks')
        const data = await res.json()
        if (!isCancelled && data.success && Array.isArray(data.items)) {
          setMatrixItems(data.items)
          setMatrixPage(1)
          setMatrixTotal(data.total)
          setMatrixHasMore(data.hasMore)
        }
      } catch (err) {
        console.error('Error fetching filtered matrix:', err)
      } finally {
        if (!isCancelled) setIsMatrixLoadingMore(false)
      }
    }

    fetchMatrixFiltered()
    return () => {
      isCancelled = true
    }
  }, [matrixFilter, selectedCategoryId, searchQuery])

  // Refetch nyata dari server saat scroll pada Matriks (auto loadmore)
  const loadMoreMatrix = useCallback(async () => {
    if (isMatrixLoadingMore || !matrixHasMore) return
    setIsMatrixLoadingMore(true)

    try {
      const nextPage = matrixPage + 1
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('limit', '15')
      params.set('matrixFilter', matrixFilter)
      params.set('categoryId', selectedCategoryId)
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }
      const res = await fetch(`/api/admin/master-bukti/matrix?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat halaman matriks berikutnya')
      const data = await res.json()
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setMatrixItems((prev) => [...prev, ...data.items])
        setMatrixPage(nextPage)
        setMatrixTotal(data.total)
        setMatrixHasMore(data.hasMore)
      } else {
        setMatrixHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more matrix items:', err)
      setMatrixHasMore(false)
    } finally {
      setIsMatrixLoadingMore(false)
    }
  }, [isMatrixLoadingMore, matrixHasMore, matrixPage, matrixFilter, selectedCategoryId, searchQuery])

  // IntersectionObserver untuk auto refetch Matriks
  useEffect(() => {
    if (!matrixHasMore || isMatrixLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && !isMatrixLoadingMore && matrixHasMore) {
          loadMoreMatrix()
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1
      }
    )

    const el = matrixSentinelRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [matrixHasMore, isMatrixLoadingMore, loadMoreMatrix])

  // Inisialisasi awal radarItemsList & refetch saat filter radar berubah
  useEffect(() => {
    if (isInitialRadarMount.current) {
      isInitialRadarMount.current = false
      setRadarItemsList(radarAffectedItems.slice(0, 15))
      setRadarPage(1)
      setRadarTotal(radarAffectedItems.length)
      setRadarHasMore(radarAffectedItems.length > 15)
      return
    }

    let isCancelled = false
    const fetchRadarFiltered = async () => {
      setIsRadarLoadingMore(true)
      try {
        const params = new URLSearchParams()
        params.set('page', '1')
        params.set('limit', '15')
        params.set('issueId', selectedRadarIssue)
        params.set('categoryId', selectedCategoryId)
        if (searchQuery.trim()) {
          params.set('q', searchQuery.trim())
        }
        const res = await fetch(`/api/admin/master-bukti/radar?${params.toString()}`)
        if (!res.ok) throw new Error('Gagal memuat radar')
        const data = await res.json()
        if (!isCancelled && data.success && Array.isArray(data.items)) {
          setRadarItemsList(data.items)
          setRadarPage(1)
          setRadarTotal(data.total)
          setRadarHasMore(data.hasMore)
        }
      } catch (err) {
        console.error('Error fetching filtered radar:', err)
      } finally {
        if (!isCancelled) setIsRadarLoadingMore(false)
      }
    }

    fetchRadarFiltered()
    return () => {
      isCancelled = true
    }
  }, [selectedRadarIssue, selectedCategoryId, searchQuery])

  // Refetch nyata dari server saat scroll pada Radar (auto loadmore)
  const loadMoreRadar = useCallback(async () => {
    if (isRadarLoadingMore || !radarHasMore) return
    setIsRadarLoadingMore(true)

    try {
      const nextPage = radarPage + 1
      const params = new URLSearchParams()
      params.set('page', String(nextPage))
      params.set('limit', '15')
      params.set('issueId', selectedRadarIssue)
      params.set('categoryId', selectedCategoryId)
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }
      const res = await fetch(`/api/admin/master-bukti/radar?${params.toString()}`)
      if (!res.ok) throw new Error('Gagal memuat halaman radar berikutnya')
      const data = await res.json()
      if (data.success && Array.isArray(data.items) && data.items.length > 0) {
        setRadarItemsList((prev) => [...prev, ...data.items])
        setRadarPage(nextPage)
        setRadarTotal(data.total)
        setRadarHasMore(data.hasMore)
      } else {
        setRadarHasMore(false)
      }
    } catch (err) {
      console.error('Error loading more radar items:', err)
      setRadarHasMore(false)
    } finally {
      setIsRadarLoadingMore(false)
    }
  }, [isRadarLoadingMore, radarHasMore, radarPage, selectedRadarIssue, selectedCategoryId, searchQuery])

  // IntersectionObserver untuk auto refetch Radar
  useEffect(() => {
    if (!radarHasMore || isRadarLoadingMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0]
        if (first.isIntersecting && !isRadarLoadingMore && radarHasMore) {
          loadMoreRadar()
        }
      },
      {
        root: null,
        rootMargin: '250px',
        threshold: 0.1
      }
    )

    const el = radarSentinelRef.current
    if (el) observer.observe(el)

    return () => {
      if (el) observer.unobserve(el)
    }
  }, [radarHasMore, isRadarLoadingMore, loadMoreRadar])

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* 1. RINGKASAN KPI (SERAGAM 4 KARTU IDENTIK DENGAN TAB REPOSITORI) */}
      {/* ========================================================================= */}
      {activeSubTab === 'MATRIX' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            compact
            label="Standar Pelayanan (SP)"
            value={compliance.stats.unitsWithSp}
            suffix={`/ ${compliance.totalUnits} OPD`}
          />
          <StatCard
            compact
            label="Sapras Ramah Rentan"
            value={compliance.stats.unitsWithSaprasRentan}
            suffix={`/ ${compliance.totalUnits} OPD`}
          />
          <StatCard
            compact
            label="Laporan SKM Berjalan"
            value={compliance.stats.unitsWithActiveSkm}
            suffix={`/ ${compliance.totalUnits} OPD`}
          />
          <StatCard
            compact
            label="Rata Kesiapan 5 Pilar"
            value={`${compliance.stats.averageReadiness}%`}
            suffix="Indeks Daerah"
            valueClassName="text-brand"
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            compact
            label="Lokus Perlu Perhatian"
            value={radarTotalAffectedCount}
            suffix={`/ ${compliance.totalUnits} Lokus`}
          />
          <StatCard
            compact
            label="SKM Kedaluwarsa / Belum"
            value={compliance.stats.unitsWithExpiredSkm}
            suffix="Lokus"
          />
          <StatCard
            compact
            label="SK SP Berusia ≥ 3 Tahun"
            value={compliance.stats.unitsWithAgingSp}
            suffix="Lokus"
          />
          <StatCard
            compact
            label="Sapras Belum Ada Foto"
            value={Math.max(0, compliance.totalUnits - compliance.stats.unitsWithSaprasRentan)}
            suffix="Lokus"
          />
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. TAMPILAN MATRIKS PROFIL KESIAPAN LAYANAN OPD */}
      {/* ========================================================================= */}
      {activeSubTab === 'MATRIX' && (
        <Card padding="sm" className="space-y-3">
          {/* Toolbar Terpadu: AdminTabs (size=default) + Kategori + Pencarian */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <AdminTabs
              items={[
                {
                  id: 'ALL',
                  badge: <Building2 className="w-3.5 h-3.5" />,
                  label: 'Semua OPD',
                  count: compliance.unitProfiles.length
                },
                {
                  id: 'NO_SP',
                  badge: <FileText className="w-3.5 h-3.5" />,
                  label: 'Belum Punya SP',
                  count: Math.max(0, compliance.totalUnits - compliance.stats.unitsWithSp)
                },
                {
                  id: 'NO_SAPRAS',
                  badge: <ImageIcon className="w-3.5 h-3.5" />,
                  label: 'Belum Ada Sapras',
                  count: Math.max(0, compliance.totalUnits - compliance.stats.unitsWithSaprasRentan)
                },
                {
                  id: 'NO_SKM',
                  badge: <Calendar className="w-3.5 h-3.5" />,
                  label: 'SKM Belum/Usang',
                  count:
                    compliance.stats.unitsWithExpiredSkm +
                    Math.max(
                      0,
                      compliance.totalUnits -
                        (compliance.stats.unitsWithActiveSkm + compliance.stats.unitsWithExpiredSkm)
                    )
                },
                {
                  id: 'AGING_SP',
                  badge: <Clock className="w-3.5 h-3.5" />,
                  label: 'SK SP ≥ 3 Thn',
                  count: compliance.stats.unitsWithAgingSp
                },
                {
                  id: 'NO_PENGADUAN',
                  badge: <MessageSquare className="w-3.5 h-3.5" />,
                  label: 'Belum Ada SP4N',
                  count: Math.max(0, compliance.totalUnits - compliance.stats.unitsWithPengaduan)
                }
              ]}
              activeId={matrixFilter}
              onChange={(val) => setMatrixFilter(val as any)}
              bordered={false}
              size="default"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-surface-subtle border border-stroke/60 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer">
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
                  placeholder="Cari nama OPD atau nomor SK..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-subtle border border-stroke/60 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>
          </div>

          {/* Tabel Matriks Komparatif Eksekutif */}
          <div className="overflow-x-auto rounded-xl border border-stroke/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle border-b border-stroke/60 text-xs font-semibold text-ink-secondary">
                  <th className="py-2.5 px-3.5">Unit Kerja / OPD</th>
                  <th className="py-2.5 px-3.5">Kategori</th>
                  <th className="py-2.5 px-2.5">Standar Pelayanan (SP)</th>
                  <th className="py-2.5 px-2.5">Sapras Rentan</th>
                  <th className="py-2.5 px-2.5">Laporan &amp; Publikasi SKM</th>
                  <th className="py-2.5 px-2.5">Pengaduan (SP4N)</th>
                  <th className="py-2.5 px-2.5">Inovasi Layanan</th>
                  <th className="py-2.5 px-3.5 text-right">Kesiapan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke/40 text-xs bg-surface">
                {matrixItems.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-ink-muted text-xs">
                      {isMatrixLoadingMore
                        ? 'Memuat data dari server...'
                        : 'Tidak ada OPD yang sesuai dengan filter pencarian.'}
                    </td>
                  </tr>
                ) : (
                  matrixItems.map((p) => (
                    <tr
                      key={p.unitId}
                      className="hover:bg-surface-subtle/60 transition-colors">
                      {/* 1. Nama OPD */}
                      <td className="py-2.5 px-3.5 max-w-[220px]">
                        <button
                          type="button"
                          onClick={() => onSelectUnitMaster?.(p.unitId)}
                          className="font-semibold text-xs text-ink hover:text-brand text-left transition-colors cursor-pointer block leading-tight">
                          {p.unitName}
                        </button>
                        {p.unitCode && (
                          <span className="text-[10px] text-ink-muted font-mono">{p.unitCode}</span>
                        )}
                      </td>

                      {/* 2. Kategori */}
                      <td className="py-2.5 px-3.5 text-ink-secondary text-xs">
                        {p.categoryName || '-'}
                      </td>

                      {/* 3. Standar Pelayanan (SP) */}
                      <td className="py-2.5 px-2.5">
                        {p.sp.hasFile ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.sp.isAging
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{p.sp.year ? `Tahun ${p.sp.year}` : 'Tersedia'}</span>
                            </span>
                            {p.sp.isAging && (
                              <p className="text-[10px] text-amber-700 font-medium">
                                Usia &ge; 3 Thn (Perlu FKP)
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Belum Ada</span>
                          </span>
                        )}
                      </td>

                      {/* 4. Sapras Kelompok Rentan */}
                      <td className="py-2.5 px-2.5">
                        {p.saprasRentan.hasFile ? (
                          <button
                            type="button"
                            onClick={() =>
                              setGalleryTarget({
                                unitName: p.unitName,
                                photos: p.saprasRentan.photos
                              })
                            }
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-sky-50 text-sky-800 border border-sky-200 hover:bg-sky-100 transition-colors cursor-pointer">
                            <ImageIcon className="w-3 h-3 text-sky-600" />
                            <span>{p.saprasRentan.photoCount} Foto</span>
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                            <span>0 Foto</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Laporan & Publikasi SKM */}
                      <td className="py-2.5 px-2.5">
                        {p.skm.hasFile ? (
                          <div className="space-y-0.5">
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                                p.skm.isExpired
                                  ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                              }`}>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>{p.skm.year ? `Lapor ${p.skm.year}` : 'Ada'}</span>
                            </span>
                            {p.skm.hasPublication && (
                              <p className="text-[10px] text-emerald-700 font-medium">
                                + Terpublikasi
                              </p>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            <XCircle className="w-3 h-3 text-rose-600" />
                            <span>Belum Lapor</span>
                          </span>
                        )}
                      </td>

                      {/* 6. Pengaduan (SP4N-LAPOR!) */}
                      <td className="py-2.5 px-2.5">
                        {p.pengaduan.hasFile ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>
                              {p.pengaduan.hasSpanLapor ? 'SP4N-LAPOR!' : 'SOP Pengaduan'}
                            </span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200">
                            <span>Belum Ada</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Inovasi */}
                      <td className="py-2.5 px-2.5">
                        {p.inovasi.hasFile ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-900 border border-purple-200">
                            <Sparkles className="w-3 h-3 text-purple-600" />
                            <span>Tersedia</span>
                          </span>
                        ) : (
                          <span className="text-ink-muted text-xs">-</span>
                        )}
                      </td>

                      {/* 8. Skor Kesiapan */}
                      <td className="py-2.5 px-3.5 text-right">
                        <div className="font-bold text-xs text-ink">{p.readinessScore}%</div>
                        <div className="w-16 h-1.5 bg-surface-subtle rounded-full overflow-hidden ml-auto mt-1 border border-stroke/40">
                          <div
                            className={`h-full rounded-full ${
                              p.readinessScore >= 80
                                ? 'bg-emerald-500'
                                : p.readinessScore >= 50
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                            }`}
                            style={{ width: `${p.readinessScore}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Sentinel & Auto Loadmore State Footer (Server-Side Refetch) */}
          {matrixHasMore && (
            <div
              ref={matrixSentinelRef}
              className="p-3.5 border-t border-stroke/40 bg-surface-subtle/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                <span>
                  {isMatrixLoadingMore
                    ? 'Memuat data berikutnya dari server...'
                    : `Menampilkan ${matrixItems.length} dari ${matrixTotal} OPD`}
                </span>
              </div>

              <button
                type="button"
                disabled={isMatrixLoadingMore}
                onClick={() => loadMoreMatrix()}
                className="text-xs font-semibold text-brand hover:text-brand-hover hover:underline cursor-pointer disabled:opacity-50">
                {isMatrixLoadingMore
                  ? 'Memuat...'
                  : `Muat lebih banyak (${Math.min(15, matrixTotal - matrixItems.length)} tersisa)`}
              </button>
            </div>
          )}

          {/* Footer saat seluruh data sudah dimuat */}
          {!matrixHasMore && matrixTotal > 15 && (
            <div className="py-2.5 px-4 border-t border-stroke/40 bg-surface-subtle/20 text-center text-xs text-ink-muted font-normal">
              Menampilkan seluruh {matrixTotal} OPD
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 3. TAMPILAN RADAR KEDALUWARSA & KEPATUHAN WAKTU */}
      {/* ========================================================================= */}
      {activeSubTab === 'RADAR' && (
        <Card padding="sm" className="space-y-3">
          {/* Toolbar Terpadu: AdminTabs (size=default) + Kategori + Pencarian */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <AdminTabs
              items={[
                {
                  id: 'ALL',
                  badge: <Clock className="w-3.5 h-3.5" />,
                  label: 'Semua Isu Regulasi',
                  count: radarAffectedItems.length
                },
                {
                  id: 'SKM_EXPIRED',
                  badge: 'I',
                  label: 'Laporan SKM',
                  count: radarIssues.find((i) => i.id === 'SKM_EXPIRED')?.units.length || 0
                },
                {
                  id: 'SP_AGING',
                  badge: 'I',
                  label: 'Standar Pelayanan',
                  count: radarIssues.find((i) => i.id === 'SP_AGING')?.units.length || 0
                },
                {
                  id: 'SAPRAS_RENTAN',
                  badge: 'III',
                  label: 'Foto Sarpras Rentan',
                  count: radarIssues.find((i) => i.id === 'SAPRAS_RENTAN')?.units.length || 0
                },
                {
                  id: 'SKM_PUB',
                  badge: 'I',
                  label: 'Publikasi SKM',
                  count: radarIssues.find((i) => i.id === 'SKM_PUB')?.units.length || 0
                },
                {
                  id: 'PENGADUAN',
                  badge: 'V',
                  label: 'SP4N-LAPOR!',
                  count: radarIssues.find((i) => i.id === 'PENGADUAN')?.units.length || 0
                }
              ]}
              activeId={selectedRadarIssue}
              onChange={(val) => setSelectedRadarIssue(val as any)}
              bordered={false}
              size="default"
            />

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <select
                value={selectedCategoryId}
                onChange={(e) => setSelectedCategoryId(e.target.value)}
                className="px-3.5 py-2 rounded-xl bg-surface-subtle border border-stroke/60 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand/30 cursor-pointer">
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
                  placeholder="Cari nama lokus atau catatan..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-surface-subtle border border-stroke/60 text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-brand/30"
                />
              </div>
            </div>
          </div>

          {/* Banner Konteks Regulasi & Dampak Evaluasi (Menyatu di dalam kartu tabel) */}
          {currentRadarIssueContext ? (
            <div className="p-3.5 rounded-xl bg-surface-subtle/60 border border-stroke/50 text-xs sm:text-sm space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider ${
                    currentRadarIssueContext.severity === 'DANGER'
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}>
                  {currentRadarIssueContext.severity === 'DANGER' ? 'Kritis' : 'Peringatan Regulasi'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-surface border border-stroke/60 text-ink-secondary">
                  Aspek {currentRadarIssueContext.aspectCode}
                </span>
                <span className="font-semibold text-ink">{currentRadarIssueContext.title}</span>
              </div>
              <div className="text-ink-secondary leading-relaxed">
                <strong className="text-ink font-semibold">Dasar Kebijakan:</strong>{' '}
                {currentRadarIssueContext.regulationContext}
              </div>
              <div className="text-ink-muted leading-relaxed">
                <strong className="text-ink font-semibold">Dampak Penilaian:</strong>{' '}
                {currentRadarIssueContext.evaluationImpact}
              </div>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-surface-subtle/40 border border-stroke/40 text-xs sm:text-sm text-ink-secondary flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="leading-relaxed">
                Menampilkan daftar seluruh lokus yang terindikasi memerlukan pembaruan berkas berkala atau pelengkapan bukti fisik lintas 5 pilar.
              </span>
              <span className="font-semibold text-ink shrink-0">
                Total {radarAffectedItems.length} Temuan Terdeteksi
              </span>
            </div>
          )}

          {/* Tabel Terpadu Temuan Lokus Radar */}
          <div className="overflow-x-auto rounded-xl border border-stroke/50">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface-subtle border-b border-stroke/60 text-xs font-semibold text-ink-secondary">
                  <th className="py-2.5 px-3.5">Unit Kerja / Lokus</th>
                  <th className="py-2.5 px-3.5">Kategori</th>
                  <th className="py-2.5 px-3.5">Isu Regulasi &amp; Aspek</th>
                  <th className="py-2.5 px-3.5">Status &amp; Catatan Kepatuhan</th>
                  <th className="py-2.5 px-3.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stroke/40 text-xs bg-surface">
                {radarItemsList.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-ink-muted text-xs">
                      {isRadarLoadingMore
                        ? 'Memuat data dari server...'
                        : 'Tidak ada lokus yang terdeteksi isu pada kriteria filter ini. Seluruh OPD telah memenuhi ketentuan.'}
                    </td>
                  </tr>
                ) : (
                  radarItemsList.map((item, idx) => (
                    <tr
                      key={`${item.unitId}-${item.issueId}-${idx}`}
                      className="hover:bg-surface-subtle/60 transition-colors">
                      {/* 1. Nama Lokus */}
                      <td className="py-2.5 px-3.5 max-w-[240px]">
                        <button
                          type="button"
                          onClick={() => onSelectUnitMaster?.(item.unitId)}
                          className="font-semibold text-xs text-ink hover:text-brand text-left transition-colors cursor-pointer block leading-tight">
                          {item.unitName}
                        </button>
                        {item.unitCode && (
                          <span className="text-[10px] text-ink-muted font-mono">{item.unitCode}</span>
                        )}
                      </td>

                      {/* 2. Kategori */}
                      <td className="py-2.5 px-3.5 text-ink-secondary text-xs">
                        {item.categoryName || '-'}
                      </td>

                      {/* 3. Isu Regulasi & Aspek */}
                      <td className="py-2.5 px-3.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-surface-subtle border border-stroke/60 text-ink">
                            Aspek {item.aspectCode}
                          </span>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              item.severity === 'DANGER'
                                ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}>
                            {item.severity === 'DANGER' ? 'Kritis' : 'Perlu Kaji Ulang'}
                          </span>
                        </div>
                      </td>

                      {/* 4. Status & Catatan */}
                      <td className="py-2.5 px-3.5">
                        <span className="text-xs font-normal text-ink-secondary">
                          {item.statusNote}
                        </span>
                      </td>

                      {/* 5. Aksi */}
                      <td className="py-2.5 px-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => onSelectUnitMaster?.(item.unitId)}
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
          {radarHasMore && (
            <div
              ref={radarSentinelRef}
              className="p-3.5 border-t border-stroke/40 bg-surface-subtle/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-ink-muted">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-brand" />
                <span>
                  {isRadarLoadingMore
                    ? 'Memuat data berikutnya dari server...'
                    : `Menampilkan ${radarItemsList.length} dari ${radarTotal} Temuan Lokus`}
                </span>
              </div>

              <button
                type="button"
                disabled={isRadarLoadingMore}
                onClick={() => loadMoreRadar()}
                className="text-xs font-semibold text-brand hover:text-brand-hover hover:underline cursor-pointer disabled:opacity-50">
                {isRadarLoadingMore
                  ? 'Memuat...'
                  : `Muat lebih banyak (${Math.min(15, radarTotal - radarItemsList.length)} tersisa)`}
              </button>
            </div>
          )}

          {/* Footer saat seluruh data sudah dimuat */}
          {!radarHasMore && radarTotal > 15 && (
            <div className="py-2.5 px-4 border-t border-stroke/40 bg-surface-subtle/20 text-center text-xs text-ink-muted font-normal">
              Menampilkan seluruh {radarTotal} Temuan Lokus
            </div>
          )}
        </Card>
      )}

      {/* ========================================================================= */}
      {/* 4. MODAL GALLERY PREVIEW FOTO SARPRAS KELOMPOK RENTAN */}
      {/* ========================================================================= */}
      <FormModal
        isOpen={Boolean(galleryTarget)}
        onClose={() => setGalleryTarget(null)}
        title="Dokumentasi Sarpras Ramah Kelompok Rentan"
        description={galleryTarget?.unitName}
        icon={<ImageIcon className="w-4 h-4" />}
        maxWidth="2xl"
        footer={
          <div className="flex justify-end">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setGalleryTarget(null)}>
              Tutup
            </Button>
          </div>
        }>
        <div className="space-y-4 text-xs">
          {!galleryTarget || galleryTarget.photos.length === 0 ? (
            <p className="text-center text-ink-muted py-8">Belum ada foto yang dilampirkan.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {galleryTarget.photos.map((ph, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-line overflow-hidden bg-surface-subtle group">
                  <div className="aspect-video bg-zinc-900/10 relative overflow-hidden flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formatFileUrl(ph.fileUrl)}
                      alt={ph.fileName}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="p-2.5 flex items-center justify-between gap-2">
                    <p className="font-medium text-[11px] text-ink truncate" title={ph.fileName}>
                      {ph.fileName}
                    </p>
                    <a
                      href={formatFileUrl(ph.fileUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[11px] text-brand hover:underline font-semibold shrink-0">
                      Buka
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </FormModal>
    </div>
  )
}
