'use client'

import dynamic from 'next/dynamic'

const MotionDiv = dynamic(() => import('framer-motion').then(mod => mod.motion.div))

interface Skill {
  name: string
  icon: string
}

const skills: Skill[] = [
  { name: "Frontend Development", icon: "🎨" },
  { name: "Backend Development", icon: "⚡" },
  { name: "Database Design", icon: "🗄️" },
  { name: "API Development", icon: "🔌" },
  { name: "UI/UX Design", icon: "✨" }
]

export function MySkills() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {skills.map((skill, index) => (
        <MotionDiv
          key={skill.name}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: index * 0.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-6 rounded-xl bg-white/10 dark:bg-gray-800/10 backdrop-blur-xl
                     border border-purple-500/20 hover:border-purple-500/30
                     transition-all duration-300"
        >
          <div className="flex items-center gap-4">
            <span className="text-3xl">{skill.icon}</span>
            <h3 className="text-lg font-medium text-gray-800 dark:text-white">
              {skill.name}
            </h3>
          </div>
        </MotionDiv>
      ))}
    </div>
  )
} 