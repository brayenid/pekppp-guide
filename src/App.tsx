/* eslint-disable react-hooks/set-state-in-effect */
// src/App.tsx
import { useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, NavLink, useLocation } from 'react-router-dom'
import { LayoutGrid, BookText, Home as HomeIcon, Info, Menu, X, FileText, BookOpen, Archive } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import Home from './pages/Home'
import Panduan from './pages/Panduan'
import DataRegulasi from './pages/DataRegulasi'
import ScrollToTop from './components/ScrollToTop'
import ContohSurat from './pages/ContohSurat'
import HasilPenilaian from './pages/Hasil'
import Wiki from './pages/Wiki'
import Arsip from './pages/Arsip'
import { FloatingUploadCTA } from './components/Floatinguploadcta'

export const DRIVE_UPLOAD_URL =
  'https://drive.google.com/drive/folders/1MsD9yZy1pQNdu1G8sIGYCdEOUeHnBUlj?usp=drive_link'

const NAV_ITEMS = [
  { path: '/', label: 'Beranda', icon: <HomeIcon className="w-4 h-4" /> },
  { path: '/panduan', label: 'Panduan', icon: <Info className="w-4 h-4" /> },
  { path: '/regulasi', label: 'Regulasi', icon: <BookText className="w-4 h-4" /> },
  { path: '/contoh', label: 'Contoh Surat', icon: <FileText className="w-4 h-4" /> },
  { path: '/wiki', label: 'Wiki', icon: <BookOpen className="w-4 h-4" /> },
  { path: '/arsip', label: 'Arsip', icon: <Archive className="w-4 h-4" /> },
  { path: '/hasil', label: 'Hasil', icon: <FileText className="w-4 h-4" /> }
]

const NavItem = ({ to, children, onClick }: { to: string; children: React.ReactNode; onClick?: () => void }) => (
  <NavLink
    to={to}
    onClick={onClick}
    className={({ isActive }) =>
      `flex items-center gap-2 px-4 py-2 font-medium transition-all rounded-md text-sm ${
        isActive
          ? 'bg-gov-blue text-white shadow-md'
          : 'bg-transparent text-slate-700 hover:bg-slate-100 hover:text-gov-blue'
      }`
    }>
    {children}
  </NavLink>
)

function AppContent() {
  const { pathname } = useLocation()
  const isWiki = pathname === '/wiki'

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  return (
    <div className="min-h-screen bg-gov-light text-slate-900 font-sans selection:bg-gov-gold/30 selection:text-gov-blue">
      {/* Background Gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-50 to-slate-100 pointer-events-none -z-10" />

      {/* --- NAVIGATION BAR --- */}
      <nav className="fixed top-0 left-0 right-0 bg-white/90 backdrop-blur-md border-b border-slate-200 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          {/* Logo */}
          <NavLink to="/" className="flex items-center gap-3 group">
            <div className="p-2 bg-slate-200 text-gov-gold rounded-lg shadow-sm group-hover:shadow-md transition-all">
              <img src="/kubar.png" alt="Logo Kubar" title="Kutai Barat" className="w-6" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-serif font-bold text-xl tracking-tight text-gov-blue">PEKPPP</span>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">Kutai Barat</span>
            </div>
          </NavLink>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-2">
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
            className="lg:hidden p-2 rounded-md text-slate-700 hover:bg-slate-100 transition-colors">
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
              className="lg:hidden border-t border-slate-200 bg-white shadow-lg overflow-hidden">
              <div className="flex flex-col p-4 gap-2 pb-6">
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
      <main className="pt-24 min-h-screen pb-32 max-w-7xl mx-auto px-4 lg:px-8">
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/panduan" element={<Panduan />} />
          <Route path="/regulasi" element={<DataRegulasi />} />
          <Route path="/contoh" element={<ContohSurat />} />
          <Route path="/hasil" element={<HasilPenilaian />} />
          <Route path="/wiki" element={<Wiki />} />
          <Route path="/arsip" element={<Arsip />} />
        </Routes>
      </main>

      {/* --- FOOTER --- */}
      <footer className="bg-gov-blue text-slate-300 py-8 border-t border-slate-800 mt-auto">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <p className="text-sm font-serif text-white tracking-wide mb-3">Bagian Organisasi Setkab Kutai Barat</p>
          <p className="text-xs text-slate-500 font-sans">© 2026 Dibangun Oleh Tim PPTL</p>
        </div>
      </footer>

      {/* --- FLOATING CTA --- */}
      <FloatingUploadCTA
        uploadUrl={DRIVE_UPLOAD_URL}
        isWiki={isWiki}
        bobbing={true}
        bobbingVisibleMs={12000}
        bobbingHiddenMs={4000}
      />
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
