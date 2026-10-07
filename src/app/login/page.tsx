'use client'

import { useState } from 'react'
import { loginAction } from '../../actions/auth-actions'
import { useRouter } from 'next/navigation'
import { Mail, Lock, ArrowRight, Check, UserCheck } from 'lucide-react'
import { toast } from 'sonner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData()
    formData.append('email', email)
    formData.append('password', password)
    try {
      const res = await loginAction(formData)
      if (res.success) {
        toast.success(`Selamat datang, ${res.user?.fullName}!`)
        if (res.user?.role === 'OPD') {
          router.push('/opd')
        } else {
          router.push('/admin')
        }
        router.refresh()
      } else {
        toast.error(res.error || 'Login gagal.')
      }
    } catch {
      toast.error('Terjadi kesalahan sistem.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md bg-surface border border-stroke/50 rounded-bento p-6 sm:p-8 shadow-soft-card space-y-6">
        {/* Brand Header */}
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand flex items-center justify-center text-white font-bold text-base shadow-hz-button">
              P
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-base tracking-tight text-ink">PEKPPP.ext</span>
              <span className="text-[11px] font-medium tracking-wider text-ink-muted">Kutai Barat</span>
            </div>
          </div>
          <div className="pt-2">
            <h1 className="text-2xl font-normal text-ink tracking-tight">Masuk ke Portal</h1>
            <p className="text-xs text-ink-muted mt-1">
              Akses sistem evaluasi pelayanan publik terpadu Kabupaten Kutai Barat.
            </p>
          </div>
        </div>

        {/* Demo Credentials Pill Box */}
        <div className="p-4 rounded-2xl bg-surface-subtle/50 border border-stroke/40 space-y-3">
          <p className="text-[10px] font-mono uppercase tracking-wider text-ink-muted font-medium">
            Kredensial Demo - Klik untuk Mengisi Otomatis
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => fillDemo('admin@kubar.go.id', 'admin123')}
              className="p-3 rounded-xl bg-surface border border-stroke/60 hover:border-brand/50 hover:bg-surface-subtle text-left transition-all group cursor-pointer shadow-2xs">
              <div className="text-xs font-medium text-ink group-hover:text-brand transition-colors">Super Admin</div>
              <div className="text-[10px] font-mono text-ink-muted mt-0.5">admin@kubar.go.id</div>
            </button>
            <button
              type="button"
              onClick={() => fillDemo('opd@kubar.go.id', 'opd123')}
              className="p-3 rounded-xl bg-surface border border-stroke/60 hover:border-brand/50 hover:bg-surface-subtle text-left transition-all group cursor-pointer shadow-2xs">
              <div className="text-xs font-medium text-ink group-hover:text-brand transition-colors">Akun OPD</div>
              <div className="text-[10px] font-mono text-ink-muted mt-0.5">opd@kubar.go.id</div>
            </button>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink">
              Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@kubar.go.id"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stroke/60 text-xs text-ink placeholder:text-ink-muted bg-surface focus:outline-none focus:border-brand transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-ink">
              Kata Sandi
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stroke/60 text-xs text-ink placeholder:text-ink-muted bg-surface focus:outline-none focus:border-brand transition-all shadow-2xs"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-full bg-brand hover:bg-brand-hover disabled:opacity-50 text-white font-medium text-xs transition-all shadow-hz-button flex items-center justify-center gap-2 cursor-pointer">
            {loading ? (
              'Memverifikasi...'
            ) : (
              <>
                <span>Masuk ke Sistem</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
