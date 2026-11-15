// src/app/evaluasi/[unitId]/berita-acara/loading.tsx
// Skeleton loading khusus untuk halaman Berita Acara Penilaian (BAP)
import { Skeleton } from '../../../../components/ui/Skeleton'

export default function BeritaAcaraLoading() {
  return (
    <div className="w-full min-w-0 max-w-full space-y-4 animate-in fade-in duration-150">
      {/* 1. Breadcrumb Tunggal Standar Ruang Evaluasi */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs text-ink-muted mb-4 pt-0.5 min-h-[32px]">
        <Skeleton className="w-24 h-4 rounded-md" />
        <span className="text-ink-muted/40">›</span>
        <Skeleton className="w-44 h-4 rounded-md" />
        <span className="text-ink-muted/40">›</span>
        <Skeleton className="w-32 h-4 rounded-md" />
      </nav>

      {/* 2. Header Status & Tombol Aksi BAP */}
      <div className="rounded-2xl border border-stroke/70 bg-surface shadow-soft-card p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Skeleton className="w-52 h-6 rounded-lg" />
            <Skeleton className="w-32 h-5 rounded-md" />
            <Skeleton className="w-20 h-5 rounded-full" />
            <Skeleton className="w-28 h-5 rounded-full" />
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <Skeleton className="w-36 h-8 rounded-xl" />
            <Skeleton className="w-28 h-8 rounded-xl" />
            <Skeleton className="w-36 h-8 rounded-xl" />
          </div>
        </div>

        {/* Tab switcher pills */}
        <div className="flex items-center gap-1.5 border-t border-stroke/50 pt-3 flex-wrap">
          <Skeleton className="w-44 h-8 rounded-xl" />
          <Skeleton className="w-44 h-8 rounded-xl" />
          <Skeleton className="w-36 h-8 rounded-xl" />
          <Skeleton className="w-36 h-8 rounded-xl" />
        </div>
      </div>

      {/* 3. Pratinjau Kertas Dokumen BAP (A4 Portrait) */}
      <div className="bg-white text-black border border-neutral-300 p-6 sm:p-8 space-y-5 shadow-sm rounded-none font-sans">
        {/* Kop Surat Centered */}
        <div className="flex flex-col items-center justify-center pt-2 pb-1 space-y-2">
          <Skeleton className="w-3/4 max-w-lg h-3.5 rounded bg-neutral-200" />
          <Skeleton className="w-1/2 max-w-sm h-3.5 rounded bg-neutral-200" />
          <Skeleton className="w-2/3 max-w-md h-3.5 rounded bg-neutral-200" />
          <Skeleton className="w-1/4 max-w-xs h-3.5 rounded bg-neutral-200" />
          <div className="w-full border-b-2 border-neutral-400 pt-2 pb-0.5" />
        </div>

        {/* Paragraf Pembuka */}
        <div className="space-y-2 pt-1">
          <Skeleton className="w-full h-3 rounded bg-neutral-100" />
          <Skeleton className="w-full h-3 rounded bg-neutral-100" />
          <Skeleton className="w-4/5 h-3 rounded bg-neutral-100" />
        </div>

        {/* Tabel Ringkasan Lokus */}
        <div className="border border-neutral-300 rounded overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex border-b border-neutral-300 last:border-b-0">
              <div className="w-1/3 bg-neutral-100 p-2.5 border-r border-neutral-300">
                <Skeleton className="w-3/4 h-3 rounded bg-neutral-200" />
              </div>
              <div className="w-2/3 p-2.5">
                <Skeleton className="w-1/2 h-3 rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>

        {/* Sub-heading I */}
        <div className="pt-2">
          <Skeleton className="w-72 h-4 rounded bg-neutral-200" />
        </div>

        {/* Tabel Aspek (6 Baris Aspek) */}
        <div className="border border-neutral-300 rounded overflow-hidden">
          {/* Header Tabel */}
          <div className="flex bg-neutral-100 border-b border-neutral-300 p-2">
            <div className="w-10 text-center"><Skeleton className="w-5 h-3 mx-auto rounded bg-neutral-300" /></div>
            <div className="w-44"><Skeleton className="w-28 h-3 rounded bg-neutral-300" /></div>
            <div className="w-20"><Skeleton className="w-14 h-3 rounded bg-neutral-300" /></div>
            <div className="w-1/3"><Skeleton className="w-36 h-3 rounded bg-neutral-300" /></div>
            <div className="flex-1"><Skeleton className="w-44 h-3 rounded bg-neutral-300" /></div>
          </div>
          {/* Rows */}
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div key={row} className="flex border-b border-neutral-300 last:border-b-0 p-2.5">
              <div className="w-10 text-center"><Skeleton className="w-4 h-3 mx-auto rounded bg-neutral-200" /></div>
              <div className="w-44 space-y-1.5">
                <Skeleton className="w-32 h-3 rounded bg-neutral-200" />
                <Skeleton className="w-20 h-2.5 rounded bg-neutral-100" />
              </div>
              <div className="w-20 space-y-1.5">
                <Skeleton className="w-12 h-3 rounded bg-neutral-200" />
                <Skeleton className="w-16 h-2.5 rounded bg-neutral-100" />
              </div>
              <div className="w-1/3 space-y-1.5 pr-2">
                <Skeleton className="w-full h-3 rounded bg-neutral-100" />
                <Skeleton className="w-4/5 h-3 rounded bg-neutral-100" />
              </div>
              <div className="flex-1 space-y-1.5">
                <Skeleton className="w-full h-3 rounded bg-neutral-100" />
                <Skeleton className="w-3/4 h-3 rounded bg-neutral-100" />
              </div>
            </div>
          ))}
        </div>

        {/* Paragraf Penutup */}
        <div className="space-y-2 pt-2">
          <Skeleton className="w-full h-3 rounded bg-neutral-100" />
          <Skeleton className="w-2/3 h-3 rounded bg-neutral-100" />
        </div>

        {/* Area Tanda Tangan */}
        <div className="pt-6 grid grid-cols-2 gap-8">
          <div className="space-y-12 text-center">
            <div className="space-y-1.5 flex flex-col items-center">
              <Skeleton className="w-44 h-3 rounded bg-neutral-100" />
              <Skeleton className="w-36 h-3.5 rounded bg-neutral-200" />
            </div>
            <div className="space-y-1 flex flex-col items-center">
              <Skeleton className="w-48 h-3.5 rounded bg-neutral-200" />
              <Skeleton className="w-32 h-2.5 rounded bg-neutral-100" />
            </div>
          </div>
          <div className="space-y-12 text-center">
            <div className="space-y-1.5 flex flex-col items-center">
              <Skeleton className="w-40 h-3 rounded bg-neutral-100" />
              <Skeleton className="w-48 h-3.5 rounded bg-neutral-200" />
            </div>
            <div className="space-y-1 flex flex-col items-center">
              <Skeleton className="w-44 h-3.5 rounded bg-neutral-200" />
              <Skeleton className="w-32 h-2.5 rounded bg-neutral-100" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
