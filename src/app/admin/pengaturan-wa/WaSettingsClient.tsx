'use client'

import { useState } from 'react'
import { saveFonnteSettingsAction, testFonnteConnectionAction } from '../../../actions/whatsapp-actions'
import { FonnteWaConfig } from '../../../services/system-setting-service'
import { MessageSquare, Save, RefreshCw, Key, Phone, CheckCircle2, AlertCircle, Info, ExternalLink, ShieldCheck, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'

export function WaSettingsClient({ initialConfig }: { initialConfig: FonnteWaConfig }) {
  const [enabled, setEnabled] = useState(initialConfig.enabled)
  const [apiToken, setApiToken] = useState(initialConfig.apiToken)
  const [adminPhone, setAdminPhone] = useState(initialConfig.adminPhone)
  const [countryCode, setCountryCode] = useState(initialConfig.countryCode || '62')

  const [showToken, setShowToken] = useState(false)
  const [saving, setSaving] = useState(false)

  // Testing State
  const [testPhone, setTestPhone] = useState(initialConfig.adminPhone || '')
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTestResult(null)
    try {
      await saveFonnteSettingsAction({
        enabled,
        apiToken: apiToken.trim(),
        adminPhone: adminPhone.trim(),
        countryCode: countryCode.trim()
      })
      toast.success('Pengaturan WhatsApp Gateway berhasil disimpan!')
    } catch {
      toast.error('Gagal menyimpan pengaturan WhatsApp.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    if (!testPhone.trim()) {
      toast.error('Masukkan nomor WhatsApp tujuan untuk uji kirim pesan.')
      return
    }

    setTesting(true)
    setTestResult(null)
    try {
      const res = await testFonnteConnectionAction(testPhone.trim())
      setTestResult(res)
      if (res.success) {
        toast.success(res.message)
      } else {
        toast.error(res.message)
      }
    } catch {
      toast.error('Terjadi kesalahan saat menguji koneksi.')
    } finally {
      setTesting(false)
    }
  }

  const isConfigured = Boolean(apiToken && apiToken.trim().length > 5)

  return (
    <div className="space-y-5 w-full">
      <PageHeader
        icon={<MessageSquare className="w-5 h-5 text-brand" />}
        title="Pengaturan WhatsApp"
        description="Integrasi bot Fonnte untuk notifikasi aktivitas penilaian."
        actions={
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${enabled ? 'bg-emerald-500' : 'bg-slate-300'}`} />
            <span className="text-xs font-medium text-slate-700">
              {enabled ? 'Bot Aktif' : 'Nonaktif'}
            </span>
          </div>
        }
      />

      <Card className="p-5 border-slate-200 space-y-5">
        <form onSubmit={handleSave} className="space-y-4">
          {/* Status & Master Toggle */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <div className="text-xs font-semibold text-slate-800">Status Integrasi</div>
              <div className="text-[11px] text-slate-500">Aktifkan untuk mulai mengirim notifikasi via WhatsApp</div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={enabled}
                onChange={(e) => setEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#1D5BB9]"></div>
            </label>
          </div>

          {/* API Token Input */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-700">
                Token Fonnte
              </label>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-[11px] text-[#1D5BB9] hover:underline flex items-center gap-1 cursor-pointer">
                {showToken ? <><EyeOff className="w-3 h-3" /> Sembunyikan</> : <><Eye className="w-3 h-3" /> Tampilkan</>}
              </button>
            </div>
            <input
              type={showToken ? 'text' : 'password'}
              value={apiToken}
              onChange={(e) => setApiToken(e.target.value)}
              placeholder="Masukkan API Token perangkat dari fonnte.com"
              className="w-full px-3.5 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#1D5BB9] text-slate-800 placeholder:text-slate-400"
            />
          </div>

          {/* Admin Target Number or Group ID */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-700">
              Nomor / ID Grup Tujuan Notifikasi
            </label>
            <input
              type="text"
              value={adminPhone}
              onChange={(e) => {
                setAdminPhone(e.target.value)
                if (!testPhone) setTestPhone(e.target.value)
              }}
              placeholder="Contoh: 08123456789 atau 120363xxxx@g.us"
              className="w-full px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#1D5BB9] text-slate-800 placeholder:text-slate-400 font-mono"
            />
          </div>

          <div className="pt-2 flex justify-end">
            <Button
              type="submit"
              variant="brand"
              size="sm"
              disabled={saving}
              isLoading={saving}
              leftIcon={<Save className="w-3.5 h-3.5" />}>
              Simpan Pengaturan
            </Button>
          </div>
        </form>
      </Card>

      {/* Uji Kirim Singkat */}
      <Card className="p-5 border-slate-200 space-y-3">
        <div className="text-xs font-semibold text-slate-800">Uji Kirim Pesan</div>
        <div className="flex flex-col sm:flex-row items-center gap-2">
          <input
            type="text"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="Nomor HP atau ID Grup tes..."
            className="w-full sm:flex-1 px-3.5 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:border-[#1D5BB9] text-slate-800 placeholder:text-slate-400 font-mono"
          />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleTestConnection}
            disabled={testing || !apiToken}
            isLoading={testing}
            leftIcon={<MessageSquare className="w-3.5 h-3.5 text-ink-muted" />}
            className="w-full sm:w-auto shrink-0">
            Tes Kirim
          </Button>
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-lg border text-xs flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="text-[11px]">{testResult.message}</span>
          </div>
        )}
      </Card>

      {/* Ringkasan Petunjuk & Skema (Compact Callout) */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2.5">
        <div className="flex items-center gap-2 font-medium text-slate-800">
          <Info className="w-4 h-4 text-[#1D5BB9] shrink-0" />
          <span>Panduan Cepat &amp; Skema Bot</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[11px] leading-relaxed pt-1 border-t border-slate-200/80">
          <div>
            <div className="font-semibold text-slate-700 mb-1">Cara Koneksi:</div>
            <p>1. Daftar di <a href="https://fonnte.com" target="_blank" rel="noopener noreferrer" className="text-[#1D5BB9] underline">fonnte.com</a> &amp; scan QR bot.</p>
            <p>2. Salin <strong>API Token</strong> perangkat ke form di atas.</p>
            <p>3. Jika dimasukkan ke <strong>Grup WA</strong>, masukkan <em>Group ID</em> (akhiran <code className="font-mono bg-slate-200/60 px-1 py-0.5 rounded">@g.us</code>).</p>
          </div>

          <div>
            <div className="font-semibold text-slate-700 mb-1">Notifikasi Otomatis Terkirim Saat:</div>
            <p>• <strong>Penilaian F-02</strong> selesai disimpan oleh Evaluator.</p>
            <p>• <strong>Revisi Pasca Nilai</strong> dilakukan oleh OPD.</p>
            <p>• <strong>Komentar / Klarifikasi</strong> baru dikirim pada indikator.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
