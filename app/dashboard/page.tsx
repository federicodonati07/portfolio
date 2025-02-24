'use client'

import { useEffect, useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { FiUsers, FiTrash2, FiActivity, FiGithub, FiMail, FiHome, FiSearch } from 'react-icons/fi'
import Link from 'next/link'
import Chart from 'chart.js/auto'
import { format } from 'date-fns'
import { CountUp } from '@/components/CountUp'
import Image from 'next/image'

interface User {
  id: string
  email?: string | undefined
  created_at: string
  app_metadata: {
    provider?: string
  }
  user_metadata: {
    name?: string
    avatar_url?: string
  }
  identities?: {
    provider: string
  }[]
}

interface DashboardState {
  totalUsers: number
  githubUsers: number
  emailUsers: number
  lastSignups: User[]
  allUsers: User[]
  usersByDate: Record<string, number>
  searchTerm: string
  filterProvider: 'all' | 'github' | 'email'
  sortBy: 'newest' | 'oldest' | 'name'
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardState>({
    totalUsers: 0,
    githubUsers: 0,
    emailUsers: 0,
    lastSignups: [],
    allUsers: [],
    usersByDate: {},
    searchTerm: '',
    filterProvider: 'all',
    sortBy: 'newest'
  })
  const [loading, setLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null)
  const chartRef = useRef<HTMLCanvasElement>(null)
  const chartInstance = useRef<Chart | null>(null)
  const router = useRouter()
  const [hasNewRequests, setHasNewRequests] = useState(false)

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session || session.user.email !== 'federico.donati.work@gmail.com') {
        router.push('/')
        return
      }
      fetchStats()
    }
    checkAuth()
  }, [router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/users')
      const users = await response.json()

      if (!response.ok) throw new Error('Failed to fetch users')

      if (users && Array.isArray(users)) {
        console.log('Fetched users:', users)
        const githubUsers = users.filter(user => 
          user.app_metadata?.provider === 'github' || 
          user.identities?.some((id: { provider: string }) => id.provider === 'github')
        ).length
        const emailUsers = users.length - githubUsers

        // Forza un re-render completo
        setStats({
          totalUsers: 0,
          githubUsers: 0,
          emailUsers: 0,
          lastSignups: [],
          allUsers: [],
          usersByDate: {},
          searchTerm: '',
          filterProvider: 'all',
          sortBy: 'newest'
        })

        // Timeout per assicurarsi che il reset sia completato
        setTimeout(() => {
          setStats(prev => ({
            ...prev,
            totalUsers: users.length,
            githubUsers,
            emailUsers,
            lastSignups: users.slice(0, 5),
            allUsers: users,
            usersByDate: users.reduce((acc: Record<string, number>, user) => {
              const date = format(new Date(user.created_at), 'yyyy-MM-dd')
              acc[date] = (acc[date] || 0) + 1
              return acc
            }, {})
          }))
        }, 100)

        updateChart(users)
      }
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const updateChart = (users: User[]) => {
    if (!chartRef.current) return
    if (chartInstance.current) chartInstance.current.destroy()

    const ctx = chartRef.current.getContext('2d')
    if (!ctx) return

    // Ottieni gli ultimi 30 giorni
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (29 - i))
      return format(date, 'yyyy-MM-dd')
    })

    // Inizializza i dati per ogni giorno
    const usersByDate = last30Days.reduce((acc, date) => {
      acc[date] = { total: 0, github: 0, email: 0 }
      return acc
    }, {} as Record<string, { total: number, github: number, email: number }>)

    // Calcola il totale cumulativo degli utenti per ogni giorno
    users.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    let runningTotalAll = 0
    let runningTotalGithub = 0
    let runningTotalEmail = 0

    users.forEach(user => {
      const date = format(new Date(user.created_at), 'yyyy-MM-dd')
      if (usersByDate[date]) {
        const isGithubUser = user.app_metadata?.provider === 'github' || 
                            user.identities?.some(id => id.provider === 'github')
        
        if (isGithubUser) runningTotalGithub++
        else runningTotalEmail++
        runningTotalAll++

        usersByDate[date] = {
          total: runningTotalAll,
          github: runningTotalGithub,
          email: runningTotalEmail
        }
      }
    })

    // Riempi i giorni senza registrazioni con il valore precedente
    let lastValues = { total: 0, github: 0, email: 0 }
    last30Days.forEach(date => {
      if (usersByDate[date].total === 0) {
        usersByDate[date] = { ...lastValues }
      } else {
        lastValues = usersByDate[date]
      }
    })

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: last30Days.map(date => format(new Date(date), 'd MMM')),
        datasets: [
          {
            label: 'Total Users',
            data: last30Days.map(date => usersByDate[date].total),
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'GitHub Users',
            data: last30Days.map(date => usersByDate[date].github),
            borderColor: 'rgb(37, 99, 235)',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          },
          {
            label: 'Email Users',
            data: last30Days.map(date => usersByDate[date].email),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2,
            pointRadius: 4,
            pointHoverRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          intersect: false,
          mode: 'index'
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              pointStyle: 'circle',
              padding: 20,
              color: 'rgb(107, 114, 128)',
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            titleColor: '#1f2937',
            bodyColor: '#1f2937',
            borderColor: 'rgba(147, 51, 234, 0.2)',
            borderWidth: 1,
            padding: 12,
            bodyFont: {
              size: 13,
              family: "'Inter', sans-serif"
            },
            titleFont: {
              size: 14,
              family: "'Inter', sans-serif",
              weight: 'bold'
            },
            boxPadding: 6,
            callbacks: {
              title: (tooltipItems) => {
                return format(new Date(last30Days[tooltipItems[0].dataIndex]), 'dd MMMM yyyy')
              }
            }
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
              color: 'rgb(107, 114, 128)',
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              }
            }
          },
          y: {
            beginAtZero: true,
            grid: {
              color: 'rgba(147, 51, 234, 0.1)',
              drawBorder: false
            },
            ticks: {
              color: 'rgb(107, 114, 128)',
              padding: 10,
              stepSize: 1,
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              }
            }
          }
        }
      }
    })
  }

  const handleDeleteUser = async (userId: string) => {
    try {
      setDeleteLoading(userId)
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) throw new Error('Failed to delete user')

      fetchStats()
    } catch (error) {
      console.error('Error deleting user:', error)
    } finally {
      setDeleteLoading(null)
    }
  }

  const filteredUsers = stats.allUsers
    .filter(user => {
      const matchesSearch = (
        (user.user_metadata?.name || '').toLowerCase().includes(stats.searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(stats.searchTerm.toLowerCase())
      )

      const matchesProvider = stats.filterProvider === 'all' ? true :
        stats.filterProvider === 'github' ?
          (user.app_metadata?.provider === 'github' || user.identities?.some(id => id.provider === 'github')) :
          (!user.app_metadata?.provider && !user.identities?.some(id => id.provider === 'github'))

      return matchesSearch && matchesProvider
    })
    .sort((a, b) => {
      switch (stats.sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case 'name':
          return (a.user_metadata?.name || a.email || '').localeCompare(b.user_metadata?.name || b.email || '')
        default:
          return 0
      }
    })

  const checkNotifications = async () => {
    try {
      const { data: requests } = await supabase
        .from('request')
        .select('id')
        .eq('status', 'pending')

      setHasNewRequests(requests && requests.length > 0)
    } catch (error) {
      console.error('Error checking notifications:', error)
    }
  }

  useEffect(() => {
    checkNotifications()

    // Subscribe to changes
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
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black p-8">
      <Link 
        href="/"
        className="fixed top-6 left-6 p-2 rounded-xl bg-white/5 dark:bg-gray-800/5 
                  border border-purple-500/20 hover:border-purple-500/40
                  transition-all duration-300 group"
      >
        <FiHome className="text-xl text-gray-600 dark:text-gray-400 
                          group-hover:text-purple-500 dark:group-hover:text-purple-400" />
      </Link>
      
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold">Dashboard</h2>
          <Link
            href="/dashboard/requests"
            className="flex items-center gap-2 px-4 py-2 rounded-xl
                      bg-white/5 dark:bg-gray-800/5 backdrop-blur-sm
                      border border-purple-500/20 hover:border-purple-500/40
                      text-gray-600 dark:text-gray-300
                      transition-all duration-300 group"
          >
            <div className="relative">
              <FiMail className="text-lg group-hover:text-purple-500 transition-colors" />
              {hasNewRequests && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </div>
            <span className="group-hover:text-purple-500 transition-colors">
              Manage Requests
            </span>
          </Link>
        </div>

        <motion.h1
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold mb-8 bg-gradient-to-r from-purple-600 to-blue-600 
                     dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text"
        >
          Admin Dashboard
        </motion.h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                       border border-purple-500/20 hover:border-purple-500/30
                       shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <FiUsers className="text-2xl text-purple-500" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Total Users</h3>
            </div>
            <p className="text-3xl font-bold text-purple-500">
              {loading ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-block w-8 h-8 border-4 border-purple-500/20 border-t-purple-500 
                             rounded-full animate-spin"
                />
              ) : (
                <CountUp end={stats.totalUsers} key={stats.totalUsers} />
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                       border border-purple-500/20 hover:border-purple-500/30
                       shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <FiGithub className="text-2xl text-blue-500" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">GitHub Users</h3>
            </div>
            <p className="text-3xl font-bold text-blue-500">
              {loading ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-block w-8 h-8 border-4 border-blue-500/20 border-t-blue-500 
                             rounded-full animate-spin"
                />
              ) : (
                <CountUp end={stats.githubUsers} key={stats.githubUsers} duration={1.5} />
              )}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                       border border-purple-500/20 hover:border-purple-500/30
                       shadow-lg transition-all duration-300"
          >
            <div className="flex items-center gap-3 mb-4">
              <FiMail className="text-2xl text-green-500" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">Email Users</h3>
            </div>
            <p className="text-3xl font-bold text-green-500">
              {loading ? (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="inline-block w-8 h-8 border-4 border-green-500/20 border-t-green-500 
                             rounded-full animate-spin"
                />
              ) : (
                <CountUp end={stats.emailUsers} key={stats.emailUsers} duration={1.7} />
              )}
            </p>
          </motion.div>
        </div>

        {/* Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                     border border-purple-500/20 shadow-lg mb-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <FiActivity className="text-2xl text-purple-500" />
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">User Growth</h3>
          </div>
          <div className="h-[300px]">
            <canvas ref={chartRef}></canvas>
          </div>
        </motion.div>

        {/* Users Management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                     border border-purple-500/20 shadow-lg"
        >
          <div className="flex flex-col space-y-4 mb-6">
            <div className="flex items-center gap-3">
              <FiUsers className="text-2xl text-purple-500" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">User Management</h3>
            </div>
            
            {/* Controlli responsivi */}
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Search */}
              <div className="relative flex-grow">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={stats.searchTerm}
                  onChange={(e) => setStats(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="Search users..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
                            focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                            text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              <div className="flex flex-row gap-4 sm:flex-nowrap">
                {/* Filter */}
                <select
                  value={stats.filterProvider}
                  onChange={(e) => setStats(prev => ({ ...prev, filterProvider: e.target.value as 'all' | 'github' | 'email' }))}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
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
                  <option value="all" className="bg-white dark:bg-gray-800">All Users</option>
                  <option value="github" className="bg-white dark:bg-gray-800">GitHub Users</option>
                  <option value="email" className="bg-white dark:bg-gray-800">Email Users</option>
                </select>

                {/* Sort */}
                <select
                  value={stats.sortBy}
                  onChange={(e) => setStats(prev => ({ ...prev, sortBy: e.target.value as 'newest' | 'oldest' | 'name' }))}
                  className="w-full sm:w-auto px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
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
                  <option value="newest" className="bg-white dark:bg-gray-800">Newest First</option>
                  <option value="oldest" className="bg-white dark:bg-gray-800">Oldest First</option>
                  <option value="name" className="bg-white dark:bg-gray-800">By Name</option>
                </select>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Users Management Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-purple-500/30">
                <thead className="bg-purple-500/5">
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Name
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Provider
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-medium text-gray-700 dark:text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/30">
                  {filteredUsers.map((user: User) => (
                    <tr key={user.id} className="hover:bg-purple-500/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          {user.user_metadata?.avatar_url ? (
                            <Image
                              src={user.user_metadata.avatar_url}
                              alt={user.user_metadata?.name || ''}
                              width={32}
                              height={32}
                              className="rounded-full border-2 border-purple-500/30"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 
                                          flex items-center justify-center text-white text-sm font-medium">
                              {(user.user_metadata?.name?.[0] || user.email?.[0] || '?').toUpperCase()}
                            </div>
                          )}
                          <span className="text-gray-700 dark:text-gray-300">
                            {user.user_metadata?.name || user.email?.split('@')[0]}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600 dark:text-gray-400">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.app_metadata?.provider === 'github' || 
                         user.identities?.some(id => id.provider === 'github') ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                                        bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                            <FiGithub className="text-sm" />
                            GitHub
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium
                                        bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                            <FiMail className="text-sm" />
                            Email
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => handleDeleteUser(user.id)}
                          disabled={deleteLoading === user.id}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm
                                    bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300
                                    hover:bg-red-200 dark:hover:bg-red-900/50 
                                    transition-all duration-300"
                        >
                          {deleteLoading === user.id ? (
                            <div className="w-4 h-4 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <>
                              <FiTrash2 className="text-sm" />
                              Delete
                            </>
                          )}
                        </motion.button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
} 