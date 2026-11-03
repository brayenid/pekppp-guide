'use client'

import React from 'react'
import Link from 'next/link'
import {
  Building2,
  CheckCircle2,
  Award,
  Unlock,
  Lock,
  Globe,
  EyeOff,
  Pencil,
  Trash2,
  ArrowRight,
} from 'lucide-react'
import { Card } from './Card'
import { Badge } from './Badge'

export interface PeriodCardData {
  id: string
  year: number
  title?: string | null
  isOpen: boolean
  isPublished?: boolean
  targetF03Quota?: number | null
  f03CalculationMethod?: string | null
  publishedAt?: Date | string | null
  createdAt?: Date | string | null
}

export interface PeriodCardStats {
  lokusCount: number
  finishedCount: number
  avgIpp: number
}

export interface PeriodCardProps {
  period: PeriodCardData
  stats: PeriodCardStats
  onToggleOpen?: (period: PeriodCardData) => void
  onTogglePublish?: (period: PeriodCardData) => void
  onEdit?: (period: PeriodCardData) => void
  onDelete?: (period: PeriodCardData) => void
  href?: string
}

export function PeriodCard({
  period,
  stats,
  onToggleOpen,
  onTogglePublish,
  onEdit,
  onDelete,
  href,
}: PeriodCardProps) {
  const completionPercent =
    stats.lokusCount > 0
      ? Math.round((stats.finishedCount / stats.lokusCount) * 100)
      : 0

  const targetHref = href || `/admin/periode/${period.year}`

  return (
    <Card
      variant={period.isOpen ? 'active' : 'default'}
      padding="lg"
      hoverable
      className="flex flex-col justify-between"
    >
      {/* Card Header & Content */}
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-3xl sm:text-4xl font-semibold tracking-tight text-ink">
              {period.year}
            </span>
            <p className="text-xs text-ink-muted">
              {period.title || `Evaluasi Terpadu Tahun ${period.year}`}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <Badge
              variant={period.isOpen ? 'success' : 'neutral'}
              dot
              pulseDot={period.isOpen}
              size="sm"
            >
              {period.isOpen ? 'Tahun Aktif' : 'Ditutup'}
            </Badge>
            <Badge
              variant={period.isPublished ? 'info' : 'neutral'}
              size="sm"
            >
              {period.isPublished ? 'Publik' : 'Internal'}
            </Badge>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-3 gap-2.5 pt-1">
          <div className="bg-surface-subtle/50 p-3 rounded-lg border border-stroke/50">
            <div className="text-[11px] text-ink-muted font-normal flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-ink-muted shrink-0" />
              <span>Lokus</span>
            </div>
            <div className="text-xl font-semibold text-ink mt-1.5">
              {stats.lokusCount}
            </div>
          </div>

          <div className="bg-surface-subtle/50 p-3 rounded-lg border border-stroke/50">
            <div className="text-[11px] text-ink-muted font-normal flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-pastel-green-text shrink-0" />
              <span>Selesai</span>
            </div>
            <div className="text-xl font-semibold text-ink mt-1.5">
              {stats.finishedCount}
            </div>
          </div>

          <div className="bg-surface-subtle/50 p-3 rounded-lg border border-stroke/50">
            <div className="text-[11px] text-ink-muted font-normal flex items-center gap-1.5">
              <Award className="w-3.5 h-3.5 text-brand shrink-0" />
              <span>Rata IPP</span>
            </div>
            <div className="text-xl font-semibold text-ink mt-1.5">
              {stats.avgIpp > 0 ? stats.avgIpp.toFixed(2) : '-'}
            </div>
          </div>
        </div>

        {/* Progress bar info */}
        {stats.lokusCount > 0 && (
          <div className="space-y-1.5 pt-1">
            <div className="flex items-center justify-between text-[11px] text-ink-muted">
              <span>Progres Evaluasi</span>
              <span className="font-medium text-ink">{completionPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-stroke/30">
              <div
                className="h-full bg-brand rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Card Footer Actions */}
      <div className="mt-5 pt-4 border-t border-stroke/40 flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
        <div className="flex items-center gap-1.5">
          {onToggleOpen && (
            <button
              type="button"
              onClick={() => onToggleOpen(period)}
              title={period.isOpen ? 'Tutup Pengisian Tahun Ini' : 'Buka & Aktifkan Tahun Ini'}
              className="w-8 h-8 rounded-lg border border-stroke/60 bg-surface flex items-center justify-center text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors shadow-2xs cursor-pointer"
            >
              {period.isOpen ? (
                <Unlock className="w-3.5 h-3.5 text-brand" />
              ) : (
                <Lock className="w-3.5 h-3.5 text-ink-muted" />
              )}
            </button>
          )}

          {onTogglePublish && (
            <button
              type="button"
              onClick={() => onTogglePublish(period)}
              title={
                period.isPublished
                  ? 'Tarik Publikasi (Sembunyikan dari Publik)'
                  : 'Publikasikan Hasil Penilaian ke Publik'
              }
              className={`w-8 h-8 rounded-lg border border-stroke/60 bg-surface flex items-center justify-center transition-colors shadow-2xs cursor-pointer ${
                period.isPublished
                  ? 'text-brand hover:text-brand-hover hover:bg-brand-light'
                  : 'text-ink-muted hover:text-ink hover:bg-surface-subtle'
              }`}
            >
              {period.isPublished ? (
                <Globe className="w-3.5 h-3.5 text-brand" />
              ) : (
                <EyeOff className="w-3.5 h-3.5 text-ink-muted" />
              )}
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(period)}
              title="Edit Tahun Penilaian"
              className="w-8 h-8 rounded-lg border border-stroke/60 bg-surface flex items-center justify-center text-ink-muted hover:text-brand hover:bg-brand-light transition-colors shadow-2xs cursor-pointer"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(period)}
              title="Hapus Tahun Penilaian"
              className="w-8 h-8 rounded-lg border border-stroke/60 bg-surface flex items-center justify-center text-ink-muted hover:text-pastel-rose-text hover:bg-pastel-rose/30 transition-colors shadow-2xs cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Open Year Dashboard Link */}
        <Link
          href={targetHref}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shadow-hz-button cursor-pointer w-full sm:w-auto min-h-[36px]"
        >
          <span>Buka Evaluasi</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </Card>
  )
}
