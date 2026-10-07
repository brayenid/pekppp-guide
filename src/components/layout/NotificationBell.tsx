'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Bell, Check, CheckCheck, ExternalLink, Loader2 } from 'lucide-react'
import { getNotificationsAction, markAsReadAction, markAllAsReadAction, NotificationData } from '../../actions/notification-actions'
import { usePathname } from 'next/navigation'

export function NotificationBell() {
  const pathname = usePathname()
  const [notifications, setNotifications] = useState<NotificationData[]>([])
  const [unreadCount, setUnreadCount] = useState<number>(0)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const fetchNotifications = async () => {
    try {
      const res = await getNotificationsAction()
      setNotifications(res.notifications)
      setUnreadCount(res.unreadCount)
    } catch {
      // ignore auth error when logged out
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [pathname])

  // Smart Polling: fetch rutin setiap 25 detik & saat window kembali aktif/fokus
  useEffect(() => {
    // 1. Interval berkala
    const interval = setInterval(() => {
      // Hanya fetch jika halaman sedang dibuka / aktif (hemat resource)
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchNotifications()
      }
    }, 25000)

    // 2. Fetch instan saat tab dibuka kembali atau jendela mendapat fokus
    const handleVisibilityOrFocus = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        fetchNotifications()
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

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleMarkAsRead = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    await markAsReadAction(id)
    fetchNotifications()
  }

  const handleMarkAllRead = async () => {
    setLoading(true)
    await markAllAsReadAction()
    await fetchNotifications()
    setLoading(false)
  }

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'F01_REVISION':
        return (
          <span className="px-2 py-0.5 rounded-pill bg-amber-50 text-amber-700 font-semibold text-[10px] border border-amber-300">
            ⚠️ Revisi Pasca Nilai
          </span>
        )
      case 'F01_UPDATE':
        return <span className="px-2 py-0.5 rounded-pill bg-surface-subtle text-ink font-medium text-[10px] border border-stroke/50">F01 OPD</span>
      case 'F02_UPDATE':
        return (
          <span className="px-2 py-0.5 rounded-pill bg-emerald-50 text-emerald-700 font-semibold text-[10px] border border-emerald-300">
            Penilaian F02
          </span>
        )
      case 'PROOF_TRIGGER':
        return <span className="px-2 py-0.5 rounded-pill bg-surface-subtle text-ink font-medium text-[10px] border border-stroke/50">Bukti Drive</span>
      case 'COMMENT_UPDATE':
        return <span className="px-2 py-0.5 rounded-pill bg-brand-light text-brand font-medium text-[10px] border border-brand/20">Catatan Diskusi</span>
      default:
        return <span className="px-2 py-0.5 rounded-pill bg-surface-subtle text-ink-muted text-[10px] border border-stroke/50">Info</span>
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        type="button"
        onClick={() => {
          const next = !isOpen
          setIsOpen(next)
          if (next) fetchNotifications()
        }}
        className="relative w-10 h-10 rounded-full bg-surface-elevated hover:bg-surface-subtle border border-stroke/60 text-ink-secondary hover:text-ink flex items-center justify-center transition-all cursor-pointer shadow-soft-card"
        title="Notifikasi">
        <Bell className="w-4 h-4 text-ink-muted group-hover:text-ink" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-brand text-white text-[10px] font-mono font-bold flex items-center justify-center border-2 border-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Overlay */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-80 sm:w-96 bg-surface border border-stroke/50 rounded-2xl shadow-soft-float z-50 overflow-hidden flex flex-col max-h-[500px] animate-fade-in-content">
          {/* Dropdown Header */}
          <div className="px-4 py-3 bg-surface-subtle/40 border-b border-stroke/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-ink uppercase tracking-wider">Notifikasi</span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-brand text-white text-[10px] font-mono font-medium shadow-2xs">
                  {unreadCount} Baru
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                disabled={loading}
                className="text-[11px] text-ink-secondary hover:text-brand transition-colors font-medium flex items-center gap-1 disabled:opacity-50 cursor-pointer">
                {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCheck className="w-3.5 h-3.5" />}
                <span>Tandai Semua Dibaca</span>
              </button>
            )}
          </div>

          {/* List Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-stroke/50">
            {notifications.length === 0 ? (
              <div className="p-8 text-center space-y-1.5">
                <Bell className="w-6 h-6 text-ink-muted mx-auto opacity-40" />
                <p className="text-xs text-ink-muted font-medium">Belum ada notifikasi.</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleMarkAsRead(n.id)}
                  className={`p-3.5 hover:bg-surface-subtle/70 transition-colors flex items-start gap-3 cursor-pointer ${
                    !n.isRead ? 'bg-brand-light/30' : 'bg-surface-elevated'
                  }`}>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between gap-1">
                      {getTypeBadge(n.type)}
                      <span className="text-[10px] font-mono text-ink-muted">
                        {new Date(n.createdAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>

                    <p className="text-xs font-semibold text-ink leading-snug">{n.title}</p>
                    <p className="text-[11px] text-ink-secondary leading-relaxed">{n.message}</p>

                    {n.link && (
                      <Link
                        href={`/notifikasi?openId=${n.id}`}
                        onClick={(e) => {
                          e.stopPropagation()
                          handleMarkAsRead(n.id)
                          setIsOpen(false)
                        }}
                        className="inline-flex items-center gap-1 text-[11px] font-medium text-brand hover:text-brand-hover pt-0.5">
                        <span>Lihat Rincian</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </Link>
                    )}
                  </div>

                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={(e) => handleMarkAsRead(n.id, e)}
                      title="Tandai telah dibaca"
                      className="p-1 rounded-full text-ink-muted hover:text-emerald-600 hover:bg-surface-subtle transition-colors shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Dropdown Footer */}
          <div className="p-2.5 bg-surface-subtle/50 border-t border-stroke/40 text-center">
            <Link
              href="/notifikasi"
              onClick={() => setIsOpen(false)}
              className="text-xs font-semibold text-brand hover:text-brand-hover transition-colors inline-flex items-center justify-center gap-1.5 py-1 w-full rounded-lg hover:bg-surface-subtle">
              <span>Buka Pusat Notifikasi Lengkap</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

