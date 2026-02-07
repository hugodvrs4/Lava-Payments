import { useEffect, useState } from 'react'

export default function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light' | 'custom'>('dark')

  useEffect(() => {
    // Check for saved theme preference or default to 'dark'
    const savedTheme = localStorage.getItem('theme') as 'dark' | 'light' | 'custom' | null
    if (savedTheme) {
      setTheme(savedTheme)
      document.documentElement.setAttribute('data-theme', savedTheme)
    } else {
      document.documentElement.setAttribute('data-theme', 'dark')
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
  }

  // Choose icon based on current theme
  const getIcon = () => {
    switch (theme) {
      case 'dark':
        return '🌙'  // Moon for dark mode
      case 'light':
        return '☀️'  // Sun for light mode
      case 'custom':
        return '🎨'  // Palette for custom theme
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