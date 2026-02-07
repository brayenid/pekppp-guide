// src/components/IndicatorModal.tsx
import { motion } from 'framer-motion'
import { X, Info, Sparkles } from 'lucide-react'
import type { PekpppIndikator, PekpppImage } from '../types/pekppp'
import { ImageGallery } from './ImageGallery' // Pastikan component ImageGallery Anda sudah ada

interface IndicatorModalProps {
  data: PekpppIndikator
  onClose: () => void
  onImageClick: (image: PekpppImage) => void
}

export const IndicatorModal = ({ data, onClose, onImageClick }: IndicatorModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop Gelap */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Konten Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto bg-white border-4 border-black shadow-[12px_12px_0px_0px_#000] flex flex-col">
        {/* Header (Sticky agar tetap terlihat saat scroll) */}
        <div className="sticky top-0 z-10 bg-[#FFDE59] border-b-4 border-black p-6 flex justify-between items-start">
          <div className="pr-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="bg-black text-white px-3 py-1 text-xs font-black uppercase tracking-widest shadow-[2px_2px_0px_0px_rgba(255,255,255,0.5)]">
                {data.aspek}
              </span>
              <span className="font-mono font-bold text-black opacity-70">ID: {data.id}</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black leading-tight text-black">{data.pertanyaan}</h2>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-2 bg-red-500 border-2 border-black text-white hover:bg-red-600 hover:shadow-[4px_4px_0px_0px_#000] transition-all active:translate-y-1 active:shadow-none">
            <X className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 md:p-8 space-y-8 bg-[#fafafa]">
          {/* Bagian 1: Kriteria */}
          <div className="bg-white border-2 border-black p-6 shadow-[6px_6px_0px_0px_#000]">
            <div className="flex items-center gap-3 mb-4 border-b-2 border-black pb-2">
              <div className="bg-[#57E7FB] border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_#000]">
                <Info className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-black text-lg uppercase">Kriteria Bukti Dukung</h3>
            </div>
            <div className="prose prose-zinc max-w-none">
              <p className="text-base md:text-lg font-medium leading-relaxed text-gray-800 whitespace-pre-line">
                {data.buktiDukung}
              </p>
            </div>
          </div>

          {/* Bagian 2: Galeri Gambar */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-[#FF90E8] border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_#000]">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <h3 className="font-black text-lg uppercase">Referensi Visual</h3>
            </div>

            <div className="bg-white border-2 border-dashed border-black p-4 bg-gray-50">
              {/* Memanggil komponen ImageGallery */}
              {data.images && data.images.length > 0 ? (
                <ImageGallery images={data.images} onImageClick={onImageClick} />
              ) : (
                <div className="text-center py-8 text-gray-500 font-bold italic">
                  Belum ada contoh gambar untuk indikator ini.
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
