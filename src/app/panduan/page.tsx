import React from 'react'
import Link from 'next/link'
import { PageHeader } from '../../components/ui/PageHeader'
import { ArrowRight, FolderOpen } from 'lucide-react'

export const metadata = {
  title: 'Panduan Teknis PEKPPP - Kutai Barat',
  description: 'Petunjuk teknis pelaksanaan evaluasi kinerja penyelenggaraan pelayanan publik bagi Tim Evaluator dan Unit Lokus Pelayanan di Kabupaten Kutai Barat.'
}

export default function PanduanPage() {
  const sections = [
    {
      num: '1',
      title: 'Peran & Tanggung Jawab Pengguna',
      items: [
        {
          role: 'Unit Lokus Pelayanan (OPD)',
          desc: 'Bertanggung jawab melaksanakan pengisian mandiri 31 indikator kinerja standar pelayanan (Formulir F-01) beserta berkas eviden. Secara berbarengan, unit lokus menyebarkan survei kepuasan masyarakat (Formulir F-03) kepada pengguna layanan hingga memenuhi kuota responden.'
        },
        {
          role: 'Tim Evaluator Bagian Organisasi Setdakab',
          desc: 'Bertindak sebagai penilai tingkat daerah: memvalidasi keabsahan dokumen pendukung, membuka sesi klarifikasi faktual, menyelenggarakan uji petik lapangan, dan memberikan nilai penilaian sementara tingkat kabupaten (belum menetapkan nilai akhir).'
        },
        {
          role: 'Biro Organisasi Setda Provinsi',
          desc: 'Menerima hasil evaluasi dan penilaian sementara dari tingkat kabupaten untuk dilakukan penelaahan, harmonisasi, dan validasi tingkat provinsi.'
        },
        {
          role: 'Kementerian PAN-RB',
          desc: 'Mengolah seluruh hasil evaluasi yang telah divalidasi dan menetapkan nilai akhir definitif Indeks Pelayanan Publik (IPP 100%), predikat mutu nasional (kategori A/B/C), serta menerbitkan lembar rekomendasi perbaikan resmi.'
        }
      ]
    },
    {
      num: '2',
      title: 'Standar Penyiapan Berkas Bukti Dukung (Eviden)',
      items: [
        {
          role: 'Format Dokumen Resmi (PDF Searchable)',
          desc: 'Seluruh produk hukum, SK penetapan standar pelayanan, maklumat pelayanan, dan laporan evaluasi diunggah dalam format PDF yang jelas dan terbaca. Hindari hasil foto scan buram atau miring.'
        },
        {
          role: 'Dokumentasi Fasilitas Fisik & Ruang Layanan',
          desc: 'Eviden sarana dan prasarana (khususnya fasilitas ramah kelompok rentan, loket, toilet khusus, dan ruang tunggu) berupa foto aktual ruang layanan (JPG/PNG/WEBP) yang menampilkan kondisi fisik nyata dengan keterangan nama ruangan.'
        },
        {
          role: 'Penyimpanan Berkas Internal Terintegrasi (Bukan Cloud Eksternal)',
          desc: 'Seluruh berkas bukti dukung diunggah langsung ke penyimpanan server internal aplikasi PEKPPP.ext (Local File Storage). Sistem tidak menggunakan tautan Google Drive/Cloud pihak ketiga, sehingga akses dokumen terjamin aman, cepat, bebas kendala pembatasan izin akses (permission denied), serta terkelola secara terpusat oleh Pemerintah Kabupaten Kutai Barat.'
        }
      ]
    },
    {
      num: '3',
      title: 'Kebijakan Berkas Berkelanjutan (Living Document)',
      items: [
        {
          role: 'Tersambung Otomatis sebagai Fallback',
          desc: 'Sistem PEKPPP.ext menerapkan prinsip Living Document sebagai fallback cadangan agar lokus tidak memulai dari nol jika regulasi dokumen permanen belum berubah.'
        },
        {
          role: 'Prioritas Pemutakhiran Berkas Dinamis',
          desc: 'Untuk dokumen eviden yang sifatnya dinamis dan terus berkembang (seperti sarana prasarana/fasilitas, Standar Pelayanan, laporan Forum Konsultasi Publik/FKP, dan tindak lanjut laporan pengaduan), sangat disarankan untuk dimutakhirkan agar penilaian mencerminkan kondisi eksisting terkini dan memperoleh capaian nilai maksimal.'
        }
      ]
    },
    {
      num: '4',
      title: 'Mekanisme Klarifikasi & Uji Petik Lapangan',
      items: [
        {
          role: 'Catatan Telaah Evaluator',
          desc: 'Selama masa verifikasi, evaluator dapat mencantumkan catatan telaah per indikator. Perangkat daerah wajib memantau dasbor secara berkala untuk menindaklanjuti permintaan kelengkapan eviden.'
        },
        {
          role: 'Batas Waktu Perbaikan (Cut-Off)',
          desc: 'Seluruh revisi berkas dan perbaikan eviden wajib diselesaikan sebelum jadwal penguncian instrumen penilaian daerah agar skor dapat diajukan ke tahap validasi provinsi.'
        }
      ]
    }
  ]

  return (
    <div className="max-w-6xl mx-auto space-y-10 sm:space-y-12 pb-16">
      {/* ── Page Header ── */}
      <PageHeader
        title="Panduan Teknis Pelaksanaan PEKPPP"
        description="Petunjuk teknis pelaksanaan evaluasi kinerja penyelenggaraan pelayanan publik bagi Tim Evaluator dan Unit Lokus di lingkungan Pemerintah Kabupaten Kutai Barat."
      />

      {/* ── Banner Pustaka Format & Contoh Berkas ── */}
      <div className="p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-blue-500/10 via-brand/5 to-transparent border border-brand/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-subtle">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0 border border-brand/20 mt-0.5">
            <FolderOpen className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm sm:text-base font-semibold text-ink">
              Format &amp; Template Dokumen Siap Pakai
            </h3>
            <p className="text-xs text-ink-muted leading-relaxed max-w-2xl">
              Membutuhkan format baku SK Standar Pelayanan, template berita acara FKP, atau formulir isian Word (.docx) &amp; Excel (.xlsx)? Kunjungi Pustaka Contoh Berkas untuk mengunduh template resmi.
            </p>
          </div>
        </div>
        <Link
          href="/contoh-berkas"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold transition-all shrink-0 self-start sm:self-auto shadow-xs">
          <span>Buka Contoh Berkas</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* ── Guidebook Content Sections ── */}
      <div className="space-y-10">
        {sections.map((sec) => (
          <section key={sec.num} className="space-y-4">
            <div className="flex items-center gap-3 border-b border-line pb-3">
              <span className="font-mono text-sm font-bold text-brand bg-brand-light dark:bg-brand/20 px-2.5 py-0.5 rounded-md">
                Bab {sec.num}
              </span>
              <h2 className="text-base sm:text-lg font-semibold text-ink">
                {sec.title}
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-3.5">
              {sec.items.map((item, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-2xl bg-surface border border-line shadow-2xs space-y-1.5 transition-colors hover:border-brand/40">
                  <h3 className="text-sm font-semibold text-ink">
                    {item.role}
                  </h3>
                  <p className="text-xs sm:text-sm text-ink-secondary leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>

      {/* ── Quick Footer Links ── */}
      <div className="p-5 sm:p-6 rounded-xl bg-surface border border-line flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-[11px] font-semibold text-brand uppercase tracking-wider">Akses Terkait</div>
          <h4 className="text-sm font-semibold text-ink">Wiki 6 Aspek Indikator &amp; Glosarium</h4>
          <p className="text-xs text-ink-secondary">
            Pelajari definisi teknis, dasar penilaian, dan penjelasan 6 aspek indikator utama dengan 31 pertanyaan evaluasi PEKPPP.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
          <Link
            href="/wiki"
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-medium transition-colors">
            <span>Buka Wiki Indikator</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  )
}
