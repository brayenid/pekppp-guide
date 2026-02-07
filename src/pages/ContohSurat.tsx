// src/pages/ContohSurat.tsx
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Search, FileJson, FileType } from 'lucide-react'
import dataRaw from '../data/surat.json'

// Definisikan tipe data agar TypeScript senang
interface Surat {
  id: number
  judul: string
  kategori: string
  deskripsi: string
  tipe: string
  ukuran: string
  url: string
}

const dataSurat = dataRaw as Surat[]

export default function ContohSurat() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('Semua')

  // Ambil kategori unik untuk filter
  const categories = useMemo(() => ['Semua', ...new Set(dataSurat.map((item) => item.kategori))], [])

  // Filter Logic
  const filteredData = useMemo(() => {
    return dataSurat.filter((item) => {
      const matchSearch = item.judul.toLowerCase().includes(searchQuery.toLowerCase())
      const matchCategory = selectedCategory === 'Semua' || item.kategori === selectedCategory
      return matchSearch && matchCategory
    })
  }, [searchQuery, selectedCategory])

  return (
    <div className="relative max-w-7xl mx-auto px-6 py-16 font-sans text-black">
      {/* HEADER SECTION */}
      <header className="mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-[#FF9F1C] border-2 border-black px-4 py-1 mb-4 shadow-[4px_4px_0px_0px_#000]">
          <span className="text-sm font-black uppercase tracking-widest">Bank Data</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-5xl md:text-7xl font-black tracking-tighter text-black mb-6 leading-[0.9]">
          CONTOH{' '}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-red-600 underline decoration-black decoration-4 underline-offset-8">
            SURAT
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-bold text-gray-600 max-w-2xl leading-relaxed">
          Kumpulan template surat dinas siap pakai. Unduh, edit sesuai kebutuhan, dan gunakan. Jangan lupa sesuaikan KOP
          instansi Anda.
        </motion.p>
      </header>

      {/* TOOLBAR (SEARCH & FILTER) */}
      <section className="mb-12 flex flex-col md:flex-row gap-6 items-start md:items-end justify-between">
        {/* Search Bar */}
        <div className="w-full md:w-1/2 relative group">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400 group-focus-within:text-black transition-colors" />
          </div>
          <input
            type="text"
            placeholder="Cari surat (misal: Undangan)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border-4 border-black py-4 pl-12 pr-4 font-bold placeholder:font-medium placeholder:text-gray-300 focus:outline-none focus:shadow-[8px_8px_0px_0px_#000] transition-all"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 border-2 border-black font-bold text-xs uppercase tracking-wider transition-all hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#000] ${
                selectedCategory === cat ? 'bg-black text-white' : 'bg-white text-black'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* GRID LIST SURAT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredData.length > 0 ? (
          filteredData.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group relative flex flex-col bg-white border-4 border-black p-6 shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] hover:-translate-y-2 transition-all duration-300">
              {/* Badge Tipe File (Pojok Kanan) */}
              <div
                className={`absolute top-0 right-0 px-3 py-1 border-l-4 border-b-4 border-black font-black text-xs ${
                  item.tipe === 'DOCX' ? 'bg-blue-200' : 'bg-red-200'
                }`}>
                {item.tipe}
              </div>

              {/* Icon Container */}
              <div className="w-14 h-14 bg-[#FF9F1C] border-2 border-black flex items-center justify-center mb-6 shadow-[4px_4px_0px_0px_#000]">
                {item.tipe === 'DOCX' ? (
                  <FileText className="w-8 h-8 text-black" />
                ) : (
                  <FileType className="w-8 h-8 text-black" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 mb-6">
                <span className="inline-block bg-gray-100 border border-black px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest mb-2">
                  {item.kategori}
                </span>
                <h3 className="text-xl font-black leading-tight mb-3 group-hover:underline decoration-4 underline-offset-4">
                  {item.judul}
                </h3>
                <p className="text-sm font-medium text-gray-500 leading-relaxed">{item.deskripsi}</p>
              </div>

              {/* Footer / Action */}
              <div className="mt-auto pt-4 border-t-4 border-black flex items-center justify-between">
                <span className="text-xs font-bold text-gray-400">{item.ukuran}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-black text-white px-4 py-2 font-bold text-xs uppercase hover:bg-[#FF9F1C] hover:text-black hover:border-black border-2 border-transparent transition-colors">
                  <Download className="w-4 h-4" />
                  Unduh
                </a>
              </div>
            </motion.div>
          ))
        ) : (
          /* Empty State */
          <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-300 rounded-xl">
            <FileJson className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-black text-gray-400">Tidak ada surat ditemukan</h3>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Semua')
              }}
              className="mt-4 text-sm font-bold underline text-black hover:text-[#FF9F1C]">
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
