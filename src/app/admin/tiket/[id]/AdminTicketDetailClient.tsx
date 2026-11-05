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
  ShieldAlert,
  CheckCircle2,
  Lock,
  Download,
  AlertTriangle
} from 'lucide-react'
import { toast } from 'sonner'
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
          targetUnit: assignedUnit ? { id: assignedUnit.id, name: assignedUnit.name, code: assignedUnit.code } : prev.targetUnit,
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

  const handleUpdateStatus = async () => {
    setUpdatingStatus(true)
    try {
      const res = await updateTicketStatusAction(ticket.id, newStatus, resolutionNotes)
      if (res.success && res.ticket) {
        toast.success('Status tiket diperbarui.')
        setTicket((prev) => ({
          ...prev,
          status: res.ticket.status,
          resolutionNotes: res.ticket.resolutionNotes,
          resolvedAt: res.ticket.resolvedAt
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
        toast.success(isInternalMemo ? 'Catatan internal ditambahkan.' : 'Tanggapan terkirim.')
      } else {
        toast.error(res.error || 'Gagal mengirim pesan.')
      }
    } catch {
      toast.error('Terjadi gangguan saat mengirim tanggapan.')
    } finally {
      setSendingMessage(false)
    }
  }

  // Format WhatsApp Link
  const getWhatsAppLink = () => {
    if (!ticket.reporterContact) return null
    const cleanNumber = ticket.reporterContact.replace(/[^0-9]/g, '')
    const formatted = cleanNumber.startsWith('0') ? `62${cleanNumber.slice(1)}` : cleanNumber
    const text = encodeURIComponent(
      `Halo ${ticket.reporterName || 'Bapak/Ibu'}, kami dari Bagian Organisasi Setdakab Kutai Barat terkait tiket laporan Anda [${ticket.ticketCode} - ${ticket.title}].`
    )
    return `https://wa.me/${formatted}?text=${text}`
  }

  const waLink = getWhatsAppLink()

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/admin/tiket"
          className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-brand transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Tiket</span>
        </Link>

        <span className="font-mono text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
          {ticket.ticketCode}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ── LEFT COLUMN: Detail Tiket & Thread Percakapan (8 Cols) ── */}
        <div className="lg:col-span-8 space-y-6">
          {/* Card Info Pokok Tiket */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-xs space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-surface-subtle text-ink-muted border border-line">
                  {ticket.category}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-brand/10 text-brand">
                  Prioritas: {ticket.priority}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-surface-subtle text-ink border border-line">
                  Status: {ticket.status}
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                {ticket.title}
              </h1>
            </div>

            {/* Uraian Laporan */}
            <div className="space-y-1.5 pt-3 border-t border-line">
              <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                Uraian Laporan Pengaduan
              </span>
              <p className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line bg-surface-subtle/50 p-4 rounded-xl border border-line/60">
                {ticket.description}
              </p>
            </div>

            {/* Berkas Lampiran */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-line">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted block">
                  Lampiran Berkas ({ticket.attachments.length})
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ticket.attachments.map((file, idx) => (
                    <a
                      key={idx}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-2.5 rounded-xl border border-line bg-surface hover:bg-surface-subtle transition-colors group">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-brand shrink-0" />
                        <span className="text-xs font-medium text-ink truncate group-hover:text-brand">
                          {file.fileName}
                        </span>
                      </div>
                      <Download className="w-3.5 h-3.5 text-ink-muted shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Thread Komunikasi & Catatan Internal */}
          <div className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-sm font-bold text-ink">
                Riwayat Diskusi &amp; Catatan Internal ({messages.length})
              </h2>
              <span className="text-[11px] text-ink-muted">Terintegrasi Notifikasi In-App</span>
            </div>

            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {messages.length === 0 ? (
                <p className="text-xs text-ink-muted text-center py-8">
                  Belum ada percakapan atau catatan internal pada tiket ini.
                </p>
              ) : (
                messages.map((m) => {
                  return (
                    <div
                      key={m.id}
                      className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                        m.isInternal
                          ? 'bg-amber-500/10 border border-amber-500/30 dark:bg-amber-950/20'
                          : m.senderRole === 'SUPER_ADMIN' || m.senderRole === 'OPD'
                            ? 'bg-brand/10 border border-brand/20 ml-2 sm:ml-6'
                            : 'bg-surface-subtle border border-line mr-2 sm:mr-6'
                      }`}>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-ink flex items-center gap-1.5">
                          {m.senderName}
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
                        </span>
                        <span className="text-ink-muted font-mono">
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

            {/* Form Balas / Tambah Catatan */}
            <form onSubmit={handleSendMessage} className="space-y-2 pt-2 border-t border-line">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-ink">
                  {isInternalMemo ? 'Tulis Catatan Internal (Hanya dilihat Admin & Lokus)' : 'Tulis Tanggapan (Terlihat oleh Pelapor)'}
                </label>
                <button
                  type="button"
                  onClick={() => setIsInternalMemo(!isInternalMemo)}
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                    isInternalMemo
                      ? 'bg-amber-500 text-white'
                      : 'bg-surface-subtle border border-line text-ink-muted hover:text-ink'
                  }`}>
                  {isInternalMemo ? '✓ Catatan Internal Aktif' : '+ Ubah ke Catatan Internal'}
                </button>
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder={
                    isInternalMemo
                      ? 'Tulis memo internal koordinasi Setdakab & OPD...'
                      : 'Tulis tanggapan resmi ke pelapor...'
                  }
                  className="flex-1 px-3.5 py-2.5 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                  required
                />
                <button
                  type="submit"
                  disabled={sendingMessage}
                  className={`px-4 py-2.5 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50 ${
                    isInternalMemo
                      ? 'bg-amber-600 hover:bg-amber-700'
                      : 'bg-brand hover:bg-brand-hover'
                  }`}>
                  <Send className="w-3.5 h-3.5" />
                  <span>{sendingMessage ? '...' : 'Kirim'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* ── RIGHT COLUMN: Kontrol Disposisi & Status (4 Cols) ── */}
        <div className="lg:col-span-4 space-y-6">
          {/* Aksi 1: Disposisi ke Unit Lokus */}
          <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <Building2 className="w-4 h-4 text-brand" />
              <span>Disposisi ke Unit Lokus</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] text-ink-muted block">
                Pilih Perangkat Daerah / Unit Penilai:
              </label>
              <select
                value={selectedUnitId}
                onChange={(e) => setSelectedUnitId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs text-ink focus:outline-none focus:border-brand">
                <option value="">-- Pilih Unit Lokus --</option>
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
              className="w-full py-2 px-3 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs">
              <span>{dispatching ? 'Mendisposisikan...' : 'Tugaskan Disposisi'}</span>
            </button>
          </div>

          {/* Aksi 2: Pembaruan Status & Resume Penyelesaian */}
          <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Pembaruan Status Penanganan</span>
            </div>

            <div className="space-y-2">
              <div className="space-y-1">
                <label className="text-[11px] text-ink-muted block">Status Saat Ini:</label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as TicketStatus)}
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs text-ink focus:outline-none focus:border-brand">
                  <option value="OPEN">Menunggu Telaah (OPEN)</option>
                  <option value="IN_PROGRESS">Sedang Ditelaah (IN_PROGRESS)</option>
                  <option value="DISPATCHED">Didisposisikan ke Lokus (DISPATCHED)</option>
                  <option value="RESOLVED">Selesai Ditindaklanjuti (RESOLVED)</option>
                  <option value="CLOSED">Ditutup (CLOSED)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-ink-muted block">
                  Catatan / Resume Penyelesaian Resmi:
                </label>
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={3}
                  placeholder="Tuliskan tindak lanjut nyata yang telah dilakukan oleh dinas/tim verifikator..."
                  className="w-full px-3 py-2 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                />
              </div>

              <button
                type="button"
                onClick={handleUpdateStatus}
                disabled={updatingStatus}
                className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs">
                <span>{updatingStatus ? 'Menyimpan...' : 'Perbarui Status Tiket'}</span>
              </button>
            </div>
          </div>

          {/* Kartu Profil Pelapor */}
          <div className="p-5 rounded-2xl bg-surface border border-line shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-ink">
              <User className="w-4 h-4 text-ink-muted" />
              <span>Identitas Pelapor</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Tipe:</span>
                <span className="font-semibold text-ink">
                  {ticket.isAnonymous ? 'Anonim (1 Arah)' : 'Pengguna Berakun'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Nama:</span>
                <span className="font-semibold text-ink truncate max-w-[180px]">
                  {ticket.reporterName || 'Warga Anonim'}
                </span>
              </div>

              {ticket.reporterContact && (
                <div className="space-y-1 pt-1 border-t border-line">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-muted">Kontak Pelapor:</span>
                    <span className="font-mono font-medium text-ink">{ticket.reporterContact}</span>
                  </div>

                  {waLink && (
                    <a
                      href={waLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-1 w-full py-1.5 px-3 rounded-lg bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors">
                      <Phone className="w-3.5 h-3.5" />
                      <span>Hubungi via WhatsApp</span>
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
