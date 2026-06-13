import { usePreferencesStore, useSessionStore } from '../store/app'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '')

interface RequestOptions extends RequestInit {
  auth?: boolean
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = false, headers, ...init } = options
  const token = useSessionStore.getState().accessToken
  const locale = usePreferencesStore.getState().locale
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      'Accept-Language': locale,
      ...headers,
    },
  })

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const detail = Array.isArray(payload.detail)
      ? payload.detail
          .map((item: { message?: string; msg?: string }) => item.message || item.msg)
          .join(', ')
      : payload.detail
    throw new Error(detail || 'Request failed')
  }
  return payload as T
}
