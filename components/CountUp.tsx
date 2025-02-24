'use client'

import { useEffect, useState } from 'react'
import { motion, animate } from 'framer-motion'

interface CountUpProps {
  end: number
  duration?: number
}

export function CountUp({ end = 0, duration = 2 }: CountUpProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    if (typeof end === 'number' && !isNaN(end)) {
      const controls = animate(0, end, {
        duration,
        onUpdate: (value) => {
          setDisplayValue(Math.round(value))
        },
        ease: "easeOut"
      })

      return () => controls.stop()
    }
  }, [end, duration])

  return (
    <motion.span
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {displayValue}
    </motion.span>
  )
} 