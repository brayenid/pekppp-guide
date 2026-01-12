// src/App.tsx
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Info, LayoutGrid, Search, Sparkles, X } from 'lucide-react'
import { type PekpppIndikator, type PekpppImage } from './types/pekppp'
import dataRaw from './data/pekppp.json'
import { ImageGallery } from './components/ImageGallery'

const dataPekppp = dataRaw as PekpppIndikator[]

function App() {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState('')

  // State untuk Modal Gambar
  const [activeImage, setActiveImage] = useState<PekpppImage | null>(null)

  const categories = ['Semua', ...new Set(dataPekppp.map((i) => i.aspek))]

  const filteredData = dataPekppp.filter((i) => {
    const matchesFilter = filter === 'Semua' || i.aspek === filter
    const matchesSearch =
      i.pertanyaan.toLowerCase().includes(searchQuery.toLowerCase()) ||
      i.aspek.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesFilter && matchesSearch
  })

  return (
    <div
      className={`min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200 ${
        activeImage ? 'overflow-hidden' : ''
      }`}>
      {/* Subtle Grid Background */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-6 py-20">
        {/* Header Section (Sama seperti sebelumnya) */}
        <header className="mb-16">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mb-4">
            <div className="p-1.5 bg-zinc-900 rounded-md">
              <LayoutGrid className="text-white w-4 h-4" />
            </div>
            <span className="text-[11px] font-bold tracking-[0.2em] text-zinc-400 uppercase">
              Standar Evaluasi 2026
            </span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl font-semibold tracking-tight text-zinc-900 mb-6">
            PEKPPP <span className="text-zinc-400 font-normal">Docs</span>
          </motion.h1>
          <p className="text-base text-zinc-500 max-w-xl leading-relaxed">
            Website panduan komprehensif penyiapan bukti dukung digital untuk OPP Kabupaten Kutai Barat. Dikelola oleh
            Bagian Organisasi.
          </p>
        </header>

        {/* Action Bar & Filter Chips (Sama seperti sebelumnya) */}
        <div className="space-y-6 mb-12">
          <div className="relative group max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
            <input
              type="text"
              placeholder="Cari indikator..."
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilter(cat)
                  setSelectedId(null)
                }}
                className={`px-4 py-1.5 rounded-md text-[13px] font-medium border transition-all ${
                  filter === cat
                    ? 'bg-zinc-900 text-white border-zinc-900'
                    : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content List */}
        <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          {filteredData.map((item) => (
            <div key={item.id} className="border-b border-zinc-100 last:border-none">
              <button
                onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                className="w-full flex items-center gap-6 p-5 text-left hover:bg-zinc-50/50 transition-colors">
                <span className="font-mono text-[11px] font-bold text-zinc-300">{item.id.padStart(2, '0')}</span>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.aspek}</span>
                  <h3 className="text-sm font-semibold text-zinc-800">{item.pertanyaan}</h3>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-zinc-300 transition-transform ${selectedId === item.id ? 'rotate-90' : ''}`}
                />
              </button>

              <AnimatePresence>
                {selectedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden bg-zinc-50/30">
                    <div className="px-6 md:px-16 pb-10 pt-2">
                      <div className="flex gap-4 p-5 rounded-xl border border-zinc-200 bg-white shadow-sm mb-8">
                        <Info className="w-4 h-4 text-zinc-900 mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Kriteria bukti</p>
                          <p className="text-sm text-zinc-600 leading-relaxed font-medium">{item.buktiDukung}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Sparkles className="w-3 h-3" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Contoh bukti dukung</p>
                        </div>
                        {/* Mengirimkan fungsi setActiveImage ke ImageGallery */}
                        <ImageGallery images={item.images} onImageClick={(img) => setActiveImage(img)} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* --- MODAL IMAGE --- */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-10">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-white/90 backdrop-blur-md"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white border border-zinc-200 shadow-2xl rounded-2xl overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                <button
                  onClick={() => setActiveImage(null)}
                  className="p-2 bg-white/80 backdrop-blur border border-zinc-200 rounded-full hover:bg-zinc-100 transition-colors">
                  <X className="w-5 h-5 text-zinc-900" />
                </button>
              </div>

              <div className="p-2">
                <img
                  src={activeImage.url}
                  alt={activeImage.caption}
                  className="w-full h-auto max-h-[75vh] object-contain rounded-lg"
                />
              </div>

              <div className="p-6 bg-zinc-50 border-t border-zinc-100 flex justify-between items-center">
                <p className="text-sm font-bold text-zinc-900 uppercase tracking-widest">{activeImage.caption}</p>
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-2 py-1 bg-zinc-200 rounded">
                  Contoh Dokumen
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default App
