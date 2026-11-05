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
  ShieldCheck,
  ArrowRight,
  Phone,
  Mail,
  X,
  Building,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../components/ui/PageHeader'
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

  // Mode otomatis berdasarkan status login pengguna
  const isAnonymous = !currentUser

  // Form State
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM')
  const [targetUnitId, setTargetUnitId] = useState('')
  const [description, setDescription] = useState('')
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
      // Maksimal 5 file, per file max 10MB
      const validFiles = selected.filter((f) => f.size <= 10 * 1024 * 1024)
      if (validFiles.length < selected.length) {
        toast.error('Beberapa berkas melebihi batas ukuran maksimal 10MB.')
      }
      setAttachments((prev) => [...prev, ...validFiles].slice(0, 5))
    }
  }

  const removeAttachment = (indexToRemove: number) => {
    setAttachments((prev) => prev.filter((_, idx) => idx !== indexToRemove))
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
      
      if (currentUser) {
        formData.append('reporterName', currentUser.fullName)
      } else {
        formData.append('reporterName', 'Warga Anonim')
        if (reporterContact.trim()) {
          formData.append('reporterContact', reporterContact.trim())
          formData.append('contactChannel', contactChannel)
        }
      }

      attachments.forEach((file) => {
        formData.append('attachments', file)
      })

      const res = await createTicketAction(formData)
      if (res.success && res.ticketCode) {
        setCreatedTicketCode(res.ticketCode)
        toast.success('Laporan pengaduan berhasil diajukan.')
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
      toast.success('Kode tiket berhasil disalin.')
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
    <div className="space-y-8 sm:space-y-10">
      {/* ── Page Header Standard (Sesuai Gaya /panduan & /contoh-berkas) ── */}
      <PageHeader
        title="Pusat Laporan & Bantuan Layanan"
        description="Saluran aspirasi masyarakat, konsultasi teknis standar pelayanan publik, serta pelaporan kendala sistem PEKPPP di lingkungan Pemerintah Kabupaten Kutai Barat."
        actions={
          <div className="inline-flex p-1 bg-surface-subtle border border-line rounded-xl gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('create')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'create'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}>
              Buat Laporan
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('track')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'track'
                  ? 'bg-surface text-ink shadow-2xs'
                  : 'text-ink-muted hover:text-ink'
              }`}>
              Lacak Status
            </button>
          </div>
        }
      />

      {/* ── TAB 1: Buat Laporan Baru ── */}
      {activeTab === 'create' && (
        <div className="space-y-6">
          {createdTicketCode ? (
            /* ── Success State Card ── */
            <div className="p-8 sm:p-10 rounded-2xl bg-surface border border-line shadow-subtle text-center space-y-6 max-w-xl mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-xl font-bold text-ink">
                  Laporan Berhasil Diajukan
                </h2>
                <p className="text-xs text-ink-muted leading-relaxed max-w-md mx-auto">
                  Laporan Anda telah tercatat dalam sistem dan otomatis dinotifikasikan ke tim verifikator. Simpan kode tiket ini untuk memantau proses tindak lanjut:
                </p>
              </div>

              <div className="p-4 rounded-xl bg-surface-subtle/60 border border-line flex items-center justify-between gap-3 max-w-sm mx-auto">
                <span className="font-mono font-bold text-base sm:text-lg text-brand tracking-wider">
                  {createdTicketCode}
                </span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="p-2 rounded-lg bg-surface border border-line hover:bg-surface-elevated text-ink transition-colors cursor-pointer"
                  title="Salin kode tiket">
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-ink-muted" />}
                </button>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
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
                  className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-line text-xs font-semibold text-ink hover:bg-surface-subtle transition-colors cursor-pointer">
                  Kirim Laporan Lain
                </button>
              </div>
            </div>
          ) : (
            /* ── Form Input Laporan ── */
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* ── Status Identitas Pelapor (Otomatis berdasarkan login, tanpa tombol pilih manual) ── */}
              {currentUser ? (
                /* Mode Berakun Terdeteksi Otomatis */
                <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle/50 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-ink block">{currentUser.fullName}</span>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        Terkoneksi ke akun terverifikasi ({currentUser.email}). Anda dapat saling membalas tanggapan secara interaktif dengan petugas.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode Anonim Terdeteksi Otomatis */
                <div className="p-4 sm:p-5 rounded-2xl bg-surface-subtle/50 border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-3.5">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20 mt-0.5">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-semibold text-ink block">Pengajuan Laporan Tanpa Akun</span>
                      <p className="text-xs text-ink-muted leading-relaxed">
                        Identitas pribadi Anda terlindungi secara penuh. Perkembangan penanganan dapat dipantau melalui kode tiket publik.
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/login"
                    className="inline-flex items-center gap-1.5 text-xs text-brand hover:text-brand-hover font-semibold px-3 py-1.5 rounded-lg border border-brand/20 bg-brand/5 hover:bg-brand/10 transition-colors shrink-0 self-start sm:self-center">
                    <span>Masuk dengan Akun</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}

              {/* ── Form Card Utama ── */}
              <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-subtle space-y-5">
                {/* Grid 2 Kolom: Kategori & Unit Terkait */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">
                      Kategori Laporan <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-subtle/40 text-xs text-ink focus:outline-none focus:border-brand transition-colors">
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-ink">
                      Unit Kerja / Lokus Terkait
                    </label>
                    <select
                      value={targetUnitId}
                      onChange={(e) => setTargetUnitId(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-subtle/40 text-xs text-ink focus:outline-none focus:border-brand transition-colors">
                      <option value="">Umum / Bagian Organisasi Setdakab</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Judul Laporan */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    Pokok Laporan / Ringkasan Judul <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Permintaan pendampingan pengisian Formulir F-01 / Kendala sarana loket difabel"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-subtle/40 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-colors"
                    required
                  />
                </div>

                {/* Uraian Lengkap */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-ink">
                    Uraian Rinci Laporan / Pertanyaan <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Tuliskan latar belakang masalah, lokasi kejadian, tanggal, dan penjelasan kendala yang dihadapi secara detail..."
                    className="w-full px-3.5 py-2.5 rounded-xl border border-line bg-surface-subtle/40 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-colors leading-relaxed"
                    required
                  />
                </div>

                {/* Kontak Klarifikasi Opsional (Hanya untuk yang tidak login) */}
                {!currentUser && (
                  <div className="p-4 rounded-xl bg-surface-subtle/40 border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-ink flex items-center gap-1.5">
                        <Phone className="w-3.5 h-3.5 text-brand" />
                        <span>Kontak yang Dapat Dihubungi (Opsional)</span>
                      </span>
                      <span className="text-[10px] text-ink-muted">Untuk verifikasi darurat</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="sm:col-span-1">
                        <select
                          value={contactChannel}
                          onChange={(e) => setContactChannel(e.target.value as 'WHATSAPP' | 'EMAIL')}
                          className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs text-ink focus:outline-none focus:border-brand">
                          <option value="WHATSAPP">WhatsApp</option>
                          <option value="EMAIL">Email</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <input
                          type="text"
                          value={reporterContact}
                          onChange={(e) => setReporterContact(e.target.value)}
                          placeholder={contactChannel === 'WHATSAPP' ? 'Nomor WhatsApp (misal: 081234567890)' : 'Alamat email aktif'}
                          className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                        />
                      </div>
                    </div>

                    <p className="text-[11px] text-ink-muted leading-relaxed">
                      Kontak ini bersifat rahasia dan tidak dipublikasikan ke publik. Hanya digunakan oleh tim pemeriksa apabila laporan memerlukan konfirmasi cepat.
                    </p>
                  </div>
                )}

                {/* Lampiran Bukti Dukung */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-semibold text-ink">
                      Lampiran Dokumen / Foto Pendukung (Opsional)
                    </label>
                    <span className="text-[11px] text-ink-muted">Maks. 5 file, per file maks. 10MB</span>
                  </div>

                  <div className="border border-dashed border-line rounded-xl p-4 bg-surface-subtle/20 hover:bg-surface-subtle/40 transition-colors">
                    <input
                      type="file"
                      id="file-upload"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="file-upload"
                      className="flex flex-col items-center justify-center gap-1.5 cursor-pointer py-2">
                      <Paperclip className="w-5 h-5 text-ink-muted" />
                      <span className="text-xs font-semibold text-brand hover:underline">
                        Pilih berkas dari perangkat
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        Format PDF, JPG, PNG, atau DOCX
                      </span>
                    </label>
                  </div>

                  {/* List Selected Files */}
                  {attachments.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                      {attachments.map((f, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 rounded-xl border border-line bg-surface-subtle/30 text-xs">
                          <div className="truncate pr-2">
                            <p className="font-medium text-ink truncate">{f.name}</p>
                            <p className="text-[10px] text-ink-muted">{(f.size / 1024).toFixed(1)} KB</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeAttachment(idx)}
                            className="p-1 rounded-lg hover:bg-surface text-ink-muted hover:text-rose-500 transition-colors cursor-pointer"
                            title="Hapus berkas">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Action */}
                <div className="pt-3 border-t border-line flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-[11px] text-ink-muted">
                    Pastikan informasi yang disampaikan sesuai dengan data dan fakta sebenarnya.
                  </p>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-brand hover:bg-brand-hover active:scale-99 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer shrink-0">
                    {submitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Mengirimkan...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Kirimkan Laporan</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── TAB 2: Lacak Status Tiket ── */}
      {activeTab === 'track' && (
        <div className="p-6 sm:p-8 rounded-2xl bg-surface border border-line shadow-subtle space-y-6 max-w-xl mx-auto">
          <div className="space-y-1.5 text-center">
            <h2 className="text-base sm:text-lg font-bold text-ink">
              Lacak Perkembangan Tiket Laporan
            </h2>
            <p className="text-xs text-ink-muted leading-relaxed">
              Masukkan kode tiket unik yang Anda peroleh saat membuat pengaduan untuk melihat posisi tindak lanjut verifikator.
            </p>
          </div>

          <form onSubmit={handleTrack} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-ink">Kode Tiket</label>
              <div className="relative">
                <input
                  type="text"
                  value={searchCode}
                  onChange={(e) => setSearchCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: TKT-2026-X8B9Q"
                  className="w-full pl-3.5 pr-10 py-2.5 rounded-xl border border-line bg-surface-subtle/40 font-mono text-xs sm:text-sm text-ink placeholder:text-ink-muted tracking-wider uppercase focus:outline-none focus:border-brand transition-colors"
                  required
                />
                <Search className="w-4 h-4 text-ink-muted absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSearching}
              className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all shadow-xs cursor-pointer disabled:opacity-50">
              {isSearching ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memeriksa Status...</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>Cari & Periksa Status</span>
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  )
}