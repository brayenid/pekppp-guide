// src/pages/Home.tsx
import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, ExternalLink, ArrowRight, Layers, FileText, LayoutGrid } from 'lucide-react'
import { type PekpppIndikator, type PekpppImage } from '../types/pekppp'
import dataRaw from '../data/pekppp.json' // Pastikan path JSON benar
import { DRIVE_UPLOAD_URL } from '../App' // Pastikan konstanta URL Drive benar
import { IndicatorModal } from '../components/IndicatorModal'
import { InfoBox } from '../components/InfoBox'

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
      className={`relative min-h-screen font-sans text-slate-900 ${selectedIndicator || activeImage ? 'overflow-hidden h-screen' : ''}`}>
      <div className="relative z-10 py-12 md:py-20">
        {/* === SECTION 1: HEADER & SEARCH === */}
        <section className="mb-16">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-12">
            {/* Title Area */}
            <div className="max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center bg-gov-blue text-gov-gold px-4 py-1.5 rounded-full shadow-sm mb-6">
                <span className="text-xs font-semibold uppercase tracking-wider">Panduan Bukti Dukung</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-5xl md:text-6xl font-serif font-bold text-gov-blue mb-6 leading-tight">
                PEKPPP <span className="text-gov-gold">Kutai Barat</span>
              </motion.h1>

              <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-xl shadow-slate-200/50">
                <p className="text-xl font-serif font-semibold text-gov-blue">Tentang Portal</p>
                <p className="text-slate-600 mt-3 leading-relaxed">
                  Portal ini adalah panduan resmi dalam menyiapkan bukti dukung pada penilaian PEKPPP
                  2026. Klik kartu di bawah untuk melihat detail kriteria dan contoh visual.
                </p>
              </div>
            </div>

            {/* Search Box */}
            <div className="w-full lg:max-w-md space-y-3">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-gov-blue transition-colors" />
                <input
                  type="text"
                  placeholder="Cari pertanyaan (cth: kebijakan)..."
                  className="w-full bg-white border border-slate-300 py-4 pl-12 pr-4 rounded-xl text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-blue/20 focus:border-gov-blue transition-all shadow-sm"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && scrollToIndicators()}
                />
              </div>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 w-full px-1 overflow-x-auto flex-nowrap pb-4 md:flex-wrap md:overflow-visible md:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setFilter(cat)
                  scrollToIndicators()
                }}
                className={`shrink-0 whitespace-nowrap px-5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                  filter === cat
                    ? 'bg-gov-blue text-white shadow-md'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 hover:text-gov-blue'
                }`}>
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* === SECTION 2: 3-STEP INFO === */}
        <section className="mb-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-slate-100 text-gov-blue rounded-xl flex items-center justify-center mb-5">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-gov-blue mb-2">1. Pilih Pertanyaan</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Cari pertanyaan yang ingin Anda lengkapi datanya.</p>
          </div>
          <div className="p-8 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <div className="w-12 h-12 bg-slate-100 text-gov-blue rounded-xl flex items-center justify-center mb-5">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-bold text-xl text-gov-blue mb-2">2. Cek Contoh</h3>
            <p className="text-slate-600 text-sm leading-relaxed">Lihat gambar contoh agar dokumen tidak salah.</p>
          </div>
          <div className="p-8 bg-gov-blue border border-gov-blue rounded-2xl shadow-lg flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 bg-white/10 text-gov-gold rounded-xl flex items-center justify-center mb-5">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-serif font-bold text-xl text-white mb-2">3. Upload</h3>
            </div>
            <a
              href={DRIVE_UPLOAD_URL}
              target="_blank"
              rel="noreferrer"
              className="mt-6 flex items-center justify-center gap-2 w-full bg-gov-gold text-gov-blue py-3 rounded-xl font-semibold hover:bg-white transition-colors">
              Buka Drive <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </section>
        <div className="mb-16"><InfoBox /></div>
        {/* === SECTION 3: GRID LIST (KARTU) === */}
        <section ref={indicatorListRef} className="scroll-mt-24">
          <div className="flex items-center justify-between mb-8 border-b border-slate-200 pb-4">
            <h2 className="text-2xl md:text-3xl font-serif font-bold text-gov-blue flex items-center gap-3">
              <LayoutGrid className="w-6 h-6 md:w-8 md:h-8 text-gov-gold" />
              Daftar Pertanyaan
            </h2>
            <div className="bg-slate-100 text-gov-blue px-3 py-1 rounded-full font-medium text-sm border border-slate-200">
              {filteredData.length} Item
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
                  className="group cursor-pointer flex flex-col justify-between bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300">
                  <div className="mb-4">
                    <div className="flex justify-between items-start mb-5">
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-600 rounded-md px-2.5 py-1 truncate max-w-[70%]">
                        {item.aspek}
                      </span>
                      <span className="shrink-0 w-8 h-8 flex items-center justify-center bg-gov-blue text-gov-gold font-bold text-xs rounded-full">
                        {item.id}
                      </span>
                    </div>
                    <h3 className="text-lg font-medium text-slate-800 leading-snug line-clamp-3 group-hover:text-gov-blue transition-colors">
                      {item.pertanyaan}
                    </h3>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider group-hover:text-gov-blue transition-colors">
                      Lihat Detail
                    </span>
                    <div className="bg-slate-50 text-slate-400 p-2 rounded-full group-hover:bg-gov-blue group-hover:text-white transition-all">
                      <ArrowRight className="w-3 h-3 -rotate-45 group-hover:rotate-0 transition-transform duration-300" />
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="py-20 text-center bg-white border border-slate-200 rounded-2xl shadow-sm">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-50 rounded-full mb-6">
                <Search className="w-8 h-8 text-slate-300" />
              </div>
              <h3 className="text-xl font-serif font-bold text-gov-blue mb-2">Data Tidak Ditemukan</h3>
              <p className="text-slate-500 mb-8">Coba kata kunci lain atau reset filter pencarian Anda.</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setFilter('Semua')
                }}
                className="px-6 py-2.5 bg-gov-blue text-white rounded-lg font-medium hover:bg-slate-800 transition-colors shadow-sm">
                Reset Pencarian
              </button>
            </div>
          )}
        </section>
      </div>

      {/* === MODALS === */}
      <AnimatePresence>
        {selectedIndicator && (
          <IndicatorModal
            data={selectedIndicator}
            onClose={() => setSelectedIndicator(null)}
            onImageClick={setActiveImage}
          />
        )}

        {activeImage && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full h-full flex flex-col items-center justify-center pointer-events-none">
              <div className="pointer-events-auto relative max-w-5xl w-full flex flex-col items-center">
                <button
                  onClick={() => setActiveImage(null)}
                  className="absolute -top-12 right-0 md:-top-4 md:-right-4 w-10 h-10 bg-white text-slate-900 rounded-full flex items-center justify-center hover:bg-slate-100 hover:scale-105 transition-all shadow-lg z-50">
                  <X className="w-5 h-5" />
                </button>

                <div className="bg-white p-2 rounded-xl shadow-2xl">
                  <img
                    src={activeImage.url}
                    alt={activeImage.caption}
                    className="max-h-[70vh] w-auto object-contain rounded-lg"
                  />
                </div>

                <div className="mt-6 bg-white/10 backdrop-blur-md text-white px-6 py-3 rounded-xl border border-white/20 text-center shadow-lg">
                  <span className="font-medium">{activeImage.caption}</span>
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
