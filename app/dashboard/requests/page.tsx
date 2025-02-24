'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FiSend, FiArrowLeft } from 'react-icons/fi'
import Link from 'next/link'
import { format } from 'date-fns'

const PLANS = [
  {
    id: 'info',
    name: 'Richiesta informazioni'
  },
  {
    id: 'frontend',
    name: 'Sito Web'
  },
  {
    id: 'frontend_modern',
    name: 'Sito Web Avanzato'
  },
  {
    id: 'fullstack',
    name: 'Web App'
  },
  {
    id: 'fullstack_modern',
    name: 'Web App Avanzata'
  }
]

export default function AdminRequests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [planFilter, setPlanFilter] = useState('all')
  const router = useRouter()

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
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
  }

  const fetchRequests = async () => {
    try {
      console.log('Fetching requests as admin...')
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      const { data: requestsData, error: requestsError } = await supabase
        .from('request')
        .select('*')
        .order('created_at', { ascending: false })

      if (requestsError) {
        console.error('Error fetching requests:', requestsError)
        throw requestsError
      }

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

      if (!requests) {
        console.log('No data returned')
        setRequests([])
        return
      }

      console.log('Fetched requests:', requests)
      setRequests(requests)

    } catch (error) {
      console.error('Error in fetchRequests:', error)
      setRequests([])
      if (error.message?.includes('JWT')) {
        router.push('/signin')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAnswer = async (id: number, answer: string) => {
    try {
      // Aggiungi la firma alla risposta
      const signedAnswer = `${answer}\n\n---\nCordialmente,\nFederico Donati\nfederico.donati.work@gmail.com`

      const { error } = await supabase
        .from('request')
        .update({ 
          status: 'answered',
          answer: signedAnswer
        })
        .eq('id', id)

      if (error) throw error

      // Invia email all'utente
      const request = requests.find(r => r.id === id)
      await supabase.functions.invoke('sendUserNotification', {
        body: {
          userEmail: request.profiles?.email,
          answer: signedAnswer
        }
      })

      fetchRequests()
    } catch (error) {
      console.error('Error answering request:', error)
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
    <div className="p-4 sm:p-8">
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
            Torna alla Dashboard
          </span>
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 
                       dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
          Richieste {
            requests.filter(r => r.status === 'pending').length > 0 && 
            `(${requests.filter(r => r.status === 'pending').length} in attesa)`
          }
        </h2>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-sm">
            {requests.filter(r => r.status === 'pending').length} richieste da gestire
          </span>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 dark:bg-gray-800/5 
                      border border-purple-500/20 
                      focus:border-purple-500/40 focus:outline-none
                      text-gray-800 dark:text-white
                      appearance-none cursor-pointer
                      bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]
                      bg-[length:1.5em_1.5em]
                      bg-[right_0.5rem_center]
                      bg-no-repeat
                      pr-10
                      hover:border-purple-500/40
                      transition-all duration-300"
          >
            <option value="all" className="bg-white dark:bg-gray-800">📋 Tutti gli stati</option>
            <option value="pending" className="bg-white dark:bg-gray-800">⏳ In attesa</option>
            <option value="answered" className="bg-white dark:bg-gray-800">✅ Risposte</option>
          </select>
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 dark:bg-gray-800/5 
                      border border-purple-500/20 
                      focus:border-purple-500/40 focus:outline-none
                      text-gray-800 dark:text-white
                      appearance-none cursor-pointer
                      bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22%236b7280%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]
                      bg-[length:1.5em_1.5em]
                      bg-[right_0.5rem_center]
                      bg-no-repeat
                      pr-10
                      hover:border-purple-500/40
                      transition-all duration-300"
          >
            <option value="all" className="bg-white dark:bg-gray-800">🎯 Tutti i piani</option>
            <option value="info" className="bg-white dark:bg-gray-800">ℹ️ Solo informazioni</option>
            <option value="frontend" className="bg-white dark:bg-gray-800">🎨 Frontend Base</option>
            <option value="frontend_modern" className="bg-white dark:bg-gray-800">✨ Frontend Moderno</option>
            <option value="fullstack" className="bg-white dark:bg-gray-800">⚡ Fullstack Base</option>
            <option value="fullstack_modern" className="bg-white dark:bg-gray-800">🚀 Fullstack Moderno</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 
                           rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Caricamento richieste...</p>
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
              Nessuna richiesta trovata
            </h3>
            <p className="text-gray-500">
              {filter !== 'all' || planFilter !== 'all' 
                ? 'Prova a modificare i filtri di ricerca'
                : 'Non ci sono ancora richieste da gestire'}
            </p>
          </motion.div>
        ) : (
          filteredRequests.map(request => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 sm:p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                         border border-purple-500/20"
            >
              <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <h3 className="font-medium text-lg text-gray-800 dark:text-gray-200">
                        {request.profiles?.full_name || 'Nome non disponibile'}
                      </h3>
                      <p className="text-sm text-gray-500 flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                        <span className="text-purple-500">{request.profiles?.email}</span>
                        <span className="hidden sm:inline">•</span>
                        <span>{format(new Date(request.created_at), 'PPP')}</span>
                      </p>
                    </div>
                  </div>
                  <div>
                    {request.status === 'pending' && (
                      <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500">
                        Nuova richiesta
                      </span>
                    )}
                  </div>
                </div>

                <div className="h-px bg-purple-500/10" />

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Piano richiesto</h4>
                  <p className="text-gray-600 dark:text-gray-300">
                    {PLANS.find(p => p.id === request.plan)?.name}
                  </p>
                </div>

                <div className="mb-4">
                  <h4 className="font-medium mb-2">Messaggio</h4>
                  <div className="p-4 rounded-lg bg-white/5 dark:bg-gray-800/5 border border-purple-500/10">
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{request.text}</p>
                  </div>
                </div>

                {request.status === 'pending' ? (
                  <div className="mt-6">
                    <textarea
                      className="w-full px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
                                focus:border-purple-500/40 focus:outline-none
                                text-gray-800 dark:text-white min-h-[100px] mb-4"
                      placeholder="Scrivi una risposta..."
                      value={request.tempAnswer || ''}
                      onChange={(e) => {
                        const newRequests = [...requests]
                        const index = newRequests.findIndex(r => r.id === request.id)
                        newRequests[index] = { ...request, tempAnswer: e.target.value }
                        setRequests(newRequests)
                      }}
                    />
                    <button
                      onClick={() => handleAnswer(request.id, request.tempAnswer)}
                      disabled={!request.tempAnswer?.trim()}
                      className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-xl 
                                bg-gradient-to-r from-purple-600 to-blue-600 text-white
                                disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <FiSend />
                      Invia Risposta
                    </button>
                  </div>
                ) : (
                  <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20">
                    <h4 className="font-medium mb-2">La tua risposta</h4>
                    <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">{request.answer}</p>
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