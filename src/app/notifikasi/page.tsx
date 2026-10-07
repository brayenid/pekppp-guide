'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import {
  Bell,
  Check,
  CheckCheck,
  ExternalLink,
  Loader2,
  ChevronDown
} from 'lucide-react'
import {
  getNotificationsAction,
  markAsReadAction,
  markAllAsReadAction,
  NotificationData
} from '../../actions/notification-actions'
import { getF01QuestionByNumber } from '../../lib/f01-parser'
import { PageHeader } from '../../components/ui/PageHeader'
import { Button } from '../../components/ui/Button'

function parseNotificationDetails(item: NotificationData) {
  const link = item.link || ''
  const message = item.message || ''
  const title = item.title || ''

  let targetItem: string | null = null
  let targetSlot: string | null = null
  let targetAnchor: string | null = null

  try {
    const urlParts = link.split('?')
    if (urlParts.length > 1) {
      const queryAndHash = urlParts[1].split('#')
      const params = new URLSearchParams(queryAndHash[0])
      targetItem = params.get('targetItem')
      targetSlot = params.get('targetSlot')
      if (queryAndHash.length > 1) {
        targetAnchor = queryAndHash[1]
      }
    } else {
      const hashParts = link.split('#')
      if (hashParts.length > 1) {
        targetAnchor = hashParts[1]
      }
    }
  } catch {
    // fallback
  }

  const indMatch =
    message.match(/Indikator\s*#?(\d+)/i) ||
    title.match(/Indikator\s*#?(\d+)/i) ||
    (targetAnchor ? targetAnchor.match(/soal-(\d+)/) : null)
  const indicatorNumber = indMatch ? indMatch[1] : null

  // Cari teks pertanyaan manusiawi jika targetItem ada
  let questionText: string | null = null
  if (indicatorNumber && targetItem) {
    const f01Q = getF01QuestionByNumber(parseInt(indicatorNumber, 10))
    const foundItem = f01Q?.items.find((it) => it.id === targetItem)
    if (foundItem) {
      questionText = foundItem.text
    }
  }

  const aspectMatch =
    title.match(/Aspek\s+([A-Za-z0-9]+)/i) ||
    message.match(/Aspek\s+([A-Za-z0-9]+)/i) ||
    (targetAnchor ? targetAnchor.match(/bukti-([A-Za-z0-9]+)/) : null)
  const aspect = aspectMatch ? aspectMatch[1] : null

  const docMatch = message.match(/"([^"]+)"/)
  const docTitle = docMatch ? docMatch[1] : null

  return {
    targetItem,
    questionText,
    targetSlot,
    targetAnchor,
    indicatorNumber,
    aspect,
    docTitle
  }
}

function NotificationContent() {
  const searchParams = useSearchParams()
  const openId = searchParams.get('openId')

  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const [categoryFilter, setCategoryFilter] = useState<'ALL' | 'REVISION' | 'F02' | 'F01' | 'DRIVE'>('ALL')

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())
  const scrolledRef = useRef<boolean>(false)

  const fetchNotifs = async () => {
    try {
      const res = await getNotificationsAction()
      setNotifications(res.notifications)

      if (openId && !scrolledRef.current) {
        setExpandedIds((prev) => new Set([...prev, openId]))
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifs()
  }, [openId])

  // Smart Polling berkala di halaman notifikasi
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchNotifs()
      }
    }, 25000)

    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchNotifs()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityOrFocus)
    window.addEventListener('focus', handleVisibilityOrFocus)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus)
      window.removeEventListener('focus', handleVisibilityOrFocus)
    }
  }, [])

  useEffect(() => {
    if (!loading && openId && !scrolledRef.current) {
      scrolledRef.current = true
      const timer = setTimeout(() => {
        const el = document.getElementById(`notif-item-${openId}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 200)
      return () => clearTimeout(timer)
    }
  }, [loading, openId])

  const toggleAccordion = (id: string, isRead: boolean) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })

    if (!isRead) {
      handleMarkRead(id)
    }
  }

  const handleMarkRead = async (id: string) => {
    await markAsReadAction(id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    )
  }

  const handleMarkAllRead = async () => {
    setActionLoading(true)
    await markAllAsReadAction()
    await fetchNotifs()
    setActionLoading(false)
  }

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'unread' && n.isRead) return false
    if (categoryFilter === 'REVISION') return n.type === 'F01_REVISION'
    if (categoryFilter === 'F02') return n.type === 'F02_UPDATE'
    if (categoryFilter === 'F01') return n.type === 'F01_UPDATE'
    if (categoryFilter === 'DRIVE') return n.type === 'PROOF_TRIGGER'
    return true
  })

  const unreadCount = notifications.filter((n) => !n.isRead).length

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'F01_REVISION':
        return (
          <span className="px-2.5 py-0.5 rounded-pill bg-amber-50 text-amber-800 font-semibold text-[10px] border border-amber-300">
            Revisi Pasca Penilaian
          </span>
        )
      case 'F01_UPDATE':
        return (
          <span className="px-2 py-0.5 rounded-pill bg-blue-50 text-blue-700 font-medium text-[10px] border border-blue-200">
            F01 OPD
          </span>
        )
      case 'F02_UPDATE':
        return (
          <span className="px-2.5 py-0.5 rounded-pill bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-300">
            Penilaian Evaluator (F02)
          </span>
        )
      case 'PROOF_TRIGGER':
        return (
          <span className="px-2 py-0.5 rounded-pill bg-violet-50 text-violet-700 font-medium text-[10px] border border-violet-200">
            Bukti Drive
          </span>
        )
      case 'COMMENT_UPDATE':
        return (
          <span className="px-2 py-0.5 rounded-pill bg-brand-light text-brand font-medium text-[10px] border border-brand/20">
            Catatan Diskusi
          </span>
        )
      default:
        return (
          <span className="px-2 py-0.5 rounded-pill bg-surface-subtle text-ink-muted text-[10px] border border-stroke/50">
            Info
          </span>
        )
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-16">
      {/* Header */}
      <PageHeader
        icon={<Bell className="w-5 h-5 text-brand" />}
        title="Pusat Notifikasi"
        description="Riwayat pembaruan Formulir F01, revisi pasca penilaian, penilaian evaluator F02, dan dokumen bukti dukung."
        actions={
          unreadCount > 0 ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={actionLoading}
              isLoading={actionLoading}
              leftIcon={<CheckCheck className="w-3.5 h-3.5 text-ink-muted" />}>
              Tandai Semua Dibaca ({unreadCount})
            </Button>
          ) : undefined
        }
      />

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-surface p-2.5 rounded-2xl border border-stroke/50 shadow-2xs">
        <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-medium transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-brand text-white shadow-hz-button font-semibold'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-subtle'
            }`}>
            Semua ({notifications.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('unread')}
            className={`px-3.5 py-1.5 rounded-pill text-xs font-medium transition-all flex items-center gap-1.5 cursor-pointer ${
              filter === 'unread'
                ? 'bg-brand text-white shadow-hz-button font-semibold'
                : 'text-ink-secondary hover:text-ink hover:bg-surface-subtle'
            }`}>
            <span>Belum Dibaca</span>
            {unreadCount > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-medium ${
                  filter === 'unread' ? 'bg-white/20 text-white' : 'bg-surface-subtle text-ink-muted'
                }`}>
                {unreadCount}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] text-ink-muted hidden md:inline">Kategori:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs rounded-full border border-stroke/60 bg-surface text-ink focus:outline-none focus:border-brand cursor-pointer shadow-2xs">
            <option value="ALL">Semua Kategori</option>
            <option value="REVISION">⚠️ Revisi Pasca Penilaian</option>
            <option value="F02">Penilaian Evaluator (F02)</option>
            <option value="F01">Isian F01 OPD</option>
            <option value="DRIVE">Bukti Drive</option>
          </select>
          <span className="text-[11px] text-ink-muted hidden sm:inline pl-2 border-l border-stroke/40 font-mono">
            {filteredNotifications.length} Notifikasi
          </span>
        </div>
      </div>

      {/* Notification List with Accordion */}
      {loading ? (
        <div className="p-16 text-center space-y-3 bg-surface rounded-2xl border border-stroke/40 shadow-2xs">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
          <p className="text-xs text-ink-secondary font-medium">Memuat riwayat notifikasi...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div className="rounded-2xl border border-stroke/50 bg-surface p-12 text-center space-y-3 shadow-2xs">
          <Bell className="w-10 h-10 text-ink-muted mx-auto opacity-30" />
          <div>
            <h3 className="font-semibold text-sm text-ink">Tidak Ada Notifikasi</h3>
            <p className="text-xs text-ink-muted mt-1">
              {filter === 'unread'
                ? 'Seluruh notifikasi telah selesai Anda baca.'
                : 'Belum ada aktivitas tercatat pada sistem.'}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredNotifications.map((item) => {
            const isExpanded = expandedIds.has(item.id)
            const isTargeted = openId === item.id
            const details = parseNotificationDetails(item)

            return (
              <div
                key={item.id}
                id={`notif-item-${item.id}`}
                className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                  isTargeted
                    ? 'ring-2 ring-brand/60 shadow-soft-float border-brand bg-surface'
                    : item.isRead
                    ? 'bg-surface border-stroke/50 hover:border-stroke hover:shadow-2xs'
                    : 'bg-surface-elevated border-brand/40 shadow-soft-card'
                }`}>
                {/* Clickable Header Row / Accordion Trigger */}
                <div
                  onClick={() => toggleAccordion(item.id, item.isRead)}
                  className="p-4 sm:p-4.5 flex items-start sm:items-center justify-between gap-3 cursor-pointer hover:bg-surface-subtle/50 transition-colors select-none">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      {getTypeBadge(item.type)}
                      <span className="text-[11px] text-ink-muted font-mono">
                        {new Date(item.createdAt).toLocaleString('id-ID', {
                          dateStyle: 'medium',
                          timeStyle: 'short'
                        })}
                      </span>
                      {!item.isRead && (
                        <span className="px-2 py-0.5 rounded-pill bg-brand text-white text-[10px] font-semibold tracking-wide shadow-2xs">
                          Baru
                        </span>
                      )}
                      {isTargeted && (
                        <span className="px-2 py-0.5 rounded-pill bg-brand-light text-brand text-[10px] font-semibold border border-brand/20">
                          Dipilih
                        </span>
                      )}
                    </div>

                    <h4 className="font-semibold text-xs sm:text-sm text-ink leading-snug">
                      {item.title}
                    </h4>
                    <p className="text-xs text-ink-secondary leading-relaxed line-clamp-2">
                      {item.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-start sm:self-center mt-1 sm:mt-0">
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkRead(item.id)
                        }}
                        className="p-1.5 rounded-full text-ink-muted hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                        title="Tandai Sudah Dibaca">
                        <Check className="w-4 h-4" />
                      </button>
                    )}

                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all ${
                        isExpanded
                          ? 'bg-brand text-white border-brand rotate-180 shadow-2xs'
                          : 'bg-surface-subtle border-stroke/50 text-ink-muted'
                      }`}>
                      <ChevronDown className="w-4 h-4 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Accordion Expanded Detail Panel */}
                {isExpanded && (
                  <div className="px-4 pb-4 sm:px-5 sm:pb-5 pt-3 border-t border-stroke/40 bg-surface-subtle/30 space-y-3.5 animate-fade-in-content">
                    {/* Detail Breakdown Box */}
                    <div className="p-4 rounded-xl bg-surface border border-stroke/50 space-y-3">
                      <div className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                        Rincian Pembaruan
                      </div>

                      <div className="space-y-2.5 text-xs">
                        {/* Target Indikator */}
                        {details.indicatorNumber && (
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-2.5 rounded-lg bg-surface-subtle/70 border border-stroke/40">
                            <span className="text-[11px] text-ink-muted font-medium min-w-[130px] shrink-0">
                              Indikator Target:
                            </span>
                            <span className="font-semibold text-ink">
                              Indikator #{details.indicatorNumber}
                            </span>
                          </div>
                        )}

                        {/* Pertanyaan Spesifik F01 yang diubah */}
                        {(details.questionText || details.targetItem) && (
                          <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-2.5 rounded-lg bg-surface-subtle/70 border border-stroke/40">
                            <span className="text-[11px] text-ink-muted font-medium min-w-[130px] shrink-0">
                              Pertanyaan F01 Diubah:
                            </span>
                            <div className="space-y-1 flex-1">
                              {details.questionText ? (
                                <p className="font-semibold text-ink leading-relaxed">
                                  {details.questionText}
                                </p>
                              ) : (
                                <p className="font-semibold text-ink">
                                  Butir formulir F01
                                </p>
                              )}
                              {details.targetItem && (
                                <span className="text-[10px] text-ink-muted font-mono inline-block">
                                  (Kode input: {details.targetItem})
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Aspek Matriks Bukti */}
                        {details.aspect && (
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-2.5 rounded-lg bg-surface-subtle/70 border border-stroke/40">
                            <span className="text-[11px] text-ink-muted font-medium min-w-[130px] shrink-0">
                              Aspek Evaluasi:
                            </span>
                            <span className="font-semibold text-ink">
                              Aspek {details.aspect}
                            </span>
                          </div>
                        )}

                        {/* Nama Dokumen Bukti Dukung */}
                        {details.docTitle && (
                          <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 p-2.5 rounded-lg bg-surface-subtle/70 border border-stroke/40">
                            <span className="text-[11px] text-ink-muted font-medium min-w-[130px] shrink-0">
                              Dokumen Bukti:
                            </span>
                            <span className="font-semibold text-ink">
                              &ldquo;{details.docTitle}&rdquo;
                            </span>
                          </div>
                        )}

                        {/* Pesan Notifikasi Lengkap */}
                        <div className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3 p-2.5 rounded-lg bg-surface-subtle/50 border border-stroke/30">
                          <span className="text-[11px] text-ink-muted font-medium min-w-[130px] shrink-0">
                            Ringkasan Notifikasi:
                          </span>
                          <p className="text-xs text-ink-secondary leading-relaxed flex-1">
                            {item.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Action Footer */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
                      <p className="text-[11px] text-ink-muted">
                        Buka lembar kerja untuk meninjau secara langsung dengan penanda highlight ring.
                      </p>

                      {item.link ? (
                        <Link
                          href={item.link}
                          onClick={() => {
                            if (!item.isRead) handleMarkRead(item.id)
                          }}
                          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shadow-hz-button shrink-0">
                          <span>Buka Lembar Evaluasi Lokus</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      ) : (
                        <span className="text-xs text-ink-muted italic">Tautan lokus tidak tersedia.</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function NotifikasiPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-5xl mx-auto p-16 text-center space-y-3 bg-surface rounded-2xl border border-stroke/40 shadow-2xs">
          <Loader2 className="w-8 h-8 animate-spin text-brand mx-auto" />
          <p className="text-xs text-ink-secondary font-medium">Memuat Pusat Notifikasi...</p>
        </div>
      }>
      <NotificationContent />
    </Suspense>
  )
}

