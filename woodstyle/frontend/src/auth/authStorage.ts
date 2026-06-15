import type { StateStorage } from 'zustand/middleware'

export const authStorageMode =
  import.meta.env.VITE_AUTH_STORAGE_MODE || (import.meta.env.DEV ? 'local' : 'cookie')

const memory = new Map<string, string>()

export const authStorage: StateStorage = {
  getItem: (name) => {
    if (authStorageMode === 'local') return window.localStorage.getItem(name)
    return memory.get(name) ?? null
  },
  setItem: (name, value) => {
    if (authStorageMode === 'local') window.localStorage.setItem(name, value)
    else memory.set(name, value)
  },
  removeItem: (name) => {
    if (authStorageMode === 'local') window.localStorage.removeItem(name)
    else memory.delete(name)
  },
}
