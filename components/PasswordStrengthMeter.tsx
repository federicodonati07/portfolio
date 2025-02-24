'use client'

import { motion } from 'framer-motion'

interface Props {
  password: string
}

export function PasswordStrengthMeter({ password }: Props) {
  const getStrength = (password: string) => {
    if (!password) return 0
    if (password.length < 6) return 1

    let strength = 0
    if (password.length >= 8) strength += 1
    if (/[A-Z]/.test(password)) strength += 1
    if (/[0-9]/.test(password)) strength += 1
    if (/[^A-Za-z0-9]/.test(password)) strength += 1

    return strength
  }

  const strength = getStrength(password)
  const strengthText = [
    'Very Weak',
    'Weak',
    'Medium',
    'Strong',
    'Very Strong'
  ]
  const strengthColor = [
    'from-red-500 to-red-400',
    'from-orange-500 to-orange-400',
    'from-yellow-500 to-yellow-400',
    'from-green-500 to-green-400',
    'from-emerald-500 to-emerald-400'
  ]

  return (
    <div className="mt-2">
      <motion.div 
        className="h-1 rounded-full bg-gray-200 dark:bg-gray-700"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${strengthColor[strength]}`}
          initial={{ width: '0%' }}
          animate={{ width: `${(strength + 1) * 20}%` }}
          transition={{ duration: 0.5 }}
        />
      </motion.div>
      <p className={`text-sm mt-1 text-${strengthColor[strength].split('-')[1]}-500`}>
        {strengthText[strength]}
      </p>
    </div>
  )
} 