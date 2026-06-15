export const motionDurations = {
  instant: 0.08,
  fast: 0.16,
  normal: 0.24,
  slow: 0.36,
  page: 0.42,
} as const

export const motionEasings = {
  standard: [0.22, 1, 0.36, 1],
  emphasized: [0.16, 1, 0.3, 1],
  exit: [0.7, 0, 0.84, 0],
} as const

export const springPresets = {
  soft: { type: 'spring', stiffness: 260, damping: 28 },
  snappy: { type: 'spring', stiffness: 420, damping: 32 },
  gentle: { type: 'spring', stiffness: 180, damping: 24 },
} as const
