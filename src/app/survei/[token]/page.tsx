import { notFound } from 'next/navigation'
import { getPublicSurveyDataAction } from '@/actions/public-survey-actions'
import { PublicSurveyClient } from './PublicSurveyClient'
import { AlertTriangle, Clock } from 'lucide-react'

export const metadata = {
  title: 'Formulir F03 - PEKPPP',
  description: 'Lembar penilaian masyarakat Formulir F03 PEKPPP',
}

interface PageProps {
  params: Promise<{
    token: string
  }>
}

export default async function PublicSurveyPage({ params }: PageProps) {
  const { token } = await params
  const res = await getPublicSurveyDataAction(token)

  if (!res.success || !res.data) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-bento p-8 border border-stroke shadow-soft-card text-center space-y-4">
          <div className="w-14 h-14 bg-pastel-rose text-pastel-rose-text rounded-2xl flex items-center justify-center mx-auto border border-rose-300/60 shadow-2xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <h1 className="text-lg font-bold text-ink">Kuesioner Tidak Ditemukan</h1>
          <p className="text-xs text-ink-secondary leading-relaxed">{res.error || 'Pastikan tautan survei yang Anda buka sudah tepat atau hubungi unit penyelenggara.'}</p>
        </div>
      </main>
    )
  }

  const { data } = res

  // Jika tahun periode evaluasi tidak aktif atau tahapan F03 ditutup
  if (!data.isPeriodOpen || !data.canFillF03) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-bento p-8 border border-stroke shadow-soft-card text-center space-y-5">
          <div className="w-14 h-14 bg-surface-subtle text-ink-muted rounded-2xl flex items-center justify-center mx-auto border border-stroke shadow-2xs">
            <Clock className="w-7 h-7 text-ink" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold text-ink">
              {!data.isPeriodOpen ? `Periode Evaluasi ${data.year} Tidak Aktif` : 'Tahapan Survei F03 Ditutup'}
            </h1>
            <p className="text-xs text-ink-secondary leading-relaxed">
              {data.closedReason || `Pengisian kuesioner untuk unit pelayanan ${data.unitName} sedang tidak dibuka.`}
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!data.isSurveyOpen) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-bento p-8 border border-stroke shadow-soft-card text-center space-y-5">
          <div className="w-14 h-14 bg-surface-subtle text-ink-muted rounded-2xl flex items-center justify-center mx-auto border border-stroke shadow-2xs">
            <Clock className="w-7 h-7 text-ink" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold text-ink">Kuesioner Ditutup Sementara</h1>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Pengisian survei untuk <strong>{data.unitName}</strong> sedang tidak aktif atau telah ditutup oleh penyelenggara layanan.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (data.isQuotaFull) {
    return (
      <main className="min-h-screen bg-canvas flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-surface rounded-bento p-8 border border-stroke shadow-soft-card text-center space-y-5">
          <div className="w-14 h-14 bg-pastel-green text-pastel-green-text rounded-2xl flex items-center justify-center mx-auto border border-emerald-300/60 shadow-2xs">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-lg font-bold text-ink">Kuota Responden Terpenuhi</h1>
            <p className="text-xs text-ink-secondary leading-relaxed">
              Target responden ({data.targetQuota} responden) untuk <strong>{data.unitName}</strong> telah terpenuhi. Terima kasih atas partisipasi masyarakat!
            </p>
          </div>
        </div>
      </main>
    )
  }

  return (
    <PublicSurveyClient
      token={token}
      unitName={data.unitName}
      agencyName={data.categoryName}
      periodYear={data.year}
      currentCount={data.filledCount}
      targetQuota={data.targetQuota}
      schema={data.schema as any}
    />
  )
}
