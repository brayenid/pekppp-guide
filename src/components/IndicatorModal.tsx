// src/components/IndicatorModal.tsx
import { motion } from 'framer-motion'
import { X, Info, Sparkles } from 'lucide-react'
import type { PekpppIndikator, PekpppImage } from '../types/pekppp'
import { ImageGallery } from './ImageGallery'
import Marquee from 'react-fast-marquee'

interface IndicatorModalProps {
  data: PekpppIndikator
  onClose: () => void
  onImageClick: (image: PekpppImage) => void
}

export const IndicatorModal = ({ data, onClose, onImageClick }: IndicatorModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl flex flex-col">
        
        <div className="sticky top-0 z-50 bg-gov-blue text-white p-5 md:p-6 flex justify-between items-center gap-4 rounded-t-2xl shadow-sm">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3 mb-2">
              <span className="bg-gov-gold text-gov-blue px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-md">
                {data.aspek}
              </span>
              <span className="font-medium text-slate-300 text-sm">ID: {data.id}</span>
            </div>

            <div className="w-full overflow-hidden">
              <Marquee delay={1} className="text-lg md:text-xl font-serif font-bold text-white">
                <span className="mr-12">{data.pertanyaan}</span>
              </Marquee>
            </div>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white hover:text-gov-blue transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 md:p-8 space-y-8 bg-slate-50">
          <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-3 mb-5 border-b border-slate-100 pb-4">
              <div className="bg-gov-blue/5 p-2 rounded-lg">
                <Info className="w-5 h-5 text-gov-blue" />
              </div>
              <h3 className="font-serif font-bold text-xl text-gov-blue">Kriteria Bukti Dukung</h3>
            </div>
            <div className="prose prose-slate max-w-none">
              <p className="text-base text-slate-700 leading-relaxed whitespace-pre-line">
                {data.buktiDukung}
              </p>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-5">
              <div className="bg-gov-gold/10 p-2 rounded-lg">
                <Sparkles className="w-5 h-5 text-gov-gold" />
              </div>
              <h3 className="font-serif font-bold text-xl text-gov-blue">Referensi Visual</h3>
            </div>

            <div className="bg-white border border-slate-200 p-6 rounded-xl shadow-sm">
              {data.images && data.images.length > 0 ? (
                <ImageGallery images={data.images} onImageClick={onImageClick} />
              ) : (
                <div className="text-center py-10 text-slate-400 italic">
                  Belum ada referensi visual untuk indikator ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
