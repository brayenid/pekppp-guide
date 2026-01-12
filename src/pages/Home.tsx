// src/pages/Home.tsx
import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Info, Search, X, Sparkles, FolderOpen, ExternalLink } from 'lucide-react'
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

  // Ref untuk menargetkan box indikator
  const indicatorListRef = useRef<HTMLDivElement>(null)

  // Fungsi untuk scroll ke daftar indikator
  const scrollToIndicators = () => {
    indicatorListRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    })
  }

  const categories = ['Semua', ...new Set(dataPekppp.map((i) => i.aspek))]

  const filteredData = dataPekppp.filter((i) => {
    const matchesFilter = filter === 'Semua' || i.aspek === filter
    const query = searchQuery.toLowerCase()
    const matchesSearch =
      i.pertanyaan.toLowerCase().includes(query) ||
      i.aspek.toLowerCase().includes(query) ||
      i.buktiDukung.toLowerCase().includes(query) ||
      i.id.includes(query)

    return matchesFilter && matchesSearch
  })

  return (
    <div className={`relative max-w-5xl mx-auto px-6 py-12 ${activeImage ? 'overflow-hidden' : ''}`}>
      {/* Header Section */}
      <header className="mb-12">
        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl font-semibold tracking-tight text-zinc-900 mb-6">
          PEKPPP <span className="text-zinc-400 font-normal">Docs</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="text-base text-zinc-500 max-w-xl leading-relaxed font-medium mb-8">
          Panduan komprehensif penyiapan bukti dukung digital untuk UPP Kabupaten Kutai Barat. Gunakan kolom pencarian
          untuk menemukan butir pertanyaan atau kriteria dokumen.
        </motion.p>

        {/* Info Box Tambahan */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-full">
          <div className="flex items-start gap-3 p-4 bg-zinc-50 border border-zinc-200 rounded-2xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-zinc-100 shadow-sm">
              <Sparkles className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-zinc-900 uppercase tracking-tight mb-0.5">Referensi Visual</p>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Klik pada salah satu indikator di bawah untuk melihat{' '}
                <button
                  onClick={scrollToIndicators}
                  className="text-zinc-900 font-semibold italic underline decoration-blue-200 decoration-2 hover:decoration-blue-400 transition-colors cursor-pointer outline-none">
                  contoh bukti dukung
                </button>
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-4 bg-amber-50/50 border border-amber-100 rounded-2xl shadow-sm">
            <div className="p-2 bg-white rounded-lg border border-amber-100 shadow-sm">
              <Info className="w-4 h-4 text-amber-600" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-amber-900 uppercase tracking-tight mb-0.5">Navigasi Lanjutan</p>
              <p className="text-xs text-amber-800/70 leading-relaxed">
                Lihat menu{' '}
                <span className="text-amber-900 font-semibold italic underline decoration-amber-200 decoration-2">
                  Panduan & Data
                </span>{' '}
                pada bilah navigasi atas untuk tata cara pengunggahan.
              </p>
            </div>
          </div>

          {/* Box Informasi Akses Drive */}
          <div className="flex items-start gap-3 p-4 bg-blue-50/50 border border-blue-100 rounded-2xl shadow-sm group">
            <div className="p-2 bg-white rounded-lg border border-blue-100 shadow-sm group-hover:bg-blue-600 transition-colors">
              <FolderOpen className="w-4 h-4 text-blue-600 group-hover:text-white transition-colors" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-blue-900 uppercase tracking-tight mb-0.5 flex items-center gap-2">
                Akses Penyimpanan Digital
                <span className="w-1 h-1 bg-blue-400 rounded-full animate-pulse" />
              </p>
              <p className="text-xs text-blue-800/70 leading-relaxed font-medium">
                Unggah seluruh berkas Anda ke{' '}
                <a
                  href={DRIVE_UPLOAD_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-900 font-bold italic underline decoration-blue-300 decoration-2 hover:text-blue-700 hover:decoration-blue-500 transition-all inline-flex items-center gap-1">
                  Folder Drive OPP
                  <ExternalLink className="w-3 h-3" />
                </a>{' '}
                sesuai dengan instansi masing-masing untuk dilakukan verifikasi.
              </p>
            </div>
          </div>
        </motion.div>
      </header>

      {/* Action Bar: Search & Filter Chips */}
      <div className="space-y-6 mb-12">
        {/* Tambahan Label di atas Search */}
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-600 rounded-full" /> {/* Aksen garis vertikal */}
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-zinc-600">Contoh Bukti Dukung</h2>
        </div>

        <div className="relative max-w-md group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-zinc-900 transition-colors" />
          <input
            type="text"
            placeholder="Cari indikator, kriteria, atau dokumen..."
            className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:border-zinc-900 transition-all shadow-sm"
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

      {/* List Indikator - Diberi Ref untuk Scroll Target */}
      <div
        ref={indicatorListRef}
        className="scroll-mt-24 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        {filteredData.length > 0 ? (
          filteredData.map((item, index) => (
            <div key={index} className="border-b border-zinc-100 last:border-none">
              <button
                onClick={() => setSelectedId(selectedId === item.id ? null : item.id)}
                className="w-full flex items-center gap-6 p-5 text-left hover:bg-zinc-50/50 transition-colors group">
                <span className="font-mono text-[11px] font-bold text-zinc-300 group-hover:text-zinc-500 transition-colors shrink-0">
                  {item.id.padStart(2, '0')}
                </span>
                <div className="flex-1">
                  <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block mb-1">
                    {item.aspek}
                  </span>
                  <h3 className="text-sm font-semibold text-zinc-800 leading-snug">{item.pertanyaan}</h3>
                </div>
                <ChevronRight
                  className={`w-4 h-4 text-zinc-300 transition-transform duration-300 shrink-0 ${
                    selectedId === item.id ? 'rotate-90' : ''
                  }`}
                />
              </button>

              <AnimatePresence>
                {selectedId === item.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="overflow-hidden bg-zinc-50/30">
                    <div className="px-6 md:px-16 pb-10 pt-2 border-t border-zinc-100">
                      <div className="flex gap-4 p-5 rounded-xl border border-zinc-200 bg-white shadow-sm mb-8 mt-4">
                        <Info className="w-4 h-4 text-zinc-900 mt-1 shrink-0" />
                        <div>
                          <p className="text-[10px] font-bold text-zinc-400 uppercase mb-1 tracking-widest">
                            Kriteria Bukti
                          </p>
                          <p className="text-sm text-zinc-600 font-medium leading-relaxed italic">{item.buktiDukung}</p>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 text-zinc-400">
                          <Sparkles className="w-3 h-3" />
                          <p className="text-[10px] font-bold uppercase tracking-widest">Referensi Gambar</p>
                        </div>
                        <ImageGallery images={item.images} onImageClick={setActiveImage} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))
        ) : (
          <div className="p-20 text-center text-zinc-400 text-sm">
            Tidak ada indikator yang sesuai dengan pencarian Anda.
          </div>
        )}
      </div>

      {/* Modal Image Lightbox */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setActiveImage(null)}
              className="absolute inset-0 bg-white/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-5xl bg-white border border-zinc-200 shadow-2xl rounded-2xl overflow-hidden">
              <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 p-2 bg-white border border-zinc-200 rounded-full z-[210] hover:bg-zinc-100 transition-colors shadow-sm">
                <X className="w-5 h-5 text-zinc-900" />
              </button>

              <div className="p-2 flex justify-center bg-zinc-50 overflow-hidden">
                <img
                  src={activeImage.url}
                  alt={activeImage.caption}
                  className="max-h-[70vh] w-auto object-contain rounded-lg shadow-inner select-none"
                />
              </div>

              <div className="p-6 bg-white flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Preview Dokumen</p>
                  <p className="text-sm font-bold text-zinc-900 uppercase tracking-widest leading-none">
                    {activeImage.caption}
                  </p>
                </div>
                <div className="px-3 py-1 bg-zinc-100 rounded-md text-[10px] font-bold text-zinc-400 uppercase">
                  PEKPPP 2026 Reference
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
