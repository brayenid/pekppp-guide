import Link from 'next/link'
import { FileQuestion, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-14 h-14 rounded-2xl bg-brand/10 text-brand flex items-center justify-center mb-4">
        <FileQuestion className="w-7 h-7" />
      </div>
      <h1 className="text-2xl font-bold text-ink">Halaman Tidak Ditemukan</h1>
      <p className="text-sm text-ink-muted max-w-md mt-2 mb-6">
        Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau tautan tidak valid.
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand text-white text-xs font-semibold hover:bg-brand-hover transition-colors shadow-sm">
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Beranda</span>
      </Link>
    </div>
  )
}
