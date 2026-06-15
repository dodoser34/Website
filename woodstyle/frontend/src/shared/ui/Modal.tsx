import { AnimatePresence, motion } from 'motion/react'
import {
  useEffect,
  useRef,
  type PropsWithChildren,
  type ReactNode,
} from 'react'

import Icon from '../../components/Icon'
import { motionDurations, motionEasings } from '../motion/motionTokens'
import { useReducedMotion } from '../motion/useReducedMotion'

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className = '',
}: PropsWithChildren<{
  open: boolean
  onClose: () => void
  title: string
  footer?: ReactNode
  className?: string
}>) {
  const panelRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key !== 'Tab' || !panelRef.current) return
      const focusable = panelRef.current.querySelectorAll<HTMLElement>(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])',
      )
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }
    document.body.classList.add('modal-open')
    document.addEventListener('keydown', onKeyDown)
    window.requestAnimationFrame(() => panelRef.current?.focus())
    return () => {
      document.body.classList.remove('modal-open')
      document.removeEventListener('keydown', onKeyDown)
      previous?.focus()
    }
  }, [onClose, open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="modal-root"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: motionDurations.fast }}
        >
          <button className="modal-overlay" onClick={onClose} aria-label="Close modal" />
          <motion.div
            ref={panelRef}
            className={`modal-panel ${className}`}
            role="dialog"
            aria-modal="true"
            aria-label={title}
            tabIndex={-1}
            initial={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: reducedMotion ? 0 : 8, scale: reducedMotion ? 1 : 0.98 }}
            transition={{ duration: motionDurations.normal, ease: motionEasings.standard }}
          >
            <header className="modal-header">
              <h2>{title}</h2>
              <button onClick={onClose} aria-label="Close"><Icon name="close" /></button>
            </header>
            <div className="modal-content">{children}</div>
            {footer && <footer className="modal-footer">{footer}</footer>}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
