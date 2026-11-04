import React from 'react'
import Link from 'next/link'
import { PageHeader } from '../../components/ui/PageHeader'
import { ArrowRight } from 'lucide-react'

export const metadata = {
  title: 'Regulasi & Dasar Hukum - PEKPPP.ext',
  description: 'Kumpulan regulasi, perundang-undangan, dan Peraturan Menteri PAN-RB terkait evaluasi kinerja penyelenggaraan pelayanan publik di Kabupaten Kutai Barat.'
}

export default function RegulasiPage() {
  const legalGroups = [
    {
      groupTitle: 'Undang-Undang Republik Indonesia',
      items: [
        {
          code: 'UU No. 25 / 2009',
          title: 'Undang-Undang Nomor 25 Tahun 2009 tentang Pelayanan Publik',
          year: '2009',
          type: 'Undang-Undang',
          summary: 'Landasan hukum tertinggi penyelenggaraan pelayanan publik di Indonesia yang mengatur hak dan kewajiban masyarakat, kepastian prosedur, keharusan maklumat pelayanan, penyusunan standar pelayanan, serta sanksi hukum atas pelanggaran pelayanan.'
        }
      ]
    },
    {
      groupTitle: 'Peraturan Menteri Pendayagunaan Aparatur Negara dan Reformasi Birokrasi',
      items: [
        {
          code: 'PermenPAN-RB No. 29 / 2022',
          title: 'PermenPAN-RB Nomor 29 Tahun 2022 tentang Pemantauan dan Evaluasi Kinerja Penyelenggaraan Pelayanan Publik (PEKPPP)',
          year: '2022',
          type: 'Peraturan Menteri',
          summary: 'Dasar hukum operasional utama pelaksanaan evaluasi PEKPPP yang menetapkan 6 dimensi aspek standar pelayanan, pembobotan baku 31 indikator kinerja, mekanisme Formulir F-01 s/d F-03, dan skala predikat indeks kompilasi nasional.'
        },
        {
          code: 'PermenPAN-RB No. 14 / 2017',
          title: 'PermenPAN-RB Nomor 14 Tahun 2017 tentang Pedoman Penyusunan Survei Kepuasan Masyarakat (SKM)',
          year: '2017',
          type: 'Peraturan Menteri',
          summary: 'Acuan teknis penyusunan survei kepuasan masyarakat bagi unit penyelenggara pelayanan publik, yang menjadi dasar pembuktian pada Aspek Kebijakan Pelayanan dan instrumen persepsi publik Formulir F-03 (porsi 25% IPP).'
        },
        {
          code: 'PermenPAN-RB No. 15 / 2014',
          title: 'PermenPAN-RB Nomor 15 Tahun 2014 tentang Pedoman Standar Pelayanan',
          year: '2014',
          type: 'Peraturan Menteri',
          summary: 'Pedoman penyusunan 14 komponen standar pelayanan publik yang terdiri dari 6 komponen service delivery (persyaratan, prosedur, waktu, biaya, produk, aduan) dan 8 komponen manufacturing.'
        },
        {
          code: 'PermenPAN-RB No. 62 / 2018',
          title: 'PermenPAN-RB Nomor 62 Tahun 2018 tentang Pedoman Sistem Pengelolaan Pengaduan Pelayanan Publik Nasional (SP4N-LAPOR!)',
          year: '2018',
          type: 'Peraturan Menteri',
          summary: 'Standar baku integrasi kanal pengaduan masyarakat secara terpadu, batas waktu penyelesaian aduan, penunjukan pejabat pengelola pengaduan, dan rekapitulasi data tindak lanjut pengaduan.'
        }
      ]
    },
    {
      groupTitle: 'Instrumen & Kebijakan Daerah Kabupaten Kutai Barat',
      items: [
        {
          code: 'Keputusan Bupati',
          title: 'Keputusan Bupati Kutai Barat tentang Penetapan Unit Lokus Evaluasi Kinerja Pelayanan Publik',
          year: '2026',
          type: 'Keputusan Kepala Daerah',
          summary: 'Penetapan resmi daftar unit kerja, puskesmas, dinas, dan kecamatan di lingkungan Pemkab Kutai Barat yang menjadi objek lokus evaluasi mandiri dan verifikasi faktual lapangan.'
        }
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12 pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="Regulasi &amp; Dasar Hukum PEKPPP"
        description="Daftar undang-undang dan peraturan menteri yang menjadi landasan yuridis evaluasi kinerja penyelenggaraan pelayanan publik di lingkungan Pemerintah Kabupaten Kutai Barat."
      />

      {/* ── Regulatory Groups ── */}
      <div className="space-y-10">
        {legalGroups.map((group, gIdx) => (
          <section key={gIdx} className="space-y-4">
            <h2 className="text-base sm:text-lg font-semibold text-ink border-b border-line pb-2.5">
              {group.groupTitle}
            </h2>

            <div className="space-y-3.5">
              {group.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 sm:p-6 rounded-2xl bg-surface border border-line shadow-2xs space-y-2.5 transition-colors hover:border-brand/40">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold text-brand bg-brand-light dark:bg-brand/20 px-2.5 py-0.5 rounded-md">
                      {item.code}
                    </span>
                    <span className="text-xs text-ink-muted">
                      {item.type} • Tahun {item.year}
                    </span>
                  </div>

                  <h3 className="text-sm sm:text-base font-semibold text-ink leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    {item.summary}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Quick Footer Link ── */}
      <div className="p-6 rounded-2xl bg-surface-subtle border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-0.5">
          <h4 className="text-sm font-semibold text-ink">Ingin Mengetahui Alur Pelaksanaan Evaluasi?</h4>
          <p className="text-xs text-ink-secondary">Pelajari tahapan berjenjang dari pengisian mandiri OPD hingga penetapan nasional pada Alur Proses.</p>
        </div>
        <Link
          href="/alur-proses"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shrink-0 self-start sm:self-auto shadow-2xs">
          <span>Lihat Alur Proses</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  )
}
