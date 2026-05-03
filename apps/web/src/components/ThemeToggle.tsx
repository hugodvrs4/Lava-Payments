import { useEffect, useState } from 'react'
import iconeUrl from '../img/icone.png'
import logoUrl from '../img/logo.png'
import iconeCustomUrl from '../img/icone-custom.png'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'custom'>('dark')

  // Function to update favicon
  const updateFavicon = (currentTheme: 'dark' | 'light' | 'custom') => {
    const faviconLink = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    
    if (!faviconLink) {
      // Create favicon link if it doesn't exist
      const newLink = document.createElement('link')
      newLink.rel = 'icon'
      document.head.appendChild(newLink)
    }
    
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement
    
    // Change favicon based on theme
    switch (currentTheme) {
      case 'dark':
        link.href = iconeUrl
        break
      case 'light':
        link.href = logoUrl
        break
      case 'custom':
        link.href = iconeCustomUrl
        break
    }
  }

  useEffect(() => {
    // Check for saved theme preference or default to 'dark'
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'custom' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
      updateFavicon(savedTheme)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
      updateFavicon('dark')
    }
  }, [])

  const toggleTheme = () => {
    // Cycle through: dark -> light -> custom -> dark
    let newTheme: 'dark' | 'light' | 'custom'
    
    if (theme === 'dark') {
      newTheme = 'light'
    } else if (theme === 'light') {
      newTheme = 'custom'
    } else {
      newTheme = 'dark'
    }
    
    setTheme(newTheme)
    document.documentElement.setAttribute('data-theme', newTheme)
    localStorage.setItem('theme', newTheme)
    updateFavicon(newTheme)
  }

  // Choose icon based on current theme
  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return '🌙'  // Moon for dark mode
      case 'light':
        return '☀️'  // Sun for light mode
      case 'custom':
        return '⚡'  // Palette for custom theme
      default:
        return '🌙'
    }
  }

  const getTitle = () => {
    switch (theme) {
      case 'dark':
        return 'Switch to Light mode'
      case 'light':
        return 'Switch to Custom theme'
      case 'custom':
        return 'Switch to Dark mode'
      default:
        return 'Toggle theme'
    }
  }

  return (
    <button
      className="theme-toggle"
      onClick={toggleTheme}
      aria-label="Toggle theme"
      title={getTitle()}
    >
      {getIcon()}
    </button>
  )
}