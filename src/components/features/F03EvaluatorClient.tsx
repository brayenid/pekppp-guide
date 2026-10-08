'use client'

import { FolderHeart, Users, CheckCircle2, BarChart3, Star, ExternalLink, Folder } from 'lucide-react'

interface F03EvaluatorClientProps {
  unitId: string
  unitName: string
  targetQuota: number
  schema: {
    kategori_penilaian: Array<{
      kategori: string
      kategori_romawi: string
      indikator: Array<{
        kode: string
        isu: string
        no_urut: number
      }>
    }>
  }
  respondents: Array<{
    id: string
    respondentNo: number
    name?: string | null
    totalScore: number
    scale5: number
    answers: Record<string, number> | Array<{ questionCode: string; optionScore: number }>
  }>
  proofUrl?: string | null
}

export function F03EvaluatorClient({
  unitId,
  unitName,
  targetQuota,
  schema,
  respondents = [],
  proofUrl
}: F03EvaluatorClientProps) {
  const currentCount = respondents.length
  const quotaPct = targetQuota > 0 ? Math.min(100, Math.round((currentCount / targetQuota) * 100)) : 0
  
  const avgScale5 = currentCount > 0 
    ? respondents.reduce((acc, r) => acc + r.scale5, 0) / currentCount 
    : 0
  const avgPct = (avgScale5 / 5) * 100

  // Calculate per-question average
  const questionAverages: Record<string, number> = {}
  if (respondents.length > 0 && schema?.kategori_penilaian) {
    schema.kategori_penilaian.forEach((cat) => {
      cat.indikator.forEach((ind) => {
        const total = respondents.reduce((acc, r) => {
          let score = 0
          if (Array.isArray(r.answers)) {
            const ans = r.answers.find((a) => a.questionCode === ind.kode)
            score = ans?.optionScore || 0
          } else if (r.answers && typeof r.answers === 'object') {
            score = Number((r.answers as Record<string, number>)[ind.kode]) || 0
          }
          return acc + score
        }, 0)
        questionAverages[ind.kode] = total / respondents.length
      })
    })
  }

  return (
    <div className="space-y-5 pb-6">
      {/* Context Header - Compact */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-0.5">
        <div className="space-y-0.5">
          <div className="inline-flex items-center gap-1.5 text-[11px] font-medium text-ink-muted">
            <span>Evaluator View</span>
            <span>•</span>
            <span>Formulir F-03</span>
            <span>•</span>
            <span className="text-brand font-semibold">Bobot 25% IPP</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-ink tracking-tight">
            Hasil Survei Responden (F-03)
          </h2>
          <p className="text-xs text-ink-secondary">
            Rekapitulasi persepsi publik untuk <strong className="text-ink font-semibold">{unitName}</strong>. Target kuota: <span className="font-semibold text-ink">{targetQuota}</span> responden.
          </p>
        </div>
      </div>

      {/* Bento Stat Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Skor Agregat */}
        <div className="rounded-xl border border-stroke/60 bg-surface p-4 space-y-2 shadow-soft-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">
              Nilai Akhir F-03
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-light text-brand font-semibold border border-brand/20">
              25% Bobot IPP
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {avgPct.toFixed(2)}%
            </div>
            <div className="text-[11px] text-ink-secondary mt-1 flex items-center gap-2">
              <span>Skala 5: <strong className="text-ink font-semibold">{avgScale5.toFixed(2)}</strong> / 5.00</span>
              <span className="text-stroke">•</span>
              <span>Kontribusi: <strong className="text-ink font-semibold">{(avgPct * 0.25).toFixed(2)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Pencapaian Kuota */}
        <div className="rounded-xl border border-stroke/60 bg-surface p-4 space-y-2 shadow-soft-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">
              Pencapaian Kuota
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              quotaPct >= 100
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-surface-subtle text-ink border border-stroke/60'
            }`}>
              {quotaPct}% Terpenuhi
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {currentCount} <span className="text-xs font-normal text-ink-muted">/ {targetQuota} Responden</span>
            </div>
            <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-stroke/40">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${Math.min(quotaPct, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-ink-muted font-medium">
              {targetQuota - currentCount > 0
                ? `${targetQuota - currentCount} responden belum terisi`
                : 'Target kuota responden lengkap'}
            </p>
          </div>
        </div>

        {/* Card 3: Bukti Dukung Dokumen */}
        <div className="rounded-xl border border-stroke/60 bg-surface p-4 space-y-2 shadow-soft-card flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted">
                Berkas Bukti Survei
              </span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                proofUrl
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-surface-subtle text-ink-muted border border-stroke/60'
              }`}>
                {proofUrl ? 'Tersedia' : 'Belum Ada'}
              </span>
            </div>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {proofUrl ? 'Dokumen rekap fisik kuesioner / foto survei.' : 'OPD belum menyematkan tautan bukti fisik.'}
            </p>
          </div>

          <div className="pt-1.5">
            {proofUrl ? (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-xs transition-colors shadow-hz-button">
                <span>Buka Berkas Google Drive</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <span className="text-xs text-ink-muted italic">Menunggu unggahan dari OPD</span>
            )}
          </div>
        </div>
      </div>

      {/* Rincian Rerata Per Indikator */}
      <div className="rounded-bento border border-stroke/50 bg-surface shadow-soft-card overflow-hidden">
        <div className="px-6 py-4 border-b border-stroke/40 flex items-center justify-between bg-surface-subtle/20">
          <span className="text-xs font-medium text-ink flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-brand" />
            Rerata Nilai per Pertanyaan (14 Indikator)
          </span>
          <span className="text-xs text-ink-muted">Skala 0.00 - 5.00</span>
        </div>

        <div className="p-6 space-y-6 divide-y divide-stroke/30">
          {schema?.kategori_penilaian?.map((cat, catIdx) => (
            <div key={cat.kategori_romawi} className={catIdx > 0 ? 'pt-6 space-y-3.5' : 'space-y-3.5'}>
              <div className="flex items-center justify-between pb-1.5 border-b border-stroke/30">
                <span className="text-xs font-semibold text-ink tracking-tight">
                  INDIKATOR {catIdx + 1} · {cat.kategori}
                </span>
                <span className="text-[11px] text-ink-muted">
                  {cat.indikator.length} pertanyaan
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {cat.indikator.map((ind) => {
                  const score = questionAverages[ind.kode] || 0
                  const pct = (score / 5) * 100
                  return (
                    <div key={ind.kode} className="p-3.5 bg-surface-elevated rounded-xl border border-stroke/60 space-y-2 shadow-2xs">
                      <div className="flex items-start justify-between gap-2 text-xs">
                        <span className="text-ink-secondary leading-snug">
                          <strong className="text-ink font-medium mr-1">{ind.no_urut}.</strong> {ind.isu}
                        </span>
                        <span className="font-medium text-ink text-xs shrink-0 bg-surface-subtle px-2.5 py-0.5 rounded-full border border-stroke/50">
                          {score.toFixed(2)}
                        </span>
                      </div>

                      {/* Mini bar */}
                      <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* List Responden */}
      <div className="rounded-bento border border-stroke/50 bg-surface shadow-soft-card overflow-hidden">
        <div className="px-6 py-4 border-b border-stroke/40 flex items-center justify-between bg-surface-subtle/20">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-medium text-ink">
              Daftar Responden Terdaftar
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-brand-light text-brand">
              {currentCount} entri
            </span>
          </div>
          <span className="text-xs text-ink-muted">
            Nilai Total & Konversi Skala 5
          </span>
        </div>

        <div className="divide-y divide-stroke/30">
          {respondents.map((r) => {
            const rPct = ((r.totalScore / 70) * 100).toFixed(1)
            return (
              <div key={r.id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-surface-subtle/30 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-surface-subtle border border-stroke/50 text-ink font-medium text-xs flex items-center justify-center shrink-0">
                    {r.respondentNo}
                  </span>
                  <div>
                    <div className="font-medium text-xs text-ink">
                      {r.name || `Responden #${r.respondentNo}`}
                    </div>
                    <div className="text-[11px] text-ink-muted mt-0.5">
                      Total Nilai: <strong className="text-ink font-medium">{r.totalScore}</strong> / 70
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 text-right shrink-0">
                  <div>
                    <div className="text-xs font-medium text-ink">
                      {r.scale5.toFixed(2)} <span className="text-[10px] font-normal text-ink-muted">/ 5.00</span>
                    </div>
                  </div>
                  <span className="text-xs font-medium text-ink bg-surface-subtle px-3 py-1 rounded-full border border-stroke/50">
                    {rPct}%
                  </span>
                </div>
              </div>
            )
          })}

          {respondents.length === 0 && (
            <div className="p-8 text-center text-xs text-ink-muted">
              Belum ada data responden yang diinput oleh OPD.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
