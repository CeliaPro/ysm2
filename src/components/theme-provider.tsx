'use client'

import * as React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>(defaultTheme)

  // Set theme from localStorage on mount (avoid SSR mismatch)
  useEffect(() => {
    const savedTheme = localStorage.getItem(storageKey) as Theme | null
    if (savedTheme && savedTheme !== theme) {
      setThemeState(savedTheme)
    }
    // eslint-disable-next-line
  }, [])

  // Listen for system theme changes if theme == 'system'
  useEffect(() => {
    const root = window.document.documentElement
    const apply = (t: Theme) => {
      root.classList.remove('light', 'dark')
      if (t === 'system') {
        const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches
          ? 'dark'
          : 'light'
        root.classList.add(systemTheme)
      } else {
        root.classList.add(t)
      }
    }

    apply(theme)

    let media: MediaQueryList
    const onSystemThemeChange = (e: MediaQueryListEvent) => {
      if (theme === 'system') apply('system')
    }

    if (theme === 'system') {
      media = window.matchMedia('(prefers-color-scheme: dark)')
      media.addEventListener('change', onSystemThemeChange)
    }

    return () => {
      if (media) media.removeEventListener('change', onSystemThemeChange)
    }
  }, [theme])

  // Always update localStorage when theme changes (for cross-tab sync)
  useEffect(() => {
    localStorage.setItem(storageKey, theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (t: Theme) => {
      setThemeState(t)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)
  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')
  return context
}
