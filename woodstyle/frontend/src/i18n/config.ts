import type { Locale } from '../types'

export const localeOptions = [
  { code: 'en', shortLabel: 'EN', name: 'English', intlLocale: 'en-US' },
  { code: 'ru', shortLabel: 'RU', name: 'Русский', intlLocale: 'ru-RU' },
  { code: 'de', shortLabel: 'DE', name: 'Deutsch', intlLocale: 'de-DE' },
  { code: 'ja', shortLabel: 'JA', name: '日本語', intlLocale: 'ja-JP' },
  { code: 'fr', shortLabel: 'FR', name: 'Français', intlLocale: 'fr-FR' },
] as const satisfies ReadonlyArray<{
  code: Locale
  shortLabel: string
  name: string
  intlLocale: string
}>

export const supportedLocales = localeOptions.map(({ code }) => code)

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && supportedLocales.includes(value as Locale)
}

export function intlLocaleFor(locale: Locale): string {
  return localeOptions.find((option) => option.code === locale)?.intlLocale ?? 'en-US'
}
