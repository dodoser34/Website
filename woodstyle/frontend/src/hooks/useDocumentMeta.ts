import { useEffect } from 'react'

import type { Locale } from '../types'

export function useDocumentMeta(title: string, description: string, locale: Locale) {
  useEffect(() => {
    document.title = `${title} | WoodStyle`
    document.documentElement.lang = locale
    const meta = document.querySelector<HTMLMetaElement>('meta[name="description"]')
    if (meta) meta.content = description
  }, [description, locale, title])
}
