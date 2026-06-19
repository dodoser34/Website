/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string
  readonly VITE_AUTH_STORAGE_MODE?: 'local' | 'cookie'
  readonly VITE_FRONTEND_ONLY?: string
  readonly VITE_BASE_PATH?: string
  readonly VITE_GOOGLE_MAPS_EMBED_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
