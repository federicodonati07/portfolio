'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FiTrash2, FiMail, FiArrowLeft } from 'react-icons/fi'
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
}

export default function Requests() {
  const [requests, setRequests] = useState<Request[]>([])
  const [viewedRequests, setViewedRequests] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchRequests()
  }, [])

  useEffect(() => {
    const answeredRequests = requests
      .filter(r => r.status === 'answered')
      .map(r => r.id)
    setViewedRequests(prev => new Set([...prev, ...answeredRequests]))
  }, [requests])

  const fetchRequests = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/signin')
        return
      }

      const { data, error } = await supabase
        .from('request')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setRequests(data)
    } catch (error) {
      console.error('Error fetching requests:', error)
    } finally {
      setLoading(false)
    }
  }

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
              Torna alla Home
            </span>
          </Link>
        </div>

        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-blue-600 
                       dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text">
          Le tue Richieste
        </h1>

        <div className="space-y-4">
          {requests.map(request => (
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
                  {request.status === 'answered' && !viewedRequests.has(request.id) && (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full
                                   bg-purple-500/10 text-purple-500 font-medium animate-pulse">
                      <FiMail />
                      Nuova risposta
                    </span>
                  )}
                  {request.status === 'pending' && (
                    <span className="flex items-center gap-2 px-3 py-1 rounded-full
                                   bg-purple-500/10 text-purple-500 font-medium">
                      <FiMail />
                      In attesa
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

              <div className="mb-4">
                <div className="p-4 rounded-lg bg-white/5 dark:bg-gray-800/5 border border-purple-500/10">
                  <h3 className="font-medium mb-2 text-sm text-gray-500">Il tuo messaggio</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{request.text}</p>
                </div>
              </div>

              {request.answer && (
                <div className="mt-6 p-4 rounded-lg bg-purple-500/10 border border-purple-500/20
                                 relative before:absolute before:w-1 before:h-full before:-left-3 
                                 before:top-0 before:bg-gradient-to-b before:from-purple-500 before:to-blue-500">
                  <h3 className="font-medium mb-2 text-sm text-purple-500">Risposta</h3>
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">{request.answer}</p>
                </div>
              )}
            </motion.div>
          ))}

          {!loading && requests.length === 0 && (
            <p className="text-center text-gray-500">
              Non hai ancora inviato nessuna richiesta
            </p>
          )}
        </div>
      </div>
    </div>
  )
} 