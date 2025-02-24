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

    // Raggruppa gli utenti per data
    const usersByDate = users.reduce((acc: Record<string, { total: number, github: number, email: number }>, user) => {
      const date = format(new Date(user.created_at), 'yyyy-MM-dd')
      if (!acc[date]) {
        acc[date] = { total: 0, github: 0, email: 0 }
      }
      acc[date].total++
      
      const isGithubUser = user.app_metadata?.provider === 'github' || 
                          user.identities?.some(id => id.provider === 'github')
      if (isGithubUser) {
        acc[date].github++
      } else {
        acc[date].email++
      }
      return acc
    }, {})

    const dates = Object.keys(usersByDate).sort()
    const data = {
      total: dates.map(date => usersByDate[date].total),
      github: dates.map(date => usersByDate[date].github),
      email: dates.map(date => usersByDate[date].email)
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates.map(date => format(new Date(date), 'MMM d')),
        datasets: [
          {
            label: 'Total Users',
            data: data.total,
            borderColor: 'rgb(147, 51, 234)',
            backgroundColor: 'rgba(147, 51, 234, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2
          },
          {
            label: 'GitHub Users',
            data: data.github,
            borderColor: 'rgb(37, 99, 235)',
            backgroundColor: 'rgba(37, 99, 235, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2
          },
          {
            label: 'Email Users',
            data: data.email,
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.1)',
            tension: 0.4,
            fill: true,
            borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true,
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
              font: {
                size: 12,
                family: "'Inter', sans-serif"
              }
            }
          },
          tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.8)',
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
            boxPadding: 6
          }
        },
        scales: {
          x: {
            grid: {
              display: false
            },
            ticks: {
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
              display: true,
              drawOnChartArea: true
            },
            ticks: {
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
            <FiMail className="text-lg group-hover:text-purple-500 transition-colors" />
            <span className="group-hover:text-purple-500 transition-colors">
              Gestisci Richieste
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
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <FiUsers className="text-2xl text-purple-500" />
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">User Management</h3>
            </div>
            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={stats.searchTerm}
                  onChange={(e) => setStats(prev => ({ ...prev, searchTerm: e.target.value }))}
                  placeholder="Search users..."
                  className="pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
                            focus:border-purple-500/40 focus:outline-none focus:ring-2 focus:ring-purple-500/20
                            text-gray-800 dark:text-white placeholder-gray-400"
                />
              </div>

              {/* Filter */}
              <select
                value={stats.filterProvider}
                onChange={(e) => setStats(prev => ({ ...prev, filterProvider: e.target.value as 'all' | 'github' | 'email' }))}
                className="px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
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
                className="px-4 py-2 rounded-xl bg-white/5 border border-purple-500/20 
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

          <div className="space-y-4">
            {filteredUsers.map((user: User) => (
              <div
                key={user.id}
                className="p-4 rounded-lg bg-white/5 dark:bg-gray-800/5
                          border border-purple-500/10 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800 dark:text-white">
                    {user.user_metadata?.name || user.email}
                  </p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(user.created_at), 'PPP')}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-3 py-1 rounded-full text-sm ${
                    user.app_metadata?.provider === 'github'
                      ? 'bg-blue-500/10 text-blue-500'
                      : 'bg-green-500/10 text-green-500'
                  }`}>
                    {user.app_metadata?.provider || 'email'}
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDeleteUser(user.id)}
                    disabled={deleteLoading === user.id}
                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10
                              transition-colors duration-300 disabled:opacity-50"
                  >
                    {deleteLoading === user.id ? (
                      <div className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FiTrash2 className="text-lg" />
                    )}
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
} 