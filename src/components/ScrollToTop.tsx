// src/components/ScrollToTop.tsx
import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Memaksa browser kembali ke koordinat 0,0 (atas-kiri)
    window.scrollTo(0, 0)
  }, [pathname]) // Akan berjalan setiap kali pathname (URL) berubah

  return null // Komponen ini tidak merender apapun secara visual
}
