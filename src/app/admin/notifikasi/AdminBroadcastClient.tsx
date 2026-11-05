'use client'

import { useState } from 'react'
import {
  Bell,
  Send,
  Sparkles,
  Smartphone,
  ShieldCheck,
  Users,
  Building,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Laptop,
  CheckCheck
} from 'lucide-react'
import { toast } from 'sonner'
import {
  sendBroadcastNotificationAction,
  sendSelfTestPushAction,
  BroadcastNotificationInput
} from '../../../actions/push-actions'
import { PageHeader } from '../../../components/ui/PageHeader'
import { Button } from '../../../components/ui/Button'

interface UnitOption {
  id: string
  name: string
  code: string | null
}

interface AdminBroadcastClientProps {
  units: UnitOption[]
  stats: {
    total: number
    adminCount: number
    opdCount: number
    guestCount: number
  }
}

export function AdminBroadcastClient({ units, stats }: AdminBroadcastClientProps) {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [targetType, setTargetType] = useState<'ALL' | 'SUPER_ADMIN' | 'OPD' | 'UNIT'>('ALL')
  const [selectedUnitId, setSelectedUnitId] = useState<string>('')
  const [notifType, setNotifType] = useState<string>('PENGUMUMAN')
  const [link, setLink] = useState<string>('/notifikasi')

  const [isSending, setIsSending] = useState(false)
  const [isTestingSelf, setIsTestingSelf] = useState(false)
  const [lastResult, setLastResult] = useState<{
    success: boolean
    message: string
    timestamp: string
    stats?: any
  } | null>(null)

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !message.trim()) {
      toast.error('Judul dan konten notifikasi wajib diisi!')
      return
    }

    if (targetType === 'UNIT' && !selectedUnitId) {
      toast.error('Silakan pilih Unit Lokus tujuan!')
      return
    }

    setIsSending(true)
    try {
      const payload: BroadcastNotificationInput = {
        title: title.trim(),
        message: message.trim(),
        targetType,
        unitId: targetType === 'UNIT' ? selectedUnitId : null,
        type: notifType,
        link: link.trim() || '/notifikasi'
      }

      const res = await sendBroadcastNotificationAction(payload)

      if (res.success) {
        toast.success(
          `Notifikasi berhasil dikirim! (${res.successCount} perangkat terkirim via Web Push & tersimpan di pusat notifikasi)`
        )
        setLastResult({
          success: true,
          message: `Berhasil dikirim ke ${res.successCount} perangkat push dan dicatat pada riwayat notifikasi in-app.`,
          timestamp: new Date().toLocaleTimeString('id-ID'),
          stats: res
        })
        // Reset form
        setTitle('')
        setMessage('')
      } else {
        toast.error(res.error || 'Gagal mengirim notifikasi')
        setLastResult({
          success: false,
          message: res.error || 'Terjadi kesalahan saat memproses pengiriman notifikasi.',
          timestamp: new Date().toLocaleTimeString('id-ID')
        })
      }
    } catch (err: any) {
      toast.error('Terjadi kesalahan jaringan/server.')
    } finally {
      setIsSending(false)
    }
  }

  const handleSelfTest = async () => {
    setIsTestingSelf(true)
    try {
      const res = await sendSelfTestPushAction()
      if (res.success) {
        toast.success(`Uji coba push terkirim ke ${res.count} perangkat aktif akun Anda!`)
      } else {
        toast.error(res.error || 'Gagal mengirim push uji coba.')
      }
    } catch {
      toast.error('Gagal memproses uji coba push.')
    } finally {
      setIsTestingSelf(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <PageHeader
        icon={<Bell className="w-5 h-5 text-brand" />}
        title="Pusat Notifikasi & Web Push PWA"
        description="Kirim notifikasi instan langsung ke perangkat pengguna (OS Push Notification) dan sinkronkan dengan Pusat Notifikasi sistem."
        actions={
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleSelfTest}
            disabled={isTestingSelf}
            isLoading={isTestingSelf}
            leftIcon={<Sparkles className="w-4 h-4 text-brand" />}>
            Tes Push ke Perangkat Saya
          </Button>
        }
      />

      {/* Grid Status Langganan Perangkat */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4.5 rounded-2xl bg-surface border border-stroke/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Total Perangkat Aktif</span>
            <Smartphone className="w-4 h-4 text-brand" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight">
            {stats.total}
          </div>
          <p className="text-[11px] text-ink-muted">Perangkat browser terdaftar Web Push</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-surface border border-stroke/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Super Admin</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight">
            {stats.adminCount}
          </div>
          <p className="text-[11px] text-ink-muted">Perangkat aktif evaluator/admin</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-surface border border-stroke/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Operator OPD</span>
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight">
            {stats.opdCount}
          </div>
          <p className="text-[11px] text-ink-muted">Perangkat pengguna lokus pelayanan</p>
        </div>

        <div className="p-4.5 rounded-2xl bg-surface border border-stroke/50 shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-ink-muted">
            <span className="text-xs font-medium">Publik / Tamu</span>
            <Laptop className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold font-mono text-ink tracking-tight">
            {stats.guestCount}
          </div>
          <p className="text-[11px] text-ink-muted">Perangkat publik yang berlangganan</p>
        </div>
      </div>

      {/* Main Split Layout: Form Broadcast & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Input (7 cols) */}
        <div className="lg:col-span-7 bg-surface rounded-2xl border border-stroke/50 shadow-2xs p-5 sm:p-6 space-y-5">
          <div>
            <h3 className="font-semibold text-sm sm:text-base text-ink">Formulir Broadcast Notifikasi</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              Notifikasi ini akan dikirimkan secara serentak ke Push Notification browser/ponsel penerima dan tercatat di bel aplikasi.
            </p>
          </div>

          <form onSubmit={handleSendBroadcast} className="space-y-4.5">
            {/* Target Penerima */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-brand" />
                <span>Target Penerima</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ALL', label: 'Semua Pengguna' },
                  { id: 'SUPER_ADMIN', label: 'Super Admin' },
                  { id: 'OPD', label: 'Semua OPD' },
                  { id: 'UNIT', label: 'Lokus Spesifik' }
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTargetType(t.id as any)}
                    className={`py-2 px-2.5 rounded-xl text-xs font-medium border text-center transition-all cursor-pointer ${
                      targetType === t.id
                        ? 'bg-brand text-white border-brand shadow-hz-button font-semibold'
                        : 'bg-surface border-stroke/60 text-ink-secondary hover:text-ink hover:bg-surface-subtle'
                    }`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dropdown Lokus jika Target == UNIT */}
            {targetType === 'UNIT' && (
              <div className="space-y-1.5 animate-fade-in-content">
                <label className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Building className="w-3.5 h-3.5 text-brand" />
                  <span>Pilih Unit Pelayanan (Lokus)</span>
                </label>
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs">
                  <option value="">-- Pilih Lokus Unit --</option>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} {u.code ? `(${u.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Jenis Notifikasi & Tautan */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Kategori Badge</label>
                <select
                  value={notifType}
                  onChange={(e) => setNotifType(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs">
                  <option value="PENGUMUMAN">📢 Pengumuman Resmi</option>
                  <option value="REMINDER">⏰ Pengingat Batas Waktu</option>
                  <option value="F01_UPDATE">📝 Pembaruan Formulir F01</option>
                  <option value="F02_UPDATE">⭐ Penilaian Evaluator (F02)</option>
                  <option value="PROOF_TRIGGER">📁 Berkas Bukti Dukung</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink">Tautan Aksi (URL saat diklik)</label>
                <input
                  type="text"
                  value={link}
                  onChange={(e) => setLink(e.target.value)}
                  placeholder="/notifikasi atau /evaluasi/..."
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs"
                />
              </div>
            </div>

            {/* Judul Notifikasi */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-ink">
                Judul Notifikasi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Batas Akhir Unggah Bukti Dukung 2026"
                maxLength={100}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs"
              />
            </div>

            {/* Konten Notifikasi */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-ink">
                  Konten Pesan Notifikasi <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-ink-muted">{message.length}/250 karakter</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Tuliskan isi pesan notifikasi yang jelas dan padat..."
                rows={3}
                maxLength={250}
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand shadow-2xs resize-none"
              />
            </div>

            {/* Tombol Kirim */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-ink-muted">
                Push akan otomatis diteruskan ke Service Worker perangkat.
              </span>
              <Button
                type="submit"
                variant="primary"
                size="md"
                disabled={isSending}
                isLoading={isSending}
                leftIcon={<Send className="w-4 h-4" />}>
                Kirim Notifikasi & Push
              </Button>
            </div>
          </form>

          {/* Feedback Hasil Terakhir */}
          {lastResult && (
            <div
              className={`p-3.5 rounded-xl border flex items-start gap-3 animate-fade-in-content ${
                lastResult.success
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-red-50/70 border-red-200 text-red-900'
              }`}>
              {lastResult.success ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              )}
              <div className="space-y-0.5 flex-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {lastResult.success ? 'Pengiriman Berhasil' : 'Pengiriman Gagal'}
                  </span>
                  <span className="text-[10px] opacity-75">{lastResult.timestamp}</span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">{lastResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Live Simulator (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          {/* Card OS Push Banner Mockup */}
          <div className="bg-surface rounded-2xl border border-stroke/50 shadow-2xs p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <Laptop className="w-3.5 h-3.5 text-brand" />
                <span>Simulasi OS Push Banner</span>
              </h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-surface-subtle border border-stroke/40 text-ink-muted">
                Windows / Mac / Android
              </span>
            </div>

            {/* Realistic OS Push Banner */}
            <div className="p-3.5 rounded-2xl bg-[#1c2130] text-white shadow-soft-float border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-[11px] text-white/60 pb-1 border-b border-white/10">
                <div className="flex items-center gap-1.5">
                  <img src="/kubar.png" alt="Icon" className="w-3.5 h-3.5 rounded-sm object-contain" />
                  <span className="font-medium text-white/80">PEKPPP Kutai Barat</span>
                </div>
                <span>Baru saja</span>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-semibold text-white">
                  {title.trim() || 'Judul Notifikasi Akan Muncul di Sini'}
                </div>
                <div className="text-[11px] text-white/75 leading-relaxed line-clamp-3">
                  {message.trim() ||
                    'Isi pesan pengingat atau pengumuman akan ditampilkan pada banner sistem operasi ini.'}
                </div>
              </div>

              <div className="pt-1.5 flex items-center justify-between text-[10px] text-white/50 border-t border-white/10">
                <span>Klik untuk membuka: {link || '/notifikasi'}</span>
                <ExternalLink className="w-3 h-3 text-white/60" />
              </div>
            </div>

            {/* In-App Notification Card Mockup */}
            <div className="space-y-2 pt-2 border-t border-stroke/40">
              <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider flex items-center gap-1.5">
                <Bell className="w-3 h-3 text-brand" />
                <span>Tampilan Dalam Aplikasi (Pusat Notifikasi)</span>
              </div>

              <div className="p-3 rounded-xl bg-surface-elevated border border-brand/40 shadow-soft-card space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-pill bg-brand-light text-brand text-[9px] font-semibold border border-brand/20">
                    {notifType}
                  </span>
                  <span className="text-[10px] text-ink-muted">Baru saja</span>
                  <span className="px-1.5 py-0.2 rounded-pill bg-brand text-white text-[9px] font-semibold">
                    Baru
                  </span>
                </div>
                <h5 className="font-semibold text-xs text-ink leading-snug">
                  {title.trim() || 'Judul Notifikasi'}
                </h5>
                <p className="text-[11px] text-ink-secondary leading-relaxed line-clamp-2">
                  {message.trim() || 'Konten notifikasi yang akan dibaca pengguna pada riwayat sistem.'}
                </p>
              </div>
            </div>
          </div>

          {/* Panduan Singkat */}
          <div className="p-4 rounded-2xl bg-surface-subtle/50 border border-stroke/40 text-xs space-y-2 text-ink-muted">
            <h5 className="font-semibold text-ink text-xs flex items-center gap-1.5">
              <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Petunjuk Penggunaan PWA Push</span>
            </h5>
            <ul className="list-disc list-inside space-y-1 text-[11px] leading-relaxed">
              <li>PWA Web Push bekerja di Chrome, Edge, Firefox, dan Safari (macOS Ventura+ & iOS 16.4+).</li>
              <li>Pengguna hanya perlu menyetujui izin notifikasi satu kali pada perangkat mereka.</li>
              <li>Notifikasi tetap dapat masuk meski browser sedang diminimalkan atau di latar belakang.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
