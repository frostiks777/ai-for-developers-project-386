import { useContext } from 'react'

import { ThemeContext, type ThemeContextValue } from '@/lib/theme-context'

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext)

  if (!context) {
    throw new Error('useTheme должен вызываться внутри ThemeProvider')
  }

  return context
}
