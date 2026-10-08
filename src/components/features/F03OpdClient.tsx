'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Users,
  CheckCircle2,
  ChevronRight,
  AlertCircle,
  ArrowLeft,
  FolderHeart,
  Folder,
  ExternalLink,
  QrCode,
  Download,
  Copy,
  Check,
  Globe,
  Share2,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Smartphone
} from 'lucide-react'
import QRCode from 'qrcode'
import {
  updateF03ProofUrlAction,
  togglePublicSurveyAction
} from '../../actions/f03-actions'
import { toast } from 'sonner'

interface F03SchemaCategory {
  kategori_romawi: string
  kategori: string
  indikator: Array<{
    no_urut: number
    kode: string
    isu: string
    skala_nilai: number[]
  }>
}

interface F03RespondentData {
  id: string
  respondentNo: number
  name?: string | null
  submittedVia?: string
  answers: Record<string, number>
  totalScore: number
  scale5: number
  createdAt: Date
}

export function F03OpdClient({
  evaluationId,
  unitId,
  unitName,
  targetQuota,
  isPeriodOpen,
  schema,
  respondents,
  initialProofUrl,
  publicSurveyToken,
  initialIsPublicSurveyOpen = true
}: {
  evaluationId: string
  unitId: string
  unitName: string
  targetQuota: number
  isPeriodOpen: boolean
  schema: { kategori_penilaian: F03SchemaCategory[] }
  respondents: F03RespondentData[]
  initialProofUrl?: string | null
  publicSurveyToken?: string | null
  initialIsPublicSurveyOpen?: boolean
}) {
  const [loading, setLoading] = useState(false)

  // Proof URL state
  const [proofUrl, setProofUrl] = useState(initialProofUrl || '')
  const [savingProof, setSavingProof] = useState(false)

  // QR & Public Survey State
  const [isSurveyOpen, setIsSurveyOpen] = useState(initialIsPublicSurveyOpen)
  const [togglingSurvey, setTogglingSurvey] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [copiedLink, setCopiedLink] = useState(false)
  const [fullSurveyUrl, setFullSurveyUrl] = useState('')

  useEffect(() => {
    if (typeof window !== 'undefined' && publicSurveyToken) {
      const url = `${window.location.origin}/survei/${publicSurveyToken}`
      setFullSurveyUrl(url)

      QRCode.toDataURL(url, {
        width: 600,
        margin: 2,
        color: {
          dark: '#1e293b',
          light: '#ffffff'
        }
      })
        .then((dataUrl) => {
          setQrDataUrl(dataUrl)
        })
        .catch((err) => {
          console.error('Error generating QR code:', err)
        })
    }
  }, [publicSurveyToken])

  const handleCopyLink = () => {
    if (!fullSurveyUrl) return
    navigator.clipboard.writeText(fullSurveyUrl)
    setCopiedLink(true)
    toast.success('Tautan kuesioner berhasil disalin!')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  const handleDownloadQR = () => {
    if (!qrDataUrl) {
      toast.error('QR code belum siap diunduh.')
      return
    }

    // Create high quality canvas card for print (aspect ratio ~ poster A4 / 3:4)
    const canvas = document.createElement('canvas')
    canvas.width = 900
    canvas.height = 1260
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 1. Background Primary (#1D5BB9)
    ctx.fillStyle = '#1D5BB9'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // 2. Aksen Bubble Ringan & Transparan
    // Bubble besar kanan atas
    ctx.fillStyle = 'rgba(255, 255, 255, 0.09)'
    ctx.beginPath()
    ctx.arc(820, 100, 220, 0, Math.PI * 2)
    ctx.fill()

    // Bubble sedang kiri tengah
    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)'
    ctx.beginPath()
    ctx.arc(60, 480, 170, 0, Math.PI * 2)
    ctx.fill()

    // Bubble kecil kanan tengah
    ctx.fillStyle = 'rgba(255, 255, 255, 0.07)'
    ctx.beginPath()
    ctx.arc(840, 720, 110, 0, Math.PI * 2)
    ctx.fill()

    // Bubble kiri bawah
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)'
    ctx.beginPath()
    ctx.arc(120, 1180, 240, 0, Math.PI * 2)
    ctx.fill()

    // 3. Header Texts
    // "FORMULIR F03"
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 44px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('FORMULIR F03', canvas.width / 2, 95)

    // "Pemantauan dan Evaluasi Kinerja Penyelenggara Pelayanan Publik"
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
    ctx.font = '500 20px sans-serif'
    ctx.fillText('Pemantauan dan Evaluasi Kinerja Penyelenggara Pelayanan Publik', canvas.width / 2, 135)

    // Box Nama Unit Penyelenggara Layanan
    ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
    ctx.lineWidth = 1.5
    ctx.beginPath()
    ctx.roundRect(80, 165, 740, 78, 16)
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)'
    ctx.font = '600 14px sans-serif'
    ctx.fillText('UNIT PENYELENGGARA LAYANAN', canvas.width / 2, 195)

    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 24px sans-serif'
    const truncatedUnitName = unitName.length > 44 ? unitName.substring(0, 41) + '...' : unitName
    ctx.fillText(truncatedUnitName, canvas.width / 2, 226)

    // 4. Load QR Image onto canvas
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = qrDataUrl
    img.onload = () => {
      // White container card for QR
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.roundRect(175, 275, 550, 550, 28)
      ctx.fill()

      // Shadow/border subtle for QR Card
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.lineWidth = 2
      ctx.stroke()

      // QR Image centered inside white card
      ctx.drawImage(img, 210, 310, 480, 480)

      // Tulisan Pindai tepat di bawah QR card
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 32px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('Pindai QR untuk Memberi Penilaian', canvas.width / 2, 875)

      // Heading "Apa ini?" (diperbesar)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 22px sans-serif'
      ctx.fillText('Apa ini?', canvas.width / 2, 922)

      // Informasi singkat kuesioner PEKPPP (diperbesar)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
      ctx.font = '19px sans-serif'
      const line1 = 'Kuesioner ini digunakan untuk penilaian mandiri PEKPPP. Respon dan penilaian Anda'
      const line2 = 'merupakan bagian penting yang menentukan capaian unit dalam Indeks Pelayanan Publik.'
      ctx.fillText(line1, canvas.width / 2, 955)
      ctx.fillText(line2, canvas.width / 2, 985)

      // Note anonimitas
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
      ctx.font = '16px sans-serif'
      ctx.fillText('Proses pengisian cepat, mudah, dan 100% tanpa identitas (Anonim)', canvas.width / 2, 1025)

      // Garis pemisah footer
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(120, 1145)
      ctx.lineTo(780, 1145)
      ctx.stroke()

      // Footer: Pemerintah Kabupaten Kutai Barat
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)'
      ctx.font = '600 17px sans-serif'
      ctx.fillText('Pemerintah Kabupaten Kutai Barat', canvas.width / 2, 1185)

      // Trigger download
      const link = document.createElement('a')
      const sanitizedName = unitName.toLowerCase().replace(/[^a-z0-9]/g, '-')
      link.download = `QR-Survei-F03-${sanitizedName}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
      toast.success('QR Code siap cetak berhasil diunduh!')
    }
  }

  const handleToggleSurvey = async () => {
    const nextState = !isSurveyOpen
    setTogglingSurvey(true)
    try {
      const res = await togglePublicSurveyAction(evaluationId, nextState)
      if (res.success) {
        setIsSurveyOpen(nextState)
        toast.success(nextState ? 'Kuesioner publik dibuka untuk umum!' : 'Kuesioner publik berhasil ditutup.')
      } else {
        toast.error('Gagal memperbarui status kuesioner.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setTogglingSurvey(false)
    }
  }

  const handleSaveProofUrl = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingProof(true)
    try {
      const res = await updateF03ProofUrlAction(evaluationId, proofUrl)
      if (res.success) {
        toast.success('Tautan bukti dukung F-03 berhasil disimpan!')
      } else {
        toast.error('Gagal menyimpan tautan.')
      }
    } catch {
      toast.error('Terjadi kesalahan.')
    } finally {
      setSavingProof(false)
    }
  }

  const currentCount = respondents.length
  const quotaPercentage = Math.round((currentCount / targetQuota) * 100)

  // Calculate aggregate score
  const avgScore = currentCount > 0 ? respondents.reduce((acc, r) => acc + r.totalScore, 0) / currentCount : 0
  const avgScale5 = (avgScore / 70) * 5
  const avgPct = (avgScore / 70) * 100

  return (
    <div className="space-y-6 pb-8">
      {/* Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-xs font-medium text-ink-muted">
            <span>Formulir F03</span>
            <span>•</span>
            <span>Penilaian Masyarakat</span>
            <span>•</span>
            <span className="text-[#D8902A] font-semibold">Bobot 25% IPP</span>
          </div>
          <h2 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Formulir F03
          </h2>
          <p className="text-xs text-slate-500">
            Publikasikan kuesioner mandiri kepada masyarakat penerima layanan di <strong className="text-slate-800 font-medium">{unitName}</strong>. Target kuota: <span className="font-semibold text-slate-900">{targetQuota}</span> responden.
          </p>
        </div>
      </div>

      {/* Hero: Public Questionnaire Generator Card - Primary Bubble Banner Version */}
      <div className="relative overflow-hidden rounded-2xl bg-brand dark:bg-card dark:border dark:border-stroke p-4 sm:p-5 shadow-soft-card">
        {/* Aksen bubble transparan di sudut */}
        <span aria-hidden className="pointer-events-none absolute -top-16 -right-10 w-52 h-52 rounded-full bg-white/10 dark:opacity-10" />

        <div className="relative flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/20 dark:border-stroke pb-3.5 mb-3.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/20 dark:bg-brand-light text-white dark:text-brand flex items-center justify-center shrink-0">
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-white dark:text-ink leading-tight">
                Generator Kuesioner Publik
              </h3>
              <p className="text-xs text-white/80 dark:text-ink-muted mt-0.5">
                Pajang kode QR di loket layanan agar masyarakat dapat mengisi survei mandiri dari ponsel.
              </p>
            </div>
          </div>

          {/* Switch Status Kuesioner Sederhana */}
          <button
            type="button"
            onClick={handleToggleSurvey}
            disabled={togglingSurvey}
            title={isSurveyOpen ? 'Klik untuk menutup kuesioner' : 'Klik untuk membuka kuesioner'}
            className="flex items-center gap-2 self-start sm:self-auto px-2.5 py-1 rounded-lg bg-white/15 dark:bg-surface-elevated hover:bg-white/20 dark:hover:bg-stroke/40 text-white dark:text-ink transition-all cursor-pointer disabled:opacity-50 border border-white/15 dark:border-stroke"
          >
            <span className="text-xs font-medium text-white/90 dark:text-ink-secondary">
              Kuesioner {isSurveyOpen ? 'Aktif' : 'Ditutup'}
            </span>
            <span className={`w-8 h-4.5 flex items-center rounded-full p-0.5 transition-colors ${isSurveyOpen ? 'bg-emerald-400' : 'bg-white/30 dark:bg-stroke'}`}>
              <span
                className={`bg-white dark:!bg-white w-3.5 h-3.5 rounded-full shadow-xs transform transition-transform ${
                  isSurveyOpen ? 'translate-x-3.5' : 'translate-x-0'
                }`}
              />
            </span>
          </button>
        </div>

        {/* QR Display + Direct Link Action */}
        <div className="relative grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
          {/* QR Canvas */}
          <div className="sm:col-span-4 md:col-span-3 flex flex-col items-center justify-center p-3 bg-white dark:bg-surface-elevated rounded-xl shadow-soft-card border border-transparent dark:border-stroke">
            {qrDataUrl ? (
              <img
                src={qrDataUrl}
                alt="QR Code Survei Publik"
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-lg object-contain bg-white p-1"
              />
            ) : (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-lg bg-surface-subtle flex items-center justify-center text-xs text-ink-muted">
                Menyiapkan QR...
              </div>
            )}
            <span className="text-[10px] text-ink-muted mt-1.5 font-medium">
              Scan Kamera / Lens
            </span>
          </div>

          {/* Action info and download */}
          <div className="sm:col-span-8 md:col-span-9 space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-white dark:text-ink flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-white/90 dark:text-brand" />
                Tautan Kuesioner Online
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  readOnly
                  value={fullSurveyUrl || 'Menyiapkan tautan...'}
                  className="flex-1 px-3 py-2 sm:py-1.5 rounded-lg text-xs bg-white dark:bg-surface-elevated text-ink border border-white/30 dark:border-stroke select-all font-mono focus:outline-none shadow-2xs"
                />
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="px-4 py-2 sm:py-1.5 rounded-lg bg-white/20 dark:bg-surface-elevated hover:bg-white/30 dark:hover:bg-stroke/40 text-white dark:text-ink font-medium text-xs inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer shrink-0 border border-white/25 dark:border-stroke shadow-2xs min-h-[40px]">
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-white dark:text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-white dark:text-ink" />}
                  <span>{copiedLink ? 'Tersalin' : 'Salin Tautan'}</span>
                </button>
              </div>
            </div>

            {/* Print & Download Button */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-2.5 pt-1">
              <button
                type="button"
                onClick={handleDownloadQR}
                className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-lg bg-white dark:bg-brand text-brand dark:text-white hover:bg-white/90 dark:hover:bg-brand-hover font-semibold text-xs inline-flex items-center gap-1.5 transition-all shadow-hz-button cursor-pointer min-h-[44px]">
                <Download className="w-3.5 h-3.5 text-brand dark:text-white" />
                <span>Unduh QR Siap Cetak (PNG)</span>
              </button>

              {fullSurveyUrl && (
                <a
                  href={fullSurveyUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto justify-center px-3.5 py-2.5 rounded-lg bg-white/15 dark:bg-surface-elevated hover:bg-white/25 dark:hover:bg-stroke/40 border border-white/25 dark:border-stroke text-white dark:text-ink font-medium text-xs inline-flex items-center gap-1.5 transition-colors shadow-2xs min-h-[44px]">
                  <span>Pratinjau Kuesioner</span>
                  <ExternalLink className="w-3 h-3 text-white/80 dark:text-ink-muted" />
                </a>
              )}
            </div>

            <div className="p-2.5 bg-white/10 dark:bg-surface-elevated/60 rounded-lg border border-white/15 dark:border-stroke text-[11px] text-white/90 dark:text-ink-secondary leading-relaxed flex items-start gap-2 backdrop-blur-2xs">
              <Smartphone className="w-3.5 h-3.5 text-white dark:text-brand shrink-0 mt-0.5" />
              <span>
                <strong>Tips:</strong> Cetak QR ini dan letakkan di meja loket. Responden tidak diminta nama/identitas, sehingga proses cepat dan objektif.
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Bento Stat Grid - Compact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card 1: Skor Agregat */}
        <div className="rounded-xl border border-stroke/60 bg-surface p-4 space-y-2 shadow-soft-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">
              Skor Agregat F-03
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-light text-brand font-semibold border border-brand/20">
              25% Bobot IPP
            </span>
          </div>
          <div>
            <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {avgPct.toFixed(2)}%
            </div>
            <div className="text-[11px] text-ink-secondary mt-1 flex items-center gap-2">
              <span>Skala 5: <strong className="text-ink font-semibold">{avgScale5.toFixed(2)}</strong> / 5.00</span>
              <span className="text-stroke">•</span>
              <span>Kontribusi: <strong className="text-ink font-semibold">{(avgPct * 0.25).toFixed(2)}%</strong></span>
            </div>
          </div>
        </div>

        {/* Card 2: Kuota Responden */}
        <div className="rounded-xl border border-stroke/60 bg-surface p-4 space-y-2 shadow-soft-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">
              Progres Responden
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              quotaPercentage >= 100
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-surface-subtle text-ink border border-stroke/60'
            }`}>
              {quotaPercentage}% Terpenuhi
            </span>
          </div>
          <div className="space-y-1.5">
            <div className="text-2xl sm:text-3xl font-bold text-ink tracking-tight">
              {currentCount} <span className="text-xs font-normal text-ink-muted">/ {targetQuota} Responden</span>
            </div>
            <div className="w-full h-1.5 bg-surface-subtle rounded-full overflow-hidden border border-stroke/40">
              <div
                className="h-full bg-brand rounded-full transition-all duration-500"
                style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
              />
            </div>
            <p className="text-[10px] text-ink-muted font-medium">
              {targetQuota - currentCount > 0
                ? `Membutuhkan ${targetQuota - currentCount} responden lagi`
                : 'Target kuota responden terpenuhi'}
            </p>
          </div>
        </div>

        {/* Card 3: Bukti Dukung Dokumen */}
        <div className="rounded-xl border border-stroke/60 bg-surface p-4 space-y-2 shadow-soft-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-ink-muted">
              Dokumentasi Survei
            </span>
            {proofUrl && (
              <a
                href={proofUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs font-semibold text-brand hover:underline">
                <span>Buka Link</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <form onSubmit={handleSaveProofUrl} className="flex gap-1.5 pt-0.5">
            <input
              type="url"
              value={proofUrl}
              onChange={(e) => setProofUrl(e.target.value)}
              placeholder="Tautan Google Drive berkas..."
              className="flex-1 min-w-0 px-3 py-1.5 text-xs rounded-lg border border-stroke/70 bg-surface-subtle/50 focus:outline-none focus:border-brand text-ink placeholder:text-ink-muted"
            />
            <button
              type="submit"
              disabled={savingProof}
              className="px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white font-medium text-xs transition-colors shrink-0 cursor-pointer disabled:opacity-50 shadow-hz-button">
              {savingProof ? '...' : 'Simpan'}
            </button>
          </form>
          <p className="text-[10px] text-ink-muted truncate">
            {proofUrl ? 'Tautan berkas fisik tersimpan' : 'Sematkan tautan rekap fisik / foto meja'}
          </p>
        </div>
      </div>

      {/* Daftar Responden Table / Document list */}
      <div className="rounded-2xl border border-stroke bg-card shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-stroke flex items-center justify-between bg-surface-subtle/40">
          <div className="flex items-center gap-2.5">
            <span className="text-xs font-bold text-ink">
              Daftar Masukan Responden
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
              {currentCount} entri
            </span>
          </div>
          <span className="text-xs text-ink-muted">
            14 Indikator • Skala 0 - 5
          </span>
        </div>

        <div className="divide-y divide-stroke/40">
          {respondents.map((r) => {
            const rPct = ((r.totalScore / 70) * 100).toFixed(1)
            const isPublic = r.submittedVia === 'PUBLIC' || !r.name?.includes('Input Mandiri')

            return (
              <div
                key={r.id}
                className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-surface-subtle/50 transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-8 h-8 rounded-full bg-surface-subtle border border-stroke text-ink-secondary font-bold text-xs flex items-center justify-center shrink-0">
                    {r.respondentNo}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-xs text-ink truncate">
                        {r.name || `Responden #${r.respondentNo}`}
                      </span>
                      {isPublic ? (
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                          Publik (QR)
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-surface-subtle text-ink-muted border border-stroke">
                          Manual OPD
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-ink-muted flex items-center gap-2 mt-0.5">
                      <span>Total: <strong className="text-ink font-medium">{r.totalScore}</strong>/70</span>
                      <span className="text-stroke">|</span>
                      <span>Skala 5: <strong className="text-ink font-medium">{r.scale5.toFixed(2)}</strong></span>
                      <span className="text-stroke">|</span>
                      <span>{new Date(r.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-ink bg-surface-subtle px-3 py-1 rounded-full border border-stroke">
                    {rPct}%
                  </span>
                </div>
              </div>
            )
          })}

          {respondents.length === 0 && (
            <div className="p-12 text-center space-y-2">
              <p className="text-xs font-medium text-slate-600">Belum ada pengisian survei F-03</p>
              <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
                Bagikan kode QR atau tautan survei publik di atas ke masyarakat penerima layanan untuk mulai mengumpulkan data kuesioner.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
