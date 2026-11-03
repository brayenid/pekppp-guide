// src/app/opd/master-bukti/OpdMasterBuktiClient.tsx
'use client'

import { useState, useEffect } from 'react'
import { AlertCircle } from 'lucide-react'
import {
  MasterEvidenceWorkspace,
  MasterRecordItem
} from '../../../components/features/MasterEvidenceWorkspace'
import type { EvidenceSlotPreset, SlotUploadRule } from '../../../core/domain/evidence-slots-preset'
import type { UnitComplianceProfile } from '../../../services/evidence-compliance-service'

export function OpdMasterBuktiClient({
  activeUnit,
  initialRecords,
  presetSlots,
  uploaderName,
  slotRules,
  complianceProfile
}: {
  activeUnit: {
    id: string
    code: string | null
    name: string
    categoryName: string
    evaluationId?: string | null
  } | null
  initialRecords: MasterRecordItem[]
  presetSlots: EvidenceSlotPreset[]
  uploaderName: string
  slotRules?: Record<string, SlotUploadRule>
  complianceProfile?: UnitComplianceProfile | null
}) {
  const [records, setRecords] = useState<MasterRecordItem[]>(initialRecords)

  useEffect(() => {
    setRecords(initialRecords)
  }, [initialRecords, activeUnit?.id])

  if (!activeUnit) {
    return (
      <div className="rounded-xl border border-stroke/50 bg-surface p-8 text-center space-y-2 shadow-2xs">
        <AlertCircle className="w-7 h-7 text-ink-muted mx-auto" />
        <h3 className="text-sm font-semibold text-ink">Belum Ada Lokus Tertaut</h3>
        <p className="text-xs text-ink-muted">
          Akun Anda belum ditautkan ke unit lokus pelayanan publik mana pun.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <MasterEvidenceWorkspace
        key={activeUnit.id}
        unit={{
          id: activeUnit.id,
          code: activeUnit.code,
          name: activeUnit.name,
          categoryName: activeUnit.categoryName,
          evaluationId: activeUnit.evaluationId
        }}
        initialRecords={records}
        presetSlots={presetSlots}
        uploaderName={uploaderName}
        slotRules={slotRules}
        complianceProfile={complianceProfile}
        onRecordsUpdated={(_uid, nextRecords) => setRecords(nextRecords)}
      />
    </div>
  )
}
