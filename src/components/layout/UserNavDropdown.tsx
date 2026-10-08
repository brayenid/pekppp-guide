'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { LayoutDashboard, Bell, LogOut, ChevronDown, Key, Eye, EyeOff, CheckCircle2, Moon, Sun, Monitor } from 'lucide-react'
import { UserSession, logoutAction, updateOwnPasswordAction } from '../../actions/auth-actions'
import { FormModal } from '../ui/FormModal'
import { Button } from '../ui/Button'
import { toast } from 'sonner'

export function UserNavDropdown({ user }: { user: UserSession }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 3-way Theme Mode state: 'system' | 'dark' | 'light'
  const [themeMode, setThemeMode] = useState<'system' | 'dark' | 'light'>('system')

  const applyTheme = (mode: 'system' | 'dark' | 'light') => {
    setThemeMode(mode)
    try {
      localStorage.setItem('pekppp-theme', mode)
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      const isDark = mode === 'dark' || (mode === 'system' && systemDark)
      if (isDark) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    } catch {}
  }

  useEffect(() => {
    try {
      const stored = (localStorage.getItem('pekppp-theme') as 'system' | 'dark' | 'light') || 'system'
      setThemeMode(stored)
    } catch {}

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = () => {
      try {
        const stored = (localStorage.getItem('pekppp-theme') as 'system' | 'dark' | 'light') || 'system'
        if (stored === 'system') {
          if (mediaQuery.matches) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      } catch {}
    }
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // Password Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const dashboardHref = user.role === 'SUPER_ADMIN' ? '/admin' : '/opd'
  const dashboardLabel = user.role === 'SUPER_ADMIN' ? 'Admin Dashboard' : 'Dashboard OPD'

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

  const resetPasswordForm = () => {
    setIsPasswordModalOpen(false)
    setNewPassword('')
    setConfirmPassword('')
    setShowPassword(false)
    setShowConfirmPassword(false)
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newPassword.trim() || newPassword.trim().length < 4) {
      toast.error('Password minimal 4 karakter.')
      return
    }

    if (newPassword.trim() !== confirmPassword.trim()) {
      toast.error('Konfirmasi password tidak cocok.')
      return
    }

    setLoading(true)
    try {
      const res = await updateOwnPasswordAction(newPassword.trim())
      if (res.success) {
        toast.success('Password berhasil diperbarui!')
        resetPasswordForm()
      } else {
        toast.error(res.error || 'Gagal memperbarui password.')
      }
    } catch {
      toast.error('Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Simplified Compact Profile Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 bg-surface-elevated hover:bg-surface-subtle border border-stroke/60 p-1 pr-2.5 rounded-full transition-all cursor-pointer shadow-soft-card group">
        <div className="w-7 h-7 rounded-full bg-brand-light text-brand border border-brand/20 flex items-center justify-center text-xs font-semibold shrink-0 shadow-2xs">
          {user.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
        </div>

        <span className="font-medium text-xs text-ink max-w-[100px] sm:max-w-[130px] truncate hidden sm:inline-block">
          {user.fullName?.split(' ')[0] || user.fullName}
        </span>

        <ChevronDown className={`w-3.5 h-3.5 text-ink-muted group-hover:text-ink transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Refined Dropdown Menu Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-64 bg-surface border border-stroke/50 rounded-2xl shadow-soft-float z-50 overflow-hidden animate-fade-in-content">
          {/* User Header Info inside dropdown */}
          <div className="px-4 py-3 border-b border-stroke/40 bg-surface-subtle/40">
            <div className="flex items-center justify-between gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-wider text-ink-muted font-semibold">Akun Terhubung</span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-brand-light text-brand border border-brand/20">
                {user.role === 'SUPER_ADMIN' ? 'Evaluator' : 'OPD'}
              </span>
            </div>
            <p className="font-medium text-xs text-ink truncate">{user.fullName}</p>
            <p className="text-[11px] text-ink-muted truncate">{user.email}</p>
          </div>

          {/* Menu Items */}
          <div className="p-1 space-y-0.5">
            <Link
              href={dashboardHref}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink hover:bg-surface-subtle transition-colors">
              <LayoutDashboard className="w-4 h-4 text-ink-muted" />
              <span>{dashboardLabel}</span>
            </Link>

            <Link
              href="/notifikasi"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink-secondary hover:bg-surface-subtle hover:text-ink transition-colors">
              <Bell className="w-4 h-4 text-ink-muted" />
              <span>Pusat Notifikasi</span>
            </Link>

            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                setIsPasswordModalOpen(true)
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-ink-secondary hover:bg-surface-subtle hover:text-ink transition-colors text-left cursor-pointer">
              <Key className="w-4 h-4 text-ink-muted" />
              <span>Ubah Password</span>
            </button>

            {/* 3-way Theme Switcher (System, Dark, Light) */}
            <div className="px-3 py-2 space-y-1.5 border-t border-stroke/40 my-0.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-medium text-ink-muted">Tema Tampilan</span>
                <span className="text-[10px] text-brand font-medium">
                  {themeMode === 'system' ? 'Sistem' : themeMode === 'dark' ? 'Gelap' : 'Terang'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 bg-surface-subtle/80 p-0.5 rounded-xl border border-stroke/50">
                <button
                  type="button"
                  onClick={() => applyTheme('light')}
                  className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    themeMode === 'light'
                      ? 'bg-card text-ink shadow-2xs font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                  title="Mode Terang">
                  <Sun className={`w-3.5 h-3.5 ${themeMode === 'light' ? 'text-amber-500' : 'text-ink-muted'}`} />
                  <span className="text-[11px]">Terang</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme('dark')}
                  className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    themeMode === 'dark'
                      ? 'bg-card text-ink shadow-2xs font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                  title="Mode Gelap">
                  <Moon className={`w-3.5 h-3.5 ${themeMode === 'dark' ? 'text-brand' : 'text-ink-muted'}`} />
                  <span className="text-[11px]">Gelap</span>
                </button>
                <button
                  type="button"
                  onClick={() => applyTheme('system')}
                  className={`flex items-center justify-center gap-1 py-1 px-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    themeMode === 'system'
                      ? 'bg-card text-ink shadow-2xs font-semibold'
                      : 'text-ink-muted hover:text-ink'
                  }`}
                  title="Ikuti Sistem">
                  <Monitor className={`w-3.5 h-3.5 ${themeMode === 'system' ? 'text-brand' : 'text-ink-muted'}`} />
                  <span className="text-[11px]">Sistem</span>
                </button>
              </div>
            </div>
          </div>

          {/* Divider & Logout */}
          <div className="p-1 border-t border-stroke/40 mt-0.5">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false)
                logoutAction()
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-600 hover:bg-pastel-rose transition-colors text-left cursor-pointer">
              <LogOut className="w-4 h-4 text-rose-500" />
              <span>Keluar (Logout)</span>
            </button>
          </div>
        </div>
      )}

      {/* Edit Password Modal */}
      <FormModal
        isOpen={isPasswordModalOpen}
        title="Ubah Password Akun"
        description="Masukkan password baru untuk akun Anda (minimal 4 karakter)."
        onClose={resetPasswordForm}>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 pt-1">
          <div className="space-y-3">
            {/* Password Baru */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-ink-secondary">Password Baru</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Masukkan password baru"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-brand shadow-2xs pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 cursor-pointer">
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Konfirmasi Password */}
            <div className="space-y-1">
              <label className="block text-xs font-medium text-ink-secondary">Konfirmasi Password Baru</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Ketik ulang password baru"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-stroke/60 bg-surface text-ink placeholder:text-ink-muted/50 focus:outline-none focus:border-brand shadow-2xs pr-9"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 cursor-pointer">
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-[11px] text-rose-500 mt-0.5">Password belum cocok.</p>
              )}
              {confirmPassword && newPassword === confirmPassword && (
                <p className="text-[11px] text-emerald-600 mt-0.5 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Password cocok.
                </p>
              )}
            </div>
          </div>

          <div className="pt-3 flex justify-end gap-2.5 border-t border-stroke/40">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={resetPasswordForm}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              isLoading={loading}>
              Simpan Password
            </Button>
          </div>
        </form>
      </FormModal>
    </div>
  )
}

