/* eslint-disable react-hooks/exhaustive-deps */
// src/pages/Wiki.tsx
import { useState, useMemo, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import wikiRaw from '../data/wiki.json'

// --- TYPES ---
interface IstilahItem {
  id: string
  singkatan: string
  kepanjangan: string
  definisi: string
  tag: string[]
}

interface KategoriItem {
  id: string
  kategori: string
  warna: string
  ikon: string
  istilah: IstilahItem[]
}

const wikiData = wikiRaw as KategoriItem[]

// Flatten & sort A-Z
const allIstilah: (IstilahItem & { warna: string; kategori: string })[] = wikiData
  .flatMap((k) => k.istilah.map((i) => ({ ...i, warna: k.warna, kategori: k.kategori })))
  .sort((a, b) => a.singkatan.localeCompare(b.singkatan, 'id'))

function groupByLetter<T extends { singkatan: string }>(items: T[]) {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const letter = item.singkatan[0].toUpperCase()
    if (!map.has(letter)) map.set(letter, [])
    map.get(letter)!.push(item)
  }
  return map
}

const Highlight = ({ text, query }: { text: string; query: string }) => {
  if (!query.trim()) return <>{text}</>
  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'))
  return (
    <>
      {parts.map((p, i) =>
        p.toLowerCase() === query.toLowerCase() ? (
          <mark key={i} className="bg-gov-gold text-white px-0.5">
            {p}
          </mark>
        ) : (
          p
        )
      )}
    </>
  )
}

// --- HALAMAN WIKI ---
const Wiki = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeLetter, setActiveLetter] = useState('')
  const letterRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    if (!q) return allIstilah
    return allIstilah.filter(
      (i) =>
        i.singkatan.toLowerCase().includes(q) ||
        i.kepanjangan.toLowerCase().includes(q) ||
        i.definisi.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const grouped = useMemo(() => groupByLetter(filtered), [filtered])
  const letters = Array.from(grouped.keys()).sort()
  const allLetters = Array.from(new Set(allIstilah.map((i) => i.singkatan[0].toUpperCase()))).sort()

  // Track active letter via IntersectionObserver
  useEffect(() => {
    if (searchQuery) {
      setActiveLetter('')
      return
    }
    const observers: IntersectionObserver[] = []
    allLetters.forEach((l) => {
      const el = letterRefs.current[l]
      if (!el) return
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveLetter(l)
        },
        { rootMargin: '-20% 0px -70% 0px', threshold: 0 }
      )
      obs.observe(el)
      observers.push(obs)
    })
    return () => observers.forEach((o) => o.disconnect())
  }, [searchQuery, letters])

  const scrollTo = (letter: string) => {
    letterRefs.current[letter]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    setActiveLetter(letter)
  }

  const showIndex = !searchQuery && filtered.length > 0

  return (
    <div className="min-h-screen font-sans text-slate-800">
      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* HEADER */}
        <section className="mb-10 max-w-3xl">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block bg-[#0f172a] text-white border border-slate-200 rounded-lg px-4 py-1 mb-4 shadow-sm">
            <span className="text-sm font-bold uppercase tracking-wider text-white">Glosarium</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-4xl md:text-5xl font-serif font-bold text-gov-blue mb-6 leading-tight">
            Wiki{' '}
            <span className="text-gov-gold underline decoration-black decoration-4 underline-offset-8">PEKPPP</span>
          </motion.h1>

          <p className="text-sm font-bold text-gray-500 mb-8">
            {allIstilah.length} istilah · Referensi singkat untuk PEKPPP 2026
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-800 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari istilah atau singkatan..."
              className="w-full bg-white border border-slate-200 rounded-lg py-3 pl-11 pr-10 text-sm font-bold placeholder:text-gray-400 focus:outline-none focus:shadow-md transition-all shadow-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </section>

        {/* BODY: two-column on desktop, single column on mobile */}
        <div className="flex gap-8 items-start">
          {/* --- LETTER INDEX: sticky sidebar (desktop only) --- */}
          <AnimatePresence>
            {showIndex && (
              <motion.aside
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ type: 'spring', stiffness: 280, damping: 26 }}
                className="hidden lg:flex flex-col gap-1 sticky top-24 self-start shrink-0">
                {allLetters.map((l) => (
                  <button
                    key={l}
                    onClick={() => scrollTo(l)}
                    className={`w-7 h-7 border border-slate-200 rounded-lg font-bold text-xs flex items-center justify-center transition-all duration-150
                      ${
                        activeLetter === l
                          ? 'bg-gov-blue text-white shadow-sm'
                          : 'bg-white text-slate-700 shadow-sm hover:bg-[#d4af37] hover:-translate-x-0.5'
                      }`}>
                    {l}
                  </button>
                ))}
              </motion.aside>
            )}
          </AnimatePresence>

          {/* --- GLOSSARY CONTENT --- */}
          <div className="flex-1 min-w-0 pb-28 lg:pb-0">
            {filtered.length > 0 ? (
              <div className="space-y-10">
                {letters.map((letter) => (
                  <div
                    key={letter}
                    ref={(el) => {
                      letterRefs.current[letter] = el
                    }}
                    className="scroll-mt-8">
                    {/* Label huruf */}
                    <div className="flex items-baseline gap-3 mb-4 pb-2 border-b border-slate-200">
                      <span className="text-4xl font-bold leading-none">{letter}</span>
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {grouped.get(letter)!.length} istilah
                      </span>
                    </div>

                    {/* Daftar istilah */}
                    <dl className="space-y-5">
                      {grouped.get(letter)!.map((item) => (
                        <div key={item.id} className="flex flex-col gap-0.5">
                          <dt className="flex items-baseline gap-2 flex-wrap">
                            <span
                              className="font-bold text-base uppercase tracking-tight px-1.5 py-0.5 border border-slate-200 rounded-lg"
                              style={{ backgroundColor: item.warna }}>
                              <Highlight text={item.singkatan} query={searchQuery} />
                            </span>
                            {item.kepanjangan !== '-' && (
                              <span className="text-sm font-bold text-gray-500">
                                - <Highlight text={item.kepanjangan} query={searchQuery} />
                              </span>
                            )}
                          </dt>
                          <dd className="text-sm text-gray-700 font-medium leading-relaxed pl-1 border-l-2 border-gray-200 ml-1">
                            <Highlight text={item.definisi} query={searchQuery} />
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-16 text-center border border-slate-200 rounded-lg bg-white shadow-md">
                <p className="font-bold text-lg mb-1">TIDAK DITEMUKAN</p>
                <p className="text-sm text-gray-500 font-medium mb-5">Coba kata kunci lain.</p>
                <button
                  onClick={() => setSearchQuery('')}
                  className="px-6 py-2.5 bg-gov-blue text-white font-bold text-sm hover:bg-white hover:text-slate-800 border border-slate-200 rounded-lg hover:shadow-sm transition-all">
                  RESET
                </button>
              </div>
            )}

            {filtered.length > 0 && searchQuery && (
              <p className="mt-8 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">
                {filtered.length} dari {allIstilah.length} istilah
              </p>
            )}
          </div>
        </div>

        {/* MOBILE: bottom bar index */}
        <AnimatePresence>
          {showIndex && (
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 overflow-x-auto">
              <div className="flex min-w-full">
                {allLetters.map((l) => (
                  <button
                    key={l}
                    onClick={() => scrollTo(l)}
                    className={`flex-1 min-w-[2rem] h-9 border-r border-slate-200 font-bold text-xs flex items-center justify-center transition-colors duration-150
                      ${activeLetter === l ? 'bg-gov-blue text-white' : 'bg-white text-slate-700 hover:bg-[#d4af37]'}`}>
                    {l}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Wiki
