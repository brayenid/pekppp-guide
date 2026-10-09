// src/app/admin/pengaturan-ai/AiSettingsClient.tsx
'use client'

import { useState } from 'react'
import {
  Sparkles,
  Save,
  RotateCcw,
  Cpu,
  Coins,
  ShieldCheck,
  AlertTriangle,
  FileText,
  HelpCircle,
  CheckCircle2,
  Sliders,
  Layers,
  FileSearch,
  ExternalLink,
  Zap,
  Info,
  HardDrive
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { ConfirmationModal } from '../../../components/ui/ConfirmationModal'
import {
  AiEvaluatorConfig,
  DEFAULT_ASPECT_CONTEXTS
} from '../../../services/system-setting-service'
import { saveAiSettingsAction, resetAiContextToDefaultAction } from '../../../actions/ai-settings-actions'

interface AiSettingsClientProps {
  initialConfig: AiEvaluatorConfig
  hasApiKey: boolean
}

export function AiSettingsClient({ initialConfig, hasApiKey }: AiSettingsClientProps) {
  const [executionMode, setExecutionMode] = useState(initialConfig.executionMode)
  const [model, setModel] = useState(initialConfig.model)
  const [maxPdfPages, setMaxPdfPages] = useState(initialConfig.maxPdfPages)
  const [maxUploadSizeMb, setMaxUploadSizeMb] = useState(initialConfig.maxUploadSizeMb || 25)
  const [aspectContexts, setAspectContexts] = useState<Record<string, string>>(initialConfig.aspectContexts)
  const [activeTab, setActiveTab] = useState<string>('I')
  const [saving, setSaving] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [isResetAllConfirmOpen, setIsResetAllConfirmOpen] = useState(false)

  const aspectKeys = ['I', 'II', 'III', 'IV', 'V', 'VI']

  const handleContextChange = (key: string, value: string) => {
    setAspectContexts((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await saveAiSettingsAction({
        executionMode,
        model,
        maxPdfPages: Number(maxPdfPages) || 15,
        maxUploadSizeMb: Number(maxUploadSizeMb) || 25,
        aspectContexts
      })

      if (res.success) {
        toast.success('Pengaturan & Konteks AI berhasil disimpan!')
      } else {
        toast.error(res.error || 'Gagal menyimpan pengaturan.')
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan.')
    } finally {
      setSaving(false)
    }
  }

  const handleResetCurrentAspect = async () => {
    setResetting(true)
    try {
      const defaultDirective = DEFAULT_ASPECT_CONTEXTS[activeTab]?.defaultDirective || ''
      setAspectContexts((prev) => ({ ...prev, [activeTab]: defaultDirective }))

      await resetAiContextToDefaultAction(activeTab)
      toast.success(`Konteks Aspek ${activeTab} dikembalikan ke Standar MenPAN-RB!`)
    } catch {
      toast.error('Gagal mereset konteks.')
    } finally {
      setResetting(false)
    }
  }

  const handleConfirmResetAll = async () => {
    setIsResetAllConfirmOpen(false)
    setResetting(true)
    try {
      const allDefaults: Record<string, string> = {}
      for (const [key, item] of Object.entries(DEFAULT_ASPECT_CONTEXTS)) {
        allDefaults[key] = item.defaultDirective
      }
      setAspectContexts(allDefaults)
      await resetAiContextToDefaultAction()
      toast.success('Seluruh konteks 6 Aspek Utama berhasil dikembalikan ke Standar Default!')
    } catch {
      toast.error('Gagal mereset semua konteks.')
    } finally {
      setResetting(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* 1. Header Halaman */}
      <PageHeader
        icon={<Sparkles className="w-5 h-5 text-brand" />}
        title="Pengaturan & Konteks AI"
        description="Konfigurasi model, batas token & berkas, serta direktif acuan analisis 6 Aspek."
        actions={
          <div className="flex items-center gap-2.5">
            {hasApiKey ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> API Key Aktif
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Mode Heuristik
              </Badge>
            )}
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={saving}
              leftIcon={<Save className="w-3.5 h-3.5" />}>
              Simpan Pengaturan
            </Button>
          </div>
        }
      />

      {/* 2. Kartu Tracker Biaya & Pemakaian Token (Compact Bento Grid) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="rounded-bento border border-stroke/50 bg-surface p-4 space-y-1 shadow-soft-card">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Panggilan AI</span>
            <div className="w-6 h-6 rounded-full bg-surface-subtle flex items-center justify-center text-ink-muted">
              <Cpu className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-normal text-ink tracking-tight">
            {initialConfig.usageStats.totalCalls.toLocaleString('id-ID')} <span className="text-xs text-ink-muted font-normal">kali</span>
          </div>
          <p className="text-[11px] text-ink-muted">Akumulasi audit dokumen</p>
        </div>

        <div className="rounded-bento border border-stroke/50 bg-surface p-4 space-y-1 shadow-soft-card">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Token Terpakai (Riil)</span>
            <div className="w-6 h-6 rounded-full bg-surface-subtle flex items-center justify-center text-ink-muted">
              <Layers className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-normal text-ink tracking-tight">
            {initialConfig.usageStats.totalTokens.toLocaleString('id-ID')} <span className="text-xs text-ink-muted font-normal">token</span>
          </div>
          <p className="text-[11px] text-ink-muted">
            {initialConfig.usageStats.promptTokens ? (
              <span>Input: {initialConfig.usageStats.promptTokens.toLocaleString('id-ID')} | Output: {(initialConfig.usageStats.candidatesTokens || 0).toLocaleString('id-ID')}</span>
            ) : (
              'Google AI Studio usageMetadata'
            )}
          </p>
        </div>

        <div className="rounded-bento border border-stroke/50 bg-surface p-4 space-y-1 shadow-soft-card">
          <div className="flex items-center justify-between text-xs font-medium text-ink-muted">
            <span>Estimasi Biaya</span>
            <div className="w-6 h-6 rounded-full bg-surface-subtle flex items-center justify-center text-ink-muted">
              <Coins className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="text-2xl font-normal text-ink tracking-tight">
            Rp {initialConfig.usageStats.estimatedCostIdr.toLocaleString('id-ID')}
          </div>
          <p className="text-[11px] text-pastel-green-text font-medium">Berdasarkan tarif Google Cloud</p>
        </div>
      </div>

      {/* 3. Panel Parameter Model & Mode Efisiensi Biaya (Compact) */}
      <div className="rounded-bento border border-stroke/50 bg-surface p-5 space-y-4 shadow-soft-card">
        <div className="flex items-center justify-between border-b border-stroke/40 pb-2.5">
          <h2 className="text-xs font-medium text-ink flex items-center gap-2">
            <Sliders className="w-3.5 h-3.5 text-ink-muted" />
            Parameter Biaya &amp; Model AI
          </h2>
          <span className="text-[11px] text-ink-muted hidden sm:inline">
            Atur keseimbangan kecepatan, kuota token, dan ketelitian
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Mode Eksekusi */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-secondary">
              Mode Eksekusi
            </label>
            <select
              value={executionMode}
              onChange={(e) => setExecutionMode(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-normal focus:outline-none focus:border-brand shadow-2xs cursor-pointer">
              <option value="BATCH">Mode Hemat / Batch (Disarankan)</option>
              <option value="INSTANT">Mode Instan</option>
              <option value="HEURISTIC_ONLY">Mode Heuristik (Rp 0)</option>
            </select>
            <p className="text-[11px] text-ink-muted leading-snug">
              {executionMode === 'BATCH'
                ? 'Hemat token: dipicu saat berkas siap atau tombol audit diklik.'
                : executionMode === 'INSTANT'
                  ? 'Realtime: diproses instan saat berkas diunggah.'
                  : 'Aturan heuristik lokal tanpa API Gemini.'}
            </p>
          </div>

          {/* Model AI Selection */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-secondary">
              Model Reasoning
            </label>
            <select
              value={model}
              onChange={(e) => setModel(e.target.value as any)}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-normal focus:outline-none focus:border-brand shadow-2xs cursor-pointer">
              <option value="gemini-3.6-flash">Gemini 3.6 Flash (Cepat &amp; Akurat)</option>
              <option value="gemini-flash-latest">Gemini Flash Latest (Stabil)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Paling Ringan)</option>
            </select>
            <p className="text-[11px] text-ink-muted leading-snug">
              Direkomendasikan untuk audit multimodal PDF &amp; foto.
            </p>
          </div>

          {/* Max PDF Pages */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-secondary">
              Maks. Hal PDF
            </label>
            <input
              type="number"
              min={5}
              max={50}
              value={maxPdfPages}
              onChange={(e) => setMaxPdfPages(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs"
            />
            <p className="text-[11px] text-ink-muted leading-snug">
              Maks. {maxPdfPages} hal awal dokumen agar hemat kuota token.
            </p>
          </div>

          {/* Max Upload Size MB */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-secondary">
              Batas Ukuran (MB)
            </label>
            <input
              type="number"
              min={5}
              max={100}
              value={maxUploadSizeMb}
              onChange={(e) => setMaxUploadSizeMb(Number(e.target.value))}
              className="w-full px-3 py-1.5 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs"
            />
            <p className="text-[11px] text-ink-muted leading-snug">
              Batas {maxUploadSizeMb} MB untuk mencegah error timeout jaringan.
            </p>
          </div>
        </div>
      </div>

      {/* 4. Tab Pengaturan Konteks Standar Emas per Aspek (6 Aspek Utama) */}
      <div className="rounded-bento border border-stroke/50 bg-surface overflow-hidden shadow-2xs">
        <div className="p-4 sm:p-5 border-b border-stroke/50 bg-surface-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xs font-semibold text-ink uppercase tracking-wider flex items-center gap-2">
              <FileSearch className="w-4 h-4 text-ink-muted" />
              Konteks Standar Emas per Aspek
            </h2>
            <p className="text-[11px] text-ink-muted mt-0.5">
              Instruksi pedoman khusus verifikasi bukti dukung Aspek I s/d VI oleh AI.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={resetting}
              onClick={handleResetCurrentAspect}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-pill border border-stroke/60 bg-surface hover:bg-surface-subtle text-xs font-medium text-ink-secondary transition-all cursor-pointer shadow-2xs">
              <RotateCcw className="w-3.5 h-3.5 text-ink-muted" />
              <span>Reset Aspek Ini</span>
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={() => setIsResetAllConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-pill border border-stroke/60 bg-surface hover:bg-surface-subtle text-xs font-medium text-rose-600 transition-all cursor-pointer shadow-2xs">
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>Reset Semua (6 Aspek)</span>
            </button>
          </div>
        </div>

        {/* Aspect Tab Switcher */}
        <div className="flex items-center gap-1.5 p-2.5 bg-surface-subtle/50 border-b border-stroke/50 overflow-x-auto">
          {aspectKeys.map((key) => {
            const label = `Aspek ${key}`
            const isActive = activeTab === key

            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                className={`px-3 py-1.5 rounded-pill text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-brand text-white shadow-hz-button font-semibold'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-subtle'
                }`}>
                {label}
              </button>
            )
          })}
        </div>

        {/* Tab Body Content */}
        <div className="p-4 sm:p-5 space-y-3.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <div className="font-semibold text-sm text-ink">
                {DEFAULT_ASPECT_CONTEXTS[activeTab]?.title}
              </div>
              <p className="text-xs text-ink-muted">
                Kriteria wajib pemenuhan berkas lokus untuk aspek ini.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-1">
              {DEFAULT_ASPECT_CONTEXTS[activeTab]?.benchmarkKeywords.map((kw, i) => (
                <span
                  key={i}
                  className="text-[10px] px-2 py-0.5 rounded-pill bg-surface-subtle border border-stroke/50 text-ink-muted">
                  #{kw}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-secondary flex items-center justify-between">
              <span>Instruksi Pedoman Standar Emas &amp; Aturan Khusus Daerah:</span>
              <span className="text-[11px] text-ink-muted">
                (Dapat disesuaikan dengan regulasi lokal)
              </span>
            </label>
            <textarea
              rows={10}
              value={aspectContexts[activeTab] || ''}
              onChange={(e) => handleContextChange(activeTab, e.target.value)}
              placeholder={`Tuliskan instruksi kriteria standar emas untuk ${DEFAULT_ASPECT_CONTEXTS[activeTab]?.title}...`}
              className="w-full p-3 text-xs rounded-xl border border-stroke/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-brand shadow-2xs resize-y font-mono leading-relaxed"
            />
          </div>

          {/* Info Box */}
          <div className="p-3 rounded-xl bg-surface-subtle border border-stroke/40 flex items-start gap-2.5 text-xs text-ink-secondary">
            <Info className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
            <p className="leading-snug">
              <strong className="text-ink font-medium">Tips Konteks Daerah:</strong> Anda dapat menambahkan aturan spesifik instansi. Contoh: seragam batik hari Kamis atau penamaan surat dinas khas daerah agar AI memverifikasinya sebagai berkas yang sah.
            </p>
          </div>
        </div>
      </div>

      {/* 5. Sticky Bottom Action Bar */}
      <div className="p-3 sm:p-4 rounded-bento border border-stroke/50 bg-surface flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
        <div className="text-xs text-ink-muted flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-ink-muted" />
          <span>Pengaturan tersimpan langsung ke database secara instan.</span>
        </div>

        <Button
          type="submit"
          variant="brand"
          size="sm"
          isLoading={saving}
          leftIcon={<Save className="w-3.5 h-3.5" />}>
          Simpan Semua Pengaturan
        </Button>
      </div>

      {/* Modal Konfirmasi Reset Semua Konteks AI */}
      <ConfirmationModal
        isOpen={isResetAllConfirmOpen}
        title="Reset Konteks AI"
        description="Kembalikan seluruh teks konteks 6 Aspek Utama ke Standar Emas default KemenPAN-RB? Perubahan yang belum disimpan akan digantikan."
        confirmText="Ya, Reset Semua"
        cancelText="Batal"
        variant="warning"
        loading={resetting}
        onCancel={() => setIsResetAllConfirmOpen(false)}
        onConfirm={handleConfirmResetAll}
      />
    </form>
  )
}
