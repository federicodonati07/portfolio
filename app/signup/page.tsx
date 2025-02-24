'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { FiMail, FiLock, FiUser, FiHome } from 'react-icons/fi'
import Link from 'next/link'
import { PasswordStrengthMeter } from '@/components/PasswordStrengthMeter'

export default function SignUp() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [loading, setLoading] = useState(false)
  const [registrationSuccess, setRegistrationSuccess] = useState(false)
  const [resendTimer, setResendTimer] = useState(60)
  const [canResend, setCanResend] = useState(false)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (registrationSuccess && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
    } else if (resendTimer === 0) {
      setCanResend(true)
    }
    return () => clearInterval(interval)
  }, [registrationSuccess, resendTimer])

  const validateEmail = (email: string) => {
    // Regex per validazione email più accurata
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/
    return emailRegex.test(email)
  }

  const validateForm = () => {
    let isValid = true
    const newErrors = {
      email: '',
      password: '',
      name: ''
    }

    // Nome validazione
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required'
      isValid = false
    }

    // Email validazione
    if (!formData.email) {
      newErrors.email = 'Email is required'
      isValid = false
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
      isValid = false
    }

    // Password validazione
    if (!formData.password) {
      newErrors.password = 'Password is required'
      isValid = false
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
      isValid = false
    }

    setErrors(newErrors)
    return isValid
  }

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            name: formData.name,
          },
        },
      })
      if (error) throw error
      setRegistrationSuccess(true)
    } catch (error: unknown) {
      setErrors(prev => ({
        ...prev,
        email: error instanceof Error ? error.message : 'An error occurred'
      }))
    } finally {
      setLoading(false)
    }
  }

  const handleResendEmail = async () => {
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: formData.email,
      })
      if (error) throw error
      
      setResendTimer(60)
      setCanResend(false)
    } catch (error: unknown) {
      console.error('Error resending email:', error instanceof Error ? error.message : 'Unknown error')
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

      {registrationSuccess ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-2xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                     border border-purple-500/20 shadow-[0_0_30px_rgba(139,92,246,0.1)]"
        >
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full 
                           flex items-center justify-center mx-auto mb-6">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </motion.div>
            </div>
            <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 
                           dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
              Check Your Email
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-8">
              We&apos;ve sent a verification link to <span className="font-medium text-purple-500">{formData.email}</span>
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Please check your email and click the verification link to complete your registration.
            </p>
            <div className="flex flex-col gap-4 items-center">
              <Link href="/signin">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600
                            text-white font-medium hover:shadow-lg hover:shadow-purple-500/30
                            transition-all duration-300"
                >
                  Go to Sign In
                </motion.button>
              </Link>
              
              <motion.button
                whileHover={canResend ? { scale: 1.05 } : {}}
                whileTap={canResend ? { scale: 0.95 } : {}}
                onClick={handleResendEmail}
                disabled={!canResend}
                className={`px-6 py-2 rounded-xl border text-sm
                          transition-all duration-300 flex items-center gap-2
                          ${canResend 
                            ? 'border-purple-500/40 text-purple-500 hover:bg-purple-500/10' 
                            : 'border-gray-300 text-gray-400 cursor-not-allowed'}`}
              >
                <span>Resend verification email</span>
                {!canResend && (
                  <span className="text-sm">({resendTimer}s)</span>
                )}
              </motion.button>
            </div>
          </div>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 rounded-2xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                     border border-purple-500/20 shadow-[0_0_30px_rgba(139,92,246,0.1)]"
        >
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-purple-600 to-blue-600 
                         dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
            Create Account
          </h2>

          <form onSubmit={handleEmailSignUp} className="space-y-6">
            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Name</label>
              <div className="relative">
                <FiUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border 
                            ${errors.name ? 'border-red-500' : 'border-purple-500/20'} 
                            focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                            text-gray-800 dark:text-white placeholder-gray-400`}
                  placeholder="Your name"
                />
              </div>
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Email</label>
              <div className="relative">
                <FiMail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border 
                            ${errors.email ? 'border-red-500' : 'border-purple-500/20'} 
                            focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                            text-gray-800 dark:text-white placeholder-gray-400`}
                  placeholder="your@email.com"
                />
              </div>
              {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
            </div>

            <div>
              <label className="block text-gray-700 dark:text-gray-300 mb-2">Password</label>
              <div className="relative">
                <FiLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                  className={`w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border 
                            ${errors.password ? 'border-red-500' : 'border-purple-500/20'}`}
                  placeholder="••••••••"
                />
              </div>
              {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
              <PasswordStrengthMeter password={formData.password} />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600
                       text-white font-medium hover:shadow-lg hover:shadow-purple-500/30
                       focus:outline-none focus:ring-2 focus:ring-purple-500/20
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all duration-300"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
          </form>

          <p className="mt-8 text-center text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link href="/signin" className="text-purple-500 hover:text-purple-600 dark:hover:text-purple-400">
              Sign In
            </Link>
          </p>
        </motion.div>
      )}
    </div>
  )
} 