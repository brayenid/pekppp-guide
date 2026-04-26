// src/pages/Panduan.tsx
import { motion } from 'framer-motion'
import { Search, FolderOpen, Type, CheckCircle2, AlertTriangle, XCircle, FileWarning, FileCheck } from 'lucide-react'

const STEPS = [
  {
    title: 'Pelajari Referensi',
    desc: "Buka halaman 'Beranda' dan cari indikator yang dituju. Lihat contoh foto atau dokumen agar bukti dukung Anda valid.",
    icon: <Search className="w-6 h-6" />,
  },
  {
    title: 'Masuk ke Folder OPP',
    desc: 'Buka tautan Drive. Cari folder sesuai nama Instansi/OPP Anda. Jangan mengunggah di folder tetangga!',
    icon: <FolderOpen className="w-6 h-6" />,
  },
  {
    title: 'Pilih Folder Indikator',
    desc: 'Di dalam folder instansi Anda, sudah tersedia folder untuk setiap nomor pertanyaan. Masuk ke sana.',
    icon: <CheckCircle2 className="w-6 h-6" />,
  },
  {
    title: 'Atur Nama File & Unggah',
    desc: 'Wajib Rename! Judul file harus jelas. Dilarang menggunakan nama file random (misal: "IMG_2024.jpg").',
    icon: <Type className="w-6 h-6" />,
  }
]

export default function Panduan() {
  return (
    <div className="relative max-w-7xl mx-auto px-6 py-16 font-sans text-slate-900">
      {/* Header */}
      <header className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center bg-gov-blue text-gov-gold px-4 py-1.5 rounded-full shadow-sm mb-6">
          <span className="text-xs font-semibold uppercase tracking-wider">Panduan Lengkap</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl md:text-5xl font-serif font-bold text-gov-blue mb-6 leading-tight">
          PANDUAN <span className="text-gov-gold">PENGUNGGAHAN</span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm max-w-3xl">
          <p className="text-xl font-serif font-semibold text-gov-blue">Jangan sampai nilai turun karena salah unggah!</p>
          <p className="text-slate-600 mt-3 leading-relaxed">
            Ikuti panduan langkah demi langkah di bawah ini agar dokumen Anda dapat diverifikasi dengan cepat dan tepat oleh tim evaluator.
          </p>
        </motion.div>
      </header>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-20">
        {STEPS.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="relative flex flex-col p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-lg transition-all group">
            {/* Number Badge */}
            <div className="absolute -top-4 -left-4 w-10 h-10 bg-gov-blue text-white flex items-center justify-center font-bold text-lg rounded-full shadow-md border-4 border-white">
              {idx + 1}
            </div>

            {/* Icon */}
            <div className="w-14 h-14 bg-slate-50 text-gov-gold border border-slate-100 rounded-xl flex items-center justify-center mb-6 shadow-sm group-hover:bg-gov-blue group-hover:text-white transition-colors">
              {step.icon}
            </div>

            <h3 className="text-xl font-serif font-bold text-gov-blue mb-3">{step.title}</h3>
            <p className="text-sm text-slate-600 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Naming Convention Section */}
      <section className="relative">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 md:p-12 shadow-md">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10 border-b border-slate-200 pb-8">
            <div className="p-4 bg-slate-50 text-gov-blue border border-slate-100 rounded-xl">
              <Type className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-2xl font-serif font-bold text-gov-blue mb-2">Aturan Penamaan File</h2>
              <p className="text-sm text-slate-600">
                Sistem penilaian sangat bergantung pada kerapian dokumentasi dan penamaan file Anda.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Sisi SALAH */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-red-100 p-2 rounded-full">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                  Hindari Format Ini
                </h3>
              </div>

              <div className="space-y-3">
                {['whatsapp-image-2024.jpg', 'IMG_00234.pdf', 'final_oke_banget.png'].map((err) => (
                  <div
                    key={err}
                    className="flex items-center justify-between bg-red-50/50 border border-red-100 p-3 rounded-lg">
                    <span className="font-mono text-red-600 text-sm truncate">{err}</span>
                    <FileWarning className="w-4 h-4 text-red-500" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-red-500 mt-2 italic">
                * File dengan nama tidak spesifik akan diabaikan oleh sistem evaluasi.
              </p>
            </div>

            {/* Sisi BENAR */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-5">
                <div className="bg-green-100 p-2 rounded-full">
                  <CheckCircle2 className="w-6 h-6 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                  Format yang Benar
                </h3>
              </div>

              <div className="space-y-3">
                {['01_SK_TIM_PEKPPP.pdf', '04_LAPORAN_SKM_TW1.pdf', '23_FOTO_RUANG_TUNGGU.jpg'].map((ok) => (
                  <div
                    key={ok}
                    className="flex items-center justify-between bg-green-50/50 border border-green-100 p-3 rounded-lg">
                    <span className="font-mono font-medium text-green-700 text-sm truncate">{ok}</span>
                    <FileCheck className="w-4 h-4 text-green-600" />
                  </div>
                ))}
              </div>
              <p className="text-xs text-green-600 mt-2 font-medium">* Format wajb: [NOMOR]_[NAMA DOKUMEN]</p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="mt-12 bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row items-start gap-4">
            <div className="bg-white border border-slate-200 p-3 rounded-lg shrink-0">
              <AlertTriangle className="w-6 h-6 text-gov-gold" />
            </div>
            <div>
              <h4 className="font-bold text-gov-blue mb-2">Catatan Penting Evaluator</h4>
              <p className="text-sm text-slate-600 leading-relaxed italic border-l-2 border-gov-gold pl-3">
                "Judul file harus secara eksplisit mewakili isi berkas. Evaluator tidak akan membuka file satu per satu
                jika namanya tidak jelas dan tidak sesuai format."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
