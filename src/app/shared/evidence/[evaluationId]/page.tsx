import { notFound } from 'next/navigation'
import { Metadata } from 'next'
import { db } from '../../../../services/db'
import {
  PEKPPP_EVIDENCE_SLOTS,
  extractAttachments,
  normalizeAspectCode
} from '../../../../core/domain/evidence-slots-preset'
import { getAllAspectEvidenceSlotsWithGuidesAction } from '../../../../actions/evidence-slot-actions'
import {
  PublicAspectListClient,
  PublicAspectSummaryItem
} from './PublicAspectListClient'

interface SharedEvidenceAspectListPageProps {
  params: Promise<{
    evaluationId: string
  }>
}

const ASPECT_CONFIG = [
  {
    code: 'I',
    romanCode: 'I',
    name: 'Kebijakan Pelayanan',
    weight: 24.0,
    indicatorRange: 'Q1 - Q9',
    indicatorCount: 9,
    description:
      'Standar Pelayanan (SP), Maklumat Pelayanan, Survei Kepuasan Masyarakat (SKM), tindak lanjut SKM, dan sarana publikasi.'
  },
  {
    code: 'II',
    romanCode: 'II',
    name: 'Profesionalisme SDM',
    weight: 25.0,
    indicatorRange: 'Q10 - Q14',
    indicatorCount: 5,
    description:
      'Waktu pelayanan, kedisiplinan, kode etik, kompetensi petugas, budaya pelayanan 5S, penghargaan & sanksi pegawai.'
  },
  {
    code: 'III',
    romanCode: 'III',
    name: 'Sarana & Prasarana Ramah Kelompok Rentan',
    weight: 18.0,
    indicatorRange: 'Q15 - Q20',
    indicatorCount: 6,
    description:
      'Tempat parkir khusus, jalur pemandu & landai (ram), kursi roda/tongkat, toilet disabilitas, ruang laktasi, dan loket ramah rentan.'
  },
  {
    code: 'IV',
    romanCode: 'IV',
    name: 'Sistem Informasi Pelayanan Publik (SIPP)',
    weight: 11.0,
    indicatorRange: 'Q21 - Q24',
    indicatorCount: 4,
    description:
      'Penyelenggaraan SIPP daring/luring, kanal website resmi, pemutakhiran data informasi publik, dan integrasi portal SIPPN.'
  },
  {
    code: 'V',
    romanCode: 'V',
    name: 'Konsultasi & Pengaduan',
    weight: 10.0,
    indicatorRange: 'Q25 - Q28',
    indicatorCount: 4,
    description:
      'Pengelolaan pengaduan SP4N-LAPOR!, ruang/sarana konsultasi langsung, pejabat/petugas pengelola, dan publikasi tindak lanjut.'
  },
  {
    code: 'VI',
    romanCode: 'VI',
    name: 'Inovasi Pelayanan Publik',
    weight: 12.0,
    indicatorRange: 'Q29 - Q30',
    indicatorCount: 2,
    description:
      'Terobosan dan inovasi pelayanan publik yang diterapkan, replikasi inovasi, pemantauan kemanfaatan & keberlanjutan.'
  },
  {
    code: 'TAMBAHAN',
    romanCode: 'Tambahan',
    name: 'Informasi & Pertanyaan Tambahan',
    weight: 0.0,
    indicatorRange: 'Q31',
    indicatorCount: 1,
    description:
      'Sistem antrean terpadu, mekanisme nomor antrean elektronik, serta fasilitas penunjang tambahan di unit kerja.'
  }
]

export async function generateMetadata({
  params
}: SharedEvidenceAspectListPageProps): Promise<Metadata> {
  const { evaluationId } = await params
  let evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: { unit: true }
  })
  if (!evaluation) {
    evaluation = await db.evaluation.findFirst({
      where: { unitId: evaluationId },
      orderBy: { year: 'desc' },
      include: { unit: true }
    })
  }

  const name = evaluation?.unit.name || 'Lokus'
  const year = evaluation?.year || new Date().getFullYear()

  return {
    title: `Katalog Bukti Dukung PEKPPP ${year} - ${name} - PEKPPP.ext`
  }
}

export default async function SharedEvidenceAspectListPage({
  params
}: SharedEvidenceAspectListPageProps) {
  const { evaluationId } = await params

  if (!evaluationId) {
    notFound()
  }

  // Cari evaluasi berdasarkan ID evaluasi langsung
  let evaluation = await db.evaluation.findUnique({
    where: { id: evaluationId },
    include: {
      unit: {
        include: {
          category: true
        }
      }
    }
  })

  // Jika bukan ID evaluasi, coba cari evaluasi aktif berdasarkan unitId
  if (!evaluation) {
    evaluation = await db.evaluation.findFirst({
      where: { unitId: evaluationId },
      orderBy: { year: 'desc' },
      include: {
        unit: {
          include: {
            category: true
          }
        }
      }
    })
  }

  let unit = evaluation?.unit || null

  // Jika tetap belum ada evaluasi, cari langsung dari tabel Unit
  if (!unit) {
    unit = await db.unit.findUnique({
      where: { id: evaluationId },
      include: {
        category: true
      }
    })
  }

  if (!unit && !evaluation) {
    notFound()
  }

  const lokusName = unit?.name || evaluation?.unit.name || 'Lokus'
  const lokusCode = unit?.code || evaluation?.unit.code || '-'
  const categoryName = unit?.category?.name || 'Perangkat Daerah'
  const year = evaluation?.year || new Date().getFullYear()
  const activeEvaluationId = evaluation?.id || evaluationId

  // Ambil seluruh data submisi dan master bukti untuk lokus ini
  const [submissions, unitMasters, slotsGuideRes] = await Promise.all([
    evaluation
      ? db.indicatorEvidenceSubmission.findMany({
          where: { evaluationId: evaluation.id },
          select: {
            aspectCode: true,
            slotKey: true,
            fileUrl: true,
            attachments: true
          }
        })
      : Promise.resolve([]),
    unit
      ? db.unitEvidenceMaster.findMany({
          where: {
            unitId: unit.id,
            NOT: { fileUrl: '' }
          },
          select: {
            aspectCode: true,
            slotKey: true,
            fileUrl: true,
            attachments: true
          }
        })
      : Promise.resolve([]),
    getAllAspectEvidenceSlotsWithGuidesAction()
  ])

  const allPresets =
    slotsGuideRes.success && slotsGuideRes.slots && slotsGuideRes.slots.length > 0
      ? slotsGuideRes.slots
      : PEKPPP_EVIDENCE_SLOTS

  // Bentuk peta submisi dan master untuk lookup cepat
  const subMap = new Map<string, (typeof submissions)[0]>()
  submissions.forEach((s) => {
    const key = `${normalizeAspectCode(s.aspectCode)}::${s.slotKey}`
    subMap.set(key, s)
  })

  const masterMap = new Map<string, (typeof unitMasters)[0]>()
  unitMasters.forEach((m) => {
    const key = `${normalizeAspectCode(m.aspectCode)}::${m.slotKey}`
    masterMap.set(key, m)
  })

  let totalSlotsAll = 0
  let totalFilledSlotsAll = 0
  let totalFilesAll = 0

  const aspectSummaries: PublicAspectSummaryItem[] = ASPECT_CONFIG.map((cfg) => {
    const norm = normalizeAspectCode(cfg.code)
    const aspectPresets = allPresets.filter((p) => normalizeAspectCode(p.aspectCode) === norm)

    const totalSlots = aspectPresets.length
    const mandatorySlots = aspectPresets.filter((p) => p.isMandatory).length

    let filledSlotsCount = 0
    let totalFilesCount = 0

    aspectPresets.forEach((p) => {
      const lookupKey = `${norm}::${p.slotKey}`
      const sub = subMap.get(lookupKey)
      const master = masterMap.get(lookupKey)

      const subAtts = sub ? extractAttachments(sub) : []
      const masterAtts = master ? extractAttachments(master) : []

      const allAtts = subAtts.length > 0 ? subAtts : masterAtts
      const hasFile =
        (sub?.fileUrl && sub.fileUrl.trim() !== '') ||
        (master?.fileUrl && master.fileUrl.trim() !== '') ||
        allAtts.length > 0

      if (hasFile) {
        filledSlotsCount++
        totalFilesCount += Math.max(1, allAtts.length)
      }
    })

    totalSlotsAll += totalSlots
    totalFilledSlotsAll += filledSlotsCount
    totalFilesAll += totalFilesCount

    const percentage = Math.min(
      100,
      Math.round((filledSlotsCount / Math.max(totalSlots, 1)) * 100)
    )

    const status: 'COMPLETE' | 'PARTIAL' | 'EMPTY' =
      filledSlotsCount >= totalSlots && totalSlots > 0
        ? 'COMPLETE'
        : filledSlotsCount > 0
        ? 'PARTIAL'
        : 'EMPTY'

    return {
      code: cfg.code,
      romanCode: cfg.romanCode,
      name: cfg.name,
      weight: cfg.weight,
      indicatorRange: cfg.indicatorRange,
      indicatorCount: cfg.indicatorCount,
      description: cfg.description,
      totalSlots,
      mandatorySlots,
      filledSlotsCount,
      totalFilesCount,
      percentage,
      status
    }
  })

  const overallPercentage = Math.min(
    100,
    Math.round((totalFilledSlotsAll / Math.max(totalSlotsAll, 1)) * 100)
  )

  return (
    <PublicAspectListClient
      evaluationId={activeEvaluationId}
      lokusName={lokusName}
      lokusCode={lokusCode}
      year={year}
      aspects={aspectSummaries}
      totalFilesAll={totalFilesAll}
    />
  )
}
