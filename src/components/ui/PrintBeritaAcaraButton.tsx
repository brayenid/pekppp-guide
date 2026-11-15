'use client'

import { useState } from 'react'
import { FileText, Loader2 } from 'lucide-react'

export function PrintBeritaAcaraButton({
  evaluationId,
  targetUrl,
  className
}: {
  evaluationId: string
  targetUrl?: string
  className?: string
}) {
  const [printing, setPrinting] = useState(false)
  const [iframeSrc, setIframeSrc] = useState<string | null>(null)

  const printUrl = targetUrl || `/hasil/${evaluationId}`

  const handlePrint = () => {
    setPrinting(true)
    // Set src to load the BA page inside hidden iframe
    setIframeSrc(printUrl)
  }

  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = e.currentTarget
    try {
      if (iframe.contentWindow) {
        iframe.contentWindow.focus()
        iframe.contentWindow.print()
      }
    } catch {
      // Fallback if cross-origin or security blocks iframe print
      window.open(printUrl, '_blank')
    } finally {
      setPrinting(false)
      // Reset iframe after print dialog opens
      setTimeout(() => setIframeSrc(null), 3000)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handlePrint}
        disabled={printing}
        className={
          className ||
          'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-2xs shrink-0 cursor-pointer disabled:opacity-50'
        }>
        {printing ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-700" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-slate-700" />
        )}
        <span>{printing ? 'Menyiapkan PDF...' : 'Cetak Berita Acara (BA)'}</span>
      </button>

      {/* Hidden iframe for seamless direct PDF printing without page redirect */}
      {iframeSrc && (
        <iframe
          src={iframeSrc}
          onLoad={handleIframeLoad}
          style={{ position: 'absolute', width: '0', height: '0', border: '0', visibility: 'hidden' }}
        />
      )}
    </>
  )
}
