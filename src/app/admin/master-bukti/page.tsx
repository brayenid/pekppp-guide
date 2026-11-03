// src/app/admin/master-bukti/page.tsx
import { Suspense } from 'react'
import { db } from '../../../services/db'
import { requireSuperAdmin } from '../../../services/auth-guard'
import {
  PEKPPP_EVIDENCE_SLOTS,
  extractAttachments,
  normalizeAspectCode
} from '../../../core/domain/evidence-slots-preset'
import { getAllAspectEvidenceSlotsWithGuidesAction } from '../../../actions/evidence-slot-actions'
import { getEvidenceSlotsRulesConfig } from '../../../services/system-setting-service'
import { EvidenceComplianceService } from '../../../services/evidence-compliance-service'
import MasterEvidenceClient from './MasterEvidenceClient'

export const revalidate = 0

export default async function MasterBuktiAdminPage({
  searchParams
}: {
  searchParams?: Promise<{ unitId?: string; tab?: string }>
}) {
  await requireSuperAdmin()
  const resolvedParams = await searchParams
  const initialUnitId = resolvedParams?.unitId || null
  const initialTab = resolvedParams?.tab || null

  const [units, categories, masterRecords, slotsWithGuidesRes, slotRules, activePeriod] =
    await Promise.all([
      db.unit.findMany({
        include: {
          category: true,
          evaluations: {
            orderBy: { year: 'desc' },
            select: { id: true, year: true }
          }
        },
        orderBy: { name: 'asc' }
      }),
      db.category.findMany({
        orderBy: { name: 'asc' }
      }),
      db.unitEvidenceMaster.findMany({
        where: {
          NOT: { fileUrl: '' }
        },
        orderBy: { updatedAt: 'desc' }
      }),
      getAllAspectEvidenceSlotsWithGuidesAction(),
      getEvidenceSlotsRulesConfig(),
      db.evaluationPeriod.findFirst({
        where: { isOpen: true },
        orderBy: { year: 'desc' }
      })
    ])

  const complianceOverview = await EvidenceComplianceService.getRegionalComplianceOverview({
    targetYear: activePeriod?.year,
    preloadedUnits: units,
    preloadedMasters: masterRecords
  })

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

  const serializedUnits = units.map((u) => ({
    id: u.id,
    code: u.code,
    name: u.name,
    isActive: u.isActive,
    category: u.category ? { id: u.category.id, name: u.category.name } : null,
    years: u.evaluations.map((e) => e.year),
    evaluationId: u.evaluations[0]?.id || null
  }))

  return (
    <Suspense fallback={<div className="p-8 text-center text-sm text-ink-muted">Memuat Master Bukti Dukung...</div>}>
      <MasterEvidenceClient
        units={serializedUnits}
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        masterRecords={serializedMasters}
        presetSlots={resolvedPresetSlots}
        initialUnitId={initialUnitId}
        initialTab={initialTab}
        slotRules={slotRules}
        complianceOverview={complianceOverview}
      />
    </Suspense>
  )
}
