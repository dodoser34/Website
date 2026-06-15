import { AnimatePresence, motion } from 'motion/react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type PropsWithChildren,
} from 'react'

import Icon from '../../components/Icon'
import { usePreferencesStore } from '../../store/app'
import { motionDurations, motionEasings } from '../motion/motionTokens'
import { useReducedMotion } from '../motion/useReducedMotion'

export type ToastTone = 'success' | 'error' | 'warning' | 'info' | 'loading'

interface ToastItem {
  id: string
  message: string
  tone: ToastTone
}

interface ToastContextValue {
  push: (message: string, tone?: ToastTone, duration?: number) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([])
  const locale = usePreferencesStore((state) => state.locale)
  const reducedMotion = useReducedMotion()
  const dismiss = useCallback((id: string) => {
    setItems((current) => current.filter((item) => item.id !== id))
  }, [])
  const push = useCallback((message: string, tone: ToastTone = 'info', duration = 3600) => {
    const id = crypto.randomUUID()
    setItems((current) => [...current.slice(-3), { id, message, tone }])
    if (tone !== 'loading' && duration > 0) {
      window.setTimeout(() => dismiss(id), duration)
    }
    return id
  }, [dismiss])

  useEffect(() => {
    const listener = () => {
      const messages = {
        en: 'Your session expired. Please sign in again.',
        ru: 'Сессия истекла. Войдите снова.',
        de: 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.',
        ja: 'セッションの有効期限が切れました。もう一度ログインしてください。',
        fr: 'Votre session a expiré. Veuillez vous reconnecter.',
      }
      push(messages[locale], 'warning', 5000)
    }
    window.addEventListener('woodstyle:session-expired', listener)
    return () => window.removeEventListener('woodstyle:session-expired', listener)
  }, [locale, push])

  const value = useMemo(() => ({ push, dismiss }), [dismiss, push])
  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="toast-viewport" aria-live="polite" aria-atomic="false">
        <AnimatePresence initial={false}>
          {items.map((item) => (
            <motion.div
              className={`app-toast app-toast-${item.tone}`}
              key={item.id}
              initial={{ opacity: 0, y: reducedMotion ? 0 : -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: reducedMotion ? 0 : -8, scale: 0.98 }}
              transition={{
                duration: reducedMotion
                  ? motionDurations.instant
                  : motionDurations.fast,
                ease: motionEasings.standard,
              }}
              role={item.tone === 'error' ? 'alert' : 'status'}
            >
              <span className="app-toast-icon">
                <Icon
                  name={
                    item.tone === 'success'
                      ? 'check'
                      : item.tone === 'error'
                        ? 'close'
                        : item.tone === 'warning'
                          ? 'shield'
                          : 'sparkles'
                  }
                  size={18}
                />
              </span>
              <span>{item.message}</span>
              <button onClick={() => dismiss(item.id)} aria-label="Close notification">
                <Icon name="close" size={16} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) throw new Error('useToast must be used inside ToastProvider')
  return context
}
