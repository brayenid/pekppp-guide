// src/pages/DataRegulasi.tsx
import { motion } from 'framer-motion'
import { ShieldCheck, AlertCircle, Link as LinkIcon } from 'lucide-react'

// Data diperbarui dengan URL ke peraturan.bpk.go.id
const REGULASI_DATA = [
  {
    no: 1,
    evidence: 'Penyusunan dan Penetapan Standar Pelayanan',
    ketentuan: 'Permenpan No.15 Tahun 2014',
    url: 'https://peraturan.bpk.go.id/Details/132734/permen-pan-rb-no-15-tahun-2014'
  },
  {
    no: 2,
    evidence: 'Penyusunan dan Penetapan Maklumat Pelayanan',
    ketentuan: 'Permenpan No.15 Tahun 2014',
    url: 'https://peraturan.bpk.go.id/Details/132734/permen-pan-rb-no-15-tahun-2014'
  },
  {
    no: 3,
    evidence: 'Media Pengelolaan Pengaduan dan Tindak lanjut hasil pengelolaan pengaduan',
    ketentuan: 'Permenpan No.46 Tahun 2020',
    url: 'https://peraturan.bpk.go.id/Details/143742/permen-pan-rb-no-46-tahun-2020'
  },
  {
    no: 4,
    evidence: 'Pengelolaan Informasi (SIPPN) dan Website Informasi Pelayanan Publik',
    ketentuan: 'Permenpan No.13 Tahun 2017',
    url: 'https://peraturan.bpk.go.id/Details/132599/permen-pan-rb-no-13-tahun-2017'
  },
  {
    no: 5,
    evidence:
      'Pelibatan Masyarakat dalam pengambilan keputusan / Penyusunan Kebijakan melalui Forum Konsultasi Publik (FKP)',
    ketentuan: 'Permenpan No.16 Tahun 2017',
    url: 'https://peraturan.bpk.go.id/Details/132602/permen-pan-rb-no-16-tahun-2017'
  },
  {
    no: 6,
    evidence: 'Pemberian penghargaan kepada pelaksana',
    ketentuan: 'PP No. 30 Tahun 2019 dan PP. 94 Tahun 2021',
    // Mengarahkan ke PP 30/2019 sebagai referensi utama dalam satu tautan
    url: 'https://peraturan.bpk.go.id/Details/107573/pp-no-30-tahun-2019'
  },
  {
    no: 7,
    evidence: 'Pemberian sanksi kepada pelaksana',
    ketentuan: 'PP No. 30 Tahun 2019 dan PP. 94 Tahun 2021',
    url: 'https://peraturan.bpk.go.id/Details/107573/pp-no-30-tahun-2019'
  },
  {
    no: 8,
    evidence: 'Penyediaan Pelayanan Publik Ramah kelompok rentan',
    ketentuan: 'Permenpan No.11 Tahun 2024',
    url: 'https://peraturan.bpk.go.id/Details/305594/permen-panrb-no-11-tahun-2024'
  },
  {
    no: 9,
    evidence: 'Pelaksanaan Survei Kepuasan Masyarakat',
    ketentuan: 'Permenpan No.14 Tahun 2017',
    url: 'https://peraturan.bpk.go.id/Details/132600/permen-pan-rb-no-14-tahun-2017'
  },
  {
    no: 10,
    evidence: 'Pelaksanaan Inovasi Pelayanan Publik',
    ketentuan: 'Permenpan No.91 Tahun 2021',
    url: 'https://peraturan.bpk.go.id/Details/202224/permen-pan-rb-no-91-tahun-2021'
  }
]

export default function DataRegulasi() {
  return (
    <div className="relative max-w-7xl mx-auto px-6 py-16 font-sans text-slate-900">
      {/* Header */}
      <header className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center bg-gov-blue text-gov-gold px-4 py-1.5 rounded-full shadow-sm mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider">Dasar Hukum</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl md:text-5xl font-serif font-bold text-gov-blue mb-6 leading-tight">
          DATA & <span className="text-gov-gold">REGULASI</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm max-w-3xl">
          <p className="text-xl font-serif font-semibold text-gov-blue">Pastikan dokumen Anda valid secara hukum.</p>
          <p className="text-slate-600 mt-3 leading-relaxed">
            Berikut adalah daftar regulasi yang menjadi acuan penilaian. Klik pada nama peraturan untuk melihat
            detailnya.
          </p>
        </motion.div>
      </header>

      {/* Tabel Data Section */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-md mb-20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-max">
            <thead>
              <tr className="bg-gov-blue text-white">
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider w-20 text-center border-r border-white/10">
                  No
                </th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider border-r border-white/10">
                  Dokumen
                </th>
                <th className="px-6 py-5 text-xs font-semibold uppercase tracking-wider text-right">Dasar Hukum</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {REGULASI_DATA.map((item, idx) => (
                <motion.tr
                  key={item.no}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-5 text-center border-r border-slate-100 font-bold text-lg text-slate-400 group-hover:text-gov-blue transition-colors">
                    {item.no.toString().padStart(2, '0')}
                  </td>
                  <td className="px-6 py-5 border-r border-slate-100">
                    <h3 className="text-sm md:text-base font-medium text-slate-800 leading-snug">{item.evidence}</h3>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-xs font-semibold text-gov-blue rounded-lg hover:bg-gov-blue hover:text-white hover:border-gov-blue shadow-sm transition-all">
                      <span className="truncate max-w-[150px] md:max-w-none">{item.ketentuan}</span>
                      <LinkIcon className="w-3 h-3" />
                    </a>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <section className="relative">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 md:p-12 shadow-sm flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
             <AlertCircle className="w-48 h-48 text-gov-blue" />
          </div>
          <div className="shrink-0 p-5 bg-white border border-slate-100 rounded-xl shadow-sm z-10">
            <ShieldCheck className="w-10 h-10 text-gov-gold" />
          </div>

          <div className="flex-1 text-center md:text-left z-10">
            <div className="inline-block bg-gov-blue text-white px-3 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-4">
              Penting
            </div>
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gov-blue mb-4 leading-tight">Validitas Dokumen</h2>
            <p className="text-base text-slate-600 leading-relaxed border-l-4 border-gov-gold pl-4 italic">
              "Setiap bukti dukung (evidence) yang diunggah harus dapat dipertanggungjawabkan dan merujuk pada regulasi di atas."
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
