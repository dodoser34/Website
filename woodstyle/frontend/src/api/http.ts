import { usePreferencesStore, useSessionStore } from '../store/app'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

export const API_ORIGIN = API_URL.replace(/\/api\/v1\/?$/, '')

interface RequestOptions extends RequestInit {
  auth?: boolean
  retryAuth?: boolean
}

interface TokenPair {
  access_token: string
  refresh_token: string
}

let refreshPromise: Promise<string> | null = null

function cookie(name: string): string {
  const prefix = `${encodeURIComponent(name)}=`
  const value = document.cookie
    .split('; ')
    .find((item) => item.startsWith(prefix))
  return value ? decodeURIComponent(value.slice(prefix.length)) : ''
}

export async function refreshAccessToken(): Promise<string> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    const refreshToken = useSessionStore.getState().refreshToken
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(cookie('woodstyle_csrf')
          ? { 'X-CSRF-Token': cookie('woodstyle_csrf') }
          : {}),
      },
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
    })
    if (!response.ok) throw new Error('Session refresh failed')
    const tokens = (await response.json()) as TokenPair
    useSessionStore.getState().setTokens(
      tokens.access_token,
      tokens.refresh_token || refreshToken,
    )
    return tokens.access_token
  })()
  try {
    return await refreshPromise
  } finally {
    refreshPromise = null
  }
}

function expireSession() {
  useSessionStore.getState().logout()
  window.dispatchEvent(new CustomEvent('woodstyle:session-expired'))
}

export async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<T> {
  const { auth = false, retryAuth = true, headers, ...init } = options
  const token = useSessionStore.getState().accessToken
  const locale = usePreferencesStore.getState().locale
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: 'include',
    headers: {
      ...(init.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(auth && token ? { Authorization: `Bearer ${token}` } : {}),
      ...(cookie('woodstyle_csrf')
        ? { 'X-CSRF-Token': cookie('woodstyle_csrf') }
        : {}),
      'Accept-Language': locale,
      ...headers,
    },
  })

  if (response.status === 401 && auth && retryAuth) {
    try {
      const nextToken = await refreshAccessToken()
      return request<T>(path, {
        ...options,
        retryAuth: false,
        headers: {
          ...headers,
          Authorization: `Bearer ${nextToken}`,
        },
      })
    } catch {
      expireSession()
    }
  }

  if (response.status === 204) return undefined as T

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    const fields = payload.fields
      ? Object.values(payload.fields as Record<string, string>).join(', ')
      : ''
    const detail = Array.isArray(payload.detail)
      ? payload.detail
          .map((item: { message?: string; msg?: string }) => item.message || item.msg)
          .join(', ')
      : payload.detail
    throw new Error(fields || detail || 'Request failed')
  }
  return payload as T
}
