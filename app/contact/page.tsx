'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { FiArrowLeft } from 'react-icons/fi'
import Link from 'next/link'

const PLANS = [
  {
    id: 'info',
    name: 'Information',
    description: 'Questions about services',
    icon: 'ℹ️'
  },
  {
    id: 'frontend',
    name: 'Website',
    description: 'Responsive and modern design',
    icon: '🎨'
  },
  {
    id: 'frontend_modern',
    name: 'Advanced Website',
    description: 'With animations and effects',
    icon: '✨'
  },
  {
    id: 'fullstack',
    name: 'Web App',
    description: 'With database and authentication',
    icon: '⚡'
  },
  {
    id: 'fullstack_modern',
    name: 'Advanced Web App',
    description: 'With real-time features',
    icon: '🚀'
  }
]

export default function Contact() {
  const [session, setSession] = useState<Session | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('info')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!session) {
      router.push('/signin')
      return
    }

    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('request')
        .insert({
          user_id: session.user.id,
          from_user: session.user.email,
          plan: selectedPlan,
          text: `${subject}\n\n${message}`
        })

      if (error) throw error

      await supabase.functions.invoke('sendAdminNotification', {
        body: {
          userEmail: session.user.email,
          userName: session.user.user_metadata.name,
          plan: selectedPlan,
          text: `${subject}\n\n${message}`
        }
      })

      setSubject('')
      setMessage('')
      setSelectedPlan('info')
      router.push('/requests')
    } catch (error) {
      setError('Error sending request')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                      bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm
                      border border-purple-500/20 hover:border-purple-500/40
                      text-gray-600 dark:text-gray-300
                      transition-all duration-300 group"
          >
            <FiArrowLeft className="text-lg group-hover:text-purple-500 transition-colors" />
            <span className="group-hover:text-purple-500 transition-colors">
              Back to Home
            </span>
          </Link>
        </div>
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8 text-center bg-gradient-to-r from-purple-600 to-blue-600 
                     dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text"
        >
          Contact Me
        </motion.h1>

        {!session ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-center p-8 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                       border border-purple-500/20"
          >
            <h2 className="text-xl font-bold mb-4">Sign in to Send a Message</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              To better respond to your requests, please sign in.
            </p>
            <button
              onClick={() => router.push('/signin')}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600
                        text-white font-medium hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] 
                        transition-all duration-300"
            >
              Sign In
            </button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            onSubmit={handleSubmit}
            className="space-y-8"
          >
            {/* Form fields */}
            <div className="space-y-4">
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Message subject"
                className="w-full px-4 py-2 rounded-xl bg-white/5 dark:bg-gray-800/5
                          border border-purple-500/20 focus:border-purple-500/40
                          focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Describe your request..."
                rows={6}
                className="w-full px-4 py-2 rounded-xl bg-white/5 dark:bg-gray-800/5
                          border border-purple-500/20 focus:border-purple-500/40
                          focus:outline-none focus:ring-2 focus:ring-purple-500/20"
              />
            </div>

            {/* Plan selection */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-3 rounded-xl text-center transition-all duration-300
                             ${selectedPlan === plan.id 
                               ? 'bg-purple-500/10 border-purple-500/40' 
                               : 'bg-white/5 dark:bg-gray-800/5 border-purple-500/20'}
                             border backdrop-blur-xl hover:scale-105`}
                >
                  <span className="text-2xl mb-1 block">{plan.icon}</span>
                  <h3 className="text-sm font-medium mb-1">{plan.name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {plan.description}
                  </p>
                </button>
              ))}
            </div>

            {error && (
              <p className="text-red-500 text-center">{error}</p>
            )}

            <div className="flex justify-center">
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600
                          text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed
                          hover:shadow-[0_0_30px_rgba(139,92,246,0.3)] transition-all duration-300"
              >
                {loading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </motion.form>
        )}
      </div>
    </div>
  )
} 