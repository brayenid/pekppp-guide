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
          className="group relative w-full text-left bg-white border-2 border-black shadow-[4px_4px_0px_0px_#000] hover:shadow-[8px_8px_0px_0px_#000] hover:-translate-y-1 transition-all duration-300 cursor-zoom-in">
          {/* Image Container */}
          <div className="relative h-48 w-full overflow-hidden border-b-2 border-black bg-gray-100">
            <img
              src={img.url}
              alt={img.caption}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              loading="lazy"
              onError={(e) => {
                // Menggunakan placeholder yang lebih kontras (Hitam Putih)
                ;(e.target as HTMLImageElement).src = 'https://placehold.co/600x400/000000/FFFFFF/png?text=IMG+ERROR'
              }}
            />

            {/* Overlay Badge saat Hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <div className="flex items-center gap-2 bg-[#FFDE59] border-2 border-black px-4 py-2 shadow-[4px_4px_0px_0px_#000] transform translate-y-4 group-hover:translate-y-0 transition-transform">
                <Maximize2 className="w-4 h-4 text-black" />
                <span className="text-xs font-black uppercase tracking-widest text-black">Zoom</span>
              </div>
            </div>
          </div>

          {/* Caption Area */}
          <div className="p-3 bg-white group-hover:bg-[#FFDE59] transition-colors duration-300">
            <div className="flex items-center gap-2">
              <div className="shrink-0 p-1 bg-black text-white">
                <ImageIcon className="w-3 h-3" />
              </div>
              <p className="text-xs font-bold text-black uppercase tracking-wider truncate">{img.caption}</p>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
