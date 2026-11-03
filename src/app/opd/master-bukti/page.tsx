// src/app/opd/master-bukti/page.tsx
import { requireAuth } from '../../../services/auth-guard'
import { db } from '../../../services/db'
import { redirect } from 'next/navigation'
import { EvidenceMasterService } from '../../../services/evidence-master-service'
import {
  PEKPPP_EVIDENCE_SLOTS,
  extractAttachments,
  normalizeAspectCode
} from '../../../core/domain/evidence-slots-preset'
import { getAllAspectEvidenceSlotsWithGuidesAction } from '../../../actions/evidence-slot-actions'
import { getEvidenceSlotsRulesConfig } from '../../../services/system-setting-service'
import { EvidenceComplianceService } from '../../../services/evidence-compliance-service'
import { OpdMasterBuktiClient } from './OpdMasterBuktiClient'

export const revalidate = 0

export default async function OpdMasterBuktiPage({
  searchParams
}: {
  searchParams?: Promise<{ unitId?: string; tahun?: string }>
}) {
  const user = await requireAuth()

  if (user.role === 'SUPER_ADMIN') {
    redirect('/admin')
  }

  const resolvedParams = await searchParams

  // Ambil seluruh unit yang ditautkan ke akun OPD ini
  const allBoundUserUnits = await db.userUnit.findMany({
    where: { userId: user.id },
    include: {
      unit: {
        include: {
          category: true,
          evaluations: {
            orderBy: { year: 'desc' },
            select: { id: true, year: true }
          }
        }
      }
    },
    orderBy: {
      unit: { name: 'asc' }
    }
  })

  const boundUnitIds = allBoundUserUnits.map((uu) => uu.unitId)

  const selectedUnitId =
    resolvedParams?.unitId && boundUnitIds.includes(resolvedParams.unitId)
      ? resolvedParams.unitId
      : boundUnitIds[0] || null

  const activeUnit = allBoundUserUnits.find((u) => u.unitId === selectedUnitId)?.unit || null

  let masterRecords = selectedUnitId
    ? await db.unitEvidenceMaster.findMany({
        where: {
          unitId: selectedUnitId,
          NOT: { fileUrl: '' }
        },
        orderBy: { updatedAt: 'desc' }
      })
    : []

  // Hanya bootstrap jika untuk unit yang sedang dibuka master-nya masih benar-benar 0
  if (selectedUnitId && masterRecords.length === 0) {
    await EvidenceMasterService.bootstrapUnitMasterFromExisting(selectedUnitId)
    masterRecords = await db.unitEvidenceMaster.findMany({
      where: {
        unitId: selectedUnitId,
        NOT: { fileUrl: '' }
      },
      orderBy: { updatedAt: 'desc' }
    })
  }

  const [slotsWithGuidesRes, slotRules, complianceProfile] = await Promise.all([
    getAllAspectEvidenceSlotsWithGuidesAction(),
    getEvidenceSlotsRulesConfig(),
    selectedUnitId
      ? EvidenceComplianceService.getUnitComplianceProfile(selectedUnitId)
      : Promise.resolve(null)
  ])

  const resolvedPresetSlots =
    slotsWithGuidesRes.success && slotsWithGuidesRes.slots.length > 0
      ? slotsWithGuidesRes.slots
      : PEKPPP_EVIDENCE_SLOTS

  const serializedMasters = masterRecords.map((m) => ({
    id: m.id,
    unitId: m.unitId,
    aspectCode: normalizeAspectCode(m.aspectCode),
    slotKey: m.slotKey,
    title: m.title,
    fileUrl: m.fileUrl,
    storageProvider: m.storageProvider,
    fileType: m.fileType,
    fileSize: m.fileSize,
    fileName: m.fileName,
    uploaderName: m.uploaderName,
    lastSourceYear: m.lastSourceYear,
    attachments: extractAttachments(m),
    history: Array.isArray(m.history) ? (m.history as any[]) : [],
    updatedAt: m.updatedAt.toISOString()
  }))

  const serializedActiveUnit = activeUnit
    ? {
        id: activeUnit.id,
        code: activeUnit.code,
        name: activeUnit.name,
        categoryName: activeUnit.category?.name || 'OPD',
        evaluationId: activeUnit.evaluations?.[0]?.id || null
      }
    : null

  return (
    <OpdMasterBuktiClient
      key={selectedUnitId || 'empty'}
      activeUnit={serializedActiveUnit}
      initialRecords={serializedMasters}
      presetSlots={resolvedPresetSlots}
      uploaderName={user.fullName || 'Admin OPD'}
      slotRules={slotRules}
      complianceProfile={complianceProfile}
    />
  )
}
