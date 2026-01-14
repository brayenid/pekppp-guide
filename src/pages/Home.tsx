// src/pages/Home.tsx
import { useState, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Info, Search, X, Sparkles, ExternalLink, MousePointerClick, ArrowRight } from 'lucide-react'
import { type PekpppIndikator, type PekpppImage } from '../types/pekppp'
import dataRaw from '../data/pekppp.json'
import { ImageGallery } from '../components/ImageGallery'
import { DRIVE_UPLOAD_URL } from '../App'

const dataPekppp = dataRaw as PekpppIndikator[]

const Home = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<string>('Semua')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeImage, setActiveImage] = useState<PekpppImage | null>(null)

  const indicatorListRef = useRef<HTMLDivElement>(null)

  // Fungsi Scroll ke daftar indikator
  const scrollToIndicators = () => {
    indicatorListRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const categories = useMemo(() => ['Semua', ...new Set(dataPekppp.map((i) => i.aspek))], [])

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

  return (
    <div className={`relative max-w-5xl mx-auto px-6 py-12 ${activeImage ? 'overflow-hidden' : ''}`}>
      {/* SECTION 1: HERO & SEARCH */}
      <section className="mb-12">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-10 mb-10">
          <div className="max-w-2xl">
            <motion.h1
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="text-5xl md:text-6xl font-semibold tracking-tighter text-zinc-900 mb-5">
              PEKPPP <span className="text-zinc-300 font-light">Docs</span>
            </motion.h1>
            <div className="space-y-3">
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="text-lg md:text-xl text-zinc-600 font-medium leading-tight">
                Bingung cara menyiapkan bukti dukung digital?
              </motion.p>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="text-sm md:text-base text-zinc-500 leading-relaxed font-normal">
                Portal ini membantu Anda memahami <span className="text-zinc-900 font-semibold">kriteria dokumen</span>{' '}
                yang diminta untuk penilaian PEKPPP, menyediakan{' '}
                <span className="text-zinc-900 font-semibold">referensi visual</span> agar tidak salah unggah.
              </motion.p>
            </div>
          </div>

          <div className="w-full lg:max-w-sm space-y-2">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Cari kata kunci lalu tekan Enter..."
                className="w-full bg-white border border-zinc-200 rounded-xl py-3 pl-11 pr-4 text-sm focus:outline-none focus:border-blue-500 transition-all shadow-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && scrollToIndicators()} // UX: Tekan enter langsung scroll ke hasil
              />
            </div>
            <p className="text-[10px] text-zinc-400 font-normal px-2 tracking-wide italic">
              Tekan enter untuk melihat hasil di bawah.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setFilter(cat)
                setSelectedId(null)
                scrollToIndicators()
              }}
              className={`px-5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                filter === cat
                  ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm'
                  : 'bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* SECTION 2: 3-STEP GUIDE */}
      <section className="mb-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* TAHAP 1: SEKARANG BISA DIKLIK (CTA) */}
          <button
            onClick={scrollToIndicators}
            className="p-6 bg-zinc-50 border border-zinc-200 rounded-3xl text-left hover:border-blue-300 transition-all group active:scale-[0.98] flex flex-col items-start">
            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-3 block">Tahap 1</span>
            <h3 className="text-base font-semibold text-zinc-900 mb-1.5 flex items-center gap-2">
              Temukan Butir
              <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:translate-x-1 transition-transform" />
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-normal">
              Gunakan pencarian atau filter kategori di atas, lalu{' '}
              <span className="text-blue-600 font-medium">klik di sini</span> untuk melihat daftar.
            </p>
          </button>

          <div className="p-6 bg-white border border-zinc-200 rounded-3xl shadow-sm">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-3 block">Tahap 2</span>
            <h3 className="text-base font-semibold text-zinc-900 mb-1.5">Pelajari Kriteria</h3>
            <p className="text-xs text-zinc-500 leading-relaxed font-normal">
              Buka butir tersebut, baca kriteria bukti dukungnya, dan lihat contoh gambarnya.
            </p>
          </div>

          <div className="p-6 bg-blue-600 rounded-3xl shadow-lg shadow-blue-600/10 text-white">
            <span className="text-[10px] font-bold text-blue-200 uppercase tracking-widest mb-3 block text-opacity-80">
              Tahap 3
            </span>
            <h3 className="text-base font-semibold mb-1.5">Unggah Berkas</h3>
            <p className="text-xs text-blue-50 leading-relaxed mb-4 font-normal">
              Pastikan nama file sesuai, lalu kirim ke folder Drive instansi Anda.
            </p>
            <a
              href={DRIVE_UPLOAD_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium py-2 rounded-lg transition-colors text-xs border border-white/20">
              Ke Folder Drive <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </section>

      {/* SECTION 3: DATA LIST */}
      <section ref={indicatorListRef} className="scroll-mt-10">
        <div className="flex items-center justify-between mb-6 px-1">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
            <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-700">Contoh Bukti Dukung</h2>
          </div>
          <p className="text-[10px] font-medium text-zinc-400 tracking-wide">
            {filteredData.length} Indikator Ditemukan
          </p>
        </div>

        <div className="w-full max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white border border-zinc-200 rounded-3xl overflow-hidden shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)]">
            {filteredData.length > 0 ? (
              filteredData.map((item, index) => {
                const isOpen = selectedId === item.id

                return (
                  <div
                    key={item.id}
                    className={`transition-colors duration-300 ${isOpen ? 'bg-zinc-50/50' : 'bg-white'} ${
                      index !== filteredData.length - 1 ? 'border-b border-zinc-100' : ''
                    }`}>
                    {/* Header / Trigger */}
                    <button
                      onClick={() => setSelectedId(isOpen ? null : item.id)}
                      className="w-full flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-8 p-6 md:p-8 text-left group transition-all">
                      {/* ID & Badge Section */}
                      <div className="flex items-center gap-4 w-full md:w-auto shrink-0">
                        <span className="font-mono text-xs font-bold text-zinc-400 group-hover:text-blue-500 transition-colors">
                          {item.id.padStart(2, '0')}
                        </span>
                        <div className="h-px w-8 bg-zinc-100 hidden md:block" />
                        <span className="md:hidden text-[10px] font-bold text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded">
                          {item.aspek}
                        </span>
                      </div>

                      {/* Title Section */}
                      <div className="flex-1 space-y-2">
                        <div className="hidden md:flex items-center gap-3">
                          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-[0.2em]">
                            {item.aspek}
                          </span>
                          {!isOpen && (
                            <span className="flex items-center gap-1.5 text-[10px] font-medium text-blue-600 uppercase tracking-wider animate-pulse">
                              <MousePointerClick className="w-3 h-3" />
                              Klik Detail
                            </span>
                          )}
                        </div>
                        <h3
                          className={`text-lg md:text-xl font-semibold tracking-tight transition-all duration-300 ${
                            isOpen ? 'text-blue-600' : 'text-zinc-800 group-hover:text-zinc-900'
                          }`}>
                          {item.pertanyaan}
                        </h3>
                      </div>

                      {/* Icon Indicator */}
                      <div
                        className={`hidden md:flex p-2.5 rounded-full transition-all duration-500 ${
                          isOpen
                            ? 'bg-blue-600 text-white rotate-90 shadow-lg shadow-blue-200'
                            : 'bg-zinc-50 text-zinc-400 group-hover:bg-zinc-100 group-hover:text-zinc-600'
                        }`}>
                        <ChevronRight className="w-5 h-5" />
                      </div>
                    </button>

                    {/* Content Area */}
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden">
                          <div className="px-6 md:px-24 pb-10 pt-2 space-y-10">
                            {/* Info Card */}
                            <div className="relative overflow-hidden rounded-2xl border border-blue-100 bg-blue-50/30 p-6">
                              <div className="absolute top-0 left-0 w-1 h-full bg-blue-500" />
                              <div className="flex gap-4">
                                <div className="shrink-0 flex items-center justify-center w-10 h-10 bg-white rounded-xl shadow-sm">
                                  <Info className="w-5 h-5 text-blue-500" />
                                </div>
                                <div>
                                  <h4 className="text-[11px] font-black text-blue-600 uppercase tracking-[0.2em] mb-2">
                                    Kriteria Dokumen
                                  </h4>
                                  <p className="text-[15px] leading-relaxed text-zinc-700 font-medium">
                                    {item.buktiDukung}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Image Gallery Section */}
                            <div className="space-y-6">
                              <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
                                <div className="flex items-center gap-2.5">
                                  <div className="p-1.5 bg-zinc-900 rounded-lg">
                                    <Sparkles className="w-4 h-4 text-white" />
                                  </div>
                                  <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-800">
                                    Referensi Visual
                                  </h4>
                                </div>
                                <span className="text-[10px] text-zinc-400 font-medium italic">
                                  Klik gambar untuk memperbesar
                                </span>
                              </div>

                              <div className="group/gallery">
                                <ImageGallery images={item.images} onImageClick={setActiveImage} />
                              </div>
                            </div>

                            {/* Mobile Close Button */}
                            <button
                              onClick={() => setSelectedId(null)}
                              className="md:hidden w-full py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest border border-zinc-200 rounded-xl">
                              Tutup Detail
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )
              })
            ) : (
              <div className="py-32 px-10 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-zinc-50 rounded-full mb-6">
                  <ArrowRight className="w-6 h-6 text-zinc-300 rotate-45" />
                </div>
                <p className="text-zinc-500 font-medium mb-4">Ups! Data yang kamu cari tidak ditemukan.</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setFilter('Semua')
                  }}
                  className="px-6 py-2.5 bg-zinc-900 text-white text-xs font-bold rounded-full hover:bg-zinc-800 transition-colors shadow-lg shadow-zinc-200">
                  Reset Pencarian
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Lightbox Modal (Tetap Sama) */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-200 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-white/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative w-full max-w-5xl bg-white border border-zinc-200 shadow-2xl rounded-2xl overflow-hidden">
              <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 p-2 bg-white border border-zinc-200 rounded-full z-210 hover:bg-zinc-100 transition-all">
                <X className="w-4 h-4 text-zinc-900" />
              </button>
              <div className="p-2 flex justify-center bg-zinc-50">
                <img
                  src={activeImage.url}
                  alt={activeImage.caption}
                  className="max-h-[75vh] w-auto object-contain rounded-lg shadow-sm"
                />
              </div>
              <div className="p-6 bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest mb-1.5 block text-center md:text-left">
                    Detail Bukti
                  </span>
                  <p className="text-base font-semibold text-zinc-800 tracking-tight text-center md:text-left">
                    {activeImage.caption}
                  </p>
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
