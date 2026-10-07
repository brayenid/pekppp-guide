import { BookText } from 'lucide-react'
import { PageHeader } from '../../components/ui/PageHeader'

export default function RegulasiPage() {
  const regulations = [
    {
      title: 'PermenPANRB Nomor 29 Tahun 2022',
      desc: 'Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik (Dasar Hukum Utama PEKPPP)',
      year: '2022',
      type: 'Peraturan Menteri'
    },
    {
      title: 'UU Nomor 25 Tahun 2009',
      desc: 'Pelayanan Publik (Landasan Hukum Penyelenggaraan Pelayanan Publik di Indonesia)',
      year: '2009',
      type: 'Undang-Undang'
    },
    {
      title: 'PermenPANRB Nomor 14 Tahun 2017',
      desc: 'Pedoman Penyusunan Survei Kepuasan Masyarakat (SKM) Unit Penyelenggara Pelayanan Publik',
      year: '2017',
      type: 'Peraturan Menteri'
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Header */}
      <PageHeader
        icon={<BookText className="w-5 h-5 text-brand" />}
        title="Regulasi & Dasar Hukum PEKPPP"
        description="Kumpulan Peraturan Menteri PANRB dan Peraturan Perundang-undangan terkait Evaluasi Pelayanan Publik."
      />

      <div className="grid grid-cols-1 gap-3.5">
        {regulations.map((reg, idx) => (
          <div
            key={idx}
            className="rounded-bento border border-stroke/50 bg-surface p-4 sm:p-5 hover:border-stroke hover:shadow-soft-card transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center px-2 py-0.5 rounded-pill bg-surface-subtle text-ink font-medium text-[10px] border border-stroke/50 uppercase tracking-wider">
                  {reg.type}
                </span>
                <span className="text-xs text-ink-muted">Tahun {reg.year}</span>
              </div>
              <h2 className="font-semibold text-sm sm:text-base text-ink">{reg.title}</h2>
              <p className="text-xs text-ink-secondary leading-relaxed">{reg.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

