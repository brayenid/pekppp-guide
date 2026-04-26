// src/components/ImageGallery.tsx
import React from 'react'
import { type PekpppImage } from '../types/pekppp'
import { Maximize2, Image as ImageIcon } from 'lucide-react'

interface Props {
  images: PekpppImage[]
  onImageClick: (img: PekpppImage) => void
}

export const ImageGallery: React.FC<Props> = ({ images, onImageClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {images.map((img, idx) => (
        <button
          key={idx}
          onClick={() => onImageClick(img)}
          className="group relative w-full text-left bg-white border border-slate-200 rounded-xl shadow-sm hover:shadow-lg hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 cursor-zoom-in overflow-hidden">
          {/* Image Container */}
          <div className="relative h-48 w-full overflow-hidden border-b border-slate-100 bg-slate-50">
            <img
              src={img.url}
              alt={img.caption}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
              onError={(e) => {
                ;(e.target as HTMLImageElement).src = 'https://placehold.co/600x400/f8fafc/94a3b8/png?text=Image+Not+Found'
              }}
            />

            {/* Overlay Badge saat Hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-2 bg-gov-blue text-white px-4 py-2 rounded-full shadow-md transform translate-y-2 group-hover:translate-y-0 transition-all">
                <Maximize2 className="w-4 h-4" />
                <span className="text-xs font-semibold uppercase tracking-wider">Perbesar</span>
              </div>
            </div>
          </div>

          {/* Caption Area */}
          <div className="p-4 bg-white transition-colors duration-300">
            <div className="flex items-center gap-3">
              <div className="shrink-0 p-1.5 bg-gov-gold/10 text-gov-gold rounded-lg">
                <ImageIcon className="w-4 h-4" />
              </div>
              <p className="text-sm font-medium text-slate-700 truncate">{img.caption}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
