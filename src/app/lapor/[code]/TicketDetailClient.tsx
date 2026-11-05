'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Send,
  FileText,
  User,
  Building2,
  Calendar,
  AlertCircle,
  ShieldCheck,
  Download
} from 'lucide-react'
import { toast } from 'sonner'
import { sendTicketMessageAction, TicketAttachment } from '../../../actions/ticket-actions'
import { UserSession } from '../../../actions/auth-actions'

interface PublicTicket {
  id: string
  ticketCode: string
  title: string
  description: string
  category: string
  priority: string
  status: string
  isAnonymous: boolean
  reporterName: string | null
  targetUnitName: string
  attachments: TicketAttachment[] | null
  resolutionNotes: string | null
  resolvedAt: Date | null
  createdAt: Date
  updatedAt: Date
  canChat: boolean
  messages: Array<{
    id: string
    senderRole: string | null
    senderName: string
    message: string
    attachments: any
    createdAt: Date
  }>
}

export function TicketDetailClient({
  ticket,
  currentUser
}: {
  ticket: PublicTicket
  currentUser: UserSession | null
}) {
  const [messages, setMessages] = useState(ticket.messages)
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMessage.trim()) return

    setSending(true)
    try {
      const formData = new FormData()
      formData.append('ticketId', ticket.id)
      formData.append('message', newMessage.trim())
      formData.append('isInternal', 'false')

      const res = await sendTicketMessageAction(formData)
      if (res.success && res.message) {
        setMessages((prev) => [
          ...prev,
          {
            id: res.message.id,
            senderRole: res.message.senderRole,
            senderName: res.message.senderName,
            message: res.message.message,
            attachments: res.message.attachments,
            createdAt: res.message.createdAt
          }
        ])
        setNewMessage('')
        toast.success('Tanggapan terkirim.')
      } else {
        toast.error(res.error || 'Gagal mengirim pesan.')
      }
    } catch {
      toast.error('Terjadi gangguan saat mengirim tanggapan.')
    } finally {
      setSending(false)
    }
  }

  // Format Status Badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400">Menunggu Telaah</span>
      case 'IN_PROGRESS':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-500/15 text-blue-700 dark:text-blue-400">Sedang Ditelaah</span>
      case 'DISPATCHED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-700 dark:text-indigo-400">Didisposisikan ke Unit</span>
      case 'RESOLVED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400">Selesai Ditindaklanjuti</span>
      case 'CLOSED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-subtle text-ink-muted">Ditutup</span>
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-surface-subtle text-ink">{status}</span>
    }
  }

  // Calculate Progress Step
  const getStepIndex = (status: string) => {
    if (status === 'OPEN') return 1
    if (status === 'IN_PROGRESS') return 2
    if (status === 'DISPATCHED') return 3
    if (status === 'RESOLVED' || status === 'CLOSED') return 4
    return 1
  }

  const currentStep = getStepIndex(ticket.status)

  return (
    <div className="space-y-6">
      {/* ── Top Bar ── */}
      <div className="flex items-center justify-between">
        <Link
          href="/lapor"
          className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-brand transition-colors">
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Pusat Laporan</span>
        </Link>

        <span className="font-mono text-xs font-bold text-brand bg-brand/10 px-3 py-1 rounded-full border border-brand/20">
          {ticket.ticketCode}
        </span>
      </div>

      {/* ── Card Info Pokok Tiket ── */}
      <div className="bg-surface border border-line rounded-2xl p-5 sm:p-7 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-semibold bg-surface-subtle text-ink-muted border border-line">
                {ticket.category}
              </span>
              {getStatusBadge(ticket.status)}
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
              {ticket.title}
            </h1>
          </div>
        </div>

        {/* ── Visual Timeline Tracker ── */}
        <div className="p-4 sm:p-5 rounded-xl bg-surface-subtle/70 border border-line">
          <div className="grid grid-cols-4 gap-2 text-center">
            {[
              { num: 1, label: 'Terkirim' },
              { num: 2, label: 'Ditelaah' },
              { num: 3, label: 'Disposisi Lokus' },
              { num: 4, label: 'Selesai' }
            ].map((step) => {
              const isPastOrCurrent = currentStep >= step.num
              const isDone = currentStep > step.num || currentStep === 4
              return (
                <div key={step.num} className="space-y-1.5">
                  <div
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center mx-auto text-xs font-bold transition-all ${
                      isPastOrCurrent
                        ? 'bg-brand text-white shadow-2xs'
                        : 'bg-surface border border-line text-ink-muted'
                    }`}>
                    {isDone && step.num !== currentStep ? (
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    ) : (
                      step.num
                    )}
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs block font-medium ${
                      isPastOrCurrent ? 'text-ink font-semibold' : 'text-ink-muted'
                    }`}>
                    {step.label}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ── Metadata Info Strip ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-line text-xs">
          <div>
            <span className="text-[11px] text-ink-muted block">Tanggal Pengajuan</span>
            <span className="font-semibold text-ink">
              {new Date(ticket.createdAt).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric'
              })}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-ink-muted block">Tipe Pelapor</span>
            <span className="font-semibold text-ink">
              {ticket.isAnonymous ? 'Anonim (1 Arah)' : 'Pengguna Berakun'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-ink-muted block">Nama Pelapor</span>
            <span className="font-semibold text-ink truncate block">
              {ticket.reporterName || 'Warga Anonim'}
            </span>
          </div>

          <div>
            <span className="text-[11px] text-ink-muted block">Unit Terkait</span>
            <span className="font-semibold text-brand truncate block">
              {ticket.targetUnitName}
            </span>
          </div>
        </div>

        {/* ── Uraian Laporan ── */}
        <div className="space-y-2 pt-2 border-t border-line">
          <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
            Uraian Laporan
          </span>
          <p className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line bg-surface-subtle/50 p-4 rounded-xl border border-line/60">
            {ticket.description}
          </p>
        </div>

        {/* ── Berkas Lampiran ── */}
        {ticket.attachments && ticket.attachments.length > 0 && (
          <div className="space-y-2 pt-2 border-t border-line">
            <span className="text-xs font-bold uppercase tracking-wider text-ink-muted">
              Berkas Lampiran ({ticket.attachments.length})
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

        {/* ── Hasil Tindak Lanjut / Resume Resmi (Saat Selesai) ── */}
        {ticket.resolutionNotes && (
          <div className="p-4 sm:p-5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold text-xs uppercase tracking-wider">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Resume Resmi Penyelesaian</span>
            </div>
            <p className="text-xs sm:text-sm text-ink leading-relaxed whitespace-pre-line">
              {ticket.resolutionNotes}
            </p>
            {ticket.resolvedAt && (
              <span className="text-[10px] text-ink-muted block pt-1">
                Diselesaikan pada:{' '}
                {new Date(ticket.resolvedAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── Thread Komunikasi 2-Arah ATAU Banner Informasi Anonim ── */}
      {ticket.canChat ? (
        /* Two-Way Chat Thread Section */
        <div className="bg-surface border border-line rounded-2xl p-5 sm:p-7 shadow-xs space-y-5">
          <div className="flex items-center justify-between border-b border-line pb-3">
            <h2 className="text-sm font-bold text-ink">
              Diskusi &amp; Tanggapan Penanganan ({messages.length})
            </h2>
            <span className="text-[11px] text-ink-muted">Thread Interaktif Dua Arah</span>
          </div>

          <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <p className="text-xs text-ink-muted text-center py-6">
                Belum ada tanggapan lanjutan. Petugas akan memproses tiket ini segera.
              </p>
            ) : (
              messages.map((m) => {
                const isStaff = m.senderRole === 'SUPER_ADMIN' || m.senderRole === 'OPD'
                return (
                  <div
                    key={m.id}
                    className={`p-3.5 rounded-xl text-xs space-y-1.5 ${
                      isStaff
                        ? 'bg-brand/10 border border-brand/20 ml-2 sm:ml-6'
                        : 'bg-surface-subtle border border-line mr-2 sm:mr-6'
                    }`}>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-ink flex items-center gap-1.5">
                        {m.senderName}
                        {isStaff && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-brand text-white">
                            Petugas
                          </span>
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

          {/* Form Balasan */}
          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <form onSubmit={handleSendMessage} className="pt-2 flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Tuliskan tanggapan atau informasi tambahan..."
                className="flex-1 px-3.5 py-2.5 rounded-xl border border-line bg-surface text-xs text-ink placeholder:text-ink-muted focus:outline-none focus:border-brand"
                required
              />
              <button
                type="submit"
                disabled={sending}
                className="px-4 py-2.5 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-xs shrink-0 cursor-pointer disabled:opacity-50">
                <Send className="w-3.5 h-3.5" />
                <span>{sending ? '...' : 'Kirim'}</span>
              </button>
            </form>
          )}
        </div>
      ) : (
        /* Anonymous 1-Way Banner */
        <div className="p-4 rounded-xl bg-surface-subtle border border-line text-xs text-ink-muted leading-relaxed flex items-center gap-3">
          <Clock className="w-4 h-4 text-brand shrink-0" />
          <span>
            Laporan ini dikirim dalam mode <strong className="text-ink">Anonim (Satu Arah)</strong>. Petugas menindaklanjuti laporan secara internal, dan pembaruan progres serta resume penyelesaian akan diperbarui otomatis pada laman pelacakan ini.
          </span>
        </div>
      )}
    </div>
  )
}
