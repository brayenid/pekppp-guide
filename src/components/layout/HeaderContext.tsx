'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

export interface HeaderConfig {
  title?: string | React.ReactNode
  icon?: React.ReactNode
  badge?: React.ReactNode
  actions?: React.ReactNode
}

interface HeaderContextType {
  headerConfig: HeaderConfig
  setHeaderConfig: (config: HeaderConfig) => void
  clearHeader: () => void
}

const HeaderContext = createContext<HeaderContextType>({
  headerConfig: {},
  setHeaderConfig: () => {},
  clearHeader: () => {}
})

export function HeaderProvider({ children }: { children: React.ReactNode }) {
  const [headerConfig, setHeaderConfigState] = useState<HeaderConfig>({})

  const setHeaderConfig = useCallback((newConfig: HeaderConfig) => {
    setHeaderConfigState((prev) => {
      if (
        prev.title === newConfig.title &&
        prev.badge === newConfig.badge &&
        prev.icon === newConfig.icon &&
        prev.actions === newConfig.actions
      ) {
        return prev
      }
      return newConfig
    })
  }, [])

  const clearHeader = useCallback(() => {
    setHeaderConfigState({})
  }, [])

  return (
    <HeaderContext.Provider value={{ headerConfig, setHeaderConfig, clearHeader }}>
      {children}
    </HeaderContext.Provider>
  )
}

export function useHeaderContext() {
  return useContext(HeaderContext)
}
