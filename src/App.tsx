/* eslint-disable react-hooks/set-state-in-effect */
// src/App.tsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import {
  LayoutGrid,
  UploadCloud,
  ExternalLink,
  BookText,
  Home as HomeIcon,
  Info,
  Menu,
  X,
  FileText
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
// Pastikan halaman ini ada atau buat placeholder dummy jika belum ada
import Panduan from './pages/Panduan'
import DataRegulasi from './pages/DataRegulasi'
import ScrollToTop from './components/ScrollToTop'
import ContohSurat from './pages/ContohSurat'

export const DRIVE_UPLOAD_URL =
  'https://drive.google.com/drive/folders/1MsD9yZy1pQNdu1G8sIGYCdEOUeHnBUlj?usp=drive_link'

const NAV_ITEMS = [
  { path: '/', label: 'Beranda', icon: <HomeIcon className="w-4 h-4" /> },
  { path: '/panduan', label: 'Panduan', icon: <Info className="w-4 h-4" /> },
  { path: '/regulasi', label: 'Regulasi', icon: <BookText className="w-4 h-4" /> },
  { path: '/contoh', label: 'Contoh Surat', icon: <FileText className="w-4 h-4" /> }
]

// Component Helper untuk NavLink agar rapi
const NavItem = ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-2 font-bold uppercase tracking-wide border-2 border-black transition-all ${
        isActive
          ? 'bg-[#FFDE59] shadow-[4px_4px_0px_0px_#000] -translate-y-1'
          : 'bg-white hover:bg-gray-50 hover:shadow-[2px_2px_0px_0px_#000] hover:-translate-y-0.5'
      }`
    }>
    {children}
  </NavLink>
)

function AppContent() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Tutup menu mobile setiap kali pindah halaman
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  return (
    <div className="min-h-screen bg-[#f4f4f0] text-black font-sans selection:bg-[#FFDE59] selection:text-black">
      {/* Background Grid Pattern */}
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#000000_1px,transparent_1px),linear-gradient(to_bottom,#000000_1px,transparent_1px)] bg-size-[24px_24px] opacity-5 pointer-events-none" />

      {/* --- NAVIGATION BAR --- */}
      <nav className="fixed top-0 left-0 right-0 bg-white border-b-4 border-black z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-20 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-2 group">
            <div className="p-2 bg-black border-2 border-black text-white rounded-none group-hover:bg-[#FFDE59] group-hover:text-black transition-colors">
              <LayoutGrid className="w-5 h-5" />
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-black text-xl tracking-tighter">PEKPPP</span>
              <span className="text-[10px] font-bold uppercase tracking-widest bg-black text-white px-1">Docs</span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            {NAV_ITEMS.map((item) => (
              <NavItem key={item.path} to={item.path}>
                {item.icon}
                {item.label}
              </NavItem>
            ))}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 border-2 border-black bg-white active:bg-black active:text-white transition-colors">
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Dropdown Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t-4 border-black bg-white overflow-hidden">
              <div className="flex flex-col p-4 gap-3 pb-6">
                {NAV_ITEMS.map((item) => (
                  <NavItem key={item.path} to={item.path}>
                    {item.icon}
                    {item.label}
                  </NavItem>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* --- MAIN CONTENT --- */}
      <main className="pt-24 min-h-screen pb-32">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/panduan" element={<Panduan />} />
          <Route path="/regulasi" element={<DataRegulasi />} />
          <Route path="/contoh" element={<ContohSurat />} />
        </Routes>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-black text-white py-12 border-t-4 border-black mt-auto">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <div className="inline-block p-3 border-2 border-white mb-4 rotate-3">
            <LayoutGrid className="w-6 h-6" />
          </div>
          <p className="text-sm font-bold uppercase tracking-widest mb-2">Bagian Organisasi Setkab Kutai Barat</p>
          <p className="text-xs text-gray-400 font-mono">© 2026 Dibangun Oleh Tim PPTL</p>
        </div>
      </footer>

      {/* --- FLOATING CTA (Neo Brutalism Style) --- */}
      <div className="fixed bottom-6 right-6 z-40">
        <motion.a
          href={DRIVE_UPLOAD_URL}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.05, rotate: -2 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-3 px-3 py-3 bg-[#57E7FB] border-4 border-black shadow-[8px_8px_0px_0px_#000] hover:shadow-[12px_12px_0px_0px_#000] hover:-translate-y-1 transition-all group">
          <div className="bg-black text-white p-2 border-2 border-transparent group-hover:bg-white group-hover:text-black group-hover:border-black transition-colors">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div className="flex flex-col text-left">
            <span className="text-[10px] font-black uppercase tracking-widest leading-none mb-1">Google Drive</span>
            <span className="text-sm font-black uppercase leading-none">Unggah Berkas</span>
          </div>
          <ExternalLink className="w-4 h-4 ml-2" />
        </motion.a>
      </div>
    </div>
  )
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  )
}

export default App
