'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { FiHome } from 'react-icons/fi'

export default function NotFound() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black 
                     flex items-center justify-center p-4">
      <div className="relative">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),rgba(30,64,175,0.05))]" />
          <div className="absolute w-[500px] h-[500px] -top-40 -left-40
                         bg-gradient-conic from-purple-500/30 via-blue-500/30 to-purple-500/30
                         blur-3xl animate-slow-spin" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          {/* 404 Number */}
          <div className="text-8xl font-bold mb-6
                         bg-gradient-to-r from-purple-600 to-blue-600 
                         dark:from-purple-400 dark:to-blue-400 
                         text-transparent bg-clip-text">
            404
          </div>

          {/* Error Message */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 
                         bg-gradient-to-r from-purple-600 to-blue-600 
                         dark:from-purple-400 dark:to-blue-400 
                         text-transparent bg-clip-text">
            Page not found
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            The page you are looking for does not exist or has been moved.
          </p>

          {/* Home Button */}
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl
                       bg-gradient-to-r from-purple-600 to-blue-600
                       text-white font-medium
                       hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]
                       transition-all duration-300 group"
          >
            <FiHome className="group-hover:scale-110 transition-transform" />
            Go to Home
          </Link>
        </motion.div>
      </div>
    </main>
  )
} 