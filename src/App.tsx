// src/App.tsx
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom'
import { LayoutGrid, UploadCloud, ExternalLink, BookText, Home as HomeIcon, Info } from 'lucide-react'
import { motion } from 'framer-motion'
import Home from './pages/Home'
import Panduan from './pages/Panduan'
import DataRegulasi from './pages/DataRegulasi'
import ScrollToTop from './components/ScrollToTop'

const DRIVE_UPLOAD_URL = 'YOUR_GOOGLE_DRIVE_LINK'

// Konfigurasi Navigasi agar mudah diolah
const NAV_ITEMS = [
  { path: '/', label: 'Beranda', icon: <HomeIcon className="w-4 h-4" /> },
  { path: '/panduan', label: 'Panduan', icon: <Info className="w-4 h-4" /> },
  { path: '/data', label: 'Data', icon: <BookText className="w-4 h-4" /> }
]

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
        {/* Subtle Grid Background */}
        <div className="fixed inset-0 bg-[linear-gradient(to_right,#f0f0f0_1px,transparent_1px),linear-gradient(to_bottom,#f0f0f0_1px,transparent_1px)] bg-size-[4rem_4rem] mask-[radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        {/* --- NAVIGATION BAR --- */}
        <nav className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md border-b border-zinc-100 z-[100]">
          <div className="max-w-5xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <NavLink
              to="/"
              className="flex items-center gap-2 font-bold text-zinc-900 uppercase tracking-tighter shrink-0">
              <div className="p-1.5 bg-zinc-900 rounded-md">
                <LayoutGrid className="text-white w-4 h-4" />
              </div>
              <span className="hidden sm:inline">
                PEKPPP <span className="text-zinc-400 font-normal">Docs</span>
              </span>
            </NavLink>

            {/* Nav Links - Mobile Friendly Scrollable */}
            <div className="flex bg-zinc-100 p-1 rounded-xl ml-4 overflow-x-auto no-scrollbar">
              {NAV_ITEMS.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-2 px-3 md:px-4 py-1.5 text-[11px] font-bold uppercase rounded-lg transition-all whitespace-nowrap ${
                      isActive ? 'bg-white shadow-sm text-blue-600' : 'text-zinc-400 hover:text-zinc-600'
                    }`
                  }>
                  {item.icon}
                  {item.label}
                </NavLink>
              ))}
            </div>
          </div>
        </nav>

        {/* --- ROUTES CONTAINER --- */}
        <main className="pt-16 min-h-screen">
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/panduan" element={<Panduan />} />
            <Route path="/data" element={<DataRegulasi />} />
          </Routes>
        </main>

        {/* --- SIMPLE FOOTER --- */}
        <footer className="max-w-5xl mx-auto px-6 py-16 mt-12 border-t border-zinc-100 text-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-1 bg-zinc-100 rounded-full mb-2" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-300">Official Portal</p>
            <p className="text-sm font-bold text-zinc-900">
              Dikelola oleh <span className="text-blue-600">Bagian Organisasi Kutai Barat</span>
            </p>
            <p className="text-[10px] text-zinc-400 font-medium mt-2">© 2026 Pemerintah Kabupaten Kutai Barat</p>
          </div>
        </footer>

        {/* --- FLOATING CTA --- */}
        <div className="fixed bottom-0 left-0 right-0 p-4 md:p-6 z-[90] pointer-events-none flex justify-center md:justify-end">
          <motion.a
            href={DRIVE_UPLOAD_URL}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            className="pointer-events-auto flex items-center gap-4 bg-white border border-zinc-200 text-zinc-900 px-5 md:px-7 py-3 md:py-4 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] transition-all group w-full md:w-auto md:min-w-[320px]">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors duration-300 shrink-0">
              <UploadCloud className="w-5 h-5 md:w-6 md:h-6 text-blue-600 group-hover:text-white" />
            </div>

            <div className="flex flex-col text-left uppercase overflow-hidden">
              <h2 className="text-[13px] md:text-[15px] font-extrabold leading-tight truncate">Unggah Bukti Dukung</h2>
              <p className="text-[10px] md:text-[11px] text-zinc-400 font-medium tracking-tight">Google Drive Kubar</p>
            </div>

            <div className="ml-auto pl-2 md:pl-4 border-l border-zinc-100 flex items-center">
              <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <ExternalLink className="w-4 h-4 md:w-5 md:h-5 text-zinc-300 group-hover:text-blue-600" />
              </motion.div>
            </div>
          </motion.a>
        </div>
      </div>
    </Router>
  )
}

export default App
