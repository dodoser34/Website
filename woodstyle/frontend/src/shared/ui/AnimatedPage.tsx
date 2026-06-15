import { motion } from 'motion/react'
import type { PropsWithChildren } from 'react'

import { motionDurations, motionEasings } from '../motion/motionTokens'
import { useReducedMotion } from '../motion/useReducedMotion'

export function AnimatedPage({ children }: PropsWithChildren) {
  const reducedMotion = useReducedMotion()
  return (
    <motion.div
      className="route-page"
      initial={{ opacity: 0, y: reducedMotion ? 0 : 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: reducedMotion ? 0 : -6 }}
      transition={{
        duration: reducedMotion ? motionDurations.instant : motionDurations.normal,
        ease: motionEasings.standard,
      }}
    >
      {children}
    </motion.div>
  )
}
