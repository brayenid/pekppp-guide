import { Info, CheckCircle2, ShieldCheck } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'

export default function PanduanPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        icon={<Info className="w-5 h-5 text-brand" />}
        title="Panduan Teknis Pelaksanaan PEKPPP"
        description="Petunjuk pelaksanaan evaluasi kinerja penyelenggaraan pelayanan publik bagi Tim Evaluator dan Unit Lokus."
      />

      <div className="rounded-bento border border-stroke/50 bg-surface p-5 sm:p-6 space-y-6 shadow-2xs">
        <div className="space-y-2">
          <h2 className="font-semibold text-sm sm:text-base text-ink flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-ink-muted shrink-0" />
            1. Tahapan Evaluasi
          </h2>
          <p className="text-xs text-ink-secondary leading-relaxed pl-6">
            Evaluasi dilakukan secara komprehensif melalui 3 alur utama: Self-Assessment oleh Unit Lokus, Penilaian Dokumentasi Bukti Dukung (Google Drive), dan Verifikasi Lapangan/Wawancara oleh Evaluator Bagian Organisasi.
          </p>
        </div>

        <div className="pt-4 border-t border-stroke/40 space-y-2">
          <h2 className="font-semibold text-sm sm:text-base text-ink flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-ink-muted shrink-0" />
            2. Kebijakan Living Document
          </h2>
          <p className="text-xs text-ink-secondary leading-relaxed pl-6">
            Setiap pendaftaran unit pada tahun periode baru (misal Tahun 2026), sistem secara otomatis menarik link bukti dukung dari tahun sebelumnya. Unit hanya perlu memutakhirkan berkas yang memiliki revisi atau perubahan kebijakan saja.
          </p>
        </div>
      </div>
    </div>
  )
}

