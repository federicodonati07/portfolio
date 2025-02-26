'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FiSend, FiArrowLeft, FiCheckCircle } from 'react-icons/fi'
import Link from 'next/link'
import { format } from 'date-fns'

interface Request {
  id: number
  created_at: string
  user_id: string
  status: 'pending' | 'answered' | 'closed'
  plan: string
  text: string
  answer?: string
  tempAnswer?: string
  profiles?: {
    email: string
    full_name: string
  }
  from_user: string
  viewed_by_user: string
}

const PLANS = [
  {
    id: 'info',
    name: 'Information Request'
  },
  {
    id: 'frontend',
    name: 'Website'
  },
  {
    id: 'frontend_modern',
    name: 'Advanced Website'
  },
  {
    id: 'fullstack',
    name: 'Web App'
  },
  {
    id: 'fullstack_modern',
    name: 'Advanced Web App'
  }
]

export default function AdminRequests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const router = useRouter()
  const [sendingResponse, setSendingResponse] = useState<number | null>(null)
  const [showSuccess, setShowSuccess] = useState<number | null>(null)

  const checkAuth = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/signin')
      return
    }
    
    if (session.user.email !== 'federico.donati.work@gmail.com') {
      router.push('/')
      return
    }

    fetchRequests()
  }, [router])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    // Sottoscrivi ai cambiamenti delle richieste
    const channel = supabase
      .channel('request_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'request'
      }, () => {
        // Aggiorna le richieste quando ci sono cambiamenti
        fetchRequests()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  useEffect(() => {
    if (requests.some(r => r.status === 'pending')) {
      setFilter('pending')
    } else {
      setFilter('all')
    }
  }, [requests])

  const fetchRequests = async () => {
    try {
      setLoading(true)
      
      const { data: requestsData, error: requestsError } = await supabase
        .from('request')
        .select('*')
        .order('created_at', { ascending: false })

      if (requestsError) throw requestsError

      // Ottieni i dati degli utenti uno alla volta
      const requests = await Promise.all(
        requestsData.map(async (request) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('email, full_name')
            .eq('id', request.user_id)
            .single()
          
          return {
            ...request,
            profiles: {
              id: request.user_id,
              email: userData?.email,
              full_name: userData?.full_name
            }
          }
        })
      )

      setRequests(requests || [])

    } catch (error) {
      console.error('Error fetching requests:', error)
      setRequests([])
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (id: number, answer: string) => {
    try {
      setSendingResponse(id)
      
      const signedAnswer = `${answer}\n\n---\nBest regards,\nFederico Donati\nfederico.donati.work@gmail.com`

      // Prima aggiorna il database
      const { error: updateError } = await supabase
        .from('request')
        .update({ 
          status: 'answered',
          answer: signedAnswer,
          viewed_by_user: "false"
        })
        .eq('id', id)

      if (updateError) throw updateError

      // Invia email all'utente
      const request = requests.find(r => r.id === id)
      if (!request || !request.profiles?.email) return
      
      await supabase.functions.invoke('sendUserNotification', {
        body: {
          userEmail: request.profiles.email,
          answer: signedAnswer
        }
      })

      // Mostra feedback di successo
      setShowSuccess(id)
      
      // Breve timeout per mostrare il feedback prima del refresh
      setTimeout(() => {
        window.location.reload()
      }, 1000)

    } catch (error) {
      console.error('Error answering request:', error)
      alert('Error sending response. Please try again.')
    } finally {
      setSendingResponse(null)
    }
  }

  const filteredRequests = requests
    .filter(request => {
      if (filter === 'all') return true
      if (filter === 'pending') return request.status === 'pending'
      if (filter === 'answered') return request.status === 'answered'
      return true
    })
    .filter(request => {
      if (planFilter === 'all') return true
      return request.plan === planFilter
    })

  return (
    <div className="h-screen flex flex-col p-4 sm:p-8">
      <div className="flex-none">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                      bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm
                      border border-purple-500/20 hover:border-purple-500/40
                      text-gray-600 dark:text-gray-300
                      transition-all duration-300 group"
          >
            <FiArrowLeft className="text-lg group-hover:text-purple-500 transition-colors" />
            <span className="hidden sm:inline group-hover:text-purple-500 transition-colors">
              Back to Dashboard
            </span>
          </Link>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 
                         dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
            Requests Management
          </h2>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm">
              {requests.filter(r => r.status === 'pending').length} requests to manage
            </span>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
            <div className="relative flex-grow sm:flex-grow-0">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-xl 
                          bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                          border border-purple-500/20 
                          focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                          text-gray-800 dark:text-white
                          appearance-none cursor-pointer
                          hover:border-purple-500/40
                          transition-all duration-300"
              >
                <option value="all" className="bg-white dark:bg-gray-800">🔍 All Requests</option>
                <option value="pending" className="bg-white dark:bg-gray-800">⏳ Pending</option>
                <option value="answered" className="bg-white dark:bg-gray-800">✅ Answered</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none
                              text-gray-400 dark:text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>

            <div className="relative flex-grow sm:flex-grow-0">
              <select
                value={planFilter}
                onChange={(e) => setPlanFilter(e.target.value)}
                className="w-full px-4 py-2 rounded-xl 
                          bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                          border border-purple-500/20 
                          focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                          text-gray-800 dark:text-white
                          appearance-none cursor-pointer
                          hover:border-purple-500/40
                          transition-all duration-300"
              >
                <option value="all" className="bg-white dark:bg-gray-800">🎯 All Plans</option>
                <option value="info" className="bg-white dark:bg-gray-800">ℹ️ Information Only</option>
                <option value="frontend" className="bg-white dark:bg-gray-800">🎨 Basic Frontend</option>
                <option value="frontend_modern" className="bg-white dark:bg-gray-800">✨ Modern Frontend</option>
                <option value="fullstack" className="bg-white dark:bg-gray-800">⚡ Basic Fullstack</option>
                <option value="fullstack_modern" className="bg-white dark:bg-gray-800">🚀 Modern Fullstack</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none
                              text-gray-400 dark:text-gray-500">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 space-y-4 pr-2">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 
                           rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >
            <div className="w-16 h-16 bg-purple-500/10 rounded-full 
                           flex items-center justify-center mx-auto mb-4">
              <svg 
                className="w-8 h-8 text-purple-500" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" 
                />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-800 dark:text-white mb-2">
              No requests found
            </h3>
            <p className="text-gray-500">
              {filter !== 'all' || planFilter !== 'all' 
                ? 'Try modifying the search filters'
                : 'There are no requests to manage yet'}
            </p>
          </motion.div>
        ) : (
          filteredRequests.map(request => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 rounded-xl bg-white/5 dark:bg-gray-800/5 backdrop-blur-xl
                         border border-purple-500/20 hover:border-purple-500/30
                         transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 
                                 flex items-center justify-center text-white font-medium">
                    {request.from_user?.[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-800 dark:text-gray-200">
                      {request.from_user}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {format(new Date(request.created_at), 'PPP')}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2
                                 ${request.plan === 'info' 
                                   ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                                   : request.plan.includes('frontend')
                                     ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20'
                                     : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}
                  >
                    <span>
                      {request.plan === 'info' && 'ℹ️'}
                      {request.plan.includes('frontend') && '🎨'}
                      {request.plan.includes('fullstack') && '⚡'}
                    </span>
                    {PLANS.find(p => p.id === request.plan)?.name}
                  </div>

                  <div className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2
                                 ${request.status === 'pending'
                                   ? 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                                   : 'bg-green-500/10 text-green-500 border border-green-500/20'}`}
                  >
                    <span>{request.status === 'pending' ? '⏳' : '✅'}</span>
                    {request.status === 'pending' ? 'Pending' : 'Answered'}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 rounded-xl bg-white/5 dark:bg-gray-800/5 
                                border border-purple-500/10">
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {request.text}
                  </p>
                </div>

                {request.status === 'pending' ? (
                  <div className="space-y-4">
                    <textarea
                      className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-gray-800/5 
                                border border-purple-500/20 
                                focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                                text-gray-800 dark:text-white min-h-[120px]
                                backdrop-blur-xl"
                      placeholder="Write your response..."
                      value={request.tempAnswer || ''}
                      onChange={(e) => {
                        const newRequests = [...requests]
                        const index = newRequests.findIndex(r => r.id === request.id)
                        newRequests[index] = { ...request, tempAnswer: e.target.value }
                        setRequests(newRequests)
                      }}
                    />
                    <div className="flex justify-end items-center gap-4">
                      {showSuccess === request.id && (
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: 20 }}
                          className="text-green-500 flex items-center gap-2"
                        >
                          <FiCheckCircle />
                          <span>Response sent successfully!</span>
                        </motion.div>
                      )}
                      <button
                        onClick={() => request.tempAnswer && handleAnswer(request.id, request.tempAnswer)}
                        disabled={!request.tempAnswer?.trim() || sendingResponse === request.id}
                        className="px-6 py-2 rounded-xl flex items-center gap-2
                                  bg-gradient-to-r from-purple-600 to-blue-600 
                                  text-white font-medium
                                  disabled:opacity-50 disabled:cursor-not-allowed
                                  hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                                  transition-all duration-300"
                      >
                        {sendingResponse === request.id ? (
                          <>
                            <div className="w-4 h-4 border-2 border-white border-t-transparent 
                                           rounded-full animate-spin" />
                            <span>Sending...</span>
                          </>
                        ) : (
                          <>
                            <FiSend className="text-lg" />
                            <span>Send Response</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20 backdrop-blur-xl">
                    <h4 className="font-medium mb-2 text-purple-500">Your Response</h4>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                      {request.answer}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
} 