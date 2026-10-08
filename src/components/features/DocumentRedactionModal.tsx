'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import {
  ShieldAlert,
  Undo2,
  Redo2,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Save,
  X,
  Loader2,
  FileText,
  AlertCircle,
  Trash2,
  ChevronRight,
  ChevronDown,
  Copy,
  RefreshCw
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
  isPreUpload?: boolean
  rawFile?: File
  onSaveRedacted: (redactedFile: File, saveMode: 'new_version' | 'overwrite') => Promise<void>
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
  isPreUpload = false,
  rawFile,
  onSaveRedacted
}: DocumentRedactionModalProps) {
  const isPdf = fileType === 'PDF' || fileName.toLowerCase().endsWith('.pdf')
  const [boxes, setBoxes] = useState<RedactBox[]>([])
  const [redoBoxes, setRedoBoxes] = useState<RedactBox[]>([])
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

  const [isSaveDropdownOpen, setIsSaveDropdownOpen] = useState(false)
  const saveDropdownRef = useRef<HTMLDivElement | null>(null)

  // Reset state saat modal dibuka
  useEffect(() => {
    if (isOpen) {
      setBoxes([])
      setRedoBoxes([])
      setZoom(1)
      setIsDrawing(false)
      setCurrentBox(null)
      setIsSaveDropdownOpen(false)
    }
  }, [isOpen, fileUrl])

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (saveDropdownRef.current && !saveDropdownRef.current.contains(e.target as Node)) {
        setIsSaveDropdownOpen(false)
      }
    }
    if (isSaveDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick)
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick)
    }
  }, [isSaveDropdownOpen])

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

        let doc: any
        // Jika ada rawFile langsung (dari pre-upload di browser client), baca sebagai ArrayBuffer
        if (rawFile) {
          const ab = await rawFile.arrayBuffer()
          doc = await pdfjs.getDocument({ data: ab }).promise
        } else if (fileUrl && fileUrl.startsWith('blob:')) {
          // Jika URL berupa blob URL lokal
          const res = await fetch(fileUrl)
          const ab = await res.arrayBuffer()
          doc = await pdfjs.getDocument({ data: ab }).promise
        } else if (fileUrl) {
          // Jika URL berupa remote server/CDN URL
          const resolvedUrl = formatFileUrl(fileUrl)
          doc = await pdfjs.getDocument({ url: resolvedUrl }).promise
        } else {
          throw new Error('URL atau berkas PDF tidak tersedia.')
        }

        if (!cancelled) setPdfDoc(doc)
      } catch (err: any) {
        console.error('Error loading PDF in studio:', err)
        if (!cancelled) setPdfError('Gagal memuat pratinjau PDF. Pastikan berkas dapat diakses.')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [isOpen, isPdf, fileUrl, rawFile])

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
      // Reset tumpukan redo ketika ada aksi gambar kotak baru
      setRedoBoxes([])
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

  const handleUndo = useCallback(() => {
    setBoxes((prev) => {
      if (prev.length === 0) return prev
      const last = prev[prev.length - 1]
      setRedoBoxes((r) => [...r, last])
      return prev.slice(0, -1)
    })
  }, [])

  const handleRedo = useCallback(() => {
    setRedoBoxes((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo
      const itemToRestore = prevRedo[prevRedo.length - 1]
      setBoxes((b) => [...b, itemToRestore])
      return prevRedo.slice(0, -1)
    })
  }, [])

  // Keyboard shortcut listener: Ctrl+Z (Undo) dan Ctrl+Y / Ctrl+Shift+Z (Redo)
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      // Pastikan bukan sedang mengetik di input / textarea
      const target = e.target as HTMLElement | null
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return
      }

      const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform)
      const isCmdOrCtrl = isMac ? e.metaKey : e.ctrlKey

      if (isCmdOrCtrl && !e.altKey) {
        // Redo: Ctrl+Y atau Ctrl+Shift+Z
        if (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z')) {
          e.preventDefault()
          handleRedo()
          return
        }
        // Undo: Ctrl+Z (tanpa shift)
        if (e.key.toLowerCase() === 'z' && !e.shiftKey) {
          e.preventDefault()
          handleUndo()
          return
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleUndo, handleRedo])

  const handleRemoveBox = (boxId: string) => {
    setBoxes((prev) => prev.filter((b) => b.id !== boxId))
  }

  const handleReset = () => {
    if (boxes.length === 0) return
    if (window.confirm('Hapus seluruh kotak sensor pada dokumen ini?')) {
      setBoxes([])
      setRedoBoxes([])
    }
  }

  const scrollToPage = (pageNum: number) => {
    const el = document.getElementById(`pdf-page-container-${pageNum}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }

  // Eksekusi Simpan Berkas Tersensor ('new_version' = Buat Versi Baru, 'overwrite' = Timpa Berkas Aktif)
  const handleApplyRedaction = async (saveMode: 'new_version' | 'overwrite' = 'new_version') => {
    if (boxes.length === 0) {
      toast.info('Belum ada kotak sensor yang ditambahkan.')
      return
    }

    setIsSaveDropdownOpen(false)
    setIsSaving(true)
    const toastId = toast.loading(
      saveMode === 'overwrite' ? 'Menimpa berkas dengan hasil sensor...' : 'Menyimpan versi baru berkas tersensor...'
    )
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

        await onSaveRedacted(redactedFile, saveMode)
        toast.dismiss(toastId)
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

        await onSaveRedacted(redactedFile, saveMode)
        toast.dismiss(toastId)
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

  // Hitung jumlah sensor per halaman untuk dokumen PDF
  const pageStats = React.useMemo(() => {
    if (!isPdf || !pdfDoc) return []
    const map: Record<number, number> = {}
    boxes.forEach((b) => {
      const p = b.page || 1
      map[p] = (map[p] || 0) + 1
    })
    return Array.from({ length: pdfDoc.numPages }, (_, i) => ({
      page: i + 1,
      count: map[i + 1] || 0
    }))
  }, [isPdf, pdfDoc, boxes])

  if (typeof document === 'undefined') return null

  return createPortal(
    <div className="fixed inset-0 z-[99999] bg-slate-950 flex flex-col text-ink animate-in fade-in duration-150 select-none">
      {/* Top Header Navbar (Clean & Minimalist) */}
      <header className="h-14 px-4 sm:px-6 bg-surface border-b border-stroke/70 flex items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-ink truncate">Studio Sensor Berkas</h1>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-medium bg-surface-subtle text-ink-muted border border-stroke/50">
                {isPdf ? 'PDF' : 'GAMBAR'}
              </span>
              {isPreUpload && (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <ShieldAlert className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                  <span>Pratinjau Sebelum Unggah (Belum Masuk Server)</span>
                </span>
              )}
            </div>
            <p className="text-[11px] text-ink-muted truncate max-w-sm sm:max-w-md">{fileName}</p>
          </div>
        </div>

        {/* Center / Toolbar (Singkat & Efisien) */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleUndo}
            disabled={boxes.length === 0 || isSaving}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-stroke/70 text-xs font-medium text-ink disabled:opacity-40 cursor-pointer transition-colors"
            title="Batalkan sensor terakhir (Ctrl+Z)">
            <Undo2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="hidden sm:inline">Undo</span>
            {boxes.length > 0 && <span className="text-[10px] font-mono text-ink-muted">({boxes.length})</span>}
          </button>

          <button
            type="button"
            onClick={handleRedo}
            disabled={redoBoxes.length === 0 || isSaving}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-surface-elevated border border-stroke/70 text-xs font-medium text-ink disabled:opacity-40 cursor-pointer transition-colors"
            title="Ulangi sensor yang dibatalkan (Ctrl+Y)">
            <Redo2 className="w-3.5 h-3.5 text-ink-muted" />
            <span className="hidden sm:inline">Redo</span>
            {redoBoxes.length > 0 && <span className="text-[10px] font-mono text-ink-muted">({redoBoxes.length})</span>}
          </button>

          <button
            type="button"
            onClick={handleReset}
            disabled={boxes.length === 0 || isSaving}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-surface hover:bg-rose-500/10 hover:text-rose-600 border border-stroke/70 text-xs font-medium text-ink disabled:opacity-40 cursor-pointer transition-colors"
            title="Bersihkan semua sensor">
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>

          <div className="h-4 w-px bg-stroke/60 mx-1 hidden sm:block" />

          {/* Zoom */}
          <div className="flex items-center bg-surface border border-stroke/70 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-subtle cursor-pointer"
              title="Perkecil">
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono font-medium text-ink-muted w-11 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
              className="p-1 rounded text-ink-muted hover:text-ink hover:bg-surface-subtle cursor-pointer"
              title="Perbesar">
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-stroke/70 bg-surface hover:bg-surface-elevated text-xs font-medium text-ink transition-colors cursor-pointer">
            Batal
          </button>

          {isPreUpload ? (
            /* Jika Berkas Baru (Pre-upload): Tombol langsung Simpan & Unggah (karena belum ada berkas lama untuk ditimpa) */
            <button
              type="button"
              disabled={isSaving}
              onClick={() => handleApplyRedaction('new_version')}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-hz-button disabled:opacity-50 transition-all cursor-pointer">
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>
                    {boxes.length > 0 ? `Simpan & Unggah (${boxes.length} Sensor)` : 'Unggah Tanpa Sensor'}
                  </span>
                </>
              )}
            </button>
          ) : (
            /* Jika Edit Berkas yang Sudah Ada: Dropdown Pilihan Versi Baru vs Timpa */
            <div className="relative inline-flex items-center" ref={saveDropdownRef}>
              <button
                type="button"
                disabled={isSaving || boxes.length === 0}
                onClick={() => setIsSaveDropdownOpen((v) => !v)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-hz-button disabled:opacity-50 transition-all cursor-pointer">
                {isSaving ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>Simpan ({boxes.length})</span>
                    <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isSaveDropdownOpen ? 'rotate-180' : ''}`} />
                  </>
                )}
              </button>

              {/* Dropdown Menu Modal */}
              {isSaveDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-60 z-50 bg-surface rounded-xl border border-stroke/80 shadow-2xl p-1.5 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-2.5 py-1 text-[10px] font-semibold text-ink-muted uppercase tracking-wider border-b border-stroke/40 mb-1">
                    Pilih Cara Simpan:
                  </div>

                  {/* Opsi 1: Buat Versi Baru (Recommended) */}
                  <button
                    type="button"
                    onClick={() => handleApplyRedaction('new_version')}
                    className="flex items-start gap-2.5 w-full p-2 rounded-lg text-left hover:bg-surface-subtle transition-colors cursor-pointer group">
                    <div className="w-6 h-6 rounded-md bg-brand/10 text-brand flex items-center justify-center shrink-0 mt-0.5">
                      <Copy className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-ink text-xs flex items-center gap-1.5">
                        <span>Buat Versi Baru</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-brand/10 text-brand font-medium">Rekomendasi</span>
                      </div>
                      <p className="text-[10px] text-ink-muted leading-tight mt-0.5">
                        Simpan sebagai versi baru. Berkas asli tetap tersimpan di riwayat lampau.
                      </p>
                    </div>
                  </button>

                  {/* Opsi 2: Timpa Berkas Aktif Langsung */}
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm('PERINGATAN: Menimpa akan mengganti berkas saat ini secara langsung. Lanjutkan?')) {
                        handleApplyRedaction('overwrite')
                      }
                    }}
                    className="flex items-start gap-2.5 w-full p-2 rounded-lg text-left hover:bg-amber-500/10 transition-colors cursor-pointer group mt-0.5">
                    <div className="w-6 h-6 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-semibold text-amber-700 dark:text-amber-400 text-xs">
                        Timpa Berkas Aktif
                      </div>
                      <p className="text-[10px] text-ink-muted leading-tight mt-0.5">
                        Gantikan berkas ini langsung tanpa menambah nomor versi baru.
                      </p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Main Studio Body: Workspace + Optional Sidebar */}
      <div className="flex-1 flex overflow-hidden bg-slate-950">
        {/* Document Canvas Workspace */}
        <main className="flex-1 overflow-auto p-4 sm:p-8 flex flex-col items-center select-none cursor-crosshair">
          <div className="flex flex-col items-center gap-6" style={{ width: `${BASE_WIDTH * zoom}px` }}>
            {!isPdf ? (
              <div
                onMouseDown={(e) => handleMouseDown(e, 1)}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                className="relative w-full shadow-2xl bg-white rounded border border-slate-700 overflow-hidden select-none">
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
              <div className="text-xs text-rose-300 bg-rose-950/40 border border-rose-500/30 rounded-xl px-5 py-4 max-w-md text-center">
                {pdfError}
              </div>
            ) : !pdfDoc ? (
              <div className="flex flex-col items-center justify-center gap-3 text-xs text-slate-400 py-24">
                <Loader2 className="w-6 h-6 animate-spin text-brand" />
                <span>Memuat pratinjau halaman PDF...</span>
              </div>
            ) : (
              Array.from({ length: pdfDoc.numPages }, (_, i) => i + 1).map((pageNum) => (
                <div
                  key={pageNum}
                  id={`pdf-page-container-${pageNum}`}
                  className="w-full flex flex-col items-center scroll-mt-6">
                  <div className="w-full flex items-center justify-between pb-1.5 text-[11px] text-slate-400 font-medium">
                    <span>Halaman {pageNum} dari {pdfDoc.numPages}</span>
                    {boxes.filter((b) => (b.page || 1) === pageNum).length > 0 && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                        {boxes.filter((b) => (b.page || 1) === pageNum).length} area disensor
                      </span>
                    )}
                  </div>
                  <div
                    onMouseDown={(e) => handleMouseDown(e, pageNum)}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    className="relative w-full shadow-2xl bg-white rounded border border-slate-700 overflow-hidden select-none">
                    <PdfPageCanvas pdfDoc={pdfDoc} pageNumber={pageNum} />
                    {renderBoxes(pageNum)}
                  </div>
                </div>
              ))
            )}
          </div>
        </main>

        {/* Sidebar Khusus PDF (Informasi Halaman Mana yang Disensor) */}
        {isPdf && (
          <aside className="w-64 sm:w-72 border-l border-stroke/70 bg-surface flex flex-col shrink-0 text-ink select-none z-10">
            {/* Sidebar Header */}
            <div className="p-3.5 border-b border-stroke/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand" />
                <h2 className="text-xs font-semibold text-ink">Navigasi & Sensor Halaman</h2>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-surface-subtle text-ink-muted border border-stroke/50">
                {boxes.length} Total
              </span>
            </div>

            {/* Petunjuk Singkat */}
            <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 text-[11px] text-amber-900 dark:text-amber-200 leading-snug">
              Klik dan tarik mouse langsung di atas dokumen untuk menambal balok hitam pekat.
            </div>

            {/* List Halaman Dokumen */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {!pdfDoc ? (
                <div className="p-4 text-center text-xs text-ink-muted italic">Memuat daftar halaman...</div>
              ) : (
                pageStats.map(({ page, count }) => (
                  <button
                    key={page}
                    type="button"
                    onClick={() => scrollToPage(page)}
                    className={`w-full flex items-center justify-between p-2 rounded-xl text-xs transition-colors cursor-pointer text-left border ${
                      count > 0
                        ? 'bg-amber-500/10 border-amber-500/30 text-ink'
                        : 'bg-surface hover:bg-surface-subtle border-stroke/40 text-ink-secondary hover:text-ink'
                    }`}>
                    <div className="flex items-center gap-2 min-w-0">
                      <div className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-semibold ${
                        count > 0 ? 'bg-amber-500 text-slate-950' : 'bg-surface-subtle text-ink-muted'
                      }`}>
                        {page}
                      </div>
                      <span className="font-medium truncate">Halaman {page}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {count > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/25 text-amber-700 dark:text-amber-300">
                          {count} sensor
                        </span>
                      ) : (
                        <span className="text-[10px] text-ink-muted">Bersih</span>
                      )}
                      <ChevronRight className="w-3.5 h-3.5 text-ink-muted" />
                    </div>
                  </button>
                ))
              )}
            </div>

            {/* Rincian Kotak Terpasang */}
            {boxes.length > 0 && (
              <div className="p-3 border-t border-stroke/50 max-h-40 overflow-y-auto space-y-1 bg-surface-subtle/30">
                <div className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                  Daftar Kotak Sensor:
                </div>
                {boxes.map((b, idx) => (
                  <div
                    key={b.id}
                    className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-surface border border-stroke/50">
                    <span className="text-ink truncate">
                      Kotak #{idx + 1} (Hal. {b.page || 1})
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveBox(b.id)}
                      className="p-1 rounded text-ink-muted hover:text-rose-600 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Hapus kotak ini">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </aside>
        )}
      </div>
    </div>,
    document.body
  )
}
