'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  ShieldAlert,
  Square,
  Undo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Save,
  X,
  Loader2,
  Info
} from 'lucide-react'
import { formatFileUrl } from '../../lib/utils'
import { toast } from 'sonner'

export interface RedactBox {
  id: string
  x: number // dalam persentase (0 - 100) dari lebar dokumen asli
  y: number // dalam persentase (0 - 100) dari tinggi dokumen asli
  width: number
  height: number
  page?: number // untuk PDF (1-indexed)
}

export interface DocumentRedactionModalProps {
  isOpen: boolean
  onClose: () => void
  fileUrl: string
  fileName: string
  fileType: 'IMAGE' | 'PDF' | string
  onSaveRedacted: (redactedFile: File) => Promise<void>
}

const BASE_WIDTH = 760

function PdfPageCanvas({ pdfDoc, pageNumber }: { pdfDoc: any; pageNumber: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    let task: any = null
    ;(async () => {
      const page = await pdfDoc.getPage(pageNumber)
      if (cancelled || !canvasRef.current) return
      // Render pada resolusi tinggi tetap; ukuran tampil diatur CSS (w-full)
      const baseVp = page.getViewport({ scale: 1 })
      const scale = (BASE_WIDTH * 2) / baseVp.width
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      canvas.width = viewport.width
      canvas.height = viewport.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      task = page.render({ canvasContext: ctx, viewport })
      try {
        await task.promise
      } catch {
        /* dibatalkan */
      }
    })()
    return () => {
      cancelled = true
      task?.cancel?.()
    }
  }, [pdfDoc, pageNumber])

  return <canvas ref={canvasRef} className="w-full h-auto block pointer-events-none" />
}

export function DocumentRedactionModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  fileType,
  onSaveRedacted
}: DocumentRedactionModalProps) {
  const isPdf = fileType === 'PDF' || fileName.toLowerCase().endsWith('.pdf')
  const [boxes, setBoxes] = useState<RedactBox[]>([])
  const [isDrawing, setIsDrawing] = useState(false)
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null)
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const [zoom, setZoom] = useState(1)
  const [isSaving, setIsSaving] = useState(false)
  const [drawPage, setDrawPage] = useState(1)
  const activeRectRef = useRef<DOMRect | null>(null)

  // PDF dirender sebagai canvas lewat pdfjs-dist (bukan iframe viewer bawaan browser)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pdfError, setPdfError] = useState<string | null>(null)

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setBoxes([])
      setZoom(1)
      setIsDrawing(false)
      setCurrentBox(null)
    }
  }, [isOpen, fileUrl])

  useEffect(() => {
    if (!isOpen || !isPdf) return
    let cancelled = false
    setPdfDoc(null)
    setPdfError(null)
    ;(async () => {
      try {
        const pdfjs = await import('pdfjs-dist')
        pdfjs.GlobalWorkerOptions.workerSrc = new URL(
          'pdfjs-dist/build/pdf.worker.min.mjs',
          import.meta.url
        ).toString()
        const doc = await pdfjs.getDocument({ url: formatFileUrl(fileUrl) }).promise
        if (!cancelled) setPdfDoc(doc)
      } catch (err) {
        console.error(err)
        if (!cancelled) setPdfError('Gagal memuat pratinjau PDF. Pastikan berkas dapat diakses.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, isPdf, fileUrl])

  const pointFromEvent = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100)),
      y: Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100)),
      rect
    }
  }

  // Mouse Down -> Mulai tarik kotak pada halaman tertentu
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, page: number) => {
    e.preventDefault()
    const { x, y, rect } = pointFromEvent(e)
    activeRectRef.current = rect
    setDrawPage(page)
    setIsDrawing(true)
    setStartPoint({ x, y })
    setCurrentBox({ x, y, w: 0, h: 0 })
  }

  // Mouse Move -> Update dimensi kotak saat ditarik
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPoint || !activeRectRef.current) return
    const rect = activeRectRef.current
    const cx = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
    const cy = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100))
    setCurrentBox({
      x: Math.min(startPoint.x, cx),
      y: Math.min(startPoint.y, cy),
      w: Math.abs(cx - startPoint.x),
      h: Math.abs(cy - startPoint.y)
    })
  }

  // Mouse Up -> Simpan kotak yang selesai ditarik
  const handleMouseUp = () => {
    if (!isDrawing || !currentBox) return
    setIsDrawing(false)

    if (currentBox.w > 0.5 && currentBox.h > 0.3) {
      setBoxes((prev) => [
        ...prev,
        {
          id: `box_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          x: currentBox.x,
          y: currentBox.y,
          width: currentBox.w,
          height: currentBox.h,
          page: drawPage
        }
      ])
    }
    setCurrentBox(null)
    setStartPoint(null)
  }

  const renderBoxes = (page: number) => (
    <>
      {boxes
        .filter((b) => (b.page || 1) === page)
        .map((box) => (
          <div
            key={box.id}
            style={{ left: `${box.x}%`, top: `${box.y}%`, width: `${box.width}%`, height: `${box.height}%` }}
            className="absolute bg-black border border-black/80 pointer-events-none z-10 flex items-center justify-center overflow-hidden">
            <span className="text-[9px] text-white/50 font-mono tracking-tighter uppercase select-none">
              [SENSOR]
            </span>
          </div>
        ))}
      {isDrawing && currentBox && drawPage === page && (
        <div
          style={{
            left: `${currentBox.x}%`,
            top: `${currentBox.y}%`,
            width: `${currentBox.w}%`,
            height: `${currentBox.h}%`
          }}
          className="absolute bg-black/80 border-2 border-amber-400 border-dashed pointer-events-none z-20"
        />
      )}
    </>
  )

  const handleUndo = () => {
    setBoxes((prev) => prev.slice(0, -1))
  }

  const handleReset = () => {
    if (boxes.length === 0) return
    if (window.confirm('Hapus seluruh kotak sensor pada dokumen ini?')) {
      setBoxes([])
    }
  }

  // Eksekusi Simpan Berkas Tersensor
  const handleApplyRedaction = async () => {
    if (boxes.length === 0) {
      toast.info('Belum ada kotak sensor yang ditambahkan.')
      return
    }

    setIsSaving(true)
    const toastId = toast.loading('Menerapkan sensor data pribadi...')
    try {
      const normalizedUrl = formatFileUrl(fileUrl)

      if (!isPdf) {
        // --- 1. PROSES GAMBAR DI HTML5 CANVAS (100% Client-Side) ---
        const img = new Image()
        img.crossOrigin = 'anonymous'
        img.src = normalizedUrl

        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = () => reject(new Error('Gagal memuat gambar untuk disensor.'))
        })

        const canvas = document.createElement('canvas')
        canvas.width = img.naturalWidth
        canvas.height = img.naturalHeight
        const ctx = canvas.getContext('2d')
        if (!ctx) throw new Error('Canvas 2D context tidak tersedia.')

        // Gambar asli
        ctx.drawImage(img, 0, 0)

        // Timpa seluruh kotak sensor dengan balok hitam pekat (Blackout)
        ctx.fillStyle = '#000000'
        boxes.forEach((box) => {
          const pxX = (box.x / 100) * canvas.width
          const pxY = (box.y / 100) * canvas.height
          const pxW = (box.width / 100) * canvas.width
          const pxH = (box.height / 100) * canvas.height
          ctx.fillRect(pxX, pxY, pxW, pxH)
        })

        const mime = fileName.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, mime, 0.92))
        if (!blob) throw new Error('Gagal mengekspor gambar tersensor.')

        const safeFileName = fileName.replace(/\.[^/.]+$/, '') + '_tersensor.' + (mime === 'image/png' ? 'png' : 'jpg')
        const redactedFile = new File([blob], safeFileName, { type: mime })

        await onSaveRedacted(redactedFile)
        toast.success('Berkas berhasil disensor dan disimpan!', { id: toastId })
        onClose()
      } else {
        // --- 2. PDF: render tiap halaman -> bakar kotak hitam -> susun ulang jadi PDF gambar ---
        // Teks asli ikut hilang (bukan sekadar ditimpa), dan ukuran berkas kecil.
        if (!pdfDoc) throw new Error('PDF belum selesai dimuat.')
        const { PDFDocument } = await import('pdf-lib')
        const out = await PDFDocument.create()
        const TARGET_WIDTH = 1240

        for (let n = 1; n <= pdfDoc.numPages; n++) {
          const page = await pdfDoc.getPage(n)
          const base = page.getViewport({ scale: 1 })
          const viewport = page.getViewport({ scale: TARGET_WIDTH / base.width })
          const canvas = document.createElement('canvas')
          canvas.width = Math.floor(viewport.width)
          canvas.height = Math.floor(viewport.height)
          const ctx = canvas.getContext('2d')
          if (!ctx) throw new Error('Canvas 2D context tidak tersedia.')
          ctx.fillStyle = '#ffffff'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
          await page.render({ canvasContext: ctx, viewport }).promise

          ctx.fillStyle = '#000000'
          boxes
            .filter((b) => (b.page || 1) === n)
            .forEach((b) => {
              ctx.fillRect(
                (b.x / 100) * canvas.width,
                (b.y / 100) * canvas.height,
                (b.width / 100) * canvas.width,
                (b.height / 100) * canvas.height
              )
            })

          const jpgBlob = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', 0.72))
          if (!jpgBlob) throw new Error('Gagal mengekspor halaman PDF.')
          const img = await out.embedJpg(await jpgBlob.arrayBuffer())
          const outPage = out.addPage([base.width, base.height])
          outPage.drawImage(img, { x: 0, y: 0, width: base.width, height: base.height })
        }

        const pdfBytes = await out.save({ useObjectStreams: true })
        const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
        const safeFileName = fileName.replace(/\.[^/.]+$/, '') + '_tersensor.pdf'
        const redactedFile = new File([blob], safeFileName, { type: 'application/pdf' })

        await onSaveRedacted(redactedFile)
        toast.success('Dokumen PDF berhasil disensor dan disimpan!', { id: toastId })
        onClose()
      }
    } catch (err: any) {
      console.error('Error applying redaction:', err)
      toast.error(err.message || 'Gagal menerapkan sensor data pribadi.', { id: toastId })
    } finally {
      setIsSaving(false)
    }
  }

  if (!isOpen) return null

  const normalizedUrl = formatFileUrl(fileUrl)

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-surface rounded-2xl border border-stroke/70 shadow-2xl flex flex-col w-full max-w-5xl h-[92vh] overflow-hidden text-ink">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-stroke/40 flex items-center justify-between gap-3 shrink-0 bg-surface">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-sm truncate flex items-center gap-2">
                <span>Sensor Data Pribadi (Redaction Studio)</span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-surface-subtle text-ink-muted border border-stroke/50">
                  {isPdf ? 'Dokumen PDF' : 'Gambar / Foto'}
                </span>
              </h3>
              <p className="text-[11px] text-ink-muted truncate">{fileName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="p-1.5 rounded-lg text-ink-muted hover:text-ink hover:bg-surface-subtle transition-colors cursor-pointer"
            title="Tutup Studio Sensor">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toolbar & Panduan */}
        <div className="px-5 py-2.5 bg-surface-subtle/50 border-b border-stroke/40 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface border border-stroke/60 font-medium text-ink shadow-2xs">
              <Square className="w-3.5 h-3.5 fill-black text-black dark:fill-white dark:text-white" />
              <span>Tarik Kotak Sensor Hitam</span>
            </div>

            <button
              type="button"
              onClick={handleUndo}
              disabled={boxes.length === 0 || isSaving}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-surface-elevated border border-stroke/60 font-medium text-ink disabled:opacity-40 cursor-pointer shadow-2xs transition-colors"
              title="Batalkan kotak sensor terakhir">
              <Undo2 className="w-3.5 h-3.5 text-ink-muted" />
              <span>Undo ({boxes.length})</span>
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={boxes.length === 0 || isSaving}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-surface hover:bg-rose-50 hover:text-rose-600 border border-stroke/60 font-medium text-ink disabled:opacity-40 cursor-pointer shadow-2xs transition-colors"
              title="Hapus seluruh kotak sensor">
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>

          {/* Zoom controls */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1 rounded-lg bg-surface hover:bg-surface-elevated border border-stroke/60 text-ink-muted hover:text-ink cursor-pointer shadow-2xs"
              title="Perkecil">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium text-ink-muted w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 rounded-lg bg-surface hover:bg-surface-elevated border border-stroke/60 text-ink-muted hover:text-ink cursor-pointer shadow-2xs"
              title="Perbesar">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Tip Banner */}
        <div className="px-5 py-2 bg-amber-500/10 dark:bg-amber-950/20 border-b border-amber-500/20 flex items-center gap-2 text-[11px] text-amber-900 dark:text-amber-200 shrink-0">
          <Info className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Petunjuk:</strong> Klik dan seret (drag) mouse di atas area dokumen yang ingin Anda tutupi (seperti <strong>NIP, NIK, Tanda Tangan, atau No. HP</strong>). Area tersebut akan ditimpa balok hitam pekat permanen.
          </span>
        </div>

        {/* Document Workspace (scrollable, zoom via width so scroll & coordinates stay accurate) */}
        <div className="flex-1 overflow-auto bg-slate-900/60 p-4 sm:p-6 select-none">
          <div className="mx-auto flex flex-col items-center gap-4" style={{ width: `${BASE_WIDTH * zoom}px` }}>
            {!isPdf ? (
              <div
                onMouseDown={(e) => handleMouseDown(e, 1)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative w-full shadow-2xl bg-white border border-slate-700 rounded-sm overflow-hidden select-none cursor-crosshair">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={normalizedUrl}
                  alt={fileName}
                  draggable={false}
                  className="w-full h-auto pointer-events-none select-none block"
                />
                {renderBoxes(1)}
              </div>
            ) : pdfError ? (
              <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-lg px-4 py-3">
                {pdfError}
              </div>
            ) : !pdfDoc ? (
              <div className="flex items-center gap-2 text-xs text-slate-300 py-10">
                <Loader2 className="w-4 h-4 animate-spin" /> Memuat halaman PDF...
              </div>
            ) : (
              Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => (
                <div key={pageNum} className="w-full">
                  <div className="text-[10px] text-slate-400 mb-1 font-medium">
                    Halaman {pageNum} / {pdfDoc.numPages}
                  </div>
                  <div
                    onMouseDown={(e) => handleMouseDown(e, pageNum)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="relative w-full shadow-2xl bg-white border border-slate-700 rounded-sm overflow-hidden select-none cursor-crosshair">
                    <PdfPageCanvas pdfDoc={pdfDoc} pageNumber={pageNum} />
                    {renderBoxes(pageNum)}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3.5 border-t border-stroke/40 flex items-center justify-between gap-3 shrink-0 bg-surface">
          <div className="text-xs text-ink-muted">
            {boxes.length > 0 ? (
              <span className="font-medium text-amber-600 dark:text-amber-400">
                • {boxes.length} area data sensitif siap disensor
              </span>
            ) : (
              <span>Belum ada area yang disensor</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="px-4 py-2 rounded-full border border-stroke/70 bg-surface hover:bg-surface-elevated text-xs font-medium text-ink transition-colors cursor-pointer">
              Batal
            </button>

            <button
              type="button"
              disabled={isSaving || boxes.length === 0}
              onClick={handleApplyRedaction}
              className="inline-flex items-center gap-1.5 px-5 py-2 rounded-full bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-hz-button disabled:opacity-50 transition-all cursor-pointer">
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Menerapkan Sensor...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Terapkan Sensor & Simpan Versi Aman</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
