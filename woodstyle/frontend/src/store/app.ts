import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

import { authStorage } from '../auth/authStorage'
import { isLocale } from '../i18n/config'
import type { Locale, User } from '../types'

interface PreferencesState {
  locale: Locale
  currency: string
  setLocale: (locale: Locale) => void
  setCurrency: (currency: string) => void
}

export const usePreferencesStore = create<PreferencesState>()(
  persist(
    (set) => ({
      locale: 'en',
      currency: 'USD',
      setLocale: (locale) => set({ locale }),
      setCurrency: (currency) => set({ currency }),
    }),
    {
      name: 'woodstyle-preferences',
      merge: (persistedState, currentState) => {
        const saved = persistedState as Partial<PreferencesState>
        return {
          ...currentState,
          ...saved,
          locale: isLocale(saved.locale) ? saved.locale : 'en',
          currency:
            typeof saved.currency === 'string' && /^[A-Z]{3}$/.test(saved.currency)
              ? saved.currency
              : 'USD',
        }
      },
    },
  ),
)

interface SessionState {
  accessToken: string
  refreshToken: string
  user: User | null
  ready: boolean
  setTokens: (accessToken: string, refreshToken: string) => void
  setUser: (user: User | null) => void
  markReady: () => void
  logout: () => void
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      accessToken: '',
      refreshToken: '',
      user: null,
      ready: false,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),
      markReady: () => set({ ready: true }),
      logout: () => set({ accessToken: '', refreshToken: '', user: null, ready: true }),
    }),
    {
      name: 'woodstyle-session',
      storage: createJSONStorage(() => authStorage),
      partialize: ({ accessToken, refreshToken, user }) => ({
        accessToken,
        refreshToken,
        user,
      }),
    },
  ),
)

export interface GuestCartItem {
  product_id: number
  quantity: number
}

interface GuestState {
  cart: GuestCartItem[]
  favorites: number[]
  addCart: (productId: number, quantity: number) => void
  setCartQuantity: (productId: number, quantity: number) => void
  removeCart: (productId: number) => void
  clearCart: () => void
  toggleFavorite: (productId: number) => void
  clearFavorites: () => void
}

export const useGuestStore = create<GuestState>()(
  persist(
    (set) => ({
      cart: [],
      favorites: [],
      addCart: (productId, quantity) =>
        set((state) => {
          const existing = state.cart.find((item) => item.product_id === productId)
          return {
            cart: existing
              ? state.cart.map((item) =>
                  item.product_id === productId
                    ? { ...item, quantity: Math.min(99, item.quantity + quantity) }
                    : item,
                )
              : [...state.cart, { product_id: productId, quantity }],
          }
        }),
      setCartQuantity: (productId, quantity) =>
        set((state) => ({
          cart: state.cart.map((item) =>
            item.product_id === productId ? { ...item, quantity } : item,
          ),
        })),
      removeCart: (productId) =>
        set((state) => ({
          cart: state.cart.filter((item) => item.product_id !== productId),
        })),
      clearCart: () => set({ cart: [] }),
      toggleFavorite: (productId) =>
        set((state) => ({
          favorites: state.favorites.includes(productId)
            ? state.favorites.filter((id) => id !== productId)
            : [...state.favorites, productId],
        })),
      clearFavorites: () => set({ favorites: [] }),
    }),
    { name: 'woodstyle-guest' },
  ),
)
