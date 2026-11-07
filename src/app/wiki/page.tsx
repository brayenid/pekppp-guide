import React from 'react'
import { db } from '../../services/db'
import { PageHeader } from '../../components/ui/PageHeader'
import { WikiAccordionClient, WikiAspectGroup } from './WikiAccordionClient'

export const revalidate = 0

export const metadata = {
  title: 'Wiki 6 Aspek & 31 Pertanyaan PEKPPP - Kutai Barat',
  description: 'Katalog dan referensi resmi instrumen evaluasi 6 aspek indikator dan 31 pertanyaan penilaian kinerja pelayanan publik berdasarkan PermenPAN-RB Nomor 29 Tahun 2022.'
}

export default async function WikiPage() {
  const indicators = await db.indicator.findMany({
    include: { aspect: true },
    orderBy: { indicatorNumber: 'asc' }
  })

  const groupedMap = indicators.reduce<Record<string, WikiAspectGroup>>((acc, item) => {
    const code = item.aspect.code
    if (!acc[code]) {
      acc[code] = {
        aspectCode: code,
        aspectName: item.aspect.name,
        aspectWeight: item.aspect.aspectWeight,
        indicators: []
      }
    }
    acc[code].indicators.push({
      id: item.id,
      code: item.code,
      indicatorNumber: item.indicatorNumber,
      question: item.question,
      indicatorWeight: item.indicatorWeight,
      isSupplementary: item.isSupplementary,
      proofRequirements: item.proofRequirements
    })
    return acc
  }, {})

  const groups = Object.values(groupedMap)

  return (
    <div className="max-w-6xl mx-auto space-y-8 sm:space-y-10 pb-16 font-sans">
      {/* ── Page Header ── */}
      <PageHeader
        title="Katalog 6 Indikator Standar Pelayanan (PEKPPP)"
        description="Referensi lengkap instrumen evaluasi kinerja penyelenggaraan pelayanan publik berdasarkan PermenPAN-RB No. 29 Tahun 2022, mencakup 6 aspek indikator utama dengan 31 butir pertanyaan penilaian, bobot terstandar, dan persyaratan bukti dukung wajib."
      />

      {/* ── Aspect Accordion Sections ── */}
      <WikiAccordionClient groups={groups} />
    </div>
  )
}
