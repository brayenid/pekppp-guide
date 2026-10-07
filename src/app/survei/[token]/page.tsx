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
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-rose-100 shadow-xl text-center space-y-4">
          <h1 className="text-xl font-bold text-rose-700">Kuesioner Tidak Ditemukan</h1>
          <p className="text-sm text-slate-600">{res.error || 'Pastikan tautan survei yang Anda buka sudah tepat.'}</p>
        </div>
      </main>
    )
  }

  const { data } = res

  if (!data.isSurveyOpen) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-100 shadow-xl shadow-amber-900/5 text-center space-y-5">
          <div className="w-16 h-16 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-amber-50/50">
            <Clock className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Kuesioner Ditutup Sementara</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Pengisian survei untuk <b>{data.unitName}</b> sedang tidak aktif atau telah ditutup oleh penyelenggara layanan.
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (data.isQuotaFull) {
    return (
      <main className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-amber-100 shadow-xl shadow-amber-900/5 text-center space-y-5">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto ring-8 ring-emerald-50/50">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-xl font-bold text-slate-900">Kuota Responden Terpenuhi</h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              Target responden ({data.targetQuota} responden) untuk <b>{data.unitName}</b> telah terpenuhi. Terima kasih atas partisipasi masyarakat!
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
