import { motion } from 'framer-motion'
import { Book, ShieldCheck, AlertCircle, ArrowRight } from 'lucide-react'

const REGULASI_DATA = [
  { no: 1, evidence: 'Penyusunan dan Penetapan Standar Pelayanan', ketentuan: 'Permenpan No.15 Tahun 2014' },
  { no: 2, evidence: 'Penyusunan dan Penetapan Maklumat Pelayanan', ketentuan: 'Permenpan No.15 Tahun 2014' },
  {
    no: 3,
    evidence: 'Media Pengelolaan Pengaduan dan Tindak lanjut hasil pengelolaan pengaduan',
    ketentuan: 'Permenpan No.46 Tahun 2020'
  },
  {
    no: 4,
    evidence: 'Pengelolaan Informasi (SIPPN) dan Website Informasi Pelayanan Publik',
    ketentuan: 'Permenpan No.13 Tahun 2017'
  },
  {
    no: 5,
    evidence:
      'Pelibatan Masyarakat dalam pengambilan keputusan / Penyusunan Kebijakan melalui Forum Konsultasi Publik (FKP)',
    ketentuan: 'Permenpan No.16 Tahun 2017'
  },
  {
    no: 6,
    evidence: 'Pemberian penghargaan kepada pelaksana',
    ketentuan: 'PP No. 30 Tahun 2019 dan PP. 94 Tahun 2021'
  },
  { no: 7, evidence: 'Pemberian sanksi kepada pelaksana', ketentuan: 'PP No. 30 Tahun 2019 dan PP. 94 Tahun 2021' },
  { no: 8, evidence: 'Penyediaan Pelayanan Publik Ramah kelompok rentan', ketentuan: 'Permenpan No.11 Tahun 2024' },
  { no: 9, evidence: 'Pelaksanaan Survei Kepuasan Masyarakat', ketentuan: 'Permenpan No.14 Tahun 2017' },
  { no: 10, evidence: 'Pelaksanaan Inovasi Pelayanan Publik', ketentuan: 'Permenpan No.91 Tahun 2021' }
]

export default function DataRegulasi() {
  return (
    <div className="relative max-w-5xl mx-auto px-6 py-12">
      {/* Header - Diselaraskan dengan pola Home.tsx */}
      <header className="mb-12">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl font-semibold tracking-tight text-zinc-900 mb-6">
          Data & <span className="text-zinc-400 font-normal">Regulasi</span>
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base text-zinc-500 max-w-xl leading-relaxed font-medium">
          Daftar dokumen bukti dukung (evidence) beserta dasar hukum pengaturannya. Pastikan dokumen yang Anda siapkan
          merujuk pada ketentuan berikut.
        </motion.p>
      </header>

      {/* Tabel Data Section - Menggunakan Pola Desain List/Table yang Clean */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm mb-12">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50 border-b border-zinc-100">
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest w-20 text-center">
                  No
                </th>
                <th className="px-4 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  Evidence / Data
                </th>
                <th className="px-6 py-4 text-[10px] font-black text-zinc-400 uppercase tracking-widest text-right">
                  Dasar Hukum
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {REGULASI_DATA.map((item, idx) => (
                <motion.tr
                  key={item.no}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.05 }}
                  className="group hover:bg-zinc-50/50 transition-colors">
                  <td className="px-6 py-5 text-center">
                    <span className="font-mono text-xs font-bold text-zinc-300 group-hover:text-zinc-500 transition-colors">
                      {item.no.toString().padStart(2, '0')}
                    </span>
                  </td>
                  <td className="px-4 py-5">
                    <h3 className="text-sm font-semibold text-zinc-800 leading-snug">{item.evidence}</h3>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 text-zinc-500 group-hover:text-amber-600 transition-colors">
                      <span className="text-[12px] font-medium italic">{item.ketentuan}</span>
                      <Book className="w-3.5 h-3.5 opacity-40 group-hover:opacity-100" />
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card - Aksen Amber tetap dipertahankan namun lebih clean */}
      <section className="bg-amber-50 rounded-[2.5rem] p-8 md:p-12 border border-amber-200 overflow-hidden relative shadow-sm">
        {/* Aksen Dekoratif di Background */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-200/30 blur-3xl rounded-full" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="p-4 bg-white rounded-3xl shadow-xl shadow-amber-200/50 border border-amber-100 flex-shrink-0">
            <ShieldCheck className="w-10 h-10 text-amber-500" />
          </div>

          <div className="flex-1 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Kesesuaian Data</span>
              <ArrowRight className="w-3 h-3 text-amber-300" />
            </div>
            <h2 className="text-xl font-bold text-zinc-900 mb-2 text-balance">Validitas Substansi Dokumen</h2>
            <p className="text-sm text-zinc-500 leading-relaxed font-medium">
              Setiap bukti dukung (evidence) yang diunggah wajib mencantumkan konsiderans atau merujuk pada regulasi
              yang tertera dalam tabel di atas. Dokumen yang tidak sesuai dengan dasar hukum terbaru dapat mempengaruhi
              hasil validasi penilaian.
            </p>
          </div>

          <div className="shrink-0 p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-200">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
        </div>
      </section>
    </div>
  )
}
