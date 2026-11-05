'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  Calendar,
  Clock,
  Send,
  FileText,
  User,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Download,
  AlertTriangle,
  ExternalLink,
  Tag,
  Check,
  ChevronRight
} from 'lucide-react'
import { toast } from 'sonner'
import { PageHeader } from '../../../../components/ui/PageHeader'
import {
  dispatchTicketAction,
  updateTicketStatusAction,
  sendTicketMessageAction,
  TicketAttachment
} from '../../../../actions/ticket-actions'
import { UserSession } from '../../../../actions/auth-actions'
import { TicketStatus } from '@prisma/client'

interface UnitItem {
  id: string
  name: string
  code: string | null
}

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

export function AdminTicketDetailClient({
  ticket: initialTicket,
  permissions,
  units,
  currentUser
}: {
  ticket: TicketDetail
  permissions: { canDispatch: boolean; canResolve: boolean; canChat: boolean; canInternalMemo: boolean }
  units: UnitItem[]
  currentUser: UserSession
}) {
  const [ticket, setTicket] = useState(initialTicket)
  const [messages, setMessages] = useState<MessageItem[]>(initialTicket.messages)

  // Disposition State
  const [selectedUnitId, setSelectedUnitId] = useState(ticket.targetUnitId || '')
  const [dispatching, setDispatching] = useState(false)

  // Status Update State
  const [newStatus, setNewStatus] = useState<TicketStatus>(ticket.status)
  const [resolutionNotes, setResolutionNotes] = useState(ticket.resolutionNotes || '')
  const [updatingStatus, setUpdatingStatus] = useState(false)

  // Message Thread State
  const [messageText, setMessageText] = useState('')
  const [isInternalMemo, setIsInternalMemo] = useState(false)
  const [sendingMessage, setSendingMessage] = useState(false)
  const [messageFilter, setMessageFilter] = useState<'ALL' | 'INTERNAL'>('ALL')

  const handleDispatch = async () => {
    if (!selectedUnitId) {
      toast.error('Pilih unit lokus tujuan.')
      return
    }
    setDispatching(true)
    try {
      const res = await dispatchTicketAction(ticket.id, selectedUnitId)
      if (res.success) {
        toast.success(`Tiket berhasil didisposisikan ke ${res.unitName}.`)
        const assignedUnit = units.find((u) => u.id === selectedUnitId)
        setTicket((prev) => ({
          ...prev,
          targetUnitId: selectedUnitId,
          targetUnit: assignedUnit
            ? { id: assignedUnit.id, name: assignedUnit.name, code: assignedUnit.code }
            : prev.targetUnit,
          status: TicketStatus.DISPATCHED
        }))
        setNewStatus(TicketStatus.DISPATCHED)
      } else {
        toast.error(res.error || 'Gagal mendisposisikan tiket.')
      }
    } catch {
      toast.error('Terjadi gangguan saat mendisposisikan tiket.')
    } finally {
      setDispatching(false)
    }
  }

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdatingStatus(true)
    try {
      const res = await updateTicketStatusAction(ticket.id, newStatus, resolutionNotes)
      if (res.success && res.ticket) {
        toast.success('Status dan berita acara tiket berhasil diperbarui.')
        setTicket((prev) => ({
          ...prev,
          status: res.ticket!.status,
          resolutionNotes: res.ticket!.resolutionNotes,
          resolvedAt: res.ticket!.resolvedAt
        }))
      } else {
        toast.error(res.error || 'Gagal memperbarui status tiket.')
      }
    } catch {
      toast.error('Terjadi gangguan saat memperbarui status.')
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
        setMessages((prev) => [...prev, res.message as any])
        setMessageText('')
        setIsInternalMemo(false)
        toast.success(isInternalMemo ? 'Catatan internal berhasil disimpan.' : 'Tanggapan resmi terkirim.')
      } else {
        toast.error(res.error || 'Gagal mengirim tanggapan.')
      }
    } catch {
      toast.error('Terjadi gangguan saat mengirim tanggapan.')
    } finally {
      setSendingMessage(false)
    }
  }

  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case TicketStatus.OPEN:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            Menunggu Telaah
          </span>
        )
      case TicketStatus.IN_PROGRESS:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            Sedang Ditelaah
          </span>
        )
      case TicketStatus.DISPATCHED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 border border-indigo-500/20">
            Didisposisikan ke Lokus
          </span>
        )
      case TicketStatus.RESOLVED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Selesai Ditangani
          </span>
        )
      case TicketStatus.CLOSED:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-subtle text-ink-muted border border-line">
            Ditutup Resmi
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-subtle text-ink border border-line">
            {status}
          </span>
        )
    }
  }

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="font-bold text-rose-600 dark:text-rose-400">Mendesak (Urgent)</span>
      case 'HIGH':
        return <span className="font-semibold text-amber-600 dark:text-amber-400">Tinggi</span>
      case 'MEDIUM':
        return <span className="font-medium text-ink">Sedang</span>
      case 'LOW':
        return <span className="font-normal text-ink-muted">Rendah</span>
      default:
        return <span>{priority}</span>
    }
  }

  // Format WhatsApp Link
  const getWhatsAppLink = () => {
    if (!ticket.reporterContact) return null
    const cleanNumber = ticket.reporterContact.replace(/[^0-9]/g, '')
    const formatted = cleanNumber.startsWith('0') ? `62${cleanNumber.slice(1)}` : cleanNumber
    const text = encodeURIComponent(
      `Halo ${ticket.reporterName || 'Bapak/Ibu'}, kami dari Bagian Organisasi Setdakab Kutai Barat terkait tiket laporan Anda #${ticket.ticketCode} ("${ticket.title}"). Kami ingin mengonfirmasi hal berikut:`
    )
    return `https://wa.me/${formatted}?text=${text}`
  }

  const waLink = getWhatsAppLink()

  const displayedMessages =
    messageFilter === 'INTERNAL' ? messages.filter((m) => m.isInternal) : messages

  return (
    <div className="space-y-6">
      {/* ── Page Header Standar Admin ── */}
      <PageHeader
        title={`Tiket #${ticket.ticketCode}`}
        description={ticket.title}
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/admin/tiket"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/25 transition-all cursor-pointer">
              <ArrowLeft className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Daftar Tiket</span>
            </Link>
            <Link
              href={`/lapor/${ticket.ticketCode}`}
              target="_blank"
              className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-white/15 hover:bg-white/25 text-white text-xs font-semibold border border-white/25 transition-all cursor-pointer">
              <ExternalLink className="w-3.5 h-3.5 text-white shrink-0" />
              <span>Lihat Halaman Publik</span>
            </Link>
          </div>
        }
      />

      {/* ── Top Summary Bento Strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Status Tiket
          </span>
          <div className="pt-0.5">{getStatusBadge(ticket.status)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Prioritas
          </span>
          <div className="text-sm pt-0.5">{getPriorityBadge(ticket.priority)}</div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Kategori
          </span>
          <div className="text-xs font-semibold text-ink truncate pt-0.5" title={ticket.category}>
            {ticket.category}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs space-y-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Lokus Penugasan
          </span>
          <div className="text-xs font-semibold text-brand truncate pt-0.5">
            {ticket.targetUnit?.name || 'Belum Didisposisikan'}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-surface border border-line shadow-2xs space-y-1 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider block">
            Tanggal Pengajuan
          </span>
          <div className="text-xs font-mono font-medium text-ink pt-0.5">
            {new Date(ticket.createdAt).toLocaleDateString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric'
            })}
          </div>
        </div>
      </div>

      {/* ── Main Two-Column Layout (8 Cols / 4 Cols) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Detail Uraian & Thread Percakapan (8 Cols) ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card Uraian Laporan */}
          <div className="p-6 rounded-2xl bg-surface border border-line shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />
                <span>Uraian Masalah Pengaduan</span>
              </h2>
              <span className="font-mono text-xs font-semibold text-ink-muted">
                #{ticket.ticketCode}
              </span>
            </div>

            <p className="text-sm text-ink leading-relaxed whitespace-pre-wrap bg-surface-subtle/40 p-4 rounded-xl border border-line/60">
              {ticket.description}
            </p>

            {/* Lampiran Berkas Bukti */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="pt-2 border-t border-line space-y-2.5">
                <span className="text-xs font-semibold text-ink block">
                  Lampiran Berkas Pendukung ({ticket.attachments.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {ticket.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl border border-line bg-surface hover:bg-surface-subtle transition-colors group shadow-2xs">
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        <FileText className="w-4 h-4 text-brand shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-medium text-ink truncate group-hover:text-brand">
                            {file.fileName}
                          </p>
                          <p className="text-[10px] text-ink-muted">
                            {(file.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Download className="w-3.5 h-3.5 text-ink-muted group-hover:text-brand shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Card Thread Diskusi & Catatan Internal */}
          <div className="p-6 rounded-2xl bg-surface border border-line shadow-subtle space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-line">
              <div className="space-y-0.5">
                <h2 className="text-sm font-bold text-ink flex items-center gap-2">
                  <span>Riwayat Diskusi &amp; Catatan Internal</span>
                  <span className="px-2 py-0.2 rounded-full text-[10px] font-semibold bg-surface-subtle text-ink-muted border border-line">
                    {messages.length}
                  </span>
                </h2>
                <p className="text-[11px] text-ink-muted">
                  Terintegrasi notifikasi in-app bell dan PWA Web Push
                </p>
              </div>

              {/* Filter Thread */}
              <div className="inline-flex p-1 bg-surface-subtle border border-line rounded-lg text-xs self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setMessageFilter('ALL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    messageFilter === 'ALL'
                      ? 'bg-surface text-ink font-semibold shadow-2xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}>
                  Semua ({messages.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMessageFilter('INTERNAL')}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                    messageFilter === 'INTERNAL'
                      ? 'bg-surface text-ink font-semibold shadow-2xs'
                      : 'text-ink-muted hover:text-ink'
                  }`}>
                  Memo Internal ({messages.filter((m) => m.isInternal).length})
                </button>
              </div>
            </div>

            {/* List Pesan */}
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {displayedMessages.length === 0 ? (
                <div className="text-center py-10 text-xs text-ink-muted">
                  Belum ada catatan atau tanggapan pada filter ini.
                </div>
              ) : (
                displayedMessages.map((m) => {
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1.5 transition-colors ${
                        m.isInternal
                          ? 'bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20'
                          : m.senderRole === 'SUPER_ADMIN' || m.senderRole === 'OPD'
                            ? 'bg-brand/10 border border-brand/20 ml-2 sm:ml-6'
                            : 'bg-surface-subtle border border-line mr-2 sm:mr-6'
                      }`}>
                      <div className="flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-1.5 font-semibold text-ink">
                          <span>{m.senderName}</span>
                          {m.isInternal ? (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-600 text-white flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              <span>Internal Staf</span>
                            </span>
                          ) : (
                            m.senderRole && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-brand text-white">
                                {m.senderRole}
                              </span>
                            )
                          )}
                        </div>
                        <span className="text-ink-muted font-mono text-[10px]">
                          {new Date(m.createdAt).toLocaleTimeString('id-ID', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <p className="text-ink leading-relaxed whitespace-pre-line">{m.message}</p>
                    </div>
                  )
                })
              )}
            </div>

            {/* Form Tanggapan / Memo Internal */}
            {permissions.canChat && (
              <form onSubmit={handleSendMessage} className="pt-3 border-t border-line space-y-3">
                <textarea
                  rows={3}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    isInternalMemo
                      ? 'Tulis memo internal koordinasi (hanya terlihat oleh petugas Setdakab & Lokus)...'
                      : ticket.isAnonymous
                        ? 'Tiket anonim tidak menerima obrolan langsung. Centang Memo Internal di bawah untuk mencatat koordinasi antar petugas.'
                        : 'Ketik tanggapan resmi untuk pelapor...'
                  }
                  disabled={ticket.isAnonymous && !isInternalMemo}
                  className="w-full text-xs p-3 rounded-xl border border-line bg-surface-subtle/40 text-ink focus:outline-none focus:border-brand disabled:opacity-50 transition-colors"
                />

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {permissions.canInternalMemo ? (
                    <label className="flex items-center gap-2 text-xs text-ink-muted cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isInternalMemo}
                        onChange={(e) => setIsInternalMemo(e.target.checked)}
                        className="rounded border-line text-brand focus:ring-0"
                      />
                      <span className="flex items-center gap-1 font-medium text-ink">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        Catat sebagai Memo Internal (Rahasia dari pelapor)
                      </span>
                    </label>
                  ) : (
                    <div />
                  )}

                  <button
                    type="submit"
                    disabled={
                      sendingMessage || (!isInternalMemo && ticket.isAnonymous) || !messageText.trim()
                    }
                    className="inline-flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all shrink-0 cursor-pointer">
                    <Send className="w-3.5 h-3.5" />
                    <span>
                      {sendingMessage
                        ? 'Mengirim...'
                        : isInternalMemo
                          ? 'Simpan Memo'
                          : 'Kirim Tanggapan'}
                    </span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* ── RIGHT COLUMN: Disposisi & Status Controls (4 Cols) ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Card Aksi 1: Disposisi ke Lokus */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-subtle space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <Building2 className="w-4 h-4 text-brand" />
              <span>Disposisi ke Unit Lokus</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-ink-muted block font-medium">
                Pilih Perangkat Daerah Penilai:
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface-subtle/40 text-xs text-ink focus:outline-none focus:border-brand transition-colors">
                <option value="">-- Pilih Unit Lokus Tujuan --</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="button"
              onClick={handleDispatch}
              disabled={dispatching || !selectedUnitId}
              className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs">
              <span>{dispatching ? 'Mendisposisikan...' : 'Tugaskan Disposisi'}</span>
            </button>
          </div>

          {/* Card Aksi 2: Pembaruan Status & Berita Acara */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-subtle space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pembaruan Status Penanganan</span>
            </div>

            <form onSubmit={handleUpdateStatus} className="space-y-3.5">
              <div className="space-y-1.5">
                <label className="text-xs text-ink-muted block font-medium">Status Penanganan Saat Ini:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                  className="w-full px-3 py-2.5 rounded-xl border border-line bg-surface-subtle/40 text-xs text-ink focus:outline-none focus:border-brand font-medium">
                  <option value={TicketStatus.OPEN}>Menunggu Telaah (OPEN)</option>
                  <option value={TicketStatus.IN_PROGRESS}>Sedang Ditelaah (IN_PROGRESS)</option>
                  <option value={TicketStatus.DISPATCHED}>Didisposisikan ke Lokus (DISPATCHED)</option>
                  <option value={TicketStatus.RESOLVED}>Selesai Ditindaklanjuti (RESOLVED)</option>
                  <option value={TicketStatus.CLOSED}>Ditutup Resmi (CLOSED)</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs text-ink-muted block font-medium">
                  Berita Acara / Resume Penyelesaian:
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={4}
                  placeholder="Tuliskan tindak lanjut faktual yang telah diambil oleh verifikator / OPD terkait..."
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface-subtle/40 text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand transition-colors"
                />
                <p className="text-[10px] text-ink-muted">
                  Catatan ini akan tampil di tautan pelacakan kode tiket publik warga.
                </p>
              </div>

              <button
                type="submit"
                disabled={updatingStatus}
                className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-xs">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{updatingStatus ? 'Menyimpan...' : 'Perbarui Status Tiket'}</span>
              </button>
            </form>
          </div>

          {/* Card Identitas Pelapor & Kontak Klarifikasi */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-subtle space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <User className="w-4 h-4 text-brand" />
              <span>Identitas Pelapor</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-ink-muted">Tipe Pelapor:</span>
                <span className="font-semibold text-ink">
                  {ticket.isAnonymous ? 'Anonim (1 Arah)' : 'Pengguna Berakun'}
                </span>
              </div>

              <div className="flex items-center justify-between pb-2 border-b border-line">
                <span className="text-ink-muted">Nama:</span>
                <span className="font-semibold text-ink truncate max-w-[180px]">
                  {ticket.reporterName || 'Warga Anonim'}
                </span>
              </div>

              {ticket.reporterContact && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Kontak Klarifikasi:</span>
                    <span className="font-mono font-medium text-ink flex items-center gap-1">
                      {ticket.contactChannel === 'WHATSAPP' ? (
                        <Phone className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Mail className="w-3 h-3 text-brand" />
                      )}
                      <span>{ticket.reporterContact}</span>
                    </span>
                  </div>

                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 w-full py-2 px-3 rounded-xl bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Klarifikasi via WhatsApp</span>
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}