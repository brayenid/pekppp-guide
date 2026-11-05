'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Calendar,
  Send,
  FileText,
  User,
  Phone,
  Mail,
  ShieldAlert,
  CheckCircle2,
  Lock,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import {
  updateTicketStatusAction,
  sendTicketMessageAction,
  TicketAttachment
} from '../../../../actions/ticket-actions'
import { UserSession } from '../../../../actions/auth-actions'
import { TicketStatus } from '@prisma/client'

interface MessageItem {
  id: string
  senderRole: string | null
  senderName: string
  message: string
  isInternal: boolean
  attachments: any
  createdAt: Date
  sender?: { fullName: string; role: string } | null
}

interface TicketDetail {
  id: string
  ticketCode: string
  title: string
  description: string
  category: string
  priority: string
  status: TicketStatus
  isAnonymous: boolean
  reporterName: string | null
  reporterContact: string | null
  contactChannel: string | null
  allowContact: boolean
  targetUnitId: string | null
  targetUnit: { id: string; name: string; code: string | null } | null
  attachments: TicketAttachment[] | null
  resolutionNotes: string | null
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
  author: { id: string; fullName: string; email: string; phone: string | null } | null
  messages: MessageItem[]
}

export function OpdTicketDetailClient({
  ticket: initialTicket,
  permissions,
  currentUser
}: {
  ticket: TicketDetail
  permissions: { canDispatch: boolean; canResolve: boolean; canChat: boolean; canInternalMemo: boolean }
  currentUser: UserSession
}) {
  const [ticket, setTicket] = useState(initialTicket)
  const [messages, setMessages] = useState<MessageItem[]>(initialTicket.messages)

  // Status Update State
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status)
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Message Thread State
  const [messageText, setMessageText] = useState('')
  const [isInternalMemo, setIsInternalMemo] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingStatus(true)
    try {
      const res = await updateTicketStatusAction(ticket.id, newStatus, resolutionNotes)
      if (res.success && res.ticket) {
        toast.success('Status dan tindak lanjut tiket berhasil diperbarui.')
        setTicket((prev) => ({
          ...prev,
          status: newStatus,
          resolutionNotes: resolutionNotes,
          resolvedAt: newStatus === TicketStatus.RESOLVED || newStatus === TicketStatus.CLOSED
            ? new Date()
            : prev.resolvedAt
        }))
      } else {
        toast.error(res.error || 'Gagal memperbarui status.')
      }
    } catch {
      toast.error('Terjadi kesalahan jaringan saat update status.')
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageText.trim()) return

    setSendingMessage(true)
    try {
      const formData = new FormData()
      formData.append('ticketId', ticket.id)
      formData.append('message', messageText.trim())
      formData.append('isInternal', String(isInternalMemo))

      const res = await sendTicketMessageAction(formData)
      if (res.success && res.message) {
        toast.success(isInternalMemo ? 'Catatan internal tersimpan.' : 'Tanggapan berhasil dikirim.')
        setMessages((prev) => [...prev, res.message as any])
        setMessageText('')
        setIsInternalMemo(false)
      } else {
        toast.error(res.error || 'Gagal mengirim pesan.')
      }
    } catch {
      toast.error('Gagal mengirim pesan.')
    } finally {
      setSendingMessage(false)
    }
  }

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">Menunggu Telaah</span>
      case TicketStatus.IN_PROGRESS:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400">Sedang Ditelaah / Diproses</span>
      case TicketStatus.DISPATCHED:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">Didisposisikan ke Lokus</span>
      case TicketStatus.RESOLVED:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">Selesai Ditindaklanjuti</span>
      case TicketStatus.CLOSED:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400">Ditutup Resmi</span>
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-slate-500/10 text-slate-500">{status}</span>
    }
  }

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-surface-border">
        <div className="flex items-center gap-3">
          <Link
            href="/opd/tiket"
            className="p-2 rounded-xl border border-surface-border hover:bg-surface-elevated text-ink-muted hover:text-ink transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-brand">#{ticket.ticketCode}</span>
              {getStatusBadge(ticket.status)}
              {ticket.isAnonymous && (
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-md bg-slate-500/10 text-slate-600 dark:text-slate-300">
                  Anonim (1 Arah)
                </span>
              )}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink mt-1 tracking-tight">
              {ticket.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-ink-muted">
          <Calendar className="w-4 h-4" />
          <span>{new Date(ticket.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Details & Thread */}
        <div className="lg:col-span-2 space-y-6">
          {/* Uraian Laporan */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand" />
              <span>Uraian Masalah Pengaduan</span>
            </h2>

            <p className="text-sm text-ink-base leading-relaxed whitespace-pre-wrap">
              {ticket.description}
            </p>

            {/* Lampiran Dokumen */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="pt-4 border-t border-surface-border">
                <p className="text-xs font-semibold text-ink-muted mb-2">Lampiran Berkas ({ticket.attachments.length}):</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ticket.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-surface-border bg-surface-elevated/40 hover:bg-surface-elevated text-xs transition-colors group">
                      <div className="truncate pr-2">
                        <p className="font-semibold text-ink group-hover:text-brand truncate">{file.fileName}</p>
                        <p className="text-[10px] text-ink-muted">{(file.fileSize / 1024).toFixed(1)} KB</p>
                      </div>
                      <Download className="w-4 h-4 text-ink-muted group-hover:text-brand shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Informasi Pelapor & Kontak Klarifikasi */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <User className="w-4 h-4 text-brand" />
              <span>Identitas Pelapor</span>
            </h2>

            {ticket.isAnonymous ? (
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200">
                  <div className="flex items-center gap-2 font-semibold mb-1">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                    <span>Laporan Anonim (Satu Arah)</span>
                  </div>
                  <p className="text-[11px] leading-relaxed text-amber-800 dark:text-amber-300">
                    Pelapor memilih menyamarkan identitas. Perkembangan tindak lanjut yang Anda tulis pada form Status & Penyelesaian di panel kanan akan otomatis tampil di tautan pelacakan kode tiket publik pelapor.
                  </p>
                </div>

                {ticket.reporterContact && (
                  <div className="p-3 rounded-xl border border-surface-border bg-surface-elevated/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div>
                      <p className="text-[11px] text-ink-muted">Kontak Klarifikasi Darurat Disediakan:</p>
                      <p className="font-semibold text-ink flex items-center gap-1.5 mt-0.5">
                        {ticket.contactChannel === 'WHATSAPP' ? (
                          <Phone className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Mail className="w-3.5 h-3.5 text-brand" />
                        )}
                        <span>{ticket.reporterContact}</span>
                      </p>
                    </div>
                    {ticket.contactChannel === 'WHATSAPP' ? (
                      <a
                        href={`https://wa.me/${ticket.reporterContact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo, kami dari ${ticket.targetUnit?.name || 'Unit Pelayanan PEKPPP'}. Terkait tiket aduan Anda #${ticket.ticketCode} (${ticket.title}), kami ingin mengonfirmasi hal berikut:`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-xs transition-colors shrink-0">
                        <Phone className="w-3.5 h-3.5" />
                        <span>Klarifikasi via WhatsApp</span>
                      </a>
                    ) : (
                      <a
                        href={`mailto:${ticket.reporterContact}?subject=${encodeURIComponent(`Tindak Lanjut Tiket #${ticket.ticketCode} - PEKPPP`)}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-semibold text-xs shadow-xs transition-colors shrink-0">
                        <Mail className="w-3.5 h-3.5" />
                        <span>Kirim Email</span>
                      </a>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl border border-surface-border bg-surface-elevated/20">
                  <span className="text-[11px] text-ink-muted block">Nama Terdaftar</span>
                  <span className="font-semibold text-ink block mt-0.5">{ticket.author?.fullName || 'Warga'}</span>
                </div>
                <div className="p-3 rounded-xl border border-surface-border bg-surface-elevated/20">
                  <span className="text-[11px] text-ink-muted block">Email Pengguna</span>
                  <span className="font-semibold text-ink block mt-0.5 truncate">{ticket.author?.email || '-'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Diskusi / Memo Thread */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-surface-border">
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <span>Catatan & Diskusi Penanganan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-surface-elevated text-ink-muted font-normal">
                  {messages.length} entri
                </span>
              </h2>
            </div>

            {/* List Messages */}
            <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <div className="text-center py-8 text-xs text-ink-muted">
                  Belum ada catatan atau tanggapan untuk tiket ini.
                </div>
              ) : (
                messages.map((m) => (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      m.isInternal
                        ? 'bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-100'
                        : 'bg-surface-elevated/40 border-surface-border text-ink-base'
                    }`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-ink">{m.senderName}</span>
                        {m.senderRole && (
                          <span className="px-1.5 py-0.2 rounded bg-surface-elevated text-[10px] text-ink-muted font-medium">
                            {m.senderRole}
                          </span>
                        )}
                        {m.isInternal && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                            <Lock className="w-3 h-3" />
                            <span>Memo Internal</span>
                          </span>
                        )}
                      </div>
                      <span className="text-ink-muted text-[10px]">
                        {new Date(m.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap leading-relaxed">{m.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Form Balas / Internal Memo */}
            {permissions.canChat && (
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-surface-border space-y-3">
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    isInternalMemo
                      ? 'Tulis memo internal koordinasi (hanya terlihat oleh petugas OPD & Admin)...'
                      : ticket.isAnonymous
                        ? 'Tiket anonim tidak menerima obrolan langsung. Centang Memo Internal di bawah untuk mencatat koordinasi antar petugas.'
                        : 'Ketik tanggapan atau instruksi untuk pelapor...'
                  }
                  disabled={ticket.isAnonymous && !isInternalMemo}
                  className="w-full text-xs p-3 rounded-xl border border-surface-border bg-surface-elevated/50 text-ink focus:outline-hidden focus:border-brand disabled:opacity-50"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {permissions.canInternalMemo ? (
                    <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternalMemo}
                        onChange={(e) => setIsInternalMemo(e.target.checked)}
                        className="rounded border-surface-border text-brand focus:ring-0"
                      />
                      <span className="flex items-center gap-1 font-medium">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        Catat sebagai Memo Internal (Tertutup dari publik/pelapor)
                      </span>
                    </label>
                  ) : (
                    <div />
                  )}

                  <button
                    type="submit"
                    disabled={sendingMessage || (!isInternalMemo && ticket.isAnonymous) || !messageText.trim()}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors shrink-0">
                    <Send className="w-3.5 h-3.5" />
                    <span>{sendingMessage ? 'Mengirim...' : isInternalMemo ? 'Simpan Memo' : 'Kirim Tanggapan'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Right Column: Status & Resolution Action */}
        <div className="space-y-6">
          {/* Card Update Status & Resume Tindak Lanjut */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-4">
            <h2 className="text-sm font-bold text-ink flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Pembaruan Status & Tindak Lanjut</span>
            </h2>

            <form onSubmit={handleUpdateStatus} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink-muted block">Status Tiket Saat Ini</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                  className="w-full text-xs p-2.5 rounded-xl border border-surface-border bg-surface-elevated/50 text-ink focus:outline-hidden focus:border-brand font-medium">
                  <option value={TicketStatus.IN_PROGRESS}>Sedang Ditelaah / Diproses</option>
                  <option value={TicketStatus.RESOLVED}>Telah Selesai Ditangani</option>
                  <option value={TicketStatus.CLOSED}>Ditutup Resmi</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-ink-muted block">
                  Ringkasan Penyelesaian / Berita Acara
                </label>
                <textarea
                  rows={4}
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  placeholder="Jelaskan tindakan yang telah diambil oleh unit lokus untuk menyelesaikan pengaduan ini..."
                  className="w-full text-xs p-3 rounded-xl border border-surface-border bg-surface-elevated/50 text-ink focus:outline-hidden focus:border-brand"
                />
                <p className="text-[10px] text-ink-muted">
                  Ringkasan ini akan otomatis tampil di halaman pelacakan publik warga sebagai bukti penyelesaian resmi.
                </p>
              </div>

              <button
                type="submit"
                disabled={updatingStatus}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-colors">
                <CheckCircle2 className="w-4 h-4" />
                <span>{updatingStatus ? 'Menyimpan...' : 'Simpan Status & Tindak Lanjut'}</span>
              </button>
            </form>
          </div>

          {/* Meta Information Card */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface-card border border-surface-border space-y-3.5">
            <h2 className="text-sm font-bold text-ink">Informasi Penugasan Lokus</h2>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <span className="text-ink-muted">Kategori Laporan</span>
                <span className="font-semibold text-ink">{ticket.category}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <span className="text-ink-muted">Tingkat Urgensi</span>
                <span className="font-semibold text-ink">{ticket.priority}</span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-surface-border">
                <span className="text-ink-muted">Unit Tujuan</span>
                <span className="font-semibold text-brand text-right">{ticket.targetUnit?.name || 'Seluruh Lokus'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Pembaruan Terakhir</span>
                <span className="text-ink font-medium">
                  {new Date(ticket.updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}