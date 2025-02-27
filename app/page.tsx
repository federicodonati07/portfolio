'use client'

import { Link } from '@nextui-org/react'
import { ThemeSwitch } from '@/components/ThemeSwitch'
import { ProfileMenu } from '@/components/ProfileMenu'
import { motion } from 'framer-motion'
import { FiFolder, FiMail, FiInstagram, FiGithub } from 'react-icons/fi'
import { SiTypescript, SiReact, SiNextdotjs, SiPhp, SiMysql, SiSupabase } from 'react-icons/si'
import { GridBackground } from '@/components/GridBackground'
import { DotsBackground } from '@/components/DotsBackground'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { GiCoffeeCup } from "react-icons/gi";

export default function Home() {
  const [activeYear, setActiveYear] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const checkIfAdmin = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
        setIsAdmin(true)
        // Sottoscrivi ai cambiamenti delle richieste
        const channel = supabase
          .channel('request_changes')
          .on('postgres_changes', {
            event: '*',
            schema: 'public',
            table: 'request'
          }, () => {})
          .subscribe()

        return () => {
          supabase.removeChannel(channel)
        }
      }
    }

    checkIfAdmin()
  }, [])

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black transition-colors duration-500">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 m-2 sm:m-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between 
                        p-2 sm:p-3 rounded-xl 
                        bg-white/40 dark:bg-gray-800/40 
                        backdrop-blur-md border border-purple-500/30
                        shadow-[0_0_30px_rgba(139,92,246,0.1)]">
          {/* Logo e Nome */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-lg
                          bg-gradient-to-br from-purple-600 to-blue-600
                          text-white font-bold text-base sm:text-lg
                          shadow-[0_0_15px_rgba(139,92,246,0.3)]">
              FD
            </div>
            <span className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-purple-600 to-blue-600 
                           dark:from-purple-400 dark:to-blue-400 
                           text-transparent bg-clip-text">
              Federico Donati
            </span>
          </div>
          
          {/* Pulsanti */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link 
              href={`https://www.buymeacoffee.com/${process.env.NEXT_PUBLIC_BUYMEACOFFEE_USERNAME}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-2 sm:px-4 py-2 rounded-xl 
                         bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-500
                         hover:shadow-[0_0_15px_rgba(16,185,129,0.3)]
                         border border-emerald-400/20
                         transition-all duration-300 group
                         hover:px-5 sm:hover:px-6
                         min-w-[40px] sm:min-w-fit"
            >
              <GiCoffeeCup className="w-5 h-5 sm:w-[1.35rem] sm:h-[1.35rem] text-white group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" />
              <span className="text-white font-medium text-sm hidden sm:block">
                Buy me a coffee
              </span>
            </Link>
            <ThemeSwitch />
            <div className="w-px h-5 sm:h-6 bg-gradient-to-b from-purple-500/20 via-blue-500/20 to-purple-500/20" />
            <ProfileMenu />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-24 sm:pt-0">
        <GridBackground />
        
        {/* Animated Circles Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Mesh Gradient */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(139,92,246,0.1),rgba(30,64,175,0.05))]" />
          
          {/* Animated Blobs */}
          <div className="absolute -top-[30%] -left-[10%] w-[60%] h-[60%]
                         bg-gradient-conic from-purple-500/30 via-blue-500/30 to-purple-500/30
                         blur-3xl animate-slow-spin" />
          <div className="absolute -bottom-[30%] -right-[10%] w-[60%] h-[60%]
                         bg-gradient-conic from-blue-500/30 via-purple-500/30 to-blue-500/30
                         blur-3xl animate-slow-spin-reverse" />
          
          {/* Sparkles Effect */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1)_1px,transparent_1px)] 
                         bg-[size:20px_20px] opacity-30 animate-twinkle" />
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="container mx-auto px-4 z-10 text-center"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="mb-8 inline-block"
          >
            <div className="relative">
              <div className="relative px-6 py-2 rounded-full border border-purple-500/20 
                             bg-white/5 backdrop-blur-sm
                             sm:transform-none sm:static
                             fixed top-20 left-1/2 -translate-x-1/2 sm:translate-x-0
                             w-auto sm:w-auto
                             whitespace-nowrap">
                <span className="bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text 
                               font-semibold text-sm sm:text-lg tracking-wide
                               drop-shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                  Full-Stack Developer since 2014
                </span>
              </div>
            </div>
          </motion.div>

          <motion.h1 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl sm:text-6xl md:text-8xl font-bold mb-6 relative mt-16 sm:mt-6"
          >
            <span className="relative inline-block">
              <span className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 
                             blur-2xl rounded-3xl transform scale-110" />
              <span className="relative bg-gradient-to-r from-purple-600 to-blue-600 
                             dark:from-purple-400 dark:to-blue-400 
                             text-transparent bg-clip-text 
                             [text-shadow:0_0_30px_rgba(139,92,246,0.2)]
                             hover:[text-shadow:0_0_50px_rgba(139,92,246,0.4)]
                             transition-all duration-300">
                Federico Donati
              </span>
            </span>
          </motion.h1>

          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-xl md:text-2xl mb-12 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto"
          >
            Crafting modern web experiences with passion and precision. 
            Specializing in React, Next.js, and full-stack development.
          </motion.p>

          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="flex flex-wrap justify-center gap-4 mt-8"
          >
            <Link
              href="/projects"
              className="flex items-center gap-2 px-6 py-3 rounded-xl 
                        bg-white/10 dark:bg-gray-800/10 backdrop-blur-sm
                        border border-purple-500/20 hover:border-purple-500/40
                        text-gray-600 dark:text-gray-300
                        transition-all duration-300 group"
            >
              <FiFolder className="text-lg group-hover:text-purple-500 transition-colors" />
              <span className="group-hover:text-purple-500 transition-colors">My Projects</span>
            </Link>
            <Link
              href="/contact"
              className="flex items-center gap-2 px-6 py-3 rounded-xl 
                        bg-gradient-to-r from-purple-600 to-blue-600
                        text-white font-medium
                        hover:shadow-[0_0_30px_rgba(139,92,246,0.3)]
                        transition-all duration-300"
            >
              <FiMail className="text-lg" />
              <span>Contact me</span>
            </Link>
          </motion.div>

          {/* Tech Stack Pills */}
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-4"
          >
            {[
              { 
                icon: SiTypescript, 
                text: 'TypeScript', 
                color: 'text-blue-500',
                year: '2021',
                description: 'Type safety & best practices'
              },
              { 
                icon: SiReact, 
                text: 'React', 
                color: 'text-blue-400',
                year: '2020',
                description: 'Modern frontend & components'
              },
              { 
                icon: SiNextdotjs, 
                text: 'Next.js', 
                color: 'text-gray-800 dark:text-white',
                year: '2022',
                description: 'Full-stack React framework'
              },
              { 
                icon: SiSupabase, 
                text: 'Supabase', 
                color: 'text-green-500',
                year: '2023',
                description: 'Database as a Service & Cybersecurity'
              }
            ].map((tech, i) => (
              <motion.button
                key={tech.text}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 + i * 0.1 }}
                onClick={() => {
                  const element = document.querySelector(`[data-year="${tech.year}"]`)
                  if (element) {
                    setActiveYear(tech.year)
                    element.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'center'
                    })
                  }
                }}
                className={`px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm
                          border border-purple-500/20 flex items-center gap-2
                          hover:border-purple-500/40 hover:scale-105
                          active:scale-95 transition-all duration-300
                          cursor-pointer
                          ${activeYear === tech.year ? 'border-purple-500 bg-purple-500/10' : ''}`}
              >
                <tech.icon className={`text-xl ${tech.color}`} />
                <span className="text-gray-600 dark:text-gray-300">{tech.text}</span>
              </motion.button>
            ))}
          </motion.div>
        </motion.div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
        >
          <div className="w-6 h-10 rounded-full border-2 border-purple-500/20 flex justify-center p-2">
            <motion.div
              animate={{ 
                y: [0, 12, 0],
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-1 h-1 rounded-full bg-purple-500"
            />
          </div>
        </motion.div>
      </section>

      {/* Skills Section */}
      <section className="relative py-20 bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm transition-colors duration-500 overflow-hidden">
        <DotsBackground />
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold mb-20 text-center bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text"
          >
            My Skills
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            {/* Frontend Card */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="group relative p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm 
                         shadow-lg hover:shadow-purple-500/20 transition-all duration-500 
                         border border-purple-500/10 hover:border-purple-500/30 overflow-hidden
                         md:initial-x-[-100] md:animate-x-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex gap-3 mb-4 group-hover:translate-x-2 transition-transform duration-500">
                  <SiTypescript className="text-2xl text-blue-500" />
                  <SiReact className="text-2xl text-blue-400" />
                  <SiNextdotjs className="text-2xl text-gray-800 dark:text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                  Frontend Development
                </h3>
                <div className="text-gray-600 dark:text-gray-300">
                  Development of modern and reactive interfaces with React, Next.js, and TypeScript
                </div>
              </div>
            </motion.div>

            {/* Backend Card */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.2 }}
              className="group relative p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm 
                         shadow-lg hover:shadow-purple-500/20 transition-all duration-500 
                         border border-purple-500/10 hover:border-purple-500/30 overflow-hidden
                         md:initial-y-[100] md:animate-y-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex gap-3 mb-4 group-hover:translate-x-2 transition-transform duration-500">
                  <SiPhp className="text-2xl text-purple-500" />
                  <SiMysql className="text-2xl text-blue-500" />
                  <SiSupabase className="text-2xl text-green-500" />
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                  Backend Development
                </h3>
                <div className="text-gray-600 dark:text-gray-300">
                  Creation of robust APIs and database management with PHP, MySQL, and Supabase
                </div>
              </div>
            </motion.div>

            {/* Early Starter Card */}
            <motion.div 
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
              className="group relative p-6 rounded-xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm 
                         shadow-lg hover:shadow-purple-500/20 transition-all duration-500 
                         border border-purple-500/10 hover:border-purple-500/30 overflow-hidden
                         md:initial-x-[100] md:animate-x-0"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10">
                <div className="flex gap-3 mb-4 group-hover:translate-x-2 transition-transform duration-500">
                  <span className="text-2xl">🚀</span>
                </div>
                <h3 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white group-hover:text-purple-500 dark:group-hover:text-purple-400 transition-colors">
                  Early Starter
                </h3>
                <div className="text-gray-600 dark:text-gray-300">
                  Started programming at the age of 10, developing a strong passion for coding and technology
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section id="journey" className="relative py-20 overflow-hidden">
        <GridBackground />
        <div className="container mx-auto px-4">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-4xl font-bold mb-16 text-center bg-gradient-to-r from-purple-600 to-blue-600 dark:from-purple-400 dark:to-blue-400 text-transparent bg-clip-text"
          >
            My Journey
          </motion.h2>
          
          <div className="relative max-w-5xl mx-auto">
            {/* Timeline line */}
            <div className="absolute left-[50%] top-0 bottom-0 w-px overflow-hidden">
              <motion.div
                initial={{ scaleY: 0 }}
                whileInView={{ scaleY: 1 }}
                transition={{ duration: 1 }}
                className="h-full w-full origin-top bg-gradient-to-b 
                          from-transparent from-5% via-purple-500 via-20% to-purple-500 to-95%
                          after:absolute after:inset-0 after:bg-gradient-to-b 
                          after:from-purple-500 after:from-95% after:to-transparent
                          before:absolute before:inset-0 before:bg-gradient-to-b 
                          before:from-transparent before:from-5% before:via-blue-500 before:via-20% before:to-blue-500 before:to-95%
                          before:opacity-50"
              />
            </div>

            {/* Timeline items */}
            {[
              { year: '2014', tech: 'Batch', description: 'First steps into programming', icon: '🚀' },
              { year: '2015', tech: 'HTML & CSS', description: 'Web development foundations', icon: '🎨' },
              { year: '2016', tech: 'JavaScript', description: 'Web programming introduction', icon: '⚡' },
              { year: '2017', tech: 'PHP & MySQL', description: 'Backend & database development', icon: '🔧' },
              { year: '2020', tech: 'React', description: 'Modern frontend & components', icon: '⚛️' },
              { year: '2021', tech: 'TypeScript', description: 'Type safety & best practices', icon: '📘' },
              { year: '2022', tech: 'Next.js', description: 'Full-stack React framework', icon: '▲' },
              { year: '2023', tech: 'Supabase & Security', description: 'Database as a Service & Cybersecurity', icon: '🛡️' }
            ].map((item, index) => (
              <div 
                key={item.tech} 
                className="relative mb-12"
                data-year={item.year}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  className={`flex items-center gap-8 ${index % 2 === 0 ? 'flex-row-reverse' : ''}`}
                >
                  {/* Card */}
                  <div className={`w-[calc(50%-2rem)] ${index % 2 === 0 ? 'ml-auto' : 'mr-auto'}`}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      animate={{
                        scale: activeYear === item.year ? 1.05 : 1,
                        borderColor: activeYear === item.year ? 'rgba(139, 92, 246, 0.5)' : 'rgba(139, 92, 246, 0.2)',
                        backgroundColor: activeYear === item.year ? 'rgba(139, 92, 246, 0.1)' : 'rgba(255, 255, 255, 0.1)'
                      }}
                      transition={{ duration: 0.3 }}
                      className="group relative p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                                border border-purple-500/20 hover:border-purple-500/40
                                shadow-[0_0_15px_rgba(139,92,246,0.1)]
                                hover:shadow-[0_0_30px_rgba(139,92,246,0.2)]
                                transition-all duration-300"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <span className="text-2xl group-hover:scale-125 transition-transform duration-300">
                          {item.icon}
                        </span>
                        <span className="text-sm font-mono font-bold bg-gradient-to-r from-purple-500 to-blue-500 text-transparent bg-clip-text">
                          {item.year}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2 
                                   group-hover:text-purple-500 dark:group-hover:text-purple-400 
                                   transition-colors duration-300">
                        {item.tech}
                      </h3>
                      <div className="text-gray-600 dark:text-gray-300">
                        {item.description}
                      </div>
                    </motion.div>
                  </div>

                  {/* Timeline dot */}
                  <div className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 
                                shadow-[0_0_10px_rgba(139,92,246,0.5)]"
                    />
                  </div>
                </motion.div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer moderno e intuitivo */}
      <footer className="mt-32 border-t border-purple-500/20">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Logo e Descrizione */}
            <div className="space-y-4">
              <Link href="/" className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
                Federico Donati
              </Link>
              <p className="text-gray-600 dark:text-gray-400 max-w-md">
                Full-Stack Developer specialized in modern web development, with a focus on React, Next.js, and TypeScript.
              </p>
            </div>

            {/* Quick Links nel Footer */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
                Quick Links
              </h3>
              <div className="flex flex-col space-y-2">
                {/* Manage/My Requests link */}
                {isAdmin ? (
                  <Link
                    href="/dashboard/requests"
                    className="text-gray-600 dark:text-gray-400 hover:text-purple-500 
                             dark:hover:text-purple-400 transition-colors"
                  >
                    Manage Requests
                  </Link>
                ) : (
                  <Link
                    href="/requests"
                    className="text-gray-600 dark:text-gray-400 hover:text-purple-500 
                             dark:hover:text-purple-400 transition-colors"
                  >
                    My Requests
                  </Link>
                )}

                {/* Contact Me link */}
                <Link
                  href="/contact"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-500 
                           dark:hover:text-purple-400 transition-colors"
                >
                  Contact Me
                </Link>

                {/* Roadmap button */}
                <button 
                  onClick={() => {
                    document.querySelector('#journey')?.scrollIntoView({ 
                      behavior: 'smooth',
                      block: 'start'
                    })
                  }}
                  className="text-left text-gray-600 dark:text-gray-400 hover:text-purple-500 
                            dark:hover:text-purple-400 transition-colors"
                >
                  Roadmap
                </button>
              </div>
            </div>

            {/* Social e Contatti */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Connect With Us</h3>
              <div className="flex flex-col space-y-2">
                <a 
                  href="https://github.com/federicodonati07"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 
                           dark:hover:text-purple-400 transition-colors group"
                >
                  <FiGithub className="text-xl group-hover:scale-110 transition-transform" />
                  <span>GitHub</span>
                </a>
                <a 
                  href="https://www.instagram.com/_federicodonati_/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 
                           dark:hover:text-purple-400 transition-colors group"
                >
                  <FiInstagram className="text-xl group-hover:scale-110 transition-transform" />
                  <span>Instagram</span>
                </a>
                <a 
                  href="mailto:federico.donati.work@gmail.com"
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-purple-500 
                           dark:hover:text-purple-400 transition-colors group"
                >
                  <FiMail className="text-xl group-hover:scale-110 transition-transform" />
                  <span>federico.donati.work@gmail.com</span>
                </a>
              </div>
            </div>
          </div>

          {/* Copyright e Credits */}
          <div className="mt-12 pt-8 border-t border-purple-500/20">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                © {new Date().getFullYear()} Federico Donati. All rights reserved.
              </p>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 dark:text-gray-500 text-sm">Made with</span>
                <span className="text-red-500">❤</span>
                <span className="text-gray-400 dark:text-gray-500 text-sm">by</span>
                <a 
                  href="https://github.com/federicodonati07"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 dark:text-gray-400 hover:text-purple-500 dark:hover:text-purple-400 
                           transition-colors text-sm font-medium"
                >
                  Federico Donati
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
