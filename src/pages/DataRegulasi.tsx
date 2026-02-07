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
    <div className="relative max-w-7xl mx-auto px-6 py-16 font-sans text-black">
      {/* Header */}
      <header className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-[#FF90E8] border-2 border-black px-4 py-1 mb-4 shadow-[4px_4px_0px_0px_#000]">
          <span className="text-sm font-black uppercase tracking-widest">Dasar Hukum</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl md:text-6xl font-black tracking-tighter text-black mb-6 leading-[0.9]">
          DATA &{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 underline decoration-black decoration-4 underline-offset-8">
            REGULASI
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000] max-w-2xl">
          <p className="text-lg font-bold leading-tight">Pastikan dokumen Anda valid secara hukum.</p>
          <p className="text-base text-gray-600 font-medium mt-2">
            Berikut adalah daftar regulasi yang menjadi acuan penilaian. Klik pada nama peraturan untuk melihat
            detailnya.
          </p>
        </motion.div>
      </header>

      {/* Tabel Data Section */}
      <div className="bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] mb-20 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black text-white">
                <th className="px-6 py-4 text-sm font-black uppercase tracking-widest w-20 text-center border-r-2 border-white/20">
                  No
                </th>
                <th className="px-6 py-4 text-sm font-black uppercase tracking-widest border-r-2 border-white/20">
                  Evidence / Data
                </th>
                <th className="px-6 py-4 text-sm font-black uppercase tracking-widest text-right">Dasar Hukum</th>
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-black">
              {REGULASI_DATA.map((item, idx) => (
                <motion.tr
                  key={item.no}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-[#FFDE59] transition-colors">
                  <td className="px-6 py-5 text-center border-r-2 border-black font-black text-lg">
                    {item.no.toString().padStart(2, '0')}
                  </td>
                  <td className="px-6 py-5 border-r-2 border-black">
                    <h3 className="text-base font-bold leading-snug">{item.evidence}</h3>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-black text-xs font-bold uppercase hover:bg-black hover:text-white hover:shadow-[4px_4px_0px_0px_#888] transition-all">
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

      {/* Info Card - Neo Brutalism Style */}
      <section className="relative">
        {/* Card Body */}
        <div className="bg-[#57E7FB] border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_#000] flex flex-col md:flex-row items-center gap-8">
          {/* Icon Box */}
          <div className="shrink-0 p-6 bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000]">
            <ShieldCheck className="w-12 h-12 text-black" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="inline-block bg-black text-white px-2 py-1 text-xs font-black uppercase tracking-widest mb-3">
              Penting
            </div>
            <h2 className="text-3xl font-black text-black mb-4 leading-none">VALIDITAS DOKUMEN</h2>
            <p className="text-base font-bold text-gray-800 leading-relaxed border-l-4 border-black pl-4">
              "Setiap bukti dukung (evidence) yang diunggah wajib mencantumkan konsiderans atau merujuk pada regulasi di
              atas. Dokumen tanpa dasar hukum yang jelas berisiko <u>tidak dinilai</u>."
            </p>
          </div>

          <div className="hidden md:block shrink-0">
            <AlertCircle className="w-16 h-16 text-black opacity-20 rotate-12" />
          </div>
        </div>
      </section>
    </div>
  )
}
