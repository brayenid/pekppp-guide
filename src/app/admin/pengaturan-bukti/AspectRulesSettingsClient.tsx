// src/app/admin/pengaturan-bukti/AspectRulesSettingsClient.tsx
'use client'

import { useState } from 'react'
import {
  Save,
  RotateCcw,
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Info,
  Layers,
  FileCheck,
  Check,
  Sparkles,
  SlidersHorizontal
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import { AdminTabs } from '../../../components/ui/AdminTabs'
import { Card } from '../../../components/ui/Card'
import {
  PEKPPP_EVIDENCE_SLOTS,
  SlotUploadRule,
  DEFAULT_SLOT_UPLOAD_RULES,
  getDefaultRuleForSlot
} from '../../../core/domain/evidence-slots-preset'
import {
  saveEvidenceSlotsRulesAction,
  resetEvidenceSlotRuleAction
} from '../../../actions/aspect-rules-actions'

const ASPECTS = [
  { code: 'I', badge: 'I', name: 'Kebijakan Pelayanan', indicators: 'Q1 – Q9', count: 6 },
  { code: 'II', badge: 'II', name: 'Profesionalisme SDM', indicators: 'Q10 – Q14', count: 5 },
  { code: 'III', badge: 'III', name: 'Sarana Prasarana', indicators: 'Q15 – Q20', count: 6 },
  { code: 'IV', badge: 'IV', name: 'Sistem Informasi Pelayanan Publik', indicators: 'Q21 – Q24', count: 4 },
  { code: 'V', badge: 'V', name: 'Konsultasi & Pengaduan', indicators: 'Q25 – Q28', count: 4 },
  { code: 'VI', badge: 'VI', name: 'Inovasi Pelayanan Publik', indicators: 'Q29 – Q30', count: 3 },
  { code: 'TAMBAHAN', badge: '+', name: 'Informasi Tambahan', indicators: 'Q31', count: 1 }
]

export function AspectRulesSettingsClient({
  initialRules
}: {
  initialRules: Record<string, SlotUploadRule>
}) {
  const [rules, setRules] = useState<Record<string, SlotUploadRule>>({
    ...DEFAULT_SLOT_UPLOAD_RULES,
    ...initialRules
  })
  const [activeAspect, setActiveAspect] = useState<string>('I')
  const [isSaving, setIsSaving] = useState(false)
  const [isResetAllConfirmOpen, setIsResetAllConfirmOpen] = useState(false)
  const [resetAspectTarget, setResetAspectTarget] = useState<string | null>(null)

  // Ambil daftar slot di bawah aspek aktif
  const currentSlots = PEKPPP_EVIDENCE_SLOTS.filter(
    (s) => s.aspectCode === activeAspect
  )

  const handleSlotRuleChange = (
    slotKey: string,
    field: keyof SlotUploadRule,
    value: any
  ) => {
    setRules((prev) => {
      const currentSlotRule =
        prev[slotKey] || getDefaultRuleForSlot(slotKey)
      const updated = {
        ...currentSlotRule,
        [field]: value
      }
      if (field === 'maxPdfSizeMb') {
        updated.maxFileSizeMb = value
      } else if (field === 'maxImageSizeMb' && updated.allowedDocumentType === 'IMAGE_ONLY') {
        updated.maxFileSizeMb = value
      }
      return {
        ...prev,
        [slotKey]: updated
      }
    })
  }

  // Terapkan aturan seragam ke seluruh slot di aspek yang sedang aktif
  const handleApplyToAllInAspect = (templateRule: SlotUploadRule) => {
    setRules((prev) => {
      const next = { ...prev }
      for (const slot of currentSlots) {
        next[slot.slotKey] = { ...templateRule }
      }
      return next
    })
    toast.info(`Aturan diseragamkan ke ${currentSlots.length} slot di Aspek ${activeAspect}`)
  }

  const handleResetSingleSlot = (slotKey: string) => {
    const defaultRule = getDefaultRuleForSlot(slotKey)
    setRules((prev) => ({
      ...prev,
      [slotKey]: { ...defaultRule }
    }))
    toast.success(`Slot "${slotKey}" dikembalikan ke standar awal PermenPAN-RB`)
  }

  const handleConfirmResetAspect = async () => {
    if (!resetAspectTarget) return
    const targetSlots = PEKPPP_EVIDENCE_SLOTS.filter(
      (s) => s.aspectCode === resetAspectTarget
    )

    setRules((prev) => {
      const next = { ...prev }
      for (const s of targetSlots) {
        next[s.slotKey] = getDefaultRuleForSlot(s.slotKey)
      }
      return next
    })

    setResetAspectTarget(null)
    toast.success(`Seluruh slot di Aspek ${resetAspectTarget} dikembalikan ke standar`)
  }

  const handleConfirmResetAll = async () => {
    setIsResetAllConfirmOpen(false)
    setRules({ ...DEFAULT_SLOT_UPLOAD_RULES })
    try {
      await resetEvidenceSlotRuleAction('ALL')
      toast.success('Seluruh slot bukti dukung berhasil dikembalikan ke standar bawaan!')
    } catch {
      toast.error('Gagal mereset seluruh slot.')
    }
  }

  const handleSaveAll = async () => {
    setIsSaving(true)
    const toastId = toast.loading('Menyimpan pengaturan aturan seluruh slot bukti dukung...')
    try {
      const res = await saveEvidenceSlotsRulesAction(rules)
      if (res.success) {
        toast.success('Pengaturan aturan bukti dukung per slot berhasil disimpan!', {
          id: toastId
        })
      } else {
        toast.error(res.error || 'Gagal menyimpan pengaturan.', { id: toastId })
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan pengaturan.', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  const activeAspectMeta =
    ASPECTS.find((a) => a.code === activeAspect) || ASPECTS[0]

  return (
    <div className="space-y-6">
      {/* Header Halaman */}
      <PageHeader
        icon={<SlidersHorizontal className="w-5 h-5 text-brand" />}
        title="Aturan Unggah Bukti Dukung"
        description="Atur secara spesifik jenis berkas yang diterima (PDF, Foto, atau Hybrid), kuota maksimal file, dan batas ukuran file per slot/indikator bukti dukung."
        speedDialItems={[
          {
            label: isSaving ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan',
            icon: <Save className="w-4 h-4" />,
            onClick: handleSaveAll,
            disabled: isSaving,
            variant: 'brand'
          },
          {
            label: 'Reset Standar Bawaan',
            icon: <RotateCcw className="w-4 h-4" />,
            onClick: () => setIsResetAllConfirmOpen(true),
            variant: 'secondary'
          }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsResetAllConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-stroke/70 bg-surface hover:bg-surface-subtle text-xs font-semibold text-ink-secondary hover:text-ink transition-colors cursor-pointer"
              title="Reset seluruh slot ke standar bawaan">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-hz-button transition-all cursor-pointer disabled:opacity-50">
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Seluruh Pengaturan'}</span>
            </button>
          </div>
        }
      />

      {/* Selector Tabs Aspek */}
      <AdminTabs
        items={ASPECTS.map((aspect) => ({
          id: aspect.code,
          badge: aspect.badge,
          label: aspect.name,
          count: `${aspect.count} Slot`
        }))}
        activeId={activeAspect}
        onChange={setActiveAspect}
      />

      {/* Baris Informasi Aspek & Aksi Batch */}
      <Card padding="sm" className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-brand/10 text-brand border border-brand/20">
              {activeAspectMeta.code === 'TAMBAHAN' ? 'Tambahan' : `Aspek ${activeAspectMeta.code}`}
            </span>
            <h3 className="font-bold text-sm sm:text-base text-ink">
              {activeAspectMeta.name} ({activeAspectMeta.indicators})
            </h3>
            <span className="text-xs text-ink-muted">
              • {currentSlots.length} slot unggahan bukti dukung
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            Tiap slot di bawah ini memiliki fungsi pembuktian yang berbeda. Anda dapat mengatur aturan berkas secara presisi untuk setiap slot.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setResetAspectTarget(activeAspect)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-ink-secondary hover:text-brand hover:bg-brand/10 transition-colors cursor-pointer border border-stroke/50">
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Aspek Ini</span>
          </button>
        </div>
      </Card>

      {/* Daftar Slot Unggahan Bukti Dukung di Aspek Ini */}
      <div className="space-y-3.5">
        {currentSlots.map((slot, index) => {
          const rule: SlotUploadRule =
            rules[slot.slotKey] || getDefaultRuleForSlot(slot.slotKey, slot.documentType)
          const defaultRule = getDefaultRuleForSlot(slot.slotKey, slot.documentType)
          const isModified =
            rule.allowedDocumentType !== defaultRule.allowedDocumentType ||
            rule.maxTotalFiles !== defaultRule.maxTotalFiles ||
            rule.maxPdfSizeMb !== defaultRule.maxPdfSizeMb ||
            rule.maxImageSizeMb !== defaultRule.maxImageSizeMb

          return (
            <Card
              key={slot.slotKey}
              variant={isModified ? 'active' : 'default'}
              className="space-y-4">
              {/* Baris 1: Identitas Slot & Indikator */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-surface-subtle border border-stroke/70 text-ink text-[11px] font-bold flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>
                    <h4 className="font-bold text-sm text-ink">{slot.title}</h4>
                    {slot.indicatorNumbers && slot.indicatorNumbers.length > 0 && (
                      <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-brand/10 text-brand border border-brand/20 text-[10px] font-mono font-bold">
                        {slot.indicatorNumbers.map((n) => `Q${n}`).join(', ')}
                      </span>
                    )}
                    {isModified && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                        Kustom
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed line-clamp-2">
                    {slot.description}
                  </p>
                </div>

                {isModified && (
                  <button
                    type="button"
                    onClick={() => handleResetSingleSlot(slot.slotKey)}
                    className="inline-flex items-center gap-1 text-[11px] text-ink-muted hover:text-brand transition-colors cursor-pointer self-start sm:self-center shrink-0"
                    title="Kembalikan slot ini ke standar PermenPAN-RB">
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset Slot</span>
                  </button>
                )}
              </div>

              {/* Baris 2: Kontrol Pengaturan Spesifik Slot */}
              <div className="pt-3 border-t border-stroke/40 grid grid-cols-1 sm:grid-cols-12 gap-3.5 items-end">
                {/* 1. Format Berkas yang Diterima (Pills Selector) */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="text-[11px] font-semibold text-ink-secondary block">
                    Jenis Berkas:
                  </label>
                  <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-surface-subtle border border-stroke/60 text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        handleSlotRuleChange(slot.slotKey, 'allowedDocumentType', 'PDF_ONLY')
                      }
                      className={`py-1.5 px-1.5 rounded-lg text-center font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        rule.allowedDocumentType === 'PDF_ONLY'
                          ? 'bg-surface text-brand font-bold shadow-2xs border border-brand/30'
                          : 'text-ink-secondary hover:text-ink'
                      }`}>
                      <FileText className="w-3 h-3" />
                      <span className="text-[11px]">PDF</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSlotRuleChange(slot.slotKey, 'allowedDocumentType', 'IMAGE_ONLY')
                      }
                      className={`py-1.5 px-1.5 rounded-lg text-center font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        rule.allowedDocumentType === 'IMAGE_ONLY'
                          ? 'bg-surface text-brand font-bold shadow-2xs border border-brand/30'
                          : 'text-ink-secondary hover:text-ink'
                      }`}>
                      <ImageIcon className="w-3 h-3" />
                      <span className="text-[11px]">Foto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleSlotRuleChange(slot.slotKey, 'allowedDocumentType', 'HYBRID')
                      }
                      className={`py-1.5 px-1.5 rounded-lg text-center font-medium transition-all cursor-pointer flex items-center justify-center gap-1 ${
                        rule.allowedDocumentType === 'HYBRID'
                          ? 'bg-surface text-brand font-bold shadow-2xs border border-brand/30'
                          : 'text-ink-secondary hover:text-ink'
                      }`}>
                      <FileCheck className="w-3 h-3" />
                      <span className="text-[11px]">Hybrid</span>
                    </button>
                  </div>
                </div>

                {/* 2. Maksimal Kuantitas Berkas (Stepper / Number Input) */}
                <div className="sm:col-span-3 space-y-1">
                  <label className="text-[11px] font-semibold text-ink-secondary block">
                    Maks. Kuantitas:
                  </label>
                  <div className="flex items-center rounded-xl border border-stroke/60 bg-surface-subtle overflow-hidden">
                    <button
                      type="button"
                      onClick={() =>
                        handleSlotRuleChange(
                          slot.slotKey,
                          'maxTotalFiles',
                          Math.max(1, rule.maxTotalFiles - 1)
                        )
                      }
                      className="px-2.5 py-1.5 text-ink hover:bg-surface text-xs font-bold transition-colors cursor-pointer">
                      -
                    </button>
                    <div className="flex-1 text-center font-mono font-bold text-xs text-ink">
                      {rule.maxTotalFiles} Berkas
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        handleSlotRuleChange(
                          slot.slotKey,
                          'maxTotalFiles',
                          Math.min(20, rule.maxTotalFiles + 1)
                        )
                      }
                      className="px-2.5 py-1.5 text-ink hover:bg-surface text-xs font-bold transition-colors cursor-pointer">
                      +
                    </button>
                  </div>
                </div>

                {/* 3. Maksimal Ukuran File (Split jika HYBRID, Single jika PDF/Foto) */}
                <div className="sm:col-span-5 space-y-1">
                  {rule.allowedDocumentType === 'HYBRID' ? (
                    <div className="flex items-end gap-2">
                      <div className="flex-1 min-w-0 space-y-1">
                        <label className="text-[10px] font-semibold text-ink-muted block truncate">
                          Maks. PDF:
                        </label>
                        <select
                          value={rule.maxPdfSizeMb ?? 20}
                          onChange={(e) =>
                            handleSlotRuleChange(
                              slot.slotKey,
                              'maxPdfSizeMb',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-mono font-semibold focus:outline-none focus:border-brand cursor-pointer">
                          <option value={5}>5 MB</option>
                          <option value={10}>10 MB</option>
                          <option value={15}>15 MB</option>
                          <option value={20}>20 MB</option>
                          <option value={25}>25 MB</option>
                          <option value={30}>30 MB</option>
                          <option value={50}>50 MB</option>
                        </select>
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <label className="text-[10px] font-semibold text-ink-muted block truncate">
                          Maks. Foto:
                        </label>
                        <select
                          value={rule.maxImageSizeMb ?? 3}
                          onChange={(e) =>
                            handleSlotRuleChange(
                              slot.slotKey,
                              'maxImageSizeMb',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-2 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-mono font-semibold focus:outline-none focus:border-brand cursor-pointer">
                          <option value={1}>1 MB</option>
                          <option value={2}>2 MB</option>
                          <option value={3}>3 MB</option>
                          <option value={5}>5 MB</option>
                          <option value={8}>8 MB</option>
                          <option value={10}>10 MB</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyToAllInAspect(rule)}
                        className="mb-0.5 px-2 py-1.5 rounded-lg border border-stroke/60 bg-surface hover:bg-surface-subtle text-[10.5px] font-medium text-ink-secondary hover:text-ink transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        title="Terapkan aturan ini ke seluruh slot pada aspek ini">
                        Samakan
                      </button>
                    </div>
                  ) : rule.allowedDocumentType === 'PDF_ONLY' ? (
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-semibold text-ink-muted block">
                          Maks. Ukuran PDF:
                        </label>
                        <select
                          value={rule.maxPdfSizeMb ?? 20}
                          onChange={(e) =>
                            handleSlotRuleChange(
                              slot.slotKey,
                              'maxPdfSizeMb',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-mono font-semibold focus:outline-none focus:border-brand cursor-pointer">
                          <option value={5}>5 MB</option>
                          <option value={10}>10 MB</option>
                          <option value={15}>15 MB</option>
                          <option value={20}>20 MB (Standar Dokumen)</option>
                          <option value={25}>25 MB</option>
                          <option value={30}>30 MB</option>
                          <option value={50}>50 MB (Arsip Tebal)</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyToAllInAspect(rule)}
                        className="mb-0.5 px-2 py-1.5 rounded-lg border border-stroke/60 bg-surface hover:bg-surface-subtle text-[10.5px] font-medium text-ink-secondary hover:text-ink transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        title="Terapkan aturan ini ke seluruh slot pada aspek ini">
                        Samakan se-Aspek
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-end gap-2">
                      <div className="flex-1 space-y-1">
                        <label className="text-[10px] font-semibold text-ink-muted block">
                          Maks. Ukuran Foto:
                        </label>
                        <select
                          value={rule.maxImageSizeMb ?? 2}
                          onChange={(e) =>
                            handleSlotRuleChange(
                              slot.slotKey,
                              'maxImageSizeMb',
                              Number(e.target.value)
                            )
                          }
                          className="w-full px-3 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-mono font-semibold focus:outline-none focus:border-brand cursor-pointer">
                          <option value={1}>1 MB (Foto Ringan)</option>
                          <option value={2}>2 MB (Standar Foto)</option>
                          <option value={3}>3 MB (Foto Detail)</option>
                          <option value={5}>5 MB</option>
                          <option value={8}>8 MB</option>
                          <option value={10}>10 MB</option>
                        </select>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleApplyToAllInAspect(rule)}
                        className="mb-0.5 px-2 py-1.5 rounded-lg border border-stroke/60 bg-surface hover:bg-surface-subtle text-[10.5px] font-medium text-ink-secondary hover:text-ink transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        title="Terapkan aturan ini ke seluruh slot pada aspek ini">
                        Samakan se-Aspek
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          )
        })}
      </div>

      {/* Confirmation Modal: Reset Single Aspect */}
      <ConfirmationModal
        isOpen={Boolean(resetAspectTarget)}
        onCancel={() => setResetAspectTarget(null)}
        onConfirm={handleConfirmResetAspect}
        title={`Reset Seluruh Slot Aspek ${resetAspectTarget}?`}
        description={`Seluruh slot bukti dukung di bawah Aspek ${resetAspectTarget} akan dikembalikan ke konfigurasi standar awal PermenPAN-RB.`}
        confirmText="Ya, Kembalikan ke Standar"
        cancelText="Batal"
        variant="warning"
      />

      {/* Confirmation Modal: Reset All */}
      <ConfirmationModal
        isOpen={isResetAllConfirmOpen}
        onCancel={() => setIsResetAllConfirmOpen(false)}
        onConfirm={handleConfirmResetAll}
        title="Reset Seluruh Slot di Semua Aspek?"
        description="Semua slot bukti dukung dari Aspek I sampai VI akan dikembalikan ke nilai standar awal PermenPAN-RB (misal SK SP 4 PDF @20MB, Sarpras ramah rentan 10 foto @3MB, dll.)."
        confirmText="Ya, Reset Seluruh Slot"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  )
}
