// InfoBox.tsx — drop ke mana saja di antara section-section di Home.tsx

import { motion } from 'framer-motion'
import { Info, FileText, ImageIcon } from 'lucide-react'

export const InfoBox = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-10">
      <div className="relative bg-[#FFDE59] border-2 border-black shadow-[6px_6px_0px_0px_#000] p-6">
        {/* Header label */}
        <div className="flex items-center gap-2 mb-4">
          <Info className="w-5 h-5 shrink-0 text-black" strokeWidth={2.5} />
          <span className="text-xs font-black uppercase tracking-widest">Perhatian</span>
        </div>

        {/* Divider */}
        <div className="border-t-2 border-black mb-5" />

        {/* Two-card row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Card: Dokumen */}
          <div className="flex items-start gap-3 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <span className="shrink-0 w-9 h-9 flex items-center justify-center bg-black border-2 border-black">
              <FileText className="w-5 h-5 text-[#FFDE59]" strokeWidth={2} />
            </span>
            <div>
              <p className="font-black text-sm uppercase tracking-wide mb-1">Bukti Dokumen</p>
              <p className="text-sm font-semibold text-gray-700 leading-snug">
                Bukti dukung berbentuk dokumen diunggah dalam format <span className="font-black text-black">PDF</span>.
              </p>
            </div>
          </div>

          {/* Card: Visual */}
          <div className="flex items-start gap-3 bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_#000]">
            <span className="shrink-0 w-9 h-9 flex items-center justify-center bg-black border-2 border-black">
              <ImageIcon className="w-5 h-5 text-[#57E7FB]" strokeWidth={2} />
            </span>
            <div>
              <p className="font-black text-sm uppercase tracking-wide mb-1">Bukti Visual</p>
              <p className="text-sm font-semibold text-gray-700 leading-snug">
                Bukti dukung kondisi faktual diunggah dalam format{' '}
                <span className="font-black text-black">Gambar (JPG/PNG)</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-4 text-xs font-bold text-black/60 uppercase tracking-widest">
          ※ Jenis bukti dukung disesuaikan dengan kebutuhan masing-masing indikator.
        </p>

        {/* Decorative corner stamp */}
        <div className="absolute -top-3 -right-3 bg-[#FF90E8] border-2 border-black w-8 h-8 rotate-12 shadow-[2px_2px_0px_0px_#000]" />
      </div>
    </motion.section>
  )
}
