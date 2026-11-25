// src/services/period-window-service.ts
import { db } from './db'

export interface WindowPresetTemplate {
  phaseKey: string
  title: string
  description: string
  orderIndex: number
  canFillF01: boolean
  canUploadEvidence: boolean
  canFillF03: boolean
  canEvaluateF02: boolean
  relativeStartMonthOffset: number // perkiraan bulan mulai relatif dari awal tahun
  relativeDurationDays: number
}

export const DEFAULT_WINDOW_PRESETS: WindowPresetTemplate[] = [
  {
    phaseKey: 'PREPARATION',
    title: 'Sosialisasi & Persiapan Evaluasi',
    description: 'Unit lokus mempelajari pedoman kuesioner dan mempersiapkan berkas dokumen.',
    orderIndex: 1,
    canFillF01: false,
    canUploadEvidence: false,
    canFillF03: false,
    canEvaluateF02: false,
    relativeStartMonthOffset: 0,
    relativeDurationDays: 14
  },
  {
    phaseKey: 'F01_FILLING',
    title: 'Pengisian F01 & Unggah Bukti Dukung',
    description: 'Lokus mengisi formulir evaluasi mandiri (F-01) dan mengunggah berkas bukti dukung 6 Aspek.',
    orderIndex: 2,
    canFillF01: true,
    canUploadEvidence: true,
    canFillF03: false,
    canEvaluateF02: false,
    relativeStartMonthOffset: 0.5,
    relativeDurationDays: 30
  },
  {
    phaseKey: 'F03_SURVEY',
    title: 'Pelaksanaan Survei Kepuasan (F03)',
    description: 'Penyebaran kuesioner publik survei kepuasan masyarakat melalui link & QR Code.',
    orderIndex: 3,
    canFillF01: false,
    canUploadEvidence: false,
    canFillF03: true,
    canEvaluateF02: false,
    relativeStartMonthOffset: 1.5,
    relativeDurationDays: 30
  },
  {
    phaseKey: 'EVALUATION_F02',
    title: 'Verifikasi & Penilaian Evaluator (F02)',
    description: 'Tim Evaluator memverifikasi bukti dukung, kesesuaian F01, dan memberikan catatan pembinaan.',
    orderIndex: 4,
    canFillF01: false,
    canUploadEvidence: false,
    canFillF03: false,
    canEvaluateF02: true,
    relativeStartMonthOffset: 2.5,
    relativeDurationDays: 21
  },
  {
    phaseKey: 'REVISION_APPEAL',
    title: 'Masa Sanggah & Perbaikan Bukti Dukung',
    description: 'Lokus dapat menindaklanjuti catatan rekomendasi evaluator dan mengunggah perbaikan bukti.',
    orderIndex: 5,
    canFillF01: false,
    canUploadEvidence: true,
    canFillF03: false,
    canEvaluateF02: true,
    relativeStartMonthOffset: 3.2,
    relativeDurationDays: 10
  },
  {
    phaseKey: 'FINALIZATION',
    title: 'Penetapan Nilai Akhir & Publikasi',
    description: 'Pleno penetapan indeks pelayanan publik (IPP) dan publikasi hasil secara transparan.',
    orderIndex: 6,
    canFillF01: false,
    canUploadEvidence: false,
    canFillF03: false,
    canEvaluateF02: false,
    relativeStartMonthOffset: 3.5,
    relativeDurationDays: 14
  }
]

export interface EvaluatedWindowItem {
  id: string
  periodId: string
  phaseKey: string
  title: string
  description: string | null
  startDate: Date | null
  endDate: Date | null
  orderIndex: number
  canFillF01: boolean
  canUploadEvidence: boolean
  canFillF03: boolean
  canEvaluateF02: boolean
  isActiveOverride: boolean | null
  // Computed Status
  status: 'UPCOMING' | 'ACTIVE' | 'PASSED'
  isCurrentlyActive: boolean
  daysRemaining: number | null
  formattedRange: string
}

export interface PeriodTimelineResult {
  year: number
  periodId: string
  isPeriodOpen: boolean
  activeWindow: EvaluatedWindowItem | null
  windows: EvaluatedWindowItem[]
  // Effective consolidated permissions
  effectivePermissions: {
    canFillF01: boolean
    canUploadEvidence: boolean
    canFillF03: boolean
    canEvaluateF02: boolean
  }
  noticeMessage?: string
}

/**
 * Otomatis mengisi default windows untuk periode tahun jika belum ada (hanya dipanggil eksplisit saat diminta).
 */
export async function ensureDefaultWindowsForPeriod(periodId: string, year: number) {
  const existingCount = await db.periodWindow.count({
    where: { periodId }
  })

  if (existingCount > 0) return

  // Generate tanggal default berbasis tahun
  const baseYear = year || new Date().getFullYear()

  const defaultInserts = DEFAULT_WINDOW_PRESETS.map((preset) => {
    // Buat estimasi tanggal awal & akhir
    const start = new Date(baseYear, Math.floor(preset.relativeStartMonthOffset), Math.round((preset.relativeStartMonthOffset % 1) * 30) + 1, 8, 0, 0)
    const end = new Date(start.getTime() + preset.relativeDurationDays * 24 * 60 * 60 * 1000)
    end.setHours(23, 59, 59, 999)

    return {
      periodId,
      phaseKey: preset.phaseKey,
      title: preset.title,
      description: preset.description,
      orderIndex: preset.orderIndex,
      startDate: start,
      endDate: end,
      canFillF01: preset.canFillF01,
      canUploadEvidence: preset.canUploadEvidence,
      canFillF03: preset.canFillF03,
      canEvaluateF02: preset.canEvaluateF02
    }
  })

  await db.periodWindow.createMany({
    data: defaultInserts
  })
}

/**
 * Format string tanggal lokal Indonesia yang ringkas dan ramah
 */
export function formatRangeIndonesian(start: Date | null, end: Date | null): string {
  if (!start && !end) return 'Belum dijadwalkan'
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

  if (start && !end) {
    return `Mulai ${start.getDate()} ${months[start.getMonth()]} ${start.getFullYear()}`
  }
  if (!start && end) {
    return `Sampai ${end.getDate()} ${months[end.getMonth()]} ${end.getFullYear()}`
  }
  if (start && end) {
    const sD = start.getDate()
    const sM = months[start.getMonth()]
    const sY = start.getFullYear()
    const eD = end.getDate()
    const eM = months[end.getMonth()]
    const eY = end.getFullYear()

    if (sY === eY && sM === eM) {
      return `${sD} - ${eD} ${sM} ${sY}`
    }
    if (sY === eY) {
      return `${sD} ${sM} - ${eD} ${eM} ${sY}`
    }
    return `${sD} ${sM} ${sY} - ${eD} ${eM} ${eY}`
  }
  return 'Belum dijadwalkan'
}

/**
 * Mengambil timeline tahapan dan izin efektif untuk suatu tahun penilaian
 */
export async function getPeriodTimeline(year: number): Promise<PeriodTimelineResult> {
  const period = await db.evaluationPeriod.findUnique({
    where: { year },
    include: {
      windows: {
        orderBy: { orderIndex: 'asc' }
      }
    }
  })

  // Fallback jika periode tidak ada
  if (!period) {
    return {
      year,
      periodId: '',
      isPeriodOpen: false,
      activeWindow: null,
      windows: [],
      effectivePermissions: {
        canFillF01: false,
        canUploadEvidence: false,
        canFillF03: false,
        canEvaluateF02: false
      },
      noticeMessage: `Periode tahun ${year} belum terdaftar.`
    }
  }

  const now = new Date()

  // Evaluasi status setiap jendela
  const evaluatedWindows: EvaluatedWindowItem[] = period.windows.map((w) => {
    let status: 'UPCOMING' | 'ACTIVE' | 'PASSED' = 'UPCOMING'
    let isCurrentlyActive = false
    let daysRemaining: number | null = null

    // Cek Override Admin Terlebih Dahulu
    if (w.isActiveOverride === true) {
      isCurrentlyActive = true
      status = 'ACTIVE'
    } else if (w.isActiveOverride === false) {
      isCurrentlyActive = false
      if (w.endDate && now > w.endDate) {
        status = 'PASSED'
      } else {
        status = 'UPCOMING'
      }
    } else {
      // Otomatis berdasarkan tanggal waktu
      if (w.startDate && now < w.startDate) {
        status = 'UPCOMING'
        const diffMs = w.startDate.getTime() - now.getTime()
        daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
      } else if (w.endDate && now > w.endDate) {
        status = 'PASSED'
        daysRemaining = 0
      } else if (w.startDate && (!w.endDate || now <= w.endDate)) {
        status = 'ACTIVE'
        isCurrentlyActive = true
        if (w.endDate) {
          const diffMs = w.endDate.getTime() - now.getTime()
          daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
        }
      } else if (!w.startDate && !w.endDate) {
        // Tanpa tanggal, status default upcoming
        status = 'UPCOMING'
      }
    }

    return {
      id: w.id,
      periodId: w.periodId,
      phaseKey: w.phaseKey,
      title: w.title,
      description: w.description,
      startDate: w.startDate,
      endDate: w.endDate,
      orderIndex: w.orderIndex,
      canFillF01: w.canFillF01,
      canUploadEvidence: w.canUploadEvidence,
      canFillF03: w.canFillF03,
      canEvaluateF02: w.canEvaluateF02,
      isActiveOverride: w.isActiveOverride,
      status,
      isCurrentlyActive,
      daysRemaining,
      formattedRange: formatRangeIndonesian(w.startDate, w.endDate)
    }
  })

  // Cari active window
  // Prioritaskan yang ada override aktif, lalu yang aktif berbasis tanggal
  const activeWindow =
    evaluatedWindows.find((w) => w.isActiveOverride === true) ||
    evaluatedWindows.find((w) => w.isCurrentlyActive) ||
    null

  // Konsolidasi izin efektif
  let effectivePermissions = {
    canFillF01: false,
    canUploadEvidence: false,
    canFillF03: false,
    canEvaluateF02: false
  }

  // Jika periode utama (isOpen) dimatikan, semua akses otomatis nonaktif
  if (!period.isOpen) {
    effectivePermissions = {
      canFillF01: false,
      canUploadEvidence: false,
      canFillF03: false,
      canEvaluateF02: false
    }
  } else if (activeWindow) {
    // Gabungkan izin dari window yang sedang aktif
    effectivePermissions = {
      canFillF01: activeWindow.canFillF01,
      canUploadEvidence: activeWindow.canUploadEvidence,
      canFillF03: activeWindow.canFillF03,
      canEvaluateF02: activeWindow.canEvaluateF02
    }
  } else if (evaluatedWindows.length === 0) {
    // Jika belum ada tahapan yang dikonfigurasi sama sekali (kosong),
    // sistem default mengikuti status utama isOpen: true
    effectivePermissions = {
      canFillF01: period.isOpen,
      canUploadEvidence: period.isOpen,
      canFillF03: period.isOpen,
      canEvaluateF02: period.isOpen
    }
  } else {
    // Ada jendela yang dikonfigurasi, tetapi tidak ada yang aktif saat ini
    effectivePermissions = {
      canFillF01: false,
      canUploadEvidence: false,
      canFillF03: false,
      canEvaluateF02: false
    }
  }

  return {
    year: period.year,
    periodId: period.id,
    isPeriodOpen: period.isOpen,
    activeWindow,
    windows: evaluatedWindows,
    effectivePermissions,
    noticeMessage: !period.isOpen
      ? `Tahun Penilaian ${year} saat ini ditutup oleh Super Admin.`
      : evaluatedWindows.length === 0
        ? `Belum ada tahapan jadwal yang dibuat. Anda dapat menambahkan tahapan satu per satu.`
        : !activeWindow
          ? `Saat ini tidak ada tahapan/jendela pengisian aktif untuk Tahun ${year}.`
          : undefined
  }
}
