'use client'

import { useState } from 'react'
import { submitPublicSurveyAction } from '@/actions/public-survey-actions'
import { 
  Building2, 
  CheckCircle2, 
  ChevronRight, 
  Send, 
  AlertCircle, 
  Sparkles,
  ShieldCheck,
  Check
} from 'lucide-react'

interface F03Indikator {
  no_urut: number
  kode: string
  isu: string
  skala_nilai: number[]
}

interface F03Category {
  kategori_romawi: string
  kategori: string
  indikator: F03Indikator[]
}

interface PublicSurveyClientProps {
  token: string
  unitName: string
  agencyName: string
  periodYear: number
  currentCount: number
  targetQuota: number
  schema: {
    kategori_penilaian: F03Category[]
  }
}

export function PublicSurveyClient({
  token,
  unitName,
  agencyName,
  periodYear,
  currentCount,
  targetQuota,
  schema
}: PublicSurveyClientProps) {
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [submittedSuccess, setSubmittedSuccess] = useState(false)

  // Count total indicators
  const allIndicators: F03Indikator[] = []
  schema.kategori_penilaian.forEach(cat => {
    cat.indikator.forEach(ind => {
      allIndicators.push(ind)
    })
  })

  const answeredCount = Object.keys(answers).length
  const totalCount = allIndicators.length
  const progressPercent = Math.round((answeredCount / totalCount) * 100)

  const handleSelectScore = (kode: string, score: number) => {
    setAnswers(prev => ({
      ...prev,
      [kode]: score
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)

    if (answeredCount < totalCount) {
      setErrorMessage(`Mohon lengkapi semua penilaian (${answeredCount}/${totalCount} telah dinilai).`)
      // Scroll to first unanswered indicator
      const firstUnanswered = allIndicators.find(ind => answers[ind.kode] === undefined)
      if (firstUnanswered) {
        const el = document.getElementById(`indicator-${firstUnanswered.kode}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }
      return
    }

    setSubmitting(true)
    try {
      const res = await submitPublicSurveyAction({
        token,
        answers
      })

      if (res.success) {
        setSubmittedSuccess(true)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        setErrorMessage(res.error || 'Gagal mengirim survei. Silakan coba beberapa saat lagi.')
      }
    } catch {
      setErrorMessage('Terjadi kesalahan jaringan atau sistem. Silakan coba kembali.')
    } finally {
      setSubmitting(false)
    }
  }

  if (submittedSuccess) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-bento p-8 sm:p-10 border border-stroke shadow-soft-card text-center space-y-6 animate-fade-in">
          {/* Ikon checkmark besar tanpa background square */}
          <div className="flex items-center justify-center pt-2">
            <CheckCircle2 className="w-16 h-16 sm:w-20 sm:h-20 text-emerald-600 dark:text-emerald-400 stroke-[1.75]" />
          </div>

          <div className="space-y-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              Terima Kasih atas Penilaian Anda
            </h1>
            <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed font-normal">
              Partisipasi Anda sangat berharga dalam meningkatkan transparansi dan kualitas pelayanan publik.
            </p>
          </div>

          <div className="p-4 bg-surface-subtle/50 rounded-xl border border-stroke/70 text-left space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
              Unit Penyelenggara Layanan
            </span>
            <div className="text-sm sm:text-base font-semibold text-ink leading-snug">
              {unitName}
            </div>
            {agencyName && (
              <div className="text-xs text-ink-secondary">
                {agencyName}
              </div>
            )}
            <div className="text-[11px] text-ink-muted pt-1">
              Periode Evaluasi PEKPPP Tahun {periodYear}
            </div>
          </div>

          <div className="pt-1">
            <p className="text-[11px] text-ink-muted">
              Anda dapat menutup halaman ini sekarang.
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-canvas text-ink pb-28">
      {/* Sticky Header Banner */}
      <header className="bg-surface/95 backdrop-blur-md border-b border-stroke sticky top-0 z-30 shadow-2xs">
        <div className="max-w-2xl mx-auto px-4 py-3 sm:py-3.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="px-2.5 py-1 rounded-lg bg-brand text-white font-bold text-xs tracking-wide shrink-0 shadow-2xs">
                F03
              </span>
              <div className="min-w-0">
                <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider block leading-none mb-0.5">
                  Kuesioner Masyarakat (PEKPPP {periodYear})
                </span>
                <h1 className="text-xs sm:text-sm font-semibold text-ink truncate leading-tight">
                  {unitName}
                </h1>
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between items-center text-xs text-ink-secondary font-medium">
              <span className="text-[11px] sm:text-xs">Kelengkapan Isian</span>
              <span className={`text-[11px] sm:text-xs font-semibold ${answeredCount === totalCount ? 'text-emerald-700 dark:text-emerald-400 font-bold' : 'text-ink'}`}>
                {answeredCount} dari {totalCount} Pertanyaan ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-surface-subtle rounded-full h-1.5 overflow-hidden border border-stroke/40">
              <div
                className="bg-brand h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Intro Notice (Warm Minimalist Callout) */}
      <section className="max-w-2xl mx-auto px-4 pt-4 pb-1">
        <div className="bg-surface rounded-xl p-4 border border-stroke text-ink space-y-1.5 shadow-2xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand" />
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wider">
              Petunjuk Pengisian
            </h2>
          </div>
          <p className="text-xs leading-relaxed text-ink-secondary font-normal">
            Pilihlah skor <strong>0 (Sangat Buruk)</strong> hingga <strong>5 (Sangat Baik)</strong> sesuai pengalaman riil yang Anda peroleh. Data pengisian dijamin <strong>100% tanpa identitas</strong> untuk menjaga netralitas dan objektivitas evaluasi pelayanan publik.
          </p>
        </div>
      </section>

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 pt-3 space-y-6">
        {schema.kategori_penilaian.map((cat, catIdx) => (
          <div key={cat.kategori_romawi} className="space-y-3">
            {/* Indikator Group Header */}
            <div className="flex items-center justify-between pb-1.5 border-b border-stroke/70 pt-2">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-md bg-surface-subtle text-ink font-bold text-xs flex items-center justify-center border border-stroke/60">
                  {catIdx + 1}
                </span>
                <h2 className="text-xs font-semibold text-ink tracking-tight uppercase">
                  INDIKATOR {catIdx + 1} · {cat.kategori}
                </h2>
              </div>
              <span className="text-[11px] text-ink-muted font-normal">
                {cat.indikator.length} pertanyaan
              </span>
            </div>

            {/* Questions under this indicator */}
            <div className="space-y-3">
              {cat.indikator.map((ind) => {
                const currentVal = answers[ind.kode]
                const isAnswered = currentVal !== undefined

                return (
                  <div
                    key={ind.kode}
                    id={`indicator-${ind.kode}`}
                    className={`bg-surface rounded-xl p-4 sm:p-4.5 border transition-all duration-200 shadow-2xs ${
                      isAnswered
                        ? 'border-brand/40 ring-1 ring-brand/10'
                        : 'border-stroke hover:border-stroke/90'
                    }`}
                  >
                    <div className="space-y-3">
                      <div className="flex items-start gap-2.5">
                        <span className="px-2 py-0.5 rounded-full bg-surface-subtle border border-stroke text-ink-muted text-[11px] font-semibold shrink-0 mt-0.5">
                          #{ind.no_urut}
                        </span>
                        <p className="text-xs sm:text-sm font-medium text-ink leading-relaxed flex-1">
                          {ind.isu}
                        </p>
                      </div>

                      {/* Score Choices 0 - 5 with clean buttons */}
                      <div className="space-y-1.5 pt-1">
                        <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                          {[0, 1, 2, 3, 4, 5].map((score) => {
                            const isSelected = currentVal === score
                            return (
                              <button
                                key={score}
                                type="button"
                                onClick={() => handleSelectScore(ind.kode, score)}
                                className={`h-11 sm:h-12 rounded-lg font-semibold text-sm flex flex-col items-center justify-center transition-all cursor-pointer select-none ${
                                  isSelected
                                    ? 'bg-brand text-white shadow-hz-button ring-2 ring-brand/30 scale-[1.02]'
                                    : 'bg-surface-subtle/70 hover:bg-surface-subtle text-ink border border-stroke/70 hover:border-stroke'
                                }`}
                              >
                                <span>{score}</span>
                              </button>
                            )
                          })}
                        </div>
                        <div className="flex justify-between items-center text-[10px] text-ink-muted font-normal px-0.5 pt-0.5">
                          <span>0 = Sangat Buruk</span>
                          <span>5 = Sangat Baik</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        ))}

        {errorMessage && (
          <div className="p-4 bg-pastel-rose border border-pastel-rose-border rounded-xl text-pastel-rose-text text-xs font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sticky Submit Bottom Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-3 sm:p-4 bg-surface/95 backdrop-blur-md border-t border-stroke z-20 shadow-soft-float">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <div className="text-xs min-w-0">
              <span className="text-ink-muted block text-[11px]">Progres Isian:</span>
              <span className={`font-semibold truncate block ${answeredCount === totalCount ? 'text-emerald-700 dark:text-emerald-400' : 'text-ink'}`}>
                {answeredCount} / {totalCount} Pertanyaan
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-full font-semibold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer min-h-[44px] ${
                answeredCount === totalCount && !submitting
                  ? 'bg-brand hover:bg-brand-hover text-white shadow-hz-button'
                  : 'bg-surface-subtle text-ink-muted border border-stroke/70 opacity-60 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Kirim Penilaian</span>
                </>
              )}
            </button>
          </div>
        </div>
      </form>
    </main>
  )
}
