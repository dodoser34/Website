import { beforeEach, describe, expect, it, vi } from 'vitest'


const values = new Map<string, string>()
const localStorageMock = {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
}

describe('authenticated HTTP client', () => {
  beforeEach(() => {
    values.clear()
    vi.restoreAllMocks()
    vi.stubGlobal('window', {
      localStorage: localStorageMock,
      dispatchEvent: vi.fn(),
    })
    vi.stubGlobal('document', { cookie: '' })
  })

  it('refreshes an expired access token and retries once', async () => {
    const { useSessionStore } = await import('../store/app')
    const { request } = await import('./http')
    useSessionStore.getState().setTokens('expired-access', 'refresh-token')

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response('{}', { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            access_token: 'new-access',
            refresh_token: 'new-refresh',
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ id: 1 }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    vi.stubGlobal('fetch', fetchMock)

    await expect(request<{ id: number }>('/me', { auth: true })).resolves.toEqual({
      id: 1,
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
    expect(useSessionStore.getState().accessToken).toBe('new-access')
  })
})
