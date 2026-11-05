'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Mail,
  Lock,
  ArrowRight,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles
} from 'lucide-react'
import { toast } from 'sonner'
import { loginAction } from '../../actions/auth-actions'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [activeDemo, setActiveDemo] = useState<'admin' | 'opd' | null>(null)
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
        toast.error(res.error || 'Email atau kata sandi tidak sesuai.')
      }
    } catch {
      toast.error('Terjadi gangguan saat memproses login.')
    } finally {
      setLoading(false)
    }
  }

  const fillDemo = (role: 'admin' | 'opd', demoEmail: string, demoPass: string) => {
    setEmail(demoEmail)
    setPassword(demoPass)
    setActiveDemo(role)
  }

  return (
    <div className="h-screen max-h-screen w-full flex flex-col lg:grid lg:grid-cols-12 bg-canvas font-sans overflow-y-auto lg:overflow-hidden">
      {/* ── LEFT COLUMN: Login Form & Authenticated Panel (5 Cols) ── */}
      <div className="lg:col-span-5 xl:col-span-5 flex flex-col justify-between p-6 sm:p-8 lg:p-8 xl:p-10 bg-surface border-r border-line h-full overflow-y-auto lg:overflow-hidden">
        {/* Top Bar: Back Link */}
        <div className="flex items-center justify-between gap-3 shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted hover:text-brand transition-colors group">
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>

        {/* Center: Auth Card & Form */}
        <div className="my-auto py-3 sm:py-4 max-w-sm sm:max-w-md w-full mx-auto space-y-4">
          {/* Logo & Headline */}
          <div className="space-y-2.5 text-left">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-surface border border-line p-1.5 flex items-center justify-center shadow-xs shrink-0">
                <Image
                  src="/kubar.png"
                  alt="Logo Kutai Barat"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-base sm:text-lg tracking-tight text-ink font-sans">
                  PEKPPP<span className="text-brand">.ext</span>
                </span>
                <span className="text-[11px] text-ink-muted">
                  Kabupaten Kutai Barat
                </span>
              </div>
            </div>

            <div className="pt-1">
              <h1 className="text-xl sm:text-2xl font-bold text-ink tracking-tight">
                Masuk ke Portal
              </h1>
              <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                Pusat kendali evaluasi pelayanan publik terpadu, asistensi eviden digital, dan penetapan nilai IPP.
              </p>
            </div>
          </div>

          {/* Quick Demo Credentials Switcher */}
          <div className="p-3 rounded-xl bg-surface-subtle/70 border border-line space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-ink-muted flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Kredensial Demo Cepat</span>
              </span>
              <span className="text-[10px] text-ink-muted">Klik untuk isi</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fillDemo('admin', 'admin@kubar.go.id', 'admin123')}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  activeDemo === 'admin'
                    ? 'bg-brand/10 border-brand text-brand shadow-xs'
                    : 'bg-surface border-line hover:border-brand/40 hover:bg-surface-subtle text-ink'
                }`}>
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Super Admin</span>
                  {activeDemo === 'admin' && <CheckCircle2 className="w-3 h-3 text-brand" />}
                </div>
                <div className="text-[10px] text-ink-muted font-mono truncate mt-0.5">
                  admin@kubar.go.id
                </div>
              </button>

              <button
                type="button"
                onClick={() => fillDemo('opd', 'opd@kubar.go.id', 'opd123')}
                className={`p-2 rounded-lg border text-left transition-all cursor-pointer ${
                  activeDemo === 'opd'
                    ? 'bg-brand/10 border-brand text-brand shadow-xs'
                    : 'bg-surface border-line hover:border-brand/40 hover:bg-surface-subtle text-ink'
                }`}>
                <div className="text-xs font-semibold flex items-center justify-between">
                  <span>Unit Lokus (OPD)</span>
                  {activeDemo === 'opd' && <CheckCircle2 className="w-3 h-3 text-brand" />}
                </div>
                <div className="text-[10px] text-ink-muted font-mono truncate mt-0.5">
                  opd@kubar.go.id
                </div>
              </button>
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold text-ink">
                Alamat Email
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value)
                    setActiveDemo(null)
                  }}
                  placeholder="nama@kutaibaratkab.go.id"
                  className="w-full pl-9 pr-3.5 py-2 sm:py-2.5 rounded-xl border border-line text-xs sm:text-sm text-ink placeholder:text-ink-muted bg-surface focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all shadow-2xs"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[11px] font-semibold text-ink">
                  Kata Sandi
                </label>
              </div>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 text-ink-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value)
                    setActiveDemo(null)
                  }}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-9 py-2 sm:py-2.5 rounded-xl border border-line text-xs sm:text-sm text-ink placeholder:text-ink-muted bg-surface focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/10 transition-all shadow-2xs"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-muted hover:text-ink p-1 rounded-md transition-colors"
                  title={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-xl bg-brand hover:bg-brand-hover active:scale-[0.99] disabled:opacity-50 text-white font-semibold text-xs sm:text-sm transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-1">
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Memverifikasi Akun...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Portal</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Help Notice */}
          <p className="text-[11px] text-ink-muted text-center leading-relaxed">
            Kendala akses atau lupa sandi? Hubungi tim administrator di{' '}
            <span className="font-semibold text-ink">Bagian Organisasi Setdakab</span>.
          </p>
        </div>

        {/* Bottom Footer Information */}
        <div className="pt-3 border-t border-line text-[11px] text-ink-muted flex items-center justify-between gap-2 shrink-0">
          <span>&copy; {new Date().getFullYear()} Pemerintah Kabupaten Kutai Barat</span>
        </div>
      </div>

      {/* ── RIGHT COLUMN: Immersive Landmark Canvas (7 Cols) ── */}
      <div className="hidden lg:relative lg:col-span-7 xl:col-span-7 lg:flex flex-col justify-between p-8 xl:p-10 overflow-hidden bg-[#0A2652] text-white lg:m-2.5 xl:m-3 rounded-2xl xl:rounded-3xl border border-white/10 shadow-xl h-[calc(100vh-1.25rem)] xl:h-[calc(100vh-1.5rem)]">
        {/* Full Bleed Image using kantor.png */}
        <div className="absolute inset-0 z-0">
          <Image
            src="/kantor.png"
            alt="Kantor Bupati Sendawar Kabupaten Kutai Barat"
            fill
            priority
            className="object-cover object-center scale-102 hover:scale-105 transition-transform duration-1000 ease-out"
          />
          {/* Deep cinematic overlay for contrast and prestige */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#061833]/95 via-[#061833]/45 to-[#061833]/25" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#061833]/60 via-transparent to-transparent" />
        </div>

        {/* Top Header Floating Badge */}
        <div className="relative z-10 flex items-center justify-end">
          <span className="text-xs font-mono text-sky-100/90 bg-black/30 backdrop-blur-xs px-3 py-1 rounded-full border border-white/15">
            Bumi Tanaa Purai Ngeriman
          </span>
        </div>

        {/* Bottom Editorial Showcase - Clean text without container box */}
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl xl:text-3xl font-bold text-white tracking-tight leading-snug drop-shadow-md">
              Sistem Evaluasi Mandiri Kinerja Pelayanan Publik (PEKPPP)
            </h2>
            <p className="text-xs sm:text-sm text-sky-100/90 leading-relaxed font-normal drop-shadow-sm max-w-lg">
              Portal terpadu pelaksanaan Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik (PEKPPP) di lingkungan Pemerintah Kabupaten Kutai Barat.
            </p>
          </div>

          {/* Slogan Ribbon */}
          <div className="pt-3 flex items-center justify-between text-xs text-sky-200/90 border-t border-white/20">
            <span className="italic font-medium">Sempekat Bersama Kita Pasti Bisa</span>
            <span className="font-mono text-white/90">PEKPPP {new Date().getFullYear()}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

