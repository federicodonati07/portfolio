'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
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
  const [answers, setAnswers] = useState<Record<number, string>>({})

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

  const handleSendResponse = async (requestId: number) => {
    try {
      setSendingResponse(requestId)
      const answer = answers[requestId]
      if (!answer) return

      // Aggiungi la firma alla risposta
      const answerWithSignature = `${answer}\n\n---\nBest regards,\nFederico Donati\nfederico.donati.work@gmail.com`

      const { error } = await supabase
        .from('request')
        .update({
          answer: answerWithSignature,
          status: 'answered',
          viewed_by_user: 'false'
        })
        .eq('id', requestId)

      if (error) throw error

      // Rimuovi la risposta dal form
      setAnswers(prev => {
        const newAnswers = { ...prev }
        delete newAnswers[requestId]
        return newAnswers
      })

      // Aggiorna lo stato locale delle richieste
      setRequests(prev => prev.map(req => 
        req.id === requestId 
          ? { ...req, answer: answerWithSignature, status: 'answered', viewed_by_user: 'false' }
          : req
      ))

      // Mostra un messaggio di successo temporaneo
      setShowSuccess(requestId)
      setTimeout(() => setShowSuccess(null), 2000)

      // Forza un refresh delle richieste dal database
      fetchRequests()

    } catch (error) {
      console.error('Error sending response:', error)
    } finally {
      setSendingResponse(null)
    }
  }

  // Aggiungi una funzione per filtrare e ordinare le richieste
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      // Prima le richieste pending
      if (a.status === 'pending' && b.status !== 'pending') return -1
      if (a.status !== 'pending' && b.status === 'pending') return 1
      
      // Poi ordina per data, le più recenti prima
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [requests])

  const filteredRequests = sortedRequests
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
          <div className="flex-grow overflow-y-auto space-y-4">
            {/* Sezione richieste pending */}
            <div className="space-y-4">
              {filteredRequests.map(request => (
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

                      {request.status === 'pending' ? (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                                       bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 
                                       font-medium">
                          <span className="flex h-2 w-2 relative">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                          </span>
                          Pending
                        </div>
                      ) : (
                        <div className="px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-2
                                       bg-green-500/10 text-green-500 border border-green-500/20">
                          <span>✅</span>
                          Answered
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="p-4 rounded-xl bg-white/5 dark:bg-gray-800/5 backdrop-blur-xl
                                    border border-purple-500/10">
                      <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                        {request.text}
                      </p>
                    </div>

                    {request.status === 'pending' && (
                      <div className="space-y-4">
                        <textarea
                          value={answers[request.id] || ''}
                          onChange={(e) => setAnswers(prev => ({
                            ...prev,
                            [request.id]: e.target.value
                          }))}
                          placeholder="Write your response..."
                          className="w-full px-4 py-3 rounded-xl bg-white/5 dark:bg-gray-800/5 
                                    border border-purple-500/20 
                                    focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                                    text-gray-800 dark:text-white min-h-[120px]
                                    backdrop-blur-xl"
                          rows={4}
                        />
                        <button
                          onClick={() => handleSendResponse(request.id)}
                          disabled={!answers[request.id] || sendingResponse === request.id}
                          className="px-6 py-2 rounded-xl flex items-center gap-2
                                    bg-gradient-to-r from-purple-600 to-blue-600 
                                    text-white font-medium
                                    disabled:opacity-50 disabled:cursor-not-allowed
                                    hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                                    transition-all duration-300"
                        >
                          <FiSend className="text-lg" />
                          {sendingResponse === request.id ? 'Sending...' : 'Send Response'}
                        </button>
                      </div>
                    )}

                    {showSuccess === request.id && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2 text-green-500 font-medium flex items-center gap-2"
                      >
                        <FiCheckCircle />
                        Response sent successfully!
                      </motion.div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 