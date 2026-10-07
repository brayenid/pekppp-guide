import { notFound } from 'next/navigation'
import { db } from '../../../../../services/db'
import {
  getIndicatorEvidenceAction,
  EvidenceSlotItem
} from '../../../../../actions/evidence-slot-actions'
import { normalizeAspectCode } from '../../../../../core/domain/evidence-slots-preset'
import { PublicEvidenceClient } from './PublicEvidenceClient'

interface SharedEvidencePageProps {
  params: Promise<{
    evaluationId: string
    aspectCode: string
  }>
}

const ASPECT_TITLES: Record<string, string> = {
  'I': 'Kebijakan Pelayanan',
  'II': 'Profesionalisme SDM',
  'III': 'Sarana & Prasarana Ramah Kelompok Rentan',
  'IV': 'Sistem Informasi Pelayanan Publik (SIPP)',
  'V': 'Konsultasi & Pengaduan',
  'VI': 'Inovasi Pelayanan Publik',
  'TAMBAHAN': 'Informasi & Pertanyaan Tambahan (Sistem Antrean)'
}

export default async function SharedEvidencePage({ params }: SharedEvidencePageProps) {
  const { evaluationId, aspectCode } = await params

  if (!evaluationId || !aspectCode) {
    notFound()
  }

  const norm = normalizeAspectCode(aspectCode)
  const aspectName = ASPECT_TITLES[norm] || `Aspek ${norm}`

  const evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      unit: true
    }
  })

  if (!evaluation) {
    notFound()
  }

  const evidenceRes = await getIndicatorEvidenceAction(evaluationId, norm)
  const slots: EvidenceSlotItem[] = evidenceRes.success && evidenceRes.slots ? evidenceRes.slots : []

  return (
    <PublicEvidenceClient
      evaluationId={evaluationId}
      aspectCode={norm}
      aspectName={aspectName}
      lokusName={evaluation.unit.name}
      lokusCode={evaluation.unit.code || '-'}
      year={evaluation.year}
      slots={slots}
    />
  )
}