'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FiTrash2, FiMail, FiArrowLeft, FiEdit, FiChevronDown } from 'react-icons/fi'
import { format } from 'date-fns'
import Link from 'next/link'

const PLANS = {
  info: { name: 'Richiesta informazioni' },
  frontend: { name: 'Sito Web' },
  frontend_modern: { name: 'Sito Web Avanzato' },
  fullstack: { name: 'Web App' },
  fullstack_modern: { name: 'Web App Avanzata' }
}

interface Request {
  id: number
  created_at: string
  user_id: string
  status: 'pending' | 'answered' | 'closed'
  answer: string | null
  plan: string
  text: string
  viewed_by_user: string // "true" o "false"
  isExpanded?: boolean
}

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [expandedRequests, setExpandedRequests] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const fetchRequests = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      const { data, error } = await supabase
        .from('request')
        .select('*')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data || [])
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    fetchRequests()

    const channel = supabase
      .channel('request_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'request'
      }, () => {
        fetchRequests()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchRequests])

  const toggleResponse = async (requestId: number) => {
    try {
      const request = requests.find(r => r.id === requestId)
      if (!request) return

      // Se stiamo aprendo una risposta non ancora visualizzata
      if (!expandedRequests.has(requestId) && 
          request.status === 'answered' && 
          request.viewed_by_user === "false") {
        
        console.log('Updating request:', requestId)

        const { error } = await supabase
          .from('request')
          .update({
            viewed_by_user: "true"  // Usiamo "true" invece di null
          })
          .eq('id', requestId)

        if (error) {
          console.error('Error updating viewed status:', error)
          return
        }

        console.log('Database updated successfully')

        setRequests(prev => 
          prev.map(req => 
            req.id === requestId 
              ? { ...req, viewed_by_user: "true" }  // Aggiorniamo anche qui
              : req
          )
        )

        window.dispatchEvent(new Event('requestsViewed'))
      }

      setExpandedRequests(prev => {
        const newSet = new Set(prev)
        if (newSet.has(requestId)) {
          newSet.delete(requestId)
        } else {
          newSet.add(requestId)
        }
        return newSet
      })

    } catch (error) {
      console.error('Error in toggleResponse:', error)
    }
  }

  // Helper per verificare se una richiesta non è stata vista
  const isRequestUnviewed = (request: Request) => 
    request.status === 'answered' && request.viewed_by_user === "false"

  const handleDelete = async (id: number) => {
    try {
      const { error } = await supabase
        .from('request')
        .delete()
        .eq('id', id)

      if (error) throw error
      fetchRequests()
    } catch (error) {
      console.error('Error deleting request:', error)
    }
  }

  // Aggiungi useMemo per l'ordinamento delle richieste
  const sortedRequests = useMemo(() => {
    return [...requests].sort((a, b) => {
      // Prima controlla se ci sono risposte non lette
      const aUnread = a.status === 'answered' && a.viewed_by_user === 'false'
      const bUnread = b.status === 'answered' && b.viewed_by_user === 'false'
      
      if (aUnread && !bUnread) return -1
      if (!aUnread && bUnread) return 1
      
      // Se entrambe sono lette o non lette, ordina per data di creazione (più recenti prima)
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
  }, [requests])

  return (
    <div className="h-screen flex flex-col py-20 px-4">
      <div className="flex-none mb-8">
        <div className="container mx-auto max-w-4xl">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl 
                          bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm
                          border border-purple-500/20 hover:border-purple-500/40
                          text-gray-600 dark:text-gray-300
                          transition-all duration-300 group mb-4 sm:mb-0"
              >
                <FiArrowLeft className="text-lg group-hover:text-purple-500 transition-colors" />
                <span className="group-hover:text-purple-500 transition-colors">
                  Back to Home
                </span>
              </Link>
            </div>

            <Link
              href="/contact"
              className="px-6 py-2 rounded-xl flex items-center gap-2
                        bg-gradient-to-r from-purple-600 to-blue-600 
                        text-white font-medium
                        hover:shadow-[0_0_20px_rgba(139,92,246,0.3)]
                        transition-all duration-300"
            >
              <FiEdit className="text-lg" />
              <span>Compose Request</span>
            </Link>
          </div>
          <h1 className="text-4xl font-bold mt-8 bg-gradient-to-r from-purple-600 to-blue-600 
                         dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
            My Requests
          </h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto min-h-0">
        <div className="container mx-auto max-w-4xl space-y-4 pr-2">
          {sortedRequests.map(request => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="group p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                         border border-purple-500/20 hover:border-purple-500/30
                         transition-all duration-300
                         hover:shadow-[0_0_30px_rgba(139,92,246,0.1)]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    request.status === 'pending' ? 'bg-yellow-500' :
                    request.status === 'answered' ? 'bg-green-500' : 'bg-purple-500'
                  }`} />
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                      {request.text.split('\n')[0]}
                    </span>
                    <span className="hidden sm:inline text-sm text-gray-500">•</span>
                    <span className="text-sm text-gray-500">
                      {format(new Date(request.created_at), 'PPP')}
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                  {isRequestUnviewed(request) && (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full
                                   bg-purple-500/10 text-purple-500 font-medium animate-pulse">
                      <FiMail />
                      New response
                    </span>
                  )}
                  {request.status === 'pending' && (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full
                                    bg-yellow-500/10 text-yellow-500 font-medium animate-pulse">
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-yellow-500"></span>
                      </span>
                      Pending
                    </span>
                  )}
                  {request.status === 'pending' && (
                    <button
                      onClick={() => handleDelete(request.id)}
                      className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg 
                                transition-colors sm:opacity-0 group-hover:opacity-100"
                    >
                      <FiTrash2 />
                    </button>
                  )}
                </div>
              </div>

              <div className="mb-4 overflow-hidden">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{
                    request.plan === 'info' ? 'ℹ️' :
                    request.plan === 'frontend' ? '🎨' :
                    request.plan === 'frontend_modern' ? '✨' :
                    request.plan === 'fullstack' ? '⚡' : '🚀'
                  }</span>
                  <h3 className="font-medium text-lg truncate">
                    {PLANS[request.plan as keyof typeof PLANS].name}
                  </h3>
                </div>
              </div>

              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-white/5 dark:bg-gray-800/5 border border-purple-500/10">
                  <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                    {request.text}
                  </p>
                </div>

                {request.status === 'answered' && (
                  <>
                    <button
                      onClick={() => toggleResponse(request.id)}
                      className="w-full p-4 rounded-xl bg-purple-500/10 border border-purple-500/20
                                flex items-center justify-between
                                hover:bg-purple-500/20 transition-all duration-300"
                    >
                      <h4 className="font-medium text-purple-500">Response</h4>
                      {isRequestUnviewed(request) && (
                        <span className="px-2 py-1 rounded-full text-xs font-medium
                                       bg-red-500/10 text-red-500 border border-red-500/20">
                          New
                        </span>
                      )}
                      <FiChevronDown 
                        className={`text-purple-500 transition-transform duration-300
                                  ${expandedRequests.has(request.id) ? 'rotate-180' : ''}`}
                      />
                    </button>
                    
                    {expandedRequests.has(request.id) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="p-4 rounded-xl bg-purple-500/10 border border-purple-500/20"
                      >
                        <p className="text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
                          {request.answer}
                        </p>
                      </motion.div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          ))}

          {!loading && requests.length === 0 && (
            <p className="text-center text-gray-500">
              You haven&apos;t sent any requests yet
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 