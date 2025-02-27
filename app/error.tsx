'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { FiHome, FiAlertCircle } from 'react-icons/fi'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

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
          {/* Error Icon */}
          <div className="inline-flex items-center justify-center w-16 h-16 mb-6
                         bg-gradient-to-br from-purple-600 to-blue-600
                         rounded-2xl shadow-[0_0_15px_rgba(139,92,246,0.3)]">
            <FiAlertCircle className="text-3xl text-white" />
          </div>

          {/* Error Message */}
          <h1 className="text-4xl sm:text-5xl font-bold mb-4 
                         bg-gradient-to-r from-purple-600 to-blue-600 
                         dark:from-purple-400 dark:to-blue-400 
                         text-transparent bg-clip-text">
                    Oops! Something went wrong
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            {error.message || "Si è verificato un errore inaspettato. Riprova più tardi."}
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={reset}
              className="px-6 py-3 rounded-xl 
                         bg-gradient-to-r from-purple-600 to-blue-600
                         text-white font-medium
                         hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]
                         transition-all duration-300 group
                         w-full sm:w-auto"
            >
              Retry
            </button>

            <Link
              href="/"
              className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                         bg-gradient-to-r from-gray-600 to-gray-700
                         text-white font-medium
                         hover:shadow-[0_0_15px_rgba(107,114,128,0.3)]
                         transition-all duration-300 group
                         w-full sm:w-auto"
            >
              <FiHome className="group-hover:scale-110 transition-transform" />
              Go to Home
            </Link>
          </div>
        </motion.div>
      </div>
    </main>
  )
} 