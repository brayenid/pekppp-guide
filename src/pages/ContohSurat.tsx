// src/pages/ContohSurat.tsx
import { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { FileText, Download, Search, FileJson, FileType, Filter } from 'lucide-react'
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
    <div className="relative max-w-7xl mx-auto px-6 py-16 font-sans text-slate-800">
      {/* HEADER SECTION */}
      <header className="mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-[#0f172a] text-white border border-slate-200 rounded-lg px-4 py-1 mb-4 shadow-sm">
          <span className="text-sm font-bold uppercase tracking-wider text-white">Contoh</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-4xl md:text-5xl font-serif font-bold text-gov-blue mb-4 leading-tight">
          Contoh{' '}
          <span className="text-gov-gold">
            Surat
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-base text-slate-500 max-w-2xl leading-relaxed">
          Kumpulan template surat dinas siap pakai. Unduh, edit sesuai kebutuhan, dan gunakan. Jangan lupa sesuaikan KOP
          OPP Anda.
        </motion.p>
      </header>

      {/* TOOLBAR (SEARCH & FILTER) */}
      <section className="mb-10 flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Search Bar */}
        <div className="w-full md:w-80 relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Search className="w-4 h-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Cari surat (misal: Undangan)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-lg py-2.5 pl-9 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-gov-blue/20 transition-all shadow-sm"
          />
        </div>

        {/* Filter Badges */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="w-4 h-4 text-slate-400 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 border font-bold text-xs uppercase tracking-wider transition-all rounded-lg ${
                selectedCategory === cat
                  ? 'bg-[#0f172a] text-white border-[#0f172a] shadow-md'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}>
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* Count */}
      <div className="text-xs text-slate-400 mb-6">
        Menampilkan <span className="text-gov-blue font-bold">{filteredData.length}</span> dari {dataSurat.length} template
      </div>

      {/* GRID LIST SURAT */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredData.length > 0 ? (
          filteredData.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05 }}
              className="group relative flex flex-col bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 overflow-hidden">
              {/* Top accent bar */}
              <div className="h-1 w-full bg-gov-blue shrink-0" />

              <div className="p-6 flex flex-col flex-1">
                {/* Badge Tipe File */}
                <div className="flex items-center justify-between mb-5">
                  <span className="inline-block bg-slate-100 text-slate-600 rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    {item.kategori}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                    item.tipe === 'DOCX' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {item.tipe}
                  </span>
                </div>

                {/* Icon + Content */}
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-11 h-11 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 text-gov-blue shadow-sm">
                    {item.tipe === 'DOCX' ? (
                      <FileText className="w-5 h-5" />
                    ) : (
                      <FileType className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-slate-800 leading-tight mb-1 group-hover:text-gov-blue transition-colors">
                      {item.judul}
                    </h3>
                    <p className="text-xs text-slate-400">{item.ukuran}</p>
                  </div>
                </div>

                <p className="text-sm text-slate-500 leading-relaxed flex-1 mb-5">{item.deskripsi}</p>

                {/* Footer / Action */}
                <div className="mt-auto pt-4 border-t border-slate-100">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-[#0f172a] text-white px-4 py-2.5 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-slate-700 transition-colors shadow-sm">
                    <Download className="w-4 h-4" />
                    Unduh Template
                  </a>
                </div>
              </div>
            </motion.div>
          ))
        ) : (
          /* Empty State */
          <div className="col-span-full py-20 text-center border border-dashed border-slate-300 rounded-xl">
            <FileJson className="w-14 h-14 mx-auto text-slate-300 mb-4" />
            <h3 className="text-lg font-bold text-slate-400">Tidak ada surat ditemukan</h3>
            <button
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('Semua')
              }}
              className="mt-4 text-sm font-bold text-gov-blue hover:underline">
              Reset Filter
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
