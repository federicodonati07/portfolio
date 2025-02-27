'use client'

import { useTheme } from 'next-themes'
import { Button } from '@nextui-org/react'
import { FiSun, FiMoon } from 'react-icons/fi'
import { useEffect, useState } from 'react'

export function ThemeSwitch() {
  const [mounted, setMounted] = useState(false)
  const { theme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <Button
      className={`
        relative overflow-hidden px-2 sm:px-3 py-2 rounded-xl
        ${theme === 'dark'
          ? 'bg-gradient-to-r from-amber-500 via-orange-400 to-amber-500'
          : 'bg-gradient-to-r from-blue-500 via-purple-500 to-blue-500'
        }
        hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]
        dark:hover:shadow-[0_0_15px_rgba(245,158,11,0.3)]
        transition-all duration-500 ease-in-out
        after:absolute after:inset-0
        after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent
        after:skew-x-[-20deg] after:-translate-x-full
        hover:after:translate-x-[200%]
        after:transition-transform after:duration-1000 after:ease-in-out
        min-w-[40px] sm:min-w-[44px]
        group
      `}
      onPress={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
    >
      {theme === 'dark' ? (
        <FiSun className="text-white text-lg sm:text-xl 
                         transform transition-all duration-500 ease-in-out
                         group-hover:rotate-180 group-hover:scale-110" />
      ) : (
        <FiMoon className="text-white text-lg sm:text-xl 
                          transform transition-all duration-500 ease-in-out
                          group-hover:-rotate-90 group-hover:scale-110" />
      )}
    </Button>
  )
} 