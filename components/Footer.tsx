'use client'

import Link from 'next/link'
import { FiMail, FiGithub, FiInstagram } from 'react-icons/fi'
import { GiCoffeeCup } from 'react-icons/gi'

export function Footer() {
  return (
    <footer className="py-8 px-4 mt-auto">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 
                           flex items-center justify-center text-white font-bold text-sm">
              FD
            </div>
            <span className="text-gray-600 dark:text-gray-400">
              Federico Donati
            </span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/contact"
              className="flex items-center gap-2 px-4 py-2 rounded-xl 
                        bg-gradient-to-r from-purple-600 to-blue-600
                        text-white font-medium
                        hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]
                        transition-all duration-300"
            >
              <FiMail className="text-lg" />
              <span>Contattami</span>
            </Link>

            <Link
              href={`https://www.buymeacoffee.com/${process.env.NEXT_PUBLIC_BUYMEACOFFEE_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 rounded-xl 
                        bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500
                        text-white font-medium
                        hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]
                        border border-emerald-400/20
                        transition-all duration-300 group"
            >
              <GiCoffeeCup className="w-5 h-5 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              <span>Supportami</span>
            </Link>

            <div className="flex items-center gap-4">
              <a
                href="https://github.com/tuouser"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-600 dark:text-gray-400 
                           hover:text-purple-500 dark:hover:text-purple-400 
                           transition-colors"
              >
                <FiGithub className="text-xl" />
              </a>
              <a
                href="https://instagram.com/tuouser"
                target="_blank"
                rel="noopener noreferrer" 
                className="p-2 text-gray-600 dark:text-gray-400 
                           hover:text-purple-500 dark:hover:text-purple-400 
                           transition-colors"
              >
                <FiInstagram className="text-xl" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
} 