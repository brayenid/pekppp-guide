'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Send,
  Search,
  CheckCircle2,
  Copy,
  Check,
  AlertCircle,
  FileText,
  Paperclip,
  User,
  ShieldAlert,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import { createTicketAction } from '../../actions/ticket-actions'
import { UserSession } from '../../actions/auth-actions'

interface UnitItem {
  id: string
  name: string
  code: string | null
  category: { name: string } | null
}

const CATEGORIES = [
  'Pelayanan Publik & Fasilitas Lokus',
  'Konsultasi Teknis & Regulasi/SOP',
  'Kendala Sistem & Portal PEKPPP',
  'Aspirasi & Inovasi Layanan',
  'Lainnya / Umum'
]

export function LaporClient({
  currentUser,
  units
}: {
  currentUser: UserSession | null
  units: UnitItem[]
}) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<'create' | 'track'>('create')

  // Form State
  const [isAnonymous, setIsAnonymous] = useState<boolean>(!currentUser)
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [targetUnitId, setTargetUnitId] = useState('')
  const [description, setDescription] = useState('')
  const [reporterName, setReporterName] = useState(currentUser?.fullName || '')
  const [reporterContact, setReporterContact] = useState('')
  const [contactChannel, setContactChannel] = useState<'WHATSAPP' | 'EMAIL'>('WHATSAPP')
  const [attachments, setAttachments] = useState<File[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Success State
  const [createdTicketCode, setCreatedTicketCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Track State
  const [searchCode, setSearchCode] = useState('')
  const [isSearching, setIsSearching] = useState(false)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files)
      setAttachments(selected)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !description.trim()) {
      toast.error('Judul dan uraian laporan wajib diisi.')
      return
    }

    setSubmitting(true)
    try {
      const formData = new FormData()
      formData.append('title', title.trim())
      formData.append('description', description.trim())
      formData.append('category', category)
      formData.append('priority', priority)
      formData.append('isAnonymous', String(isAnonymous))
      if (targetUnitId) formData.append('targetUnitId', targetUnitId)
      if (reporterName) formData.append('reporterName', reporterName.trim())
      if (reporterContact) {
        formData.append('reporterContact', reporterContact.trim())
        formData.append('contactChannel', contactChannel)
      }

      attachments.forEach((file) => {
        formData.append('attachments', file)
      })

      const res = await createTicketAction(formData)
      if (res.success && res.ticketCode) {
        setCreatedTicketCode(res.ticketCode)
        toast.success('Laporan berhasil dikirim.')
      } else {
        toast.error(res.error || 'Gagal mengirim laporan.')
      }
    } catch {
      toast.error('Terjadi gangguan sistem saat mengirim laporan.')
    } finally {
      setSubmitting(false)
    }
  }

  const handleCopyCode = () => {
    if (createdTicketCode) {
      navigator.clipboard.writeText(createdTicketCode)
      setCopied(true)
      toast.success('Kode tiket disalin.')
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault()
    const clean = searchCode.trim().toUpperCase()
    if (!clean) {
      toast.error('Masukkan kode tiket.')
      return
    }
    setIsSearching(true)
    router.push(`/lapor/${clean}`)
  }

  return (
    <div className="space-y-6">
      {/* ── Institutional Header ── */}
      <div className="space-y-2 text-center max-w-2xl mx-auto">
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-brand/10 text-brand">
          Pusat Laporan & Bantuan Layanan
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
          Tiket Layanan Publik Kabupaten Kutai Barat
        </h1>
        <p className="text-xs sm:text-sm text-ink-muted leading-relaxed">
          Sampaikan laporan pelayanan, kendala teknis sistem, konsultasi standar pelayanan, atau aspirasi perbaikan layanan secara transparan.
        </p>
      </div>

      {/* ── Primary Tabs (Buat Laporan / Lacak Status) ── */}
      <div className="flex items-center justify-center">
        <div className="inline-flex p-1 bg-surface-subtle border border-line rounded-xl gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'create'
                ? 'bg-surface text-ink shadow-2xs'
                : 'text-ink-muted hover:text-ink'
            }`}>
            Buat Laporan Baru
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('track')}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'track'
                ? 'bg-surface text-ink shadow-2xs'
                : 'text-ink-muted hover:text-ink'
            }`}>
            Lacak Status Tiket
          </button>
        </div>
      </div>

      {/* ── TAB 1: Buat Laporan Baru ── */}
      {activeTab === 'create' && (
        <div className="bg-surface border border-line rounded-2xl p-5 sm:p-8 shadow-xs">
          {createdTicketCode ? (
            /* Success State Modal / Card */
            <div className="text-center py-6 sm:py-8 space-y-4 max-w-lg mx-auto">
              <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1">
                <h2 className="text-lg sm:text-xl font-bold text-ink">
                  Laporan Berhasil Diajukan
                </h2>
                <p className="text-xs sm:text-sm text-ink-muted">
                  Simpan kode tiket berikut untuk memantau perkembangan dan tindak lanjut petugas:
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle border border-line flex items-center justify-between gap-3 max-w-sm mx-auto">
                <span className="font-mono font-bold text-base sm:text-lg text-brand tracking-wider">
                  {createdTicketCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-surface border border-line hover:bg-surface-elevated text-ink transition-colors cursor-pointer"
                  title="Salin kode">
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-ink-muted" />}
                </button>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2">
                <Link
                  href={`/lapor/${createdTicketCode}`}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shadow-xs">
                  <span>Pantau Status Tiket</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setCreatedTicketCode(null)
                    setTitle('')
                    setDescription('')
                    setAttachments([])
                    setReporterContact('')
                  }}
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-line text-xs font-medium text-ink hover:bg-surface-subtle transition-colors cursor-pointer">
                  Kirim Laporan Lain
                </button>
              </div>
            </div>
          ) : (
            /* Form Input Laporan */
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Mode Switcher: Anonim (1 Arah) vs Akun (2 Arah) */}
              <div className="p-3.5 rounded-xl bg-surface-subtle border border-line space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                  Metode Identitas Pelapor
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAnonymous(true)}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      isAnonymous
                        ? 'bg-brand/10 border-brand text-brand shadow-2xs font-semibold'
                        : 'bg-surface border-line text-ink hover:bg-surface-elevated'
                    }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span>Mode Anonim (1 Arah)</span>
                      {isAnonymous && <Check className="w-3.5 h-3.5 text-brand" />}
                    </div>
                    <p className="text-[11px] text-ink-muted font-normal mt-0.5">
                      Identitas terjaga rahasia. Pantau progres melalui kode tiket publik.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (!currentUser) {
                        toast.info('Silakan masuk ke portal untuk pelaporan dengan akun.')
                        router.push('/login')
                      } else {
                        setIsAnonymous(false)
                      }
                    }}
                    className={`p-3 rounded-lg border text-left transition-all cursor-pointer ${
                      !isAnonymous
                        ? 'bg-brand/10 border-brand text-brand shadow-2xs font-semibold'
                        : 'bg-surface border-line text-ink hover:bg-surface-elevated'
                    }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span>Mode Berakun (2 Arah)</span>
                      {!isAnonymous && <Check className="w-3.5 h-3.5 text-brand" />}
                    </div>
                    <p className="text-[11px] text-ink-muted font-normal mt-0.5">
                      {currentUser
                        ? `Terkoneksi sebagai ${currentUser.fullName}. Diskusi interaktif dua arah.`
                        : 'Login akun terdaftar untuk berdiskusi langsung dengan tim pemeriksa.'}
                    </p>
                  </button>
                </div>
              </div>

              {/* Grid 2 Kolom: Kategori & Unit Terkait */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink">
                    Kategori Laporan <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs sm:text-sm text-ink focus:outline-none focus:border-brand">
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-ink">
                    Unit Kerja Terkait (Opsional)
                  </label>
                  <select
                    value={targetUnitId}
                    onChange={(e) => setTargetUnitId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs sm:text-sm text-ink focus:outline-none focus:border-brand">
                    <option value="">Umum / Ditujukan ke Setdakab</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Judul Laporan */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Pokok Laporan / Judul <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Keterlambatan penerbitan izin usaha / kendala unggah dokumen F-01"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs"
                  required
                />
              </div>

              {/* Uraian Lengkap */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Uraian Lengkap Laporan / Keluhan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan rincian kejadian, tanggal, lokasi, atau penjelasan kendala secara jelas..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface text-xs sm:text-sm text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand shadow-2xs leading-relaxed"
                  required
                />
              </div>

              {/* Informasi Kontak Opsional (Khusus Mode Anonim) */}
              {isAnonymous && (
                <div className="p-3.5 rounded-xl bg-surface-subtle border border-line space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-ink">
                      Kontak yang Dapat Dihubungi (Opsional)
                    </span>
                    <span className="text-[10px] text-ink-muted">Berguna untuk verifikasi</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-1">
                      <select
                        value={contactChannel}
                        onChange={(e) => setContactChannel(e.target.value as 'WHATSAPP' | 'EMAIL')}
                        className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs text-ink focus:outline-none focus:border-brand">
                        <option value="WHATSAPP">WhatsApp / HP</option>
                        <option value="EMAIL">Email</option>
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        value={reporterContact}
                        onChange={(e) => setReporterContact(e.target.value)}
                        placeholder={contactChannel === 'WHATSAPP' ? 'Contoh: 0812-3456-7890' : 'nama@email.com'}
                        className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                      />
                    </div>
                  </div>

                  <p className="text-[11px] text-ink-muted leading-relaxed">
                    Kontak ini bersifat rahasia dan tidak akan dipublikasikan. Hanya digunakan apabila verifikator membutuhkan klarifikasi faktual.
                  </p>
                </div>
              )}

              {/* Lampiran Bukti (Opsional) */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-ink">
                  Lampiran Bukti Dokumen / Foto (Opsional)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={handleFileChange}
                    className="text-xs text-ink file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border file:border-line file:text-xs file:font-semibold file:bg-surface-subtle file:text-ink hover:file:bg-surface-elevated cursor-pointer"
                  />
                  {attachments.length > 0 && (
                    <span className="text-[11px] text-ink-muted font-medium">
                      {attachments.length} berkas dipilih
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 px-5 rounded-xl bg-brand hover:bg-brand-hover active:scale-99 disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Mengirimkan Laporan...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Kirimkan Tiket Laporan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── TAB 2: Lacak Status Tiket ── */}
      {activeTab === 'track' && (
        <div className="bg-surface border border-line rounded-2xl p-6 sm:p-8 max-w-lg mx-auto shadow-xs space-y-4">
          <div className="space-y-1 text-center">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Lacak Status Laporan
            </h2>
            <p className="text-xs text-ink-muted">
              Masukkan kode tiket unik yang Anda peroleh saat mengajukan laporan:
            </p>
          </div>

          <form onSubmit={handleTrack} className="space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchCode}
                onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                placeholder="Contoh: TKT-2026-X8B9Q"
                className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-line bg-surface text-xs sm:text-sm font-mono text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand uppercase tracking-wider shadow-2xs"
                required
              />
              <Search className="w-4 h-4 text-ink-muted absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white font-semibold text-xs sm:text-sm transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer">
              {isSearching ? 'Mencari Tiket...' : 'Periksa Status'}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}
