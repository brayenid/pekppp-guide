'use client'

import { useEffect, useState } from 'react'

export function UnsavedFormGuard({ children }: { children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false)

  useEffect(() => {
    const handleInput = () => {
      setIsDirty(true)
    }

    const handleSubmit = () => {
      setIsDirty(false)
    }

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'Terdapat perubahan yang belum disimpan. Yakin ingin keluar?'
        return e.returnValue
      }
    }

    window.addEventListener('input', handleInput)
    window.addEventListener('change', handleInput)
    window.addEventListener('submit', handleSubmit)
    window.addEventListener('beforeunload', handleBeforeUnload)

    return () => {
      window.removeEventListener('input', handleInput)
      window.removeEventListener('change', handleInput)
      window.removeEventListener('submit', handleSubmit)
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [isDirty])

  return <>{children}</>
}
