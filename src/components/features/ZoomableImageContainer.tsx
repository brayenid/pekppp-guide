'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react'

interface ZoomableImageContainerProps {
  src: string
  alt: string
  className?: string
}

export function ZoomableImageContainer({ src, alt, className = '' }: ZoomableImageContainerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const pinchStartDistRef = useRef<number | null>(null)
  const initialPinchScaleRef = useRef(1)

  // Reset zoom & pan when image src changes
  useEffect(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [src])

  const handleReset = useCallback(() => {
    setScale(1)
    setPosition({ x: 0, y: 0 })
  }, [])

  const handleZoomIn = useCallback(() => {
    setScale((prev) => Math.min(prev * 1.3, 5))
  }, [])

  const handleZoomOut = useCallback(() => {
    setScale((prev) => {
      const next = Math.max(prev / 1.3, 1)
      if (next === 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  // Wheel zoom bounded strictly inside container
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85
    setScale((prev) => {
      const next = Math.min(Math.max(prev * zoomFactor, 1), 5)
      if (next === 1) setPosition({ x: 0, y: 0 })
      return next
    })
  }, [])

  // Touch handlers for mobile pinch-to-zoom & pan
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      // 2 fingers: pinch gesture
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      pinchStartDistRef.current = dist
      initialPinchScaleRef.current = scale
    } else if (e.touches.length === 1 && scale > 1) {
      // 1 finger pan when zoomed
      isDraggingRef.current = true
      dragStartRef.current = {
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y
      }
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
      // Pinching
      e.preventDefault()
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      )
      const ratio = dist / pinchStartDistRef.current
      const next = Math.min(Math.max(initialPinchScaleRef.current * ratio, 1), 5)
      setScale(next)
      if (next === 1) setPosition({ x: 0, y: 0 })
    } else if (e.touches.length === 1 && isDraggingRef.current && scale > 1) {
      // Panning
      e.preventDefault()
      setPosition({
        x: e.touches[0].clientX - dragStartRef.current.x,
        y: e.touches[0].clientY - dragStartRef.current.y
      })
    }
  }

  const handleTouchEnd = () => {
    pinchStartDistRef.current = null
    isDraggingRef.current = false
  }

  // Mouse pan handlers when zoomed in
  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale <= 1) return
    e.preventDefault()
    isDraggingRef.current = true
    dragStartRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || scale <= 1) return
    e.preventDefault()
    setPosition({
      x: e.clientX - dragStartRef.current.x,
      y: e.clientY - dragStartRef.current.y
    })
  }

  const handleMouseUp = () => {
    isDraggingRef.current = false
  }

  // Double click / tap to toggle zoom
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    if (scale > 1) {
      handleReset()
    } else {
      setScale(2)
    }
  }

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      className={`relative w-full h-full overflow-hidden select-none flex items-center justify-center bg-surface-subtle ${
        scale > 1 ? 'cursor-grab active:cursor-grabbing' : 'cursor-zoom-in'
      } ${className}`}
      style={{ touchAction: 'none' }}
    >
      {/* Floating Micro Controls */}
      <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1 bg-surface-elevated/90 backdrop-blur-sm p-1 rounded-lg border border-stroke/50 shadow-soft-card">
        <button
          type="button"
          onClick={handleZoomIn}
          disabled={scale >= 5}
          className="p-1 rounded text-ink-secondary hover:text-ink hover:bg-surface-subtle disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Perbesar (Zoom In)"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <span className="text-[10px] font-semibold text-ink px-1 min-w-[32px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          type="button"
          onClick={handleZoomOut}
          disabled={scale <= 1}
          className="p-1 rounded text-ink-secondary hover:text-ink hover:bg-surface-subtle disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed transition-colors"
          title="Perkecil (Zoom Out)"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        {scale > 1 && (
          <button
            type="button"
            onClick={handleReset}
            className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-subtle cursor-pointer transition-colors border-l border-stroke/40 ml-0.5 pl-1.5"
            title="Reset Zoom (100%)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Image with Hardware-accelerated CSS Transform bounded to container */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{
          transform: `translate(${position.x}px, ${position.y}px) scale(${scale})`,
          transition: isDraggingRef.current ? 'none' : 'transform 0.15s ease-out',
          transformOrigin: 'center center'
        }}
        className="max-w-full max-h-full object-contain pointer-events-none rounded shadow-2xs"
      />
    </div>
  )
}
