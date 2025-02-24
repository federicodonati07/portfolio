'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Session } from '@supabase/supabase-js'
import { Button } from '@nextui-org/react'

const PLANS = [
  {
    id: 'frontend',
    name: 'Sito Web Front-end',
    description: 'Design moderno, responsive e ottimizzato',
    startingPrice: 499
  },
  {
    id: 'frontend_modern',
    name: 'Sito Web Front-end Moderno',
    description: 'Animazioni fluide, effetti avanzati, massima interattività',
    startingPrice: 799
  },
  {
    id: 'fullstack',
    name: 'Sito Web Full-stack',
    description: 'Front-end + Back-end con database e autenticazione',
    startingPrice: 999
  },
  {
    id: 'fullstack_modern',
    name: 'Sito Web Full-stack Moderno',
    description: 'Soluzione completa con tecnologie all\'avanguardia',
    startingPrice: 1499
  }
]

export function ContactSection() {
  const [session, setSession] = useState<Session | null>(null)
  const [selectedPlan, setSelectedPlan] = useState<string>('info')
  const [text, setText] = useState('')
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

    if (!text.trim()) {
      setError('Per favore inserisci un messaggio')
      return
    }

    setLoading(true)
    setError('')

    try {
      const { error } = await supabase
        .from('request')
        .insert({
          user_id: session.user.id,
          plan: selectedPlan,
          text: text.trim()
        })

      if (error) throw error

      // Invia email all'admin
      await supabase.functions.invoke('sendAdminNotification', {
        body: {
          userEmail: session.user.email,
          userName: session.user.user_metadata.name,
          plan: selectedPlan,
          text: text.trim()
        }
      })

      setText('')
      setSelectedPlan('info')
      router.push('/requests')
    } catch (error) {
      setError('Errore durante l\'invio della richiesta')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="relative py-20 overflow-hidden" id="contact">
      <div className="container mx-auto px-4">
        <motion.h2 
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          className="text-4xl font-bold mb-16 text-center bg-gradient-to-r from-purple-600 to-blue-600 
                     dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text"
        >
          Richiedi un Preventivo
        </motion.h2>

        {!session ? (
          <div className="text-center">
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              Effettua l&apos;accesso per richiedere un preventivo
            </p>
            <Button
              size="lg"
              onClick={() => router.push('/signin')}
              className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
            >
              Accedi
            </Button>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="max-w-4xl mx-auto"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              {PLANS.map(plan => (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className={`p-6 rounded-xl cursor-pointer transition-all duration-300
                            ${selectedPlan === plan.id 
                              ? 'bg-purple-500/10 border-purple-500' 
                              : 'bg-white/5 border-purple-500/20'} 
                            border backdrop-blur-sm`}
                >
                  <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                  <p className="text-gray-600 dark:text-gray-300 mb-4">{plan.description}</p>
                  <p className="text-purple-500 font-bold">
                    A partire da €{plan.startingPrice}
                  </p>
                </div>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-gray-700 dark:text-gray-300 mb-2">
                  Il tuo messaggio
                </label>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
                            focus:border-purple-500/40 focus:outline-none
                            text-gray-800 dark:text-white min-h-[200px]"
                  placeholder="Descrivi il tuo progetto..."
                />
              </div>

              {error && (
                <p className="text-red-500">{error}</p>
              )}

              <Button
                type="submit"
                size="lg"
                isLoading={loading}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white"
              >
                {loading ? 'Invio in corso...' : 'Invia Richiesta'}
              </Button>
            </form>
          </motion.div>
        )}
      </div>
    </section>
  )
} 