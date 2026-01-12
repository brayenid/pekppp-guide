// src/pages/Panduan.tsx
import { motion } from 'framer-motion'
import { Search, FolderOpen, Type, ArrowRight, CheckCircle2, AlertTriangle } from 'lucide-react'

const STEPS = [
  {
    title: 'Pelajari Referensi',
    desc: "Buka halaman 'Katalog' di depan. Lihat contoh foto atau dokumen pada indikator yang dituju. Pastikan dokumen Anda sudah sesuai dengan kriteria yang diminta.",
    icon: <Search className="w-5 h-5" />,
    color: 'bg-blue-600'
  },
  {
    title: 'Masuk ke Folder UPP',
    desc: 'Buka tautan Drive. Masuk ke folder sesuai nama Instansi/UPP Anda (Contoh: Dinas A, Dinas B). Jangan mengunggah di luar folder instansi Anda.',
    icon: <FolderOpen className="w-5 h-5" />,
    color: 'bg-amber-500'
  },
  {
    title: 'Pilih Folder Indikator',
    desc: 'Di dalam folder instansi Anda, sudah tersedia folder khusus untuk setiap pertanyaan. Masuk ke folder yang mewakili pertanyaan tersebut.',
    icon: <CheckCircle2 className="w-5 h-5" />,
    color: 'bg-emerald-600'
  },
  {
    title: 'Atur Nama File & Unggah',
    desc: 'Judul file harus jelas dan mewakili isi berkas. Dilarang menggunakan nama file random hasil download atau kiriman WhatsApp.',
    icon: <Type className="w-5 h-5" />,
    color: 'bg-zinc-900'
  }
]

export default function Panduan() {
  return (
    <div className="relative max-w-5xl mx-auto px-6 py-12 pb-40">
      {/* Header - Diselaraskan dengan pola Home.tsx */}
      <header className="mb-12">
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 mb-6">
          SOP <span className="text-zinc-400 font-normal">Pengunggahan</span>
        </h1>
        <p className="text-base text-zinc-500 max-w-xl leading-relaxed font-medium">
          Penting: Kesalahan penginputan atau penempatan berkas akan menyebabkan kesulitan penilaian dan berpotensi
          mengurangi skor evaluasi.
        </p>
      </header>

      {/* Timeline Steps - Pola Akordion/List */}
      <div className="space-y-4 mb-16">
        {STEPS.map((step, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1 }}
            className="group flex flex-col md:flex-row gap-6 p-6 bg-white border border-zinc-200 rounded-2xl shadow-sm hover:border-zinc-300 transition-all">
            {/* Step Indicator */}
            <div className="flex shrink-0 items-center justify-center">
              <div
                className={`w-12 h-12 rounded-xl ${step.color} text-white flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}>
                {step.icon}
              </div>
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Langkah {idx + 1}</span>
                <ArrowRight className="w-3 h-3 text-zinc-200" />
              </div>
              <h3 className="text-lg font-bold text-zinc-800 mb-2">{step.title}</h3>
              <p className="text-sm text-zinc-500 leading-relaxed font-medium">{step.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Penamaan File Section - Aksen Amber tetap dipertahankan namun lebih clean */}
      <section className="bg-amber-50 rounded-[2.5rem] p-8 md:p-12 border border-amber-200 overflow-hidden relative shadow-sm">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-amber-200/30 blur-3xl rounded-full" />

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-amber-500 rounded-2xl shadow-lg shadow-amber-200">
              <Type className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-tight">Standardisasi Nama File</h2>
              <p className="text-xs text-amber-700 font-medium italic">
                Sistem penilaian bergantung pada kerapian dokumentasi Anda.
              </p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Sisi SALAH */}
            <div className="space-y-4">
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Contoh Salah
              </p>
              <div className="space-y-2">
                {['whatsapp-image-2024.jpg', 'IMG_00234.pdf', 'final_oke.png'].map((err) => (
                  <div
                    key={err}
                    className="bg-white border border-red-100 text-red-500 px-4 py-3 rounded-xl text-xs font-mono shadow-sm flex items-center gap-3">
                    <span className="opacity-40">✕</span>
                    {err}
                  </div>
                ))}
              </div>
            </div>

            {/* Sisi BENAR */}
            <div className="space-y-4">
              <p className="text-zinc-400 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Contoh Benar
              </p>
              <div className="space-y-2">
                {['01_SK_SP_DINAS_A.pdf', '04_LAPORAN_SKM.pdf', '23_FOTO_SARANA.jpg'].map((ok) => (
                  <div
                    key={ok}
                    className="bg-white border border-emerald-100 text-emerald-600 px-4 py-3 rounded-xl text-xs font-mono shadow-sm flex items-center gap-3">
                    <span className="font-bold">✓</span>
                    {ok}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Warning Box */}
          <div className="mt-10 flex items-start gap-4 p-5 bg-amber-500 rounded-2xl border border-amber-600/10 shadow-lg shadow-amber-200/50">
            <AlertTriangle className="w-5 h-5 text-white shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] text-white leading-relaxed font-bold uppercase tracking-widest">
                Catatan Penting Evaluator
              </p>
              <p className="text-sm text-amber-50 leading-relaxed font-medium">
                Judul file harus mewakili isi berkas secara eksplisit. Hal ini sangat menentukan kecepatan dan kemudahan
                Evaluator dalam memverifikasi bukti dukung Anda.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
