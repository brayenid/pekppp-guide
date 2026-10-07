'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

export function F01GlobalSaveButton({ large }: { large?: boolean }) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSaveAll = () => {
    setLoading(true)
    
    // Dispatch custom event to save all dirty F01 forms
    window.dispatchEvent(new Event('save-all-f01'))

    // Wait a brief moment for the forms to submit their server actions, then notify and refresh
    setTimeout(() => {
      toast.success('Seluruh isian F01 yang diubah berhasil disimpan!')
      setLoading(false)
      router.refresh()
    }, 1200)
  }

  const baseClass = "inline-flex items-center gap-1.5 rounded-full bg-brand hover:bg-brand-hover text-white font-medium transition-all shadow-hz-button disabled:opacity-50 cursor-pointer"
  const sizeClass = large ? "px-5 py-2.5 text-xs gap-1.5" : "px-4 py-1.5 text-xs"
  const iconClass = "w-3.5 h-3.5"

  return (
    <button
      type="button"
      onClick={handleSaveAll}
      disabled={loading}
      className={`${baseClass} ${sizeClass}`}>
      {loading ? (
        <>
          <Loader2 className={`${iconClass} animate-spin`} />
          <span>Menyimpan F01...</span>
        </>
      ) : (
        <>
          <Save className={iconClass} />
          <span>{large ? 'Simpan Seluruh Isian F01' : 'Simpan F01'}</span>
        </>
      )}
    </button>
  )
}
