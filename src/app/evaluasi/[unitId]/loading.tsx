// src/app/evaluasi/[unitId]/loading.tsx
// Skeleton loading yang 100% presisi dan identik dengan tampilan loaded halaman evaluasi split-panel

import { Skeleton } from '../../../components/ui/Skeleton'

export default function EvaluasiLoading() {
  return (
    <div className="space-y-4 animate-in fade-in duration-150">
      {/* 1. Breadcrumbs */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-muted mb-4 sm:mb-5 pt-0.5 min-h-[32px]">
        <Skeleton className="w-24 h-4 rounded-md" />
        <span className="text-ink-muted/40">›</span>
        <Skeleton className="w-48 h-4 rounded-md" />
      </nav>

      <div className="space-y-4">
        {/* 2. Top 3-Pillar Tab Switcher + Mode Fokus Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-stroke/40 pb-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tab 1: Formulir F01 (Active) */}
            <div className="h-9 px-4 rounded-xl bg-brand text-white flex items-center gap-2 shadow-hz-button">
              <div className="w-3.5 h-3.5 rounded bg-white/40 animate-pulse" />
              <span className="text-xs font-semibold">Formulir F01</span>
            </div>
            {/* Tab 2: Survei F03 */}
            <div className="h-9 px-3.5 rounded-xl border border-stroke/60 bg-surface flex items-center gap-2">
              <Skeleton className="w-3.5 h-3.5 rounded" />
              <Skeleton className="w-16 h-3.5 rounded-md" />
              <Skeleton className="w-4 h-4 rounded-full" />
            </div>
            {/* Tab 3: Unggah Bukti Dukung */}
            <div className="h-9 px-3.5 rounded-xl border border-stroke/60 bg-surface flex items-center gap-2">
              <Skeleton className="w-3.5 h-3.5 rounded" />
              <Skeleton className="w-28 h-3.5 rounded-md" />
              <Skeleton className="w-4 h-4 rounded-full" />
            </div>
          </div>

          {/* Mode Fokus Toggle */}
          <div className="h-9 px-3.5 rounded-xl border border-stroke/60 bg-surface flex items-center gap-1.5">
            <Skeleton className="w-3.5 h-3.5 rounded" />
            <Skeleton className="w-20 h-3.5 rounded-md" />
          </div>
        </div>

        {/* 3. Action Ribbon (Header Status Soal & Kelengkapan F01) */}
        <div className="bg-surface rounded-2xl border border-stroke px-4 sm:px-5 py-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 shadow-soft-card mb-5">
          {/* Left: Indicator Breadcrumb + Save Status */}
          <div className="flex items-center gap-2 text-xs flex-wrap min-w-0">
            <Skeleton className="w-20 h-6 rounded-full" />
            <span className="text-stroke font-bold hidden sm:inline">•</span>
            <Skeleton className="w-36 h-4 rounded-md" />
            <span className="text-stroke font-bold hidden sm:inline">•</span>
            <Skeleton className="w-24 h-4 rounded-md" />
          </div>

          {/* Right: Progress & Action */}
          <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
            <div className="flex items-center gap-2.5 text-xs">
              <Skeleton className="w-28 h-4 rounded-md" />
              <Skeleton className="w-20 h-2 rounded-full hidden sm:block" />
              <Skeleton className="w-8 h-4 rounded-md" />
            </div>
            <div className="h-8 w-24 rounded-xl bg-brand/85 flex items-center justify-center shadow-xs">
              <div className="w-16 h-3.5 rounded bg-white/40 animate-pulse" />
            </div>
          </div>
        </div>

        {/* 4. Split-Panel Workspace Layout */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-start gap-4 lg:gap-0 mt-2 sm:mt-5">
          {/* ── LEFT PANEL: Peta Navigasi Soal (33.33% Width) ── */}
          <div className="w-[33.33%] hidden lg:block rounded-bento border border-stroke bg-surface p-5 space-y-4 shadow-soft-card shrink-0">
            {/* Header Peta Navigasi */}
            <div className="flex items-center justify-between pb-3 text-xs border-b border-stroke">
              <Skeleton className="w-24 h-4 rounded-md" />
              <div className="h-5 px-2.5 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center">
                <span className="text-[11px] font-bold text-brand">Soal #1</span>
              </div>
            </div>

            {/* Aspek 1: KEBIJAKAN. Kebijakan Pelayanan (9 Soal) */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-[11px] pb-0.5">
                <span className="text-xs font-bold text-brand">KEBIJAKAN. Kebijakan Pelayanan</span>
                <span className="text-[10px] text-ink-muted font-medium">9 soal</span>
              </div>
              {/* 5-Column Grid Matrix */}
              <div className="grid grid-cols-5 text-xs" style={{ rowGap: '12px', columnGap: '6px' }}>
                {/* Active Question #1 */}
                <div className="h-10 rounded-xl bg-brand text-white font-bold text-xs flex items-center justify-center shadow-xs">
                  1
                </div>
                {/* Questions #2 - #9 */}
                {[2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
                  <div
                    key={n}
                    className="h-10 rounded-xl border border-stroke/60 bg-surface-subtle/50 flex flex-col items-center justify-center gap-1">
                    <span className="text-xs font-semibold text-ink-muted/80">{n}</span>
                    <div className="w-1 h-1 rounded-full bg-ink-muted/40" />
                  </div>
                ))}
              </div>
            </div>

            {/* Aspek 2: SDM. Profesionalisme SDM (5 Soal) */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-[11px] pb-0.5">
                <span className="text-xs font-medium text-ink-secondary">SDM. Profesionalisme SDM</span>
                <span className="text-[10px] text-ink-muted font-medium">5 soal</span>
              </div>
              <div className="grid grid-cols-5 text-xs" style={{ rowGap: '12px', columnGap: '6px' }}>
                {[10, 11, 12, 13, 14].map((n) => (
                  <div
                    key={n}
                    className="h-10 rounded-xl border border-stroke/60 bg-surface-subtle/50 flex flex-col items-center justify-center gap-1">
                    <span className="text-xs font-semibold text-ink-muted/80">{n}</span>
                    <div className="w-1 h-1 rounded-full bg-ink-muted/40" />
                  </div>
                ))}
              </div>
            </div>

            {/* Aspek 3: SARPRAS. Sarana dan Prasarana (6 Soal) */}
            <div className="space-y-2.5 pt-2">
              <div className="flex items-center justify-between text-[11px] pb-0.5">
                <span className="text-xs font-medium text-ink-secondary">SARPRAS. Sarana dan Prasarana</span>
                <span className="text-[10px] text-ink-muted font-medium">6 soal</span>
              </div>
              <div className="grid grid-cols-5 text-xs" style={{ rowGap: '12px', columnGap: '6px' }}>
                {[15, 16, 17, 18, 19, 20].map((n) => (
                  <div
                    key={n}
                    className="h-10 rounded-xl border border-stroke/60 bg-surface-subtle/50 flex flex-col items-center justify-center gap-1">
                    <span className="text-xs font-semibold text-ink-muted/80">{n}</span>
                    <div className="w-1 h-1 rounded-full bg-ink-muted/40" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Resizer Divider ── */}
          <div className="hidden lg:flex w-2.5 shrink-0 select-none items-center justify-center relative -ml-px z-10">
            <div className="w-0.5 h-16 rounded-full bg-stroke/60" />
          </div>

          {/* ── RIGHT PANEL: Active Question Card + Discussion Card ── */}
          <div className="flex-1 min-w-0 space-y-5">
            {/* Question Card */}
            <div className="rounded-bento border border-stroke bg-surface p-6 sm:p-7 space-y-6 shadow-soft-card">
              {/* Question Header Line */}
              <div className="flex items-center gap-2 flex-wrap text-xs">
                <Skeleton className="w-16 h-5 rounded-md" />
                <span className="text-stroke font-bold">•</span>
                <Skeleton className="w-64 h-4 rounded-md" />
                <span className="text-stroke font-bold">•</span>
                <Skeleton className="w-36 h-4 rounded-md" />
              </div>

              {/* Big Question Title */}
              <div className="space-y-2.5 pt-1">
                <Skeleton className="w-full h-6 rounded-lg" />
                <Skeleton className="w-4/5 h-6 rounded-lg" />
              </div>

              {/* Sub-question Description */}
              <div className="pt-2 space-y-2">
                <Skeleton className="w-3/4 h-4 rounded-md" />
              </div>

              {/* Radio Option Pills ("Ya" / "Tidak") */}
              <div className="flex items-center gap-3 pt-3">
                <div className="px-6 py-2.5 rounded-full border border-stroke/80 bg-surface flex items-center justify-center">
                  <span className="text-xs font-semibold text-ink-muted">Ya</span>
                </div>
                <div className="px-6 py-2.5 rounded-full border border-stroke/80 bg-surface flex items-center justify-center">
                  <span className="text-xs font-semibold text-ink-muted">Tidak</span>
                </div>
              </div>

              {/* Card Footer Navigation (< Sebelumnya, Soal #1 dari 31, Berikutnya >) */}
              <div className="pt-8 border-t border-stroke/40 flex items-center justify-between gap-3 text-xs">
                <div className="px-4 py-2 rounded-xl border border-stroke/60 bg-surface-subtle text-ink-muted">
                  &lt; Sebelumnya (-)
                </div>
                <span className="text-ink-muted font-medium">Soal #1 dari 31</span>
                <div className="px-5 py-2.5 rounded-xl bg-brand text-white font-semibold flex items-center gap-1.5 shadow-hz-button">
                  <span>Berikutnya (#2) &gt;</span>
                </div>
              </div>
            </div>

            {/* Discussion & Clarification Card */}
            <div className="rounded-bento border border-stroke bg-surface p-4 sm:p-5 shadow-soft-card flex items-center justify-between gap-4">
              <div className="flex items-start gap-3 min-w-0">
                <Skeleton className="w-8 h-8 rounded-xl shrink-0" />
                <div className="space-y-1.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-ink">Diskusi &amp; Catatan Klarifikasi Soal</span>
                    <span className="text-[10px] font-semibold text-ink-muted bg-surface-subtle px-1.5 py-0.5 rounded border border-stroke/60">
                      Komentar
                    </span>
                  </div>
                  <Skeleton className="w-72 sm:w-96 h-3 rounded-md" />
                </div>
              </div>
              <div className="px-4 py-2 rounded-xl border border-stroke/60 bg-surface-subtle flex items-center gap-1.5 text-xs font-semibold text-ink-secondary shrink-0">
                <Skeleton className="w-3.5 h-3.5 rounded" />
                <span>Tulis Komentar</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
