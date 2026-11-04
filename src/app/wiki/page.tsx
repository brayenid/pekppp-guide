import React from 'react'
import { db } from '../../services/db'
import { PageHeader } from '../../components/ui/PageHeader'

export const revalidate = 0

export const metadata = {
  title: 'Wiki 31 Indikator PEKPPP - Kutai Barat',
  description: 'Katalog dan referensi resmi instrumen evaluasi 31 indikator kinerja pelayanan publik berdasarkan PermenPAN-RB Nomor 29 Tahun 2022.'
}

export default async function WikiPage() {
  const indicators = await db.indicator.findMany({
    include: { aspect: true },
    orderBy: { indicatorNumber: 'asc' }
  })

  const grouped = indicators.reduce<Record<string, typeof indicators>>((acc, item) => {
    const code = item.aspect.code
    ;(acc[code] ??= []).push(item)
    return acc
  }, {})

  return (
    <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12 pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="Katalog 31 Indikator Standar Pelayanan (PEKPPP)"
        description="Referensi lengkap instrumen evaluasi kinerja penyelenggaraan pelayanan publik berdasarkan PermenPAN-RB No. 29 Tahun 2022, mencakup rumusan butir penilaian, bobot terstandar, dan persyaratan bukti dukung pembuktian."
      />

      {/* ── Aspect Quick Navigation Bar ── */}
      <div className="p-3 sm:p-4 rounded-2xl bg-surface border border-line shadow-2xs space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-ink-muted px-1">
          Lompat Cepat ke Aspek Evaluasi
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          {Object.entries(grouped).map(([aspectCode, items]) => {
            const aspect = items[0]?.aspect
            return (
              <a
                key={aspectCode}
                href={`#aspek-${aspectCode.toLowerCase()}`}
                className="px-3 py-1.5 rounded-xl bg-surface-subtle hover:bg-brand-light hover:text-brand border border-line text-xs font-medium text-ink transition-colors">
                <span className="font-semibold text-brand mr-1.5">{aspectCode}</span>
                <span>{aspect?.name.split(' ')[0]}</span>
                <span className="text-ink-muted text-[11px] ml-1">({aspect?.aspectWeight}%)</span>
              </a>
            )
          })}
        </div>
      </div>

      {/* ── Aspect Sections ── */}
      <div className="space-y-10 sm:space-y-12">
        {Object.entries(grouped).map(([aspectCode, items]) => {
          const aspect = items[0]?.aspect

          return (
            <section
              key={aspectCode}
              id={`aspek-${aspectCode.toLowerCase()}`}
              className="scroll-mt-24 space-y-4">
              {/* Aspect Chapter Header */}
              <div className="p-4 sm:p-5 rounded-2xl bg-surface border border-line shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-brand bg-brand-light dark:bg-brand/20 px-2.5 py-0.5 rounded-md">
                      Aspek {aspectCode}
                    </span>
                    <h2 className="text-base sm:text-lg font-semibold text-ink">
                      {aspect?.name}
                    </h2>
                  </div>
                  <p className="text-xs text-ink-secondary">
                    Total kontribusi bobot: <strong>{aspect?.aspectWeight}%</strong> dari total Indeks Pelayanan Publik (IPP).
                  </p>
                </div>
                <span className="text-xs font-medium text-ink-muted self-start sm:self-auto px-2.5 py-1 rounded-full bg-surface-subtle border border-line">
                  {items.length} Indikator
                </span>
              </div>

              {/* Indicator Items List */}
              <div className="space-y-3.5">
                {items.map((ind) => (
                  <div
                    key={ind.id}
                    className="p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-3 transition-colors hover:border-brand/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-semibold text-ink bg-surface-subtle border border-line px-2 py-0.5 rounded-md">
                          Indikator #{ind.indicatorNumber} • {ind.code}
                        </span>
                        {ind.isSupplementary && (
                          <span className="text-[11px] font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 px-2 py-0.5 rounded-md">
                            Data Tambahan
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono font-medium text-ink-secondary">
                        Bobot: <strong className="text-brand font-semibold">{ind.indicatorWeight}%</strong>
                      </span>
                    </div>

                    <h3 className="font-medium text-sm sm:text-base text-ink leading-relaxed">
                      {ind.question}
                    </h3>

                    {ind.proofRequirements && (
                      <div className="p-3.5 rounded-xl bg-surface-subtle/70 border border-line/60 text-xs space-y-1">
                        <span className="font-semibold text-ink block">
                          Syarat Dokumen Bukti Dukung Wajib:
                        </span>
                        <p className="text-ink-secondary leading-relaxed whitespace-pre-line">
                          {ind.proofRequirements}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
