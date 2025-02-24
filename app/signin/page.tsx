'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { FiGithub, FiMail, FiLock, FiHome } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push('/')
    } catch (error: Error | unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleGithubSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
      })
      if (error) throw error
    } catch (error: Error | unknown) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <Link 
        href="/"
        className="absolute top-6 left-6 p-2 rounded-xl bg-white/5 dark:bg-gray-800/5 
                  border border-purple-500/20 hover:border-purple-500/40
                  transition-all duration-300 group"
      >
        <FiHome className="text-xl text-gray-600 dark:text-gray-400 
                          group-hover:text-purple-500 dark:group-hover:text-purple-400" />
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md p-8 rounded-2xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                   border border-purple-500/20 shadow-[0_0_30px_rgba(139,92,246,0.1)]"
      >
        <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-blue-600 
                       dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
          Sign In
        </h2>

        <form onSubmit={handleEmailSignIn} className="space-y-6">
          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Email</label>
            <div className="relative">
              <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
                          focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                          text-gray-800 dark:text-white placeholder-gray-400"
                placeholder="your@email.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-700 dark:text-gray-300 mb-2">Password</label>
            <div className="relative">
              <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
                          focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                          text-gray-800 dark:text-white placeholder-gray-400"
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <p className="text-red-500 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600
                       text-white font-medium hover:shadow-lg hover:shadow-purple-500/30
                       focus:outline-none focus:ring-2 focus:ring-purple-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-10">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full h-px">
                <div className="w-[40%] h-full bg-gradient-to-r from-transparent to-purple-500/20" />
                <div className="w-[40%] h-full ml-auto bg-gradient-to-l from-transparent to-purple-500/20" />
              </div>
            </div>
            <div className="relative z-10 px-12">
              <span className="px-4 py-2 rounded-full text-sm font-medium
                              text-gray-600 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          <button
            onClick={handleGithubSignIn}
            className="mt-8 w-full py-3 px-4 rounded-xl 
                      bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm
                      border border-purple-500/20 hover:border-purple-500/40 
                      hover:shadow-lg hover:shadow-purple-500/20
                      flex items-center justify-center gap-3 
                      transition-all duration-300 group"
          >
            <FiGithub className="text-xl text-gray-600 dark:text-gray-400 
                                group-hover:text-purple-500 transition-colors" />
            <span className="font-medium text-gray-600 dark:text-gray-400 
                            group-hover:text-purple-500 transition-colors">
              Continue with GitHub
            </span>
          </button>
        </div>

        <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
          Don&apos;t have an account?{' '}
          <Link href="/signup" className="text-purple-500 hover:text-purple-600 dark:hover:text-purple-400">
            Sign Up
          </Link>
        </p>
      </motion.div>
    </div>
  )
} 