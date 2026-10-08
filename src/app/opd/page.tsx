import { requireAuth } from '../../services/auth-guard'
import { db } from '../../services/db'
import Link from 'next/link'
import { FileText, ArrowRight, Building2, CheckCircle2, AlertCircle, LayoutDashboard, UserCheck, CalendarDays, Clock, History, ChevronDown } from 'lucide-react'
import { redirect } from 'next/navigation'
import { PageHeader } from '../../components/ui/PageHeader'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'

import { OpdYearSelect } from '../../components/features/OpdYearSelect'

export const revalidate = 0

export default async function OpdDashboardPage({
  searchParams
}: {
  searchParams?: Promise<{ tahun?: string }>
}) {
  const user = await requireAuth()

  if (user.role === 'SUPER_ADMIN') {
    redirect('/admin')
  }

  const resolvedSearchParams = await searchParams
  const queryYear = resolvedSearchParams?.tahun ? parseInt(resolvedSearchParams.tahun, 10) : null

  // Cari periode aktif
  const activePeriod = await db.evaluationPeriod.findFirst({ where: { isOpen: true } })
  const defaultYear = activePeriod?.year || null

  // Cari seluruh daftar tahun di mana unit akun OPD ini pernah/sedang menjadi peserta evaluasi
  const enrolledEvaluations = await db.evaluation.findMany({
    where: {
      unit: {
        userUnits: {
          some: { userId: user.id }
        }
      }
    },
    select: { year: true },
    distinct: ['year'],
    orderBy: { year: 'desc' }
  })

  // List tahun tersedia untuk akun OPD ini
  const availableYears = enrolledEvaluations.map((e) => e.year)
  if (defaultYear && !availableYears.includes(defaultYear)) {
    availableYears.unshift(defaultYear)
  }

  // Tentukan tahun yang sedang dilihat: queryYear jika valid, fallback ke defaultYear atau tahun pertama yang ada
  const selectedYear = (queryYear && availableYears.includes(queryYear))
    ? queryYear
    : (defaultYear || availableYears[0] || null)

  const isCurrentYearActive = activePeriod?.year === selectedYear

  // Fetch timeline status untuk tahun yang dipilih
  let timelineResult = null
  if (selectedYear) {
    const { getPeriodTimeline } = await import('../../services/period-window-service')
    timelineResult = await getPeriodTimeline(selectedYear)
  }
  // Jika bukan tahun aktif (tahun arsip / masa lalu), pengisian F01 otomatis dikunci (hanya baca)
  const canFillF01 = isCurrentYearActive && timelineResult
    ? timelineResult.effectivePermissions.canFillF01
    : false

  // Fetch bound units for this OPD account yang terdaftar sebagai peserta evaluasi di selectedYear
  const userUnits = selectedYear
    ? await db.userUnit.findMany({
        where: {
          userId: user.id,
          unit: {
            evaluations: {
              some: { year: selectedYear }
            }
          }
        },
        include: {
          unit: {
            include: {
              category: true,
              evaluations: {
                where: { year: selectedYear },
                include: {
                  scores: true,
                  agenda: true
                }
              }
            }
          }
        }
      })
    : []

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      {/* Header Banner Sederhana tanpa Icon dan pakai Selector */}
      <PageHeader
        title={`Selamat Datang, ${user.fullName}`}
        titleClassName="text-lg sm:text-xl font-semibold text-ink tracking-tight"
        description="Lengkapi formulir evaluasi mandiri F01 dan F03 untuk setiap unit pelayanan yang ditautkan ke akun Anda."
        actions={
          <div className="flex items-center gap-2">
            <OpdYearSelect
              years={availableYears}
              selectedYear={selectedYear}
              defaultYear={defaultYear}
            />
          </div>
        }
      />

      {/* Visual Rentang Jadwal Pelaksanaan Evaluasi (Read-Only) */}
      {timelineResult && timelineResult.windows && timelineResult.windows.length > 0 && (() => {
        const validWindows = timelineResult.windows.filter(w => w.startDate && w.endDate)
        if (validWindows.length === 0) return null

        let minTime = Infinity
        let maxTime = -Infinity
        validWindows.forEach(w => {
          const s = new Date(w.startDate!).getTime()
          const e = new Date(w.endDate!).getTime()
          if (s < minTime) minTime = s
          if (e > maxTime) maxTime = e
        })

        const totalDuration = maxTime - minTime
        const now = Date.now()
        const progressPercent = totalDuration > 0
          ? Math.min(100, Math.max(0, Math.round(((now - minTime) / totalDuration) * 100)))
          : 0

        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
        const formatShort = (ms: number) => {
          const d = new Date(ms)
          return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
        }

        return (
          <div className="rounded-2xl border border-stroke/70 bg-surface p-4 sm:p-5 shadow-2xs space-y-3.5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-xl bg-brand-light text-brand flex items-center justify-center shrink-0">
                  <CalendarDays className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-ink uppercase tracking-wider">
                      Jadwal Tahapan Evaluasi Tahun {selectedYear}
                    </h4>
                    {isCurrentYearActive && timelineResult.activeWindow && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold animate-pulse">
                        Tahapan Berjalan
                      </span>
                    )}
                    {!isCurrentYearActive && (
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-stroke/50 text-[10px] font-medium">
                        Riwayat Arsip
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-secondary mt-0.5">
                    Rentang Waktu: <span className="font-semibold text-ink">{formatShort(minTime)} – {formatShort(maxTime)}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto text-xs">
                <span className="text-ink-muted text-[11px]">Progres:</span>
                <span className="font-bold text-ink">{progressPercent}%</span>
              </div>
            </div>

            {/* Visual Segments Bar */}
            <div className="relative h-2.5 w-full rounded-full bg-surface-subtle overflow-hidden border border-stroke/50 flex">
              {validWindows.map((seg) => {
                const s = new Date(seg.startDate!).getTime()
                const e = new Date(seg.endDate!).getTime()
                const widthPercent = totalDuration > 0 ? Math.max(4, ((e - s) / totalDuration) * 100) : 100
                return (
                  <div
                    key={seg.id}
                    title={`${seg.title} (${seg.formattedRange})`}
                    style={{ width: `${widthPercent}%` }}
                    className={`h-full transition-all border-r last:border-r-0 border-surface/50 ${
                      seg.isCurrentlyActive
                        ? 'bg-brand animate-pulse'
                        : seg.status === 'PASSED'
                          ? 'bg-emerald-400'
                          : 'bg-slate-200'
                    }`}
                  />
                )
              })}
            </div>

            {/* Step Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-0.5">
              {validWindows.map((seg, idx) => (
                <div
                  key={seg.id}
                  className={`p-2 rounded-xl border text-[11px] transition-all ${
                    seg.isCurrentlyActive
                      ? 'border-brand bg-brand-light/30 text-brand font-bold shadow-2xs'
                      : seg.status === 'PASSED'
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-800'
                        : 'border-stroke/50 bg-surface-subtle/30 text-ink-muted'
                  }`}>
                  <div className="flex items-center gap-1.5 truncate">
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      seg.isCurrentlyActive
                        ? 'bg-brand'
                        : seg.status === 'PASSED'
                          ? 'bg-emerald-500'
                          : 'bg-slate-300'
                    }`} />
                    <span className="truncate">{idx + 1}. {seg.title}</span>
                  </div>
                  <div className="text-[10px] text-ink-muted/80 truncate mt-0.5 font-normal">
                    {seg.formattedRange}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* Dynamic Schedule Banner for OPD (jika ada tahapan aktif) */}
      {timelineResult && timelineResult.activeWindow && (
        <div className="rounded-2xl border border-brand/30 bg-brand-light/30 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand text-white text-[10px] font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Tahapan Aktif
              </span>
              <span className="text-xs font-semibold text-ink-muted">
                {timelineResult.activeWindow.formattedRange}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-ink">
              {timelineResult.activeWindow.title}
            </h3>
            <p className="text-xs text-ink-secondary">
              {timelineResult.activeWindow.description || 'Tahapan evaluasi sedang aktif. Mohon periksa kelengkapan pengisian lokus Anda.'}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
            {timelineResult.activeWindow.daysRemaining !== null && (
              <div className="px-3 py-1.5 rounded-xl bg-surface border border-brand/20 shadow-2xs text-center">
                <div className="text-[10px] text-ink-muted font-medium">Batas Waktu</div>
                <div className="text-xs font-bold text-brand">
                  {timelineResult.activeWindow.daysRemaining === 0 ? 'Hari Ini Terakhir' : `${timelineResult.activeWindow.daysRemaining} Hari Lagi`}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Read-Only Alert jika Pengisian F01 Sedang Tutup */}
      {timelineResult && !canFillF01 && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50/70 p-4 flex items-center gap-3 text-xs text-amber-900">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
          <div>
            <span className="font-bold">Pengisian F-01 Saat Ini Terkunci (Mode Hanya Baca). </span>
            <span>Anda tetap dapat meninjau riwayat isian dan berkas bukti dukung yang telah tersimpan.</span>
          </div>
        </div>
      )}

      {/* Account Info Card */}
      <div className="rounded-bento border border-stroke/50 bg-surface p-4 sm:p-5 flex flex-wrap items-center justify-between gap-4 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-sm border border-brand/20 shadow-2xs">
            {user.fullName.charAt(0)}
          </div>
          <div>
            <div className="text-xs font-semibold text-ink">{user.fullName}</div>
            <div className="text-[11px] text-ink-muted">{user.email}</div>
          </div>
        </div>
        <div className="flex items-center gap-4 sm:gap-6 text-xs text-ink-muted">
          <div className="flex items-center gap-1.5">
            <span>Peran:</span>
            <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-surface-subtle text-ink font-medium text-[11px] border border-stroke/50">
              {user.role}
            </span>
          </div>
          <div className="h-3.5 w-px bg-stroke/60" />
          <div className="flex items-center gap-1.5">
            <span>Lokus Ditautkan:</span>
            <strong className="text-ink font-medium">{userUnits.length} Unit</strong>
          </div>
        </div>
      </div>

      {/* List of Bound Units / Lokus */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">Lokus Pelayanan Anda</h2>
          <span className="text-xs text-ink-muted">{userUnits.length} unit tersedia</span>
        </div>

        {userUnits.length === 0 ? (
          <div className="rounded-bento border border-stroke/50 bg-surface p-12 text-center space-y-3 shadow-2xs">
            <AlertCircle className="w-8 h-8 text-ink-muted mx-auto" />
            <h3 className="font-semibold text-sm text-ink">
              {selectedYear ? `Tidak Ada Lokus Peserta di Tahun ${selectedYear}` : 'Tidak Ada Periode Penilaian Aktif'}
            </h3>
            <p className="text-xs text-ink-muted max-w-md mx-auto leading-relaxed">
              {selectedYear
                ? `Unit pelayanan yang ditautkan ke akun Anda belum didaftarkan sebagai peserta evaluasi untuk Tahun ${selectedYear}. Silakan hubungi Tim Admin Evaluator Bagian Organisasi Setdakab Kutai Barat.`
                : 'Saat ini belum ada periode penilaian yang dibuka oleh Admin Evaluator.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3.5">
            {userUnits.map(({ unit }) => {
              const evaluation = unit.evaluations[0]
              const scores = evaluation?.scores || []
              const filledF01Count = scores.filter(
                (s) => s.f01Submitted || (s.f01Data && Object.keys(s.f01Data as any).length > 0)
              ).length
              const percentage = Math.round((filledF01Count / 31) * 100)

              return (
                <div
                  key={unit.id}
                  className="rounded-bento border border-stroke/50 bg-surface p-5 hover:border-stroke hover:shadow-soft-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
                  <div className="space-y-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-surface-subtle text-ink-secondary text-[11px] font-medium border border-stroke/50">
                        {unit.category?.name || 'OPD'}
                      </span>
                      {evaluation?.agenda && (
                        <Badge variant="neutral" size="sm">
                          {evaluation.agenda.title}
                        </Badge>
                      )}
                      {evaluation?.isFinished && (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
                        </Badge>
                      )}
                      {percentage === 100 ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> F01 Lengkap (100%)
                        </Badge>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-surface-subtle text-ink-secondary text-[11px] font-medium border border-stroke/50">
                          F01: {filledF01Count}/31 ({percentage}%)
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-ink-muted shrink-0" />
                      <span>{unit.name}</span>
                    </h3>
                  </div>

                  <Link
                    href={selectedYear ? `/evaluasi/${unit.id}?tahun=${selectedYear}` : `/evaluasi/${unit.id}`}
                    className="shrink-0">
                    <Button
                      type="button"
                      variant={isCurrentYearActive ? 'brand' : 'outline'}
                      size="sm"
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      {isCurrentYearActive ? 'Isi Formulir' : 'Lihat Evaluasi (Arsip)'}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
