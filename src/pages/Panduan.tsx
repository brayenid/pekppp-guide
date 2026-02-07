// src/pages/Panduan.tsx
import { motion } from 'framer-motion'
import { Search, FolderOpen, Type, CheckCircle2, AlertTriangle, XCircle, FileWarning, FileCheck } from 'lucide-react'

const STEPS = [
  {
    title: 'Pelajari Referensi',
    desc: "Buka halaman 'Beranda' dan cari indikator yang dituju. Lihat contoh foto atau dokumen agar bukti dukung Anda valid.",
    icon: <Search className="w-6 h-6" />,
    color: 'bg-[#57E7FB]', // Cyan
    rotate: 'rotate-1'
  },
  {
    title: 'Masuk ke Folder OPP',
    desc: 'Buka tautan Drive. Cari folder sesuai nama Instansi/OPP Anda. Jangan mengunggah di folder tetangga!',
    icon: <FolderOpen className="w-6 h-6" />,
    color: 'bg-[#FF90E8]', // Pink
    rotate: '-rotate-1'
  },
  {
    title: 'Pilih Folder Indikator',
    desc: 'Di dalam folder instansi Anda, sudah tersedia folder untuk setiap nomor pertanyaan. Masuk ke sana.',
    icon: <CheckCircle2 className="w-6 h-6" />,
    color: 'bg-[#FFDE59]', // Yellow
    rotate: 'rotate-2'
  },
  {
    title: 'Atur Nama File & Unggah',
    desc: 'Wajib Rename! Judul file harus jelas. Dilarang menggunakan nama file random (misal: "IMG_2024.jpg").',
    icon: <Type className="w-6 h-6" />,
    color: 'bg-[#98fb98]', // Mint Green
    rotate: '-rotate-2'
  }
]

export default function Panduan() {
  return (
    <div className="relative max-w-7xl mx-auto px-6 py-16 font-sans text-black">
      {/* Header */}
      <header className="mb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-black text-white px-4 py-1 mb-4 border-2 border-transparent shadow-[4px_4px_0px_0px_#888]">
          <span className="text-sm font-black uppercase tracking-widest">SOP Pengunggahan</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl md:text-6xl font-black tracking-tighter text-black mb-6 leading-[0.9]">
          PANDUAN{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 underline decoration-black decoration-4 underline-offset-8">
            UPLOAD
          </span>
        </motion.h1>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000] max-w-2xl">
          <p className="text-lg font-bold leading-tight">Jangan sampai nilai turun karena salah upload!</p>
          <p className="text-base text-gray-600 font-medium mt-2">
            Ikuti 4 langkah mudah di bawah ini agar dokumen Anda diverifikasi dengan cepat oleh tim evaluator.
          </p>
        </motion.div>
      </header>

      {/* Steps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-24">
        {STEPS.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className={`group relative flex flex-col p-8 bg-white border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] hover:-translate-y-1 transition-all ${step.rotate}`}>
            {/* Number Badge */}
            <div className="absolute -top-5 -left-5 w-12 h-12 bg-black text-white flex items-center justify-center font-black text-xl border-2 border-white shadow-[4px_4px_0px_0px_#888]">
              {idx + 1}
            </div>

            {/* Icon */}
            <div
              className={`w-14 h-14 ${step.color} border-2 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_#000]`}>
              {step.icon}
            </div>

            <h3 className="text-2xl font-black text-black mb-3 uppercase leading-none">{step.title}</h3>
            <p className="text-base font-bold text-gray-600 leading-relaxed">{step.desc}</p>
          </motion.div>
        ))}
      </div>

      {/* Naming Convention Section */}
      <section className="relative">
        {/* Decorative Tape */}
        <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-40 h-8 bg-[#FFDE59] border-2 border-black rotate-2 z-10 flex items-center justify-center font-black text-xs uppercase tracking-widest shadow-[2px_2px_0px_0px_#000]">
          Penting
        </div>

        <div className="bg-white border-4 border-black p-8 md:p-12 shadow-[12px_12px_0px_0px_#000]">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6 mb-10 border-b-4 border-black pb-8">
            <div className="p-4 bg-black text-white border-2 border-transparent">
              <Type className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tight mb-2">Aturan Nama File</h2>
              <p className="text-base font-bold text-gray-500">
                Sistem penilaian bergantung pada kerapian dokumentasi Anda.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {/* Sisi SALAH */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <XCircle className="w-8 h-8 text-red-500 fill-black" />
                <h3 className="font-black text-xl uppercase text-red-600 underline decoration-4 underline-offset-4">
                  Jangan Tiru
                </h3>
              </div>

              <div className="space-y-3">
                {['whatsapp-image-2024.jpg', 'IMG_00234.pdf', 'final_oke_banget.png'].map((err) => (
                  <div
                    key={err}
                    className="flex items-center justify-between bg-red-50 border-2 border-red-500 p-3 shadow-[4px_4px_0px_0px_#ef4444]">
                    <span className="font-mono font-bold text-red-600 text-sm truncate">{err}</span>
                    <FileWarning className="w-5 h-5 text-red-500" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-red-500 mt-2">
                *File dengan nama random sulit dilacak dan berisiko tidak ternilai.
              </p>
            </div>

            {/* Sisi BENAR */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle2 className="w-8 h-8 text-green-500 fill-black" />
                <h3 className="font-black text-xl uppercase text-green-600 underline decoration-4 underline-offset-4">
                  Wajib Tiru
                </h3>
              </div>

              <div className="space-y-3">
                {['01_SK_TIM_PEKPPP.pdf', '04_LAPORAN_SKM_TW1.pdf', '23_FOTO_RUANG_TUNGGU.jpg'].map((ok) => (
                  <div
                    key={ok}
                    className="flex items-center justify-between bg-green-50 border-2 border-green-600 p-3 shadow-[4px_4px_0px_0px_#16a34a]">
                    <span className="font-mono font-bold text-green-700 text-sm truncate">{ok}</span>
                    <FileCheck className="w-5 h-5 text-green-600" />
                  </div>
                ))}
              </div>
              <p className="text-xs font-bold text-green-600 mt-2">*Gunakan format: [NOMOR]_[NAMA DOKUMEN]</p>
            </div>
          </div>

          {/* Warning Box */}
          <div className="mt-12 bg-[#FFDE59] border-4 border-black p-6 flex flex-col md:flex-row items-start gap-4 shadow-[6px_6px_0px_0px_#000]">
            <div className="bg-black p-2 shrink-0">
              <AlertTriangle className="w-6 h-6 text-[#FFDE59]" />
            </div>
            <div>
              <h4 className="font-black text-lg uppercase mb-1">Catatan Evaluator</h4>
              <p className="font-bold text-sm leading-relaxed">
                "Judul file harus mewakili isi berkas secara eksplisit. Kami tidak akan membuka file satu per satu jika
                namanya tidak jelas."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
