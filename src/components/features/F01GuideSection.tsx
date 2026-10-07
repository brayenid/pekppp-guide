'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Search, Image as ImageIcon, X, ZoomIn, Info, HelpCircle } from 'lucide-react'

export interface GuideImage {
  url: string
  caption: string
}

export interface GuideItem {
  id: string
  aspek: string
  pertanyaan: string
  buktiDukung: string
  images: GuideImage[]
}

export function F01GuideSection({ items }: { items: GuideItem[] }) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedAspek, setSelectedAspek] = useState('Semua')
  const [activeImage, setActiveImage] = useState<GuideImage | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Extract unique aspects
  const aspekList = ['Semua', ...Array.from(new Set(items.map((item) => item.aspek)))]

  // Filter items based on search and aspect filter
  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.pertanyaan.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.buktiDukung.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.aspek.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAspek = selectedAspek === 'Semua' || item.aspek === selectedAspek
    return matchesSearch && matchesAspek
  })

  // Prevent background scroll when modal is active
  useEffect(() => {
    if (activeImage) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [activeImage])

  const modalContent = activeImage && (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="relative max-w-4xl w-full bg-white rounded-[20px] overflow-hidden shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8e8]">
          <span className="text-xs font-bold text-[#090c1d] uppercase tracking-wide">
            Pratinjau Contoh Bukti Dukung
          </span>
          <button
            type="button"
            onClick={() => setActiveImage(null)}
            className="p-1 rounded-full hover:bg-[#f8f9fa] text-[#838383] hover:text-[#202020] transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Image Containment */}
        <div className="flex-1 bg-[#1a1a1a] flex items-center justify-center p-6 max-h-[70vh] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImage.url}
            alt={activeImage.caption}
            className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-lg"
          />
        </div>

        {/* Footer Caption */}
        <div className="px-6 py-4 bg-[#f8f9fa] border-t border-[#e8e8e8]">
          <p className="text-xs text-[#090c1d] font-bold">Keterangan Gambar:</p>
          <p className="text-xs text-[#646464] mt-1 leading-relaxed">{activeImage.caption}</p>
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Search & Filter Toolbar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Aspect Filter Pills */}
        <div className="flex flex-wrap gap-2 overflow-x-auto pb-1 scrollbar-none">
          {aspekList.map((aspek) => {
            const isActive = selectedAspek === aspek
            return (
              <button
                key={aspek}
                type="button"
                onClick={() => setSelectedAspek(aspek)}
                className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-brand border-brand text-white shadow-2xs'
                    : 'bg-white border-stroke/60 text-ink-secondary hover:text-ink hover:bg-surface-subtle'
                }`}>
                {aspek}
              </button>
            )
          })}
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-80 shrink-0">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-muted" />
          <input
            type="text"
            placeholder="Cari indikator atau eviden..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stroke/60 rounded-full text-xs placeholder:text-ink-muted text-ink focus:outline-none focus:border-brand transition-all shadow-2xs"
          />
        </div>
      </div>

      {/* Guide Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div
              key={item.id}
              className="bg-surface-elevated border border-stroke/50 rounded-2xl p-6 space-y-4 shadow-soft-card hover:border-brand/40 transition-all flex flex-col justify-between">
              <div className="space-y-3">
                {/* Aspek Badge & Indicator ID */}
                <div className="flex items-center justify-between gap-4">
                  <span className="px-3 py-1 rounded-full bg-brand-light text-brand text-xs font-medium">
                    {item.aspek}
                  </span>
                  <span className="px-3 py-1 rounded-full bg-surface-subtle text-ink-secondary text-xs font-mono font-medium border border-stroke/40 shrink-0">
                    #{item.id}
                  </span>
                </div>

                {/* Pertanyaan */}
                <h3 className="text-sm font-medium text-ink leading-relaxed">
                  {item.pertanyaan}
                </h3>

                {/* Bukti Dukung Alert/Box */}
                <div className="p-4 bg-surface-subtle/80 border border-stroke/50 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-ink">
                    <Info className="w-3.5 h-3.5 text-brand" />
                    <span>DOKUMEN BUKTI DUKUNG:</span>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    {item.buktiDukung}
                  </p>
                </div>
              </div>

              {/* Contoh Gambar Gallery */}
              {item.images && item.images.length > 0 && (
                <div className="pt-3 border-t border-slate-100 space-y-2 mt-auto">
                  <div className="flex items-center gap-1 text-[10px] font-mono text-slate-400 uppercase tracking-wider font-bold">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>Contoh Gambar Upload:</span>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {item.images.map((img, idx) => (
                      <div
                        key={idx}
                        onClick={() => setActiveImage(img)}
                        className="relative aspect-video rounded-lg border border-slate-200 bg-slate-50 overflow-hidden group cursor-zoom-in hover:border-slate-900 transition-all">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.url}
                          alt={img.caption}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-4 h-4 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center bg-surface-subtle border border-stroke/60 rounded-2xl">
            <p className="text-xs text-ink-muted">Tidak ditemukan panduan bukti dukung yang cocok.</p>
          </div>
        )}
      </div>

      {/* Render modal directly into document.body using React Portal */}
      {mounted && activeImage ? createPortal(modalContent, document.body) : null}
    </div>
  )
}
