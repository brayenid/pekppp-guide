import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Info, Search, X } from 'lucide-react'
import { type PekpppIndikator, type PekpppImage } from '../types/pekppp'
import dataRaw from '../data/pekppp.json'
import { ImageGallery } from '../components/ImageGallery'

const dataPekppp = dataRaw as PekpppIndikator[]

const Home = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState('')
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
    <div className="relative max-w-5xl mx-auto px-6 py-12 pb-40">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-5xl font-semibold tracking-tight text-zinc-900 mb-6">
          PEKPPP <span className="text-zinc-400 font-normal">Docs</span>
        </h1>
        <p className="text-base text-zinc-500 max-w-xl leading-relaxed">
          Panduan komprehensif penyiapan bukti dukung digital untuk OPP Kabupaten Kutai Barat.
        </p>
      </header>

      {/* Filter & Search */}
      <div className="space-y-6 mb-12">
        <div className="relative max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900" />
          <input
            type="text"
            placeholder="Cari indikator..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-zinc-900 transition-all"
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
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-400'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* List Indikator */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        {filteredData.map((item) => (
          <div key={item.id} className="border-b border-zinc-100 last:border-none">
            <button
              onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
              className="w-full flex items-center gap-6 p-5 text-left hover:bg-zinc-50/50 transition-colors">
              <span className="font-mono text-[11px] font-bold text-zinc-300">{item.id.padStart(2, '0')}</span>
              <div className="flex-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">{item.aspek}</span>
                <h3 className="text-sm font-semibold text-zinc-800 leading-snug">{item.pertanyaan}</h3>
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
                    <div className="flex gap-4 p-5 rounded-xl border border-zinc-200 bg-white shadow-sm mb-8 font-medium text-sm text-zinc-600">
                      <Info className="w-4 h-4 text-zinc-900 mt-1 shrink-0" />
                      <div>
                        <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1">Kriteria Bukti</p>
                        {item.buktiDukung}
                      </div>
                    </div>
                    <ImageGallery images={item.images} onImageClick={setActiveImage} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Modal Image */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-white/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-5xl bg-white border border-zinc-200 shadow-2xl rounded-2xl overflow-hidden">
              <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 p-2 bg-white border border-zinc-200 rounded-full z-10 hover:bg-zinc-100">
                <X className="w-5 h-5 text-zinc-900" />
              </button>
              <div className="p-2 flex justify-center bg-zinc-50">
                <img
                  src={activeImage.url}
                  alt={activeImage.caption}
                  className="max-h-[75vh] object-contain rounded-lg shadow-inner"
                />
              </div>
              <div className="p-6 flex justify-between items-center">
                <p className="text-sm font-bold uppercase tracking-widest">{activeImage.caption}</p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home
