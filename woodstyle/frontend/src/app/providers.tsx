import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { type PropsWithChildren, useEffect, useState } from 'react'

import { refreshAccessToken } from '../api/http'
import { api } from '../api/client'
import { ToastProvider } from '../shared/ui/ToastProvider'
import { useSessionStore } from '../store/app'

function SessionBootstrap() {
  const markReady = useSessionStore((state) => state.markReady)
  const setUser = useSessionStore((state) => state.setUser)
  useEffect(() => {
    let active = true
    const restore = async () => {
      try {
        if (!useSessionStore.getState().accessToken) await refreshAccessToken()
        const user = await api.me()
        if (active) setUser(user)
      } catch {
        // Anonymous sessions are expected and should not surface as errors.
      } finally {
        if (active) markReady()
      }
    }
    restore()
    return () => {
      active = false
    }
  }, [markReady, setUser])
  return null
}

export function AppProviders({ children }: PropsWithChildren) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      }),
  )

  return (
    <QueryClientProvider client={client}>
      <ToastProvider>
        <SessionBootstrap />
        {children}
      </ToastProvider>
    </QueryClientProvider>
  )
}
