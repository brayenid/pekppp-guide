import { notFound } from 'next/navigation'
import { db } from '../../../../../services/db'
import {
  getIndicatorEvidenceAction,
  getAllAspectEvidenceSlotsWithGuidesAction,
  EvidenceSlotItem
} from '../../../../../actions/evidence-slot-actions'
import {
  PEKPPP_EVIDENCE_SLOTS,
  extractAttachments,
  normalizeAspectCode
} from '../../../../../core/domain/evidence-slots-preset'
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

  let evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      unit: true
    }
  })

  // Jika evaluationId bukan ID evaluasi langsung, coba cari evaluasi aktif/terbaru berdasarkan unitId
  if (!evaluation) {
    evaluation = await db.evaluation.findFirst({
      where: { unitId: evaluationId },
      orderBy: { year: 'desc' },
      include: {
        unit: true
      }
    })
  }

  let lokusName = evaluation?.unit.name || ''
  let lokusCode = evaluation?.unit.code || '-'
  let year = evaluation?.year || new Date().getFullYear()
  let slots: EvidenceSlotItem[] = []
  let activeEvaluationId = evaluation?.id || evaluationId

  if (evaluation) {
    const [evidenceRes, unitMasters] = await Promise.all([
      getIndicatorEvidenceAction(evaluation.id, norm),
      db.unitEvidenceMaster.findMany({
        where: {
          unitId: evaluation.unitId,
          aspectCode: { in: [norm, aspectCode] },
          NOT: { fileUrl: '' }
        }
      })
    ])
    const masterMap = new Map<string, (typeof unitMasters)[0]>()
    unitMasters.forEach((m) => masterMap.set(m.slotKey, m))

    const rawSlots = evidenceRes.success && evidenceRes.slots ? evidenceRes.slots : []
    slots = rawSlots.map((slot) => {
      if (!slot.fileUrl && (!slot.attachments || slot.attachments.length === 0)) {
        const m = masterMap.get(slot.slotKey)
        if (m) {
          const atts = extractAttachments(m.attachments)
          return {
            ...slot,
            fileUrl: m.fileUrl || '',
            fileName: m.fileName || undefined,
            fileSize: m.fileSize || undefined,
            fileType: m.fileType || undefined,
            attachments: atts.length > 0 ? atts : slot.attachments
          }
        }
      }
      return slot
    })
  } else {
    // Jika belum ada evaluasi, cari langsung dari tabel Unit
    const unit = await db.unit.findUnique({
      where: { id: evaluationId }
    })
    if (!unit) {
      notFound()
    }
    lokusName = unit.name
    lokusCode = unit.code || '-'

    const [slotsWithGuidesRes, unitMasters] = await Promise.all([
      getAllAspectEvidenceSlotsWithGuidesAction(),
      db.unitEvidenceMaster.findMany({
        where: {
          unitId: unit.id,
          aspectCode: { in: [norm, aspectCode] },
          NOT: { fileUrl: '' }
        }
      })
    ])

    const allAspectPresets = (
      slotsWithGuidesRes.success && slotsWithGuidesRes.slots
        ? slotsWithGuidesRes.slots
        : PEKPPP_EVIDENCE_SLOTS
    ).filter((s) => s.aspectCode === norm)

    const masterMap = new Map<string, (typeof unitMasters)[0]>()
    unitMasters.forEach((m) => masterMap.set(m.slotKey, m))

    slots = allAspectPresets.map((preset, idx) => {
      const m = masterMap.get(preset.slotKey)
      const atts = m ? extractAttachments(m.attachments) : []
      return {
        slotKey: preset.slotKey,
        orderIndex: preset.orderIndex ?? idx,
        title: preset.title,
        description: preset.description || '',
        isMandatory: preset.isMandatory,
        documentType: preset.documentType,
        exampleImages: preset.exampleImages,
        guideChecklist: preset.guideChecklist,
        indicatorNumbers: preset.indicatorNumbers,
        fileUrl: m?.fileUrl || '',
        fileName: m?.fileName || undefined,
        fileSize: m?.fileSize || undefined,
        fileType: m?.fileType || undefined,
        attachments: atts
      }
    })
  }

  return (
    <PublicEvidenceClient
      evaluationId={activeEvaluationId}
      aspectCode={norm}
      aspectName={aspectName}
      lokusName={lokusName}
      lokusCode={lokusCode}
      year={year}
      slots={slots}
    />
  )
}