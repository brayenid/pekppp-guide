'use client'

import { useState } from 'react'
import { saveMenpanApiConfigAction, testMenpanConnectionAction } from '../../../actions/menpan-actions'
import { MenpanApiConfig } from '../../../services/system-setting-service'
import { ShieldCheck, Server, Key, Lock, Globe, Save, RefreshCw, AlertTriangle, CheckCircle2, Info, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Card } from '../../../components/ui/Card'

export function ApiSettingsClient({ initialConfig }: { initialConfig: MenpanApiConfig }) {
  const [baseUrl, setBaseUrl] = useState(initialConfig.baseUrl)
  const [clientId, setClientId] = useState(initialConfig.clientId)
  const [clientSecret, setClientSecret] = useState(initialConfig.clientSecret)
  const [apiKey, setApiKey] = useState(initialConfig.apiKey)

  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    isConfigured: boolean
    user?: {
      id: number
      name: string
      email: string
      roles: string[]
      government_instance_id: number | null
    }
  } | null>(null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setTestResult(null)
    try {
      await saveMenpanApiConfigAction({
        baseUrl: baseUrl.trim(),
        clientId: clientId.trim(),
        clientSecret: clientSecret.trim(),
        apiKey: apiKey.trim()
      })
      toast.success('Pengaturan API MenPAN-RB berhasil disimpan!')
    } catch {
      toast.error('Gagal menyimpan pengaturan API.')
    } finally {
      setSaving(false)
    }
  }

  const handleTestConnection = async () => {
    setTesting(true)
    setTestResult(null)
    try {
      const res = await testMenpanConnectionAction()
      setTestResult(res)
      if (res.success) {
        toast.success('Terhubung ke API MenPAN-RB!')
      } else {
        toast.warning(res.message)
      }
    } catch {
      toast.error('Gagal melakukan uji koneksi.')
    } finally {
      setTesting(false)
    }
  }

  const isConfigured = Boolean(apiKey.trim())

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        icon={<ShieldCheck className="w-5 h-5 text-brand" />}
        title="Pengaturan API MenPAN-RB"
        description="Konfigurasi endpoint dan kredensial akses resmi untuk sinkronisasi evaluasi ke portal nasional."
        actions={
          <div className="flex items-center gap-2.5">
            {isConfigured ? (
              <Badge variant="success" size="sm">
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Terintegrasi
              </Badge>
            ) : (
              <Badge variant="warning" size="sm">
                <AlertTriangle className="w-3.5 h-3.5 mr-1" /> Belum Dikonfigurasi
              </Badge>
            )}
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleTestConnection}
              disabled={testing}
              isLoading={testing}
              leftIcon={<RefreshCw className="w-3.5 h-3.5 text-ink-muted" />}>
              {testing ? 'Menguji...' : 'Uji Koneksi'}
            </Button>
            <Button
              type="submit"
              form="api-settings-form"
              variant="brand"
              size="sm"
              disabled={saving}
              isLoading={saving}
              leftIcon={<Save className="w-3.5 h-3.5" />}>
              Simpan Pengaturan
            </Button>
          </div>
        }
      />

      {/* Sandbox Notice Info Box */}
      <div className="p-3.5 rounded-xl bg-surface-subtle border border-stroke/40 flex items-start gap-2.5 text-xs text-ink-secondary">
        <Info className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-ink font-medium">Catatan Keamanan &amp; Sandbox:</strong> Jika kredensial dibiarkan kosong, pengiriman evaluasi berjalan dalam <span className="font-semibold text-ink">Mode Simulasi (Sandbox)</span>. Seluruh data lokal tetap aman.
        </p>
      </div>

      {/* API Credentials Form */}
      <form id="api-settings-form" onSubmit={handleSave} className="rounded-bento border border-stroke/50 bg-surface p-5 space-y-4 shadow-2xs">
        <h2 className="text-xs font-semibold text-ink uppercase tracking-wider border-b border-stroke/40 pb-3 flex items-center gap-2">
          <Server className="w-4 h-4 text-ink-muted" />
          Parameter Endpoint API
        </h2>

        <div className="grid grid-cols-1 gap-4">
          {/* Base URL */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink-secondary flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-ink-muted" />
              Base URL Endpoint API
            </label>
            <input
              type="url"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://evaluasi.menpan.go.id/api/v1"
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-mono focus:outline-none focus:border-brand shadow-2xs"
            />
            <p className="text-[11px] text-ink-muted">
              Default OpenAPI MenPAN: <code className="bg-surface-subtle px-1.5 py-0.5 rounded border border-stroke/40 text-ink font-mono">https://evaluasi.menpan.go.id/api/v1</code>
            </p>
          </div>

          {/* Bearer Token (Utama) */}
          <div className="space-y-1">
            <label className="block text-xs font-medium text-ink flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-brand" />
              <span>Bearer Access Token (Wajib)</span>
            </label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Masukkan Personal Access Token (Sanctum) yang diterbitkan oleh Admin PEKPPP"
              className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-mono focus:outline-none focus:border-brand shadow-2xs"
            />
            <p className="text-[11px] text-ink-muted leading-relaxed">
              Token ini langsung diotentikasi ke endpoint <code className="font-mono text-ink bg-surface-subtle px-1 py-0.5 rounded border border-stroke/40">GET /user</code> untuk mendapatkan identitas akun dan <code className="font-mono text-ink">government_instance_id</code> instansi Anda.
            </p>
          </div>

          {/* Client ID & Client Secret (Opsional) */}
          <div className="pt-2 border-t border-stroke/30">
            <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block mb-2">
              Parameter Tambahan (Opsional)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink-secondary">
                  Label Identitas Instansi / Pemkab
                </label>
                <input
                  type="text"
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  placeholder="Misal: Pemkab Kutai Barat"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-mono focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-medium text-ink-secondary">
                  Catatan Kredensial / Secret
                </label>
                <input
                  type="password"
                  value={clientSecret}
                  onChange={(e) => setClientSecret(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink font-mono focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>
            </div>
          </div>
        </div>

      </form>

      {/* Connection Test Result Card */}
      {testResult && (
        <div
          className={`p-4 rounded-2xl border space-y-2.5 text-xs transition-all ${
            testResult.success
              ? 'bg-pastel-green/40 border-pastel-green-border text-ink'
              : testResult.isConfigured
                ? 'bg-pastel-rose/40 border-pastel-rose-border text-pastel-rose-text'
                : 'bg-pastel-amber/40 border-pastel-amber-border text-pastel-amber-text'
          }`}>
          <div className="flex items-center gap-2 font-semibold text-xs text-ink">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
            )}
            <span>Hasil Uji Koneksi API MenPAN-RB</span>
          </div>
          <p className="leading-relaxed pl-6 text-ink-secondary">{testResult.message}</p>

          {/* Profil Akun MenPAN jika sukses */}
          {testResult.success && testResult.user && (
            <div className="ml-6 p-3 rounded-xl bg-surface border border-stroke/40 space-y-1.5 shadow-2xs">
              <span className="text-[10px] uppercase tracking-wider font-semibold text-ink-muted block">
                Detail Akun Pemilik Token:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-ink-muted text-[11px] block">Nama / Unit:</span>
                  <span className="font-semibold text-ink">{testResult.user.name || '-'}</span>
                </div>
                <div>
                  <span className="text-ink-muted text-[11px] block">Email:</span>
                  <span className="font-mono text-ink">{testResult.user.email || '-'}</span>
                </div>
                <div>
                  <span className="text-ink-muted text-[11px] block">ID Instansi Pemerintah:</span>
                  <span className="font-mono font-semibold text-brand">
                    {testResult.user.government_instance_id ?? 'Semua Instansi (Super Admin)'}
                  </span>
                </div>
                <div>
                  <span className="text-ink-muted text-[11px] block">Role Sistem:</span>
                  <span className="font-medium text-ink">
                    {testResult.user.roles?.join(', ') || 'user'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Back Button */}
      <div className="pt-1">
        <Link
          href="/admin/lokus"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors">
          <ArrowLeft className="w-3.5 h-3.5 text-ink-muted" /> Kembali ke Manajemen Lokus
        </Link>
      </div>
    </div>
  )
}
