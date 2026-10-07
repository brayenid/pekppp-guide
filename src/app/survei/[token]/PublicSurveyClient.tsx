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
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-100 shadow-xl shadow-amber-900/5 text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Terima Kasih!
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Penilaian Formulir F03 Anda telah berhasil tersimpan secara aman dan anonim. Kontribusi Anda sangat berarti bagi evaluasi pelayanan di:
            </p>
          </div>

          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100/80 text-left space-y-1">
            <div className="text-[11px] font-bold tracking-wider uppercase text-[#1D5BB9]">
              Unit Layanan
            </div>
            <div className="text-base font-bold text-slate-900 leading-snug">
              {unitName}
            </div>
            {agencyName && (
              <div className="text-xs text-slate-500 font-medium">
                {agencyName}
              </div>
            )}
          </div>

          <div className="pt-2">
            <div className="inline-flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Survei Terverifikasi (Anonim) • PEKPPP {periodYear}</span>
            </div>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FDFBF7] pb-24">
      {/* Header Banner */}
      <header className="bg-white border-b border-blue-100 sticky top-0 z-30 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 sm:py-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-500/10 text-blue-700 flex items-center justify-center font-bold text-base shrink-0">
                F03
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1D5BB9] block leading-none mb-0.5">
                  Formulir F03
                </span>
                <h1 className="text-sm sm:text-base font-bold text-slate-900 line-clamp-1">
                  {unitName}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200/70 shrink-0">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">100%</span> Anonim
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3">
            <div className="flex justify-between items-center text-xs mb-1 font-medium text-slate-500">
              <span>Kelengkapan Pertanyaan</span>
              <span className={answeredCount === totalCount ? 'font-bold text-emerald-600' : 'text-slate-700'}>
                {answeredCount} dari {totalCount} ({progressPercent}%)
              </span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div
                className="bg-[#1D5BB9] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Intro Notice */}
      <section className="max-w-2xl mx-auto px-4 pt-5 pb-2">
        <div className="bg-amber-500/10 border border-amber-200/80 rounded-2xl p-4 text-slate-800 space-y-1">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[#b57317] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" /> Petunjuk Penilaian
          </h2>
          <p className="text-xs leading-relaxed text-slate-700">
            Pilihlah skor <b>0 (Sangat Buruk)</b> hingga <b>5 (Sangat Baik)</b> yang paling sesuai dengan pengalaman layanan yang Anda rasakan. Penilaian ini murni <b>tanpa identitas</b> untuk menjamin objektivitas evaluasi pelayanan publik.
          </p>
        </div>
      </section>

      {/* Questions Form */}
      <form onSubmit={handleSubmit} className="max-w-2xl mx-auto px-4 pt-3 space-y-6">
        {schema.kategori_penilaian.map((cat, catIdx) => (
          <div key={cat.kategori_romawi} className="space-y-4">
            {/* Category Header */}
            <div className="flex items-center gap-2 pt-2">
              <div className="w-6 h-6 rounded-lg bg-slate-900 text-white text-xs font-bold flex items-center justify-center">
                {cat.kategori_romawi}
              </div>
              <h2 className="text-xs font-bold tracking-wider uppercase text-slate-700">
                {cat.kategori}
              </h2>
            </div>

            {/* Indicators */}
            <div className="space-y-3">
              {cat.indikator.map((ind) => {
                const currentVal = answers[ind.kode]
                const isAnswered = currentVal !== undefined

                return (
                  <div
                    key={ind.kode}
                    id={`indicator-${ind.kode}`}
                    className={`bg-white rounded-2xl p-4 border transition-all ${
                      isAnswered 
                        ? 'border-amber-200/80 shadow-xs' 
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                        {ind.no_urut}
                      </span>
                      <div className="flex-1 space-y-3">
                        <p className="text-sm font-medium text-slate-800 leading-snug">
                          {ind.isu}
                        </p>

                        {/* Rating 0 - 5 buttons */}
                        <div className="space-y-1.5">
                          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
                            {[0, 1, 2, 3, 4, 5].map((score) => {
                              const isSelected = currentVal === score
                              return (
                                <button
                                  key={score}
                                  type="button"
                                  onClick={() => handleSelectScore(ind.kode, score)}
                                  className={`py-2.5 rounded-xl font-bold text-sm flex flex-col items-center justify-center transition-all cursor-pointer ${
                                    isSelected
                                      ? 'bg-[#1D5BB9] text-white shadow-md shadow-blue-600/20 ring-2 ring-blue-400 scale-[1.02]'
                                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                                  }`}
                                >
                                  <span>{score}</span>
                                </button>
                              )
                            })}
                          </div>
                          <div className="flex justify-between items-center text-[10px] text-slate-600 font-medium px-1">
                            <span>0 = Sangat Buruk</span>
                            <span>5 = Sangat Baik</span>
                          </div>
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
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-700 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Sticky Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 backdrop-blur-md border-t border-slate-200 z-20">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div className="text-xs">
              <span className="text-slate-500 block">Status Pengisian:</span>
              <span className={`font-bold ${answeredCount === totalCount ? 'text-emerald-600' : 'text-blue-600'}`}>
                {answeredCount} / {totalCount} Pertanyaan
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-md cursor-pointer ${
                answeredCount === totalCount && !submitting
                  ? 'bg-[#1D5BB9] hover:bg-[#154694] text-white shadow-blue-600/20'
                  : 'bg-slate-200 text-slate-500 cursor-not-allowed'
              }`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Mengirim...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
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
