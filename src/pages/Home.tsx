// src/pages/Home.tsx
import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ExternalLink, ArrowRight, Layers, FileText, LayoutGrid } from 'lucide-react'
import { type PekpppIndikator, type PekpppImage } from '../types/pekppp'
import dataRaw from '../data/pekppp.json' // Pastikan path JSON benar
import { DRIVE_UPLOAD_URL } from '../App' // Pastikan konstanta URL Drive benar
import { IndicatorModal } from '../components/IndicatorModal'

// Casting data agar sesuai tipe
const dataPekppp = dataRaw as PekpppIndikator[]

const Home = () => {
  // --- STATE MANAGEMENT ---
  const [selectedIndicator, setSelectedIndicator] = useState<PekpppIndikator | null>(null)
  const [filter, setFilter] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeImage, setActiveImage] = useState<PekpppImage | null>(null)

  const indicatorListRef = useRef<HTMLDivElement>(null)

  // --- HELPER FUNCTIONS ---
  const scrollToIndicators = () => {
    indicatorListRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Mengambil kategori unik
  const categories = useMemo(() => ['Semua', ...new Set(dataPekppp.map((i) => i.aspek))], [])

  // Logika Filter & Search
  const filteredData = useMemo(() => {
    const query = searchQuery.toLowerCase().trim()
    return dataPekppp.filter((i) => {
      const matchesFilter = filter === 'Semua' || i.aspek === filter
      const matchesSearch =
        i.pertanyaan.toLowerCase().includes(query) ||
        i.aspek.toLowerCase().includes(query) ||
        i.buktiDukung.toLowerCase().includes(query) ||
        i.id.includes(query)
      return matchesFilter && matchesSearch
    })
  }, [filter, searchQuery])

  // --- RENDER ---
  return (
    <div
      className={`relative min-h-screen font-sans text-black ${selectedIndicator || activeImage ? 'overflow-hidden h-screen' : ''}`}>
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16">
        {/* === SECTION 1: HEADER & SEARCH === */}
        <section className="mb-20">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
            {/* Title Area */}
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-block bg-[#FFDE59] border-2 border-black px-4 py-1 mb-4 shadow-[4px_4px_0px_0px_#000]">
                <span className="text-sm font-black uppercase tracking-widest">Panduan Bukti Dukung</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl md:text-7xl font-black tracking-tighter text-black mb-6 leading-[0.9]">
                PEKPPP{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 underline decoration-black decoration-4 underline-offset-8">
                  DOCS
                </span>
              </motion.h1>

              <div className="bg-white border-2 border-black p-6 shadow-[8px_8px_0px_0px_#000]">
                <p className="text-lg md:text-xl font-bold leading-tight">Bingung cara menyiapkan dokumen?</p>
                <p className="text-sm md:text-base text-gray-600 mt-2 font-medium">
                  Portal ini adalah "Cheat Sheet" Anda. Klik kartu di bawah untuk melihat detail kriteria dan contoh
                  visual.
                </p>
              </div>
            </div>

            {/* Search Box */}
            <div className="w-full lg:max-w-md space-y-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-black pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari indikator (cth: kebijakan)..."
                  className="w-full bg-white border-2 border-black py-4 pl-12 pr-4 text-base font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-[6px_6px_0px_0px_#000] transition-all shadow-[4px_4px_0px_0px_#000]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToIndicators()}
                />
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilter(cat)
                  scrollToIndicators()
                }}
                className={`px-6 py-2 text-sm font-bold border-2 border-black transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] active:translate-y-0 active:shadow-none ${
                  filter === cat
                    ? 'bg-black text-white shadow-[4px_4px_0px_0px_#888]'
                    : 'bg-white text-black shadow-[4px_4px_0px_0px_#000]'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* === SECTION 2: 3-STEP INFO === */}
        <section className="mb-20 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 bg-[#FF90E8] border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <LayoutGrid className="w-8 h-8 mb-3 text-black" />
            <h3 className="font-black text-lg">1. Pilih Indikator</h3>
            <p className="text-sm font-semibold mt-1">Cari pertanyaan yang ingin Anda lengkapi datanya.</p>
          </div>
          {/* Step 2 */}
          <div className="p-6 bg-[#57E7FB] border-2 border-black shadow-[4px_4px_0px_0px_#000]">
            <FileText className="w-8 h-8 mb-3 text-black" />
            <h3 className="font-black text-lg">2. Cek Contoh</h3>
            <p className="text-sm font-semibold mt-1">Lihat gambar contoh agar dokumen tidak salah.</p>
          </div>
          {/* Step 3 */}
          <div className="p-6 bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] flex flex-col justify-between">
            <div>
              <Layers className="w-8 h-8 mb-3 text-black" />
              <h3 className="font-black text-lg">3. Upload</h3>
            </div>
            <a
              href={DRIVE_UPLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-4 flex items-center justify-center gap-2 w-full bg-black text-white py-2 font-bold hover:bg-zinc-800 transition-colors">
              Buka Drive <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </section>

        {/* === SECTION 3: GRID LIST (KARTU) === */}
        <section ref={indicatorListRef} className="scroll-mt-10">
          <div className="flex items-center justify-between mb-8 border-b-4 border-black pb-4">
            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 md:w-8 md:h-8" />
              Daftar Indikator
            </h2>
            <div className="bg-black text-white px-3 py-1 font-mono font-bold text-sm shadow-[4px_4px_0px_0px_#888]">
              {filteredData.length} ITEM
            </div>
          </div>

          {filteredData.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => setSelectedIndicator(item)}
                  className="group cursor-pointer flex flex-col justify-between bg-white border-2 border-black p-6 shadow-[4px_4px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 transition-all duration-200">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-gray-100 border border-black px-2 py-1 truncate max-w-[70%]">
                        {item.aspek}
                      </span>
                      <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-[#FFDE59] border-2 border-black font-bold text-xs rounded-full">
                        {item.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold leading-tight line-clamp-3 group-hover:text-blue-600 transition-colors">
                      {item.pertanyaan}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t-2 border-gray-100 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest group-hover:text-black transition-colors">
                      Lihat Detail
                    </span>
                    <div className="bg-black text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <ArrowRight className="w-3 h-3 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-20 text-center bg-white border-2 border-black shadow-[8px_8px_0px_0px_#000]">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-gray-100 border-2 border-black mb-6 rounded-full">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-black mb-2">DATA TIDAK DITEMUKAN</h3>
              <p className="text-gray-600 font-medium mb-6">Coba kata kunci lain atau reset filter.</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilter('Semua')
                }}
                className="px-8 py-3 bg-black text-white font-bold border-2 border-transparent hover:bg-white hover:text-black hover:border-black hover:shadow-[4px_4px_0px_0px_#000] transition-all">
                RESET PENCARIAN
              </button>
            </div>
          )}
        </section>
      </div>

      {/* === MODALS (Global Overlay) === */}
      <AnimatePresence>
        {/* 1. Modal Detail Indikator (Layer 50) */}
        {selectedIndicator && (
          <IndicatorModal
            data={selectedIndicator}
            onClose={() => setSelectedIndicator(null)}
            onImageClick={setActiveImage}
          />
        )}

        {/* 2. Lightbox Image Viewer (Layer 100 - Paling Atas) */}
        {activeImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop Lightbox */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-[#FFDE59]/95 backdrop-blur-md"
            />

            {/* Image Container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none">
              <div className="pointer-events-auto relative max-w-5xl w-full flex flex-col items-center">
                {/* Close Button Lightbox */}
                <button
                  onClick={() => setActiveImage(null)}
                  className="absolute -top-12 md:-top-6 right-0 md:-right-6 w-12 h-12 bg-red-500 border-2 border-black text-white flex items-center justify-center hover:bg-red-600 hover:scale-110 transition-transform shadow-[4px_4px_0px_0px_#000] z-50">
                  <X className="w-6 h-6 stroke-3" />
                </button>

                {/* The Image */}
                <div className="bg-white p-2 border-4 border-black shadow-[16px_16px_0px_0px_#000]">
                  <img
                    src={activeImage.url}
                    alt={activeImage.caption}
                    className="max-h-[70vh] w-auto object-contain border-2 border-black"
                  />
                </div>

                {/* Caption */}
                <div className="mt-6 bg-black text-white px-6 py-4 border-2 border-white text-center shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)]">
                  <span className="text-xs font-bold text-[#FFDE59] uppercase tracking-widest block mb-1">CAPTION</span>
                  <span className="font-bold text-lg">{activeImage.caption}</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home
