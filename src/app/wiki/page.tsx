import { db } from '../../services/db'
import { BookOpen, CheckCircle2 } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'

export const revalidate = 0

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
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        icon={<BookOpen className="w-5 h-5 text-brand" />}
        title="Wiki 31 Indikator PEKPPP"
        description="Referensi lengkap kriteria penilaian, bobot persentase, dan dokumen bukti dukung wajib untuk seluruh 31 Indikator PEKPPP."
      />

      {/* List per Aspect */}
      <div className="space-y-6">
        {Object.entries(grouped).map(([aspectCode, items]) => {
          const aspect = items[0]?.aspect

          return (
            <div key={aspectCode} className="rounded-bento border border-stroke/50 bg-surface shadow-2xs overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-stroke/50 bg-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-brand-light text-brand text-[10px] font-semibold border border-brand/20">
                      Aspek {aspectCode}
                    </span>
                    <h2 className="text-sm font-semibold text-ink">{aspect?.name}</h2>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Bobot Aspek: <span className="font-semibold text-ink">{aspect?.aspectWeight}%</span>
                  </p>
                </div>
                <span className="inline-flex items-center self-start sm:self-auto px-2.5 py-1 rounded-pill bg-surface text-ink-secondary text-xs font-medium border border-stroke/50">
                  {items.length} Indikator
                </span>
              </div>

              <div className="p-4 sm:p-5 space-y-4 divide-y divide-stroke/40">
                {items.map((ind) => (
                  <div key={ind.id} className="pt-4 first:pt-0 space-y-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-surface-subtle text-ink font-medium text-[11px] border border-stroke/50">
                        Indikator #{ind.indicatorNumber} ({ind.code})
                      </span>
                      <span className="text-xs text-ink-muted">
                        Bobot: <strong className="text-ink font-medium">{ind.indicatorWeight}%</strong>
                      </span>
                      {ind.isSupplementary && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-surface-subtle text-ink-secondary text-[10px] border border-stroke/50">
                          Informasi Tambahan
                        </span>
                      )}
                    </div>

                    <h3 className="font-medium text-ink text-xs sm:text-sm leading-snug">{ind.question}</h3>

                    {ind.proofRequirements && (
                      <div className="p-3 rounded-xl bg-surface-subtle border border-stroke/40 text-xs space-y-1">
                        <span className="font-medium text-ink flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-ink-muted" />
                          Syarat Dokumen Bukti Dukung Wajib:
                        </span>
                        <p className="text-ink-secondary leading-relaxed pl-5">{ind.proofRequirements}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

