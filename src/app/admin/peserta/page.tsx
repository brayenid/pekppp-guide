import { redirect } from 'next/navigation'

export const revalidate = 0

export default async function PesertaPage({
  searchParams
}: {
  searchParams: Promise<{ tahun?: string }>
}) {
  const resolvedParams = await searchParams
  const yearQuery = resolvedParams?.tahun ? `?tahun=${resolvedParams.tahun}` : ''
  redirect(`/admin/periode${yearQuery}`)
}
