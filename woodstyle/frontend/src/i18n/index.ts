import type { Locale } from '../types'
import de from './locales/de'
import en from './locales/en'
import fr from './locales/fr'
import ja from './locales/ja'
import ru from './locales/ru'

type TranslateShape<T> =
  T extends string
    ? string
    : T extends readonly (infer Item)[]
      ? ReadonlyArray<TranslateShape<Item>>
      : T extends object
        ? { readonly [Key in keyof T]: TranslateShape<T[Key]> }
        : T

export type TranslationDictionary = TranslateShape<typeof en>

export const translations: Record<Locale, TranslationDictionary> = {
  en,
  ru,
  de,
  ja,
  fr,
}

export function getTranslations(locale: Locale): TranslationDictionary {
  return translations[locale]
}

export function interpolate(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(values[key] ?? `{${key}}`))
}
