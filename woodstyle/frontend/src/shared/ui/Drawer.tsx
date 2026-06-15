import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, type PropsWithChildren } from 'react'

import Icon from '../../components/Icon'
import { motionDurations, motionEasings } from '../motion/motionTokens'
import { useReducedMotion } from '../motion/useReducedMotion'

export function Drawer({
  open,
  onClose,
  title,
  children,
}: PropsWithChildren<{
  open: boolean
  onClose: () => void
  title: string
}>) {
  const panelRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.body.classList.add('modal-open')
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="drawer-root" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <button className="drawer-overlay" onClick={onClose} aria-label="Close drawer" />
          <motion.aside
            ref={panelRef}
            className="drawer-panel"
            role="dialog"
            aria-modal="true"
            aria-label={title}
            initial={{ x: reducedMotion ? 0 : '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: reducedMotion ? 0 : '100%', opacity: 0 }}
            transition={{ duration: motionDurations.slow, ease: motionEasings.standard }}
          >
            <span className="drawer-handle" />
            <header><h2>{title}</h2><button onClick={onClose}><Icon name="close" /></button></header>
            <div className="drawer-content">{children}</div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
