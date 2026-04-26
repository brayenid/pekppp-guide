// InfoBox.tsx
import { motion } from 'framer-motion'
import { Info, FileText, ImageIcon } from 'lucide-react'

export const InfoBox = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mb-10 w-full">
      <div className="relative bg-white border border-gov-gold/30 shadow-lg shadow-gov-gold/5 rounded-2xl p-8">
        {/* Header label */}
        <div className="flex items-center gap-3 mb-5">
          <div className="bg-gov-gold/20 p-2 rounded-lg">
            <Info className="w-6 h-6 text-gov-blue" strokeWidth={2} />
          </div>
          <span className="text-xl font-serif font-bold text-gov-blue">Perhatian Penting</span>
        </div>

        {/* Divider */}
        <div className="border-t border-slate-200 mb-6" />

        {/* Two-card row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {/* Card: Dokumen */}
          <div className="flex items-start gap-4 bg-slate-50 border border-slate-100 p-5 rounded-xl hover:shadow-md transition-shadow">
            <span className="shrink-0 w-10 h-10 flex items-center justify-center bg-white shadow-sm rounded-lg">
              <FileText className="w-5 h-5 text-gov-blue" strokeWidth={2} />
            </span>
            <div>
              <p className="font-bold text-gov-blue mb-1">Bukti Dokumen</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bukti dukung berbentuk dokumen diunggah dalam format <span className="font-semibold text-gov-blue">PDF</span>.
              </p>
            </div>
          </div>

          {/* Card: Visual */}
          <div className="flex items-start gap-4 bg-slate-50 border border-slate-100 p-5 rounded-xl hover:shadow-md transition-shadow">
            <span className="shrink-0 w-10 h-10 flex items-center justify-center bg-white shadow-sm rounded-lg">
              <ImageIcon className="w-5 h-5 text-gov-gold" strokeWidth={2} />
            </span>
            <div>
              <p className="font-bold text-gov-blue mb-1">Bukti Visual</p>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bukti dukung kondisi faktual diunggah dalam format{' '}
                <span className="font-semibold text-gov-blue">Gambar (JPG/PNG)</span>.
              </p>
            </div>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-6 text-sm italic text-slate-500">
          * Jenis bukti dukung disesuaikan dengan kebutuhan masing-masing indikator.
        </p>
      </div>
    </motion.section>
  )
}
