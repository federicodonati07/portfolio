'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { FiGithub, FiMail, FiLogOut, FiPieChart, FiUser } from 'react-icons/fi'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Session } from '@supabase/supabase-js'
import Image from 'next/image'

export function ProfileMenu() {
  const [session, setSession] = useState<Session | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(true)
  const [hasNewRequests, setHasNewRequests] = useState(false)
  const router = useRouter()
  const menuRef = useRef<HTMLDivElement>(null)

  // Controlla se è mobile
  useEffect(() => {
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkIsMobile()
    window.addEventListener('resize', checkIsMobile)
    return () => window.removeEventListener('resize', checkIsMobile)
  }, [])

  // Funzione unificata per controllare le notifiche
  const checkNotifications = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      if (session.user.email === 'federico.donati.work@gmail.com') {
        // Controlla nuove richieste per l'admin
        const { data: pendingRequests } = await supabase
          .from('request')
          .select('id')
          .eq('status', 'pending')
        
        setHasNewRequests(!!(pendingRequests && pendingRequests.length > 0))
      } else {
        // Controlla nuove risposte non visualizzate per l'utente
        const { data: unreadResponses, error } = await supabase
          .from('request')
          .select('id')
          .eq('user_id', session.user.id)
          .eq('status', 'answered')
          .eq('viewed_by_user', 'false')

        if (error) {
          console.error('Error checking notifications:', error)
          return
        }

        setHasNewRequests(unreadResponses && unreadResponses.length > 0)
      }
    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }

  // Gestione autenticazione e notifiche iniziali
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        checkNotifications()
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        checkNotifications()
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  // Ascolta i cambiamenti nella tabella request
  useEffect(() => {
    if (!session) return

    // Ascolta l'evento di visualizzazione delle richieste
    const handleRequestsViewed = () => {
      checkNotifications()
    }
    window.addEventListener('requestsViewed', handleRequestsViewed)

    // Ascolta i cambiamenti nella tabella request
    const channel = supabase
      .channel('request_changes')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'request'
      }, () => {
        checkNotifications()
      })
      .subscribe()

    return () => {
      window.removeEventListener('requestsViewed', handleRequestsViewed)
      supabase.removeChannel(channel)
    }
  }, [session])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/signin')
  }

  if (!session) {
    return (
      <Link href="/signin">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          className="relative px-2 sm:px-4 py-2 rounded-xl 
                     bg-gradient-to-r from-purple-600 to-blue-600
                     text-white font-medium 
                     hover:shadow-[0_0_15px_rgba(139,92,246,0.3)]
                     transition-all duration-300 group overflow-hidden
                     after:absolute after:inset-0
                     after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent
                     after:skew-x-[-20deg] after:-translate-x-full
                     hover:after:translate-x-[200%]
                     after:transition-transform after:duration-1000 after:ease-in-out
                     min-w-[40px] sm:min-w-fit"
        >
          <span className="relative z-10 flex items-center gap-2">
            <FiUser className="w-5 h-5 sm:w-[1.35rem] sm:h-[1.35rem] group-hover:scale-110 transition-transform duration-300" />
            <span className="hidden sm:block">Sign In</span>
          </span>
        </motion.button>
      </Link>
    )
  }

  const isGithubUser = session.user.app_metadata?.provider === 'github' || 
                       session.user.identities?.some(identity => identity.provider === 'github')
  const userEmail = session.user.email
  const userName = session.user.user_metadata.name || userEmail?.split('@')[0] || 'User'
  const avatarUrl = session.user.user_metadata.avatar_url

  const isAdmin = userEmail && userEmail === process.env.NEXT_PUBLIC_ADMIN_EMAIL

  return (
    <div 
      className="relative" 
      ref={menuRef}
      onMouseEnter={() => !isMobile && setIsOpen(true)}
      onMouseLeave={() => !isMobile && setIsOpen(false)}
    >
      {isAdmin && (
        <Link href="/admin">
          <motion.button className="...">Admin Dashboard</motion.button>
        </Link>
      )}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => isMobile && setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-white/5 dark:bg-gray-800/5 
                   border border-purple-500/20 hover:border-purple-500/40
                   transition-all duration-300
                   shadow-[0_0_10px_rgba(139,92,246,0.1)]
                   hover:shadow-[0_0_15px_rgba(139,92,246,0.2)]"
      >
        {isGithubUser ? (
          <FiGithub className="text-xl text-gray-600 dark:text-gray-400" />
        ) : (
          <FiMail className="text-xl text-gray-600 dark:text-gray-400" />
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="absolute right-0 mt-4 w-72 rounded-xl 
                      bg-white/40 dark:bg-gray-800/40 
                      backdrop-blur-md border border-purple-500/30
                      shadow-[0_0_30px_rgba(139,92,246,0.1)] z-50"
          >
            <div className="p-6 backdrop-blur-md bg-white/30 dark:bg-gray-800/30 rounded-xl">
              <div className="flex items-center gap-3 mb-4">
                {avatarUrl ? (
                  <Image 
                    src={avatarUrl} 
                    alt={userName}
                    width={48}
                    height={48}
                    className="w-12 h-12 rounded-full border-2 border-purple-500/30 flex-shrink-0
                             shadow-[0_0_15px_rgba(139,92,246,0.2)]"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 
                                 flex items-center justify-center text-white font-bold flex-shrink-0
                                 shadow-[0_0_15px_rgba(139,92,246,0.2)]">
                    {userName[0].toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="font-medium text-gray-800 dark:text-white truncate">
                    {userName}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                    {userEmail}
                  </p>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 my-4" />

              {session && (
                <>
                  {session.user.email === 'federico.donati.work@gmail.com' ? (
                    <>
                      <Link
                        href="/dashboard"
                        className="w-full py-2 px-4 rounded-lg flex items-center gap-2
                                  hover:bg-purple-500/20 transition-all duration-300
                                  text-gray-600 dark:text-gray-400 group mb-2"
                      >
                        <FiPieChart className="text-lg group-hover:text-purple-500 transition-colors" />
                        <span className="group-hover:text-purple-500 transition-colors">Dashboard</span>
                      </Link>
                      <Link
                        href="/dashboard/requests"
                        className="w-full py-2 px-4 rounded-lg flex items-center gap-2
                                  hover:bg-purple-500/20 transition-all duration-300
                                  text-gray-600 dark:text-gray-400 group mb-2"
                      >
                        <div className="relative">
                          <FiMail className="text-lg group-hover:text-purple-500 transition-colors" />
                          {hasNewRequests && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
                          )}
                        </div>
                        <span className="group-hover:text-purple-500 transition-colors">Manage Requests</span>
                      </Link>
                    </>
                  ) : (
                    <Link
                      href="/requests"
                      className="w-full py-2 px-4 rounded-lg flex items-center justify-between
                                hover:bg-purple-500/20 transition-all duration-300
                                text-gray-600 dark:text-gray-400 group mb-2"
                    >
                      <div className="flex items-center gap-2">
                        <FiMail className="text-lg group-hover:text-purple-500 transition-colors" />
                        <span className="group-hover:text-purple-500 transition-colors">
                          My Requests
                        </span>
                      </div>
                      {hasNewRequests && (
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                        </span>
                      )}
                    </Link>
                  )}
                </>
              )}

              <div className="h-px bg-gradient-to-r from-purple-500/20 via-blue-500/20 to-purple-500/20 my-2" />

              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 rounded-lg flex items-center gap-2
                          hover:bg-purple-500/20 transition-all duration-300
                          text-gray-600 dark:text-gray-400 group"
              >
                <FiLogOut className="text-lg group-hover:text-purple-500 transition-colors" />
                <span className="group-hover:text-purple-500 transition-colors">Logout</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
} 