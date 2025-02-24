'use client'

import { motion } from 'framer-motion'

export const DotsBackground = () => {
  return (
    <div className="absolute inset-0 -z-10 overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.3 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 
                    [background-image:linear-gradient(45deg,rgba(139,92,246,0.1)_25%,transparent_25%),
                                     linear-gradient(-45deg,rgba(139,92,246,0.1)_25%,transparent_25%),
                                     linear-gradient(45deg,transparent_75%,rgba(139,92,246,0.1)_75%),
                                     linear-gradient(-45deg,transparent_75%,rgba(139,92,246,0.1)_75%)]
                    [background-size:20px_20px]
                    [background-position:0_0,0_10px,10px_-10px,-10px_0px]"
      />
    </div>
  )
} 