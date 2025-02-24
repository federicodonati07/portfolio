'use client'

import { motion } from 'framer-motion'

export const GridBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-purple-500/5 to-transparent" />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1 }}
        className="absolute inset-0"
        style={{
          backgroundImage: `linear-gradient(to right, #8b5cf6 1px, transparent 1px),
                           linear-gradient(to bottom, #8b5cf6 1px, transparent 1px)`,
          backgroundSize: '4rem 4rem',
        }}
      />
    </div>
  )
} 