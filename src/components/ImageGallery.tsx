// src/components/ImageGallery.tsx
import React from 'react'
import { type PekpppImage } from '../types/pekppp'
import { Maximize2 } from 'lucide-react'

interface Props {
  images: PekpppImage[]
  onImageClick: (img: PekpppImage) => void // Prop baru untuk handle klik
}

export const ImageGallery: React.FC<Props> = ({ images, onImageClick }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {images.map((img, idx) => (
        <div
          key={idx}
          onClick={() => onImageClick(img)}
          className="group relative rounded-xl overflow-hidden border border-zinc-200 bg-zinc-100 cursor-zoom-in">
          <img
            src={img.url}
            alt={img.caption}
            className="w-full h-56 object-cover transition-all duration-500 group-hover:scale-105 group-hover:brightness-90"
            loading="lazy"
            onError={(e) => {
              ;(e.target as HTMLImageElement).src = 'https://via.placeholder.com/600x400?text=Dokumen+PEKPPP'
            }}
          />

          {/* Overlay Icon on Hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="bg-white/90 p-2 rounded-full shadow-lg">
              <Maximize2 className="w-4 h-4 text-zinc-900" />
            </div>
          </div>

          <div className="absolute bottom-0 inset-x-0 bg-white border-t border-zinc-100 p-2">
            <p className="text-[11px] font-medium text-zinc-600 uppercase tracking-wider truncate text-center">
              {img.caption}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
