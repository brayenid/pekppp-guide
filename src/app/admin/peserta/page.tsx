import { redirect } from 'next/navigation'
import { Metadata } from 'next'

export const revalidate = 0

export const metadata: Metadata = {
  title: 'Peserta & Lokus Evaluasi - PEKPPP.ext'
}

export default async function PesertaPage({
  searchParams
}: {
  searchParams: Promise<{ tahun?: string }>
}) {
  const resolvedParams = await searchParams
  const yearQuery = resolvedParams?.tahun ? `?tahun=${resolvedParams.tahun}` : ''
  redirect(`/admin/periode${yearQuery}`)
}
