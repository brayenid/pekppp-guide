// src/app/opd/OpdDashboardClient.tsx
'use client'

import Link from 'next/link'
import {
  FileText,
  ArrowRight,
  Building2,
  CheckCircle2,
  AlertCircle,
  CalendarDays,
  Sparkles,
  ShieldCheck,
  Clock,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  ChevronRight,
  ExternalLink,
  AlertTriangle,
  FolderArchive
} from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'
import { DataTable } from '../../components/ui/DataTable'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { NoticeBanner } from '../../components/ui/NoticeBanner'
import { Card } from '../../components/ui/Card'
import { formatFileUrl } from '../../lib/utils'
import type { UnitComplianceProfile } from '../../services/evidence-compliance-service'

export interface OpdUnitSummary {
  id: string
  code: string | null
  name: string
  categoryName: string
  evaluation: {
    id: string
    year: number
    isFinished: boolean
    agendaTitle: string | null
    filledF01Count: number
    percentage: number
    f03Count?: number
    f03Target?: number
    f03Percentage?: number
  } | null
}

export function OpdDashboardClient({
  selectedYear,
  isCurrentYearActive,
  canFillF01,
  timelineResult,
  enrolledUnits,
  activeMasterUnit,
  masterStatsMap = {},
  complianceProfile
}: {
  selectedYear: number | null
  isCurrentYearActive: boolean
  canFillF01: boolean
  timelineResult: any
  enrolledUnits: OpdUnitSummary[]
  activeMasterUnit: { id: string; code: string | null; name: string; categoryName: string } | null
  masterStatsMap?: Record<string, { filledMandatory: number; totalFiles: number }>
  complianceProfile?: UnitComplianceProfile | null
}) {
  return (
    <div className="space-y-6 w-full pb-12">
      {/* Page Header */}
      <PageHeader
        icon={<Building2 className="w-5 h-5 text-brand" />}
        title="Daftar Lokus Anda"
        description="Kelola pengisian kuesioner evaluasi mandiri F-01 dan pantau status penilaian unit pelayanan Anda."
        speedDialItems={[
          {
            label: 'Master Bukti Dukung',
            icon: <FolderArchive className="w-4 h-4" />,
            href: '/opd/master-bukti',
            variant: 'brand'
          },
          {
            label: 'Panduan Indikator',
            icon: <FileText className="w-4 h-4" />,
            href: '/panduan',
            variant: 'secondary'
          }
        ]}
      />

      {/* Unified Compact Timeline & Active Stage Strip */}
      {timelineResult &&
        timelineResult.windows &&
        timelineResult.windows.length > 0 &&
        (() => {
          const validWindows = timelineResult.windows.filter(
            (w: any) => w.startDate && w.endDate
          )
          if (validWindows.length === 0) return null

          let minTime = Infinity
          let maxTime = -Infinity
          validWindows.forEach((w: any) => {
            const s = new Date(w.startDate!).getTime()
            const e = new Date(w.endDate!).getTime()
            if (s < minTime) minTime = s
            if (e > maxTime) maxTime = e
          })

          const totalDuration = maxTime - minTime
          const now = Date.now()
          const progressPercent =
            totalDuration > 0
              ? Math.min(100, Math.max(0, Math.round(((now - minTime) / totalDuration) * 100)))
              : 0

          const months = [
            'Jan',
            'Feb',
            'Mar',
            'Apr',
            'Mei',
            'Jun',
            'Jul',
            'Agu',
            'Sep',
            'Okt',
            'Nov',
            'Des'
          ]
          const formatShort = (ms: number) => {
            const d = new Date(ms)
            return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`
          }

          const activeWin = timelineResult.activeWindow

          return (
            <Card className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-brand-light text-brand flex items-center justify-center shrink-0 border border-brand/20">
                    <CalendarDays className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-ink">
                        {activeWin
                          ? `Tahapan Aktif: ${activeWin.title}`
                          : `Jadwal Evaluasi ${selectedYear}`}
                      </span>
                      {isCurrentYearActive && activeWin ? (
                        <Badge variant="success" size="sm" dot pulseDot>
                          {activeWin.formattedRange}
                        </Badge>
                      ) : (
                        <Badge variant="neutral" size="sm">
                          {formatShort(minTime)} – {formatShort(maxTime)}
                        </Badge>
                      )}
                    </div>
                    {activeWin?.description && (
                      <p className="text-xs text-ink-muted truncate max-w-xl mt-0.5">
                        {activeWin.description}
                      </p>
                    )}
                  </div>
                </div>

                {isCurrentYearActive && (
                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                    {canFillF01 ? (
                      <Badge variant="success" size="sm" dot pulseDot>
                        Pengisian Terbuka
                      </Badge>
                    ) : (
                      <Badge variant="warning" size="sm">
                        Pengisian Terkunci
                      </Badge>
                    )}
                  </div>
                )}
              </div>

              {/* Progress Bar Tahapan */}
              <div className="space-y-1.5 pt-1">
                <div className="h-2 w-full bg-surface-subtle rounded-full overflow-hidden border border-stroke/30">
                  <div
                    className="h-full bg-brand transition-all duration-500 rounded-full"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-medium text-ink-muted">
                  <span>Mulai: {formatShort(minTime)}</span>
                  <span>{progressPercent}% Periode Berjalan</span>
                  <span>Berakhir: {formatShort(maxTime)}</span>
                </div>
              </div>
            </Card>
          )
        })()}

      {/* Notice Periode Non-Aktif */}
      {!isCurrentYearActive && selectedYear && (
        <NoticeBanner
          variant="info"
          title={`Arsip Evaluasi ${selectedYear}`}
          description={`Anda sedang meninjau arsip tahun ${selectedYear}. Pengisian dan perubahan formulir F-01 dinonaktifkan.`}
        />
      )}

      {/* Daftar Unit Evaluasi via DataTable (Standar Desain Dashboard Admin) */}
      <DataTable
        headerTitle="UNIT PELAYANAN TERDAFTAR"
        headerMeta={
          <Badge variant="neutral" size="sm">
            {enrolledUnits.length} Unit
          </Badge>
        }
        isEmpty={enrolledUnits.length === 0}
        emptyMessage={`Unit pelayanan Anda belum didaftarkan sebagai peserta evaluasi pada tahun ${selectedYear || '-'}.`}
        emptyIcon={<AlertCircle className="w-6 h-6 text-ink-muted" />}>
        <div className="divide-y divide-line">
          {enrolledUnits.map((unitItem) => {
            const ev = unitItem.evaluation
            const percentage = ev?.percentage || 0
            const filledF01Count = ev?.filledF01Count || 0
            const f03Count = ev?.f03Count || 0
            const f03Target = ev?.f03Target || 30
            const f03Percentage = ev?.f03Percentage ?? Math.min(100, Math.round((f03Count / f03Target) * 100))

            return (
              <div
                key={unitItem.id}
                className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-surface-subtle/70 transition-colors">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-sm text-ink truncate">
                      {unitItem.name}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {unitItem.categoryName}
                    </Badge>
                    {unitItem.code && (
                      <span className="text-[11px] font-mono text-ink-muted">
                        {unitItem.code}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {ev?.isFinished && (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Selesai
                      </Badge>
                    )}
                    {percentage === 100 ? (
                      <Badge variant="success" size="sm">
                        <CheckCircle2 className="w-3 h-3 mr-1" /> F01 Lengkap (100%)
                      </Badge>
                    ) : (
                      <Badge variant="neutral" size="sm">
                        F01: {filledF01Count}/31 ({percentage}%)
                      </Badge>
                    )}

                    <Link
                      href={`/evaluasi/${unitItem.id}/f03${selectedYear ? `?tahun=${selectedYear}` : ''}`}
                      className="hover:opacity-85 transition-opacity"
                      title="Buka Survei Kepuasan Masyarakat (F-03)">
                      {f03Percentage === 100 ? (
                        <Badge variant="success" size="sm">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> F03 Lengkap ({f03Count}/{f03Target})
                        </Badge>
                      ) : (
                        <Badge variant={f03Count > 0 ? 'info' : 'neutral'} size="sm">
                          F03: {f03Count}/{f03Target} ({f03Percentage}%)
                        </Badge>
                      )}
                    </Link>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
                  <Link
                    href={
                      selectedYear
                        ? `/evaluasi/${unitItem.id}?tahun=${selectedYear}`
                        : `/evaluasi/${unitItem.id}`
                    }>
                    <Button
                      type="button"
                      variant={isCurrentYearActive ? 'brand' : 'secondary'}
                      size="sm"
                      leftIcon={<FileText className="w-3.5 h-3.5" />}
                      rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
                      {isCurrentYearActive ? 'Isi Formulir' : 'Lihat Formulir'}
                    </Button>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </DataTable>
    </div>
  )
}
