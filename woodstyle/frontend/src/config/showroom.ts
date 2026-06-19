import type { CountryOption, Locale, ShowroomConfig } from '../types'
import { getTranslations } from '../i18n'

const defaultEmbed =
  'https://www.google.com/maps?q=Astana%2C%20Kazakhstan&output=embed'

export function showroom(locale: Locale): ShowroomConfig {
  const copy = getTranslations(locale).contacts
  const country = countries.find(({ code }) => code === 'KZ')?.name[locale] || 'Kazakhstan'
  return {
    name: copy.officeName,
    address: `Astana, 010000, ${country}`,
    phone: '+7 7172 55 01 74',
    email: 'info@woodstyle.com',
    mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Astana+Kazakhstan',
    embedUrl: import.meta.env.VITE_GOOGLE_MAPS_EMBED_URL || defaultEmbed,
    hours: copy.hoursRows.map((row) => ({ ...row })),
  }
}

export const countries: CountryOption[] = [
  { code: 'US', name: { en: 'United States', ru: 'США', de: 'Vereinigte Staaten', ja: 'アメリカ合衆国', fr: 'États-Unis' }, dialCode: '+1' },
  { code: 'CA', name: { en: 'Canada', ru: 'Канада', de: 'Kanada', ja: 'カナダ', fr: 'Canada' }, dialCode: '+1' },
  { code: 'GB', name: { en: 'United Kingdom', ru: 'Великобритания', de: 'Vereinigtes Königreich', ja: 'イギリス', fr: 'Royaume-Uni' }, dialCode: '+44' },
  { code: 'DE', name: { en: 'Germany', ru: 'Германия', de: 'Deutschland', ja: 'ドイツ', fr: 'Allemagne' }, dialCode: '+49' },
  { code: 'FR', name: { en: 'France', ru: 'Франция', de: 'Frankreich', ja: 'フランス', fr: 'France' }, dialCode: '+33' },
  { code: 'IT', name: { en: 'Italy', ru: 'Италия', de: 'Italien', ja: 'イタリア', fr: 'Italie' }, dialCode: '+39' },
  { code: 'ES', name: { en: 'Spain', ru: 'Испания', de: 'Spanien', ja: 'スペイン', fr: 'Espagne' }, dialCode: '+34' },
  { code: 'CH', name: { en: 'Switzerland', ru: 'Швейцария', de: 'Schweiz', ja: 'スイス', fr: 'Suisse' }, dialCode: '+41' },
  { code: 'AU', name: { en: 'Australia', ru: 'Австралия', de: 'Australien', ja: 'オーストラリア', fr: 'Australie' }, dialCode: '+61' },
  { code: 'CN', name: { en: 'China', ru: 'Китай', de: 'China', ja: '中国', fr: 'Chine' }, dialCode: '+86' },
  { code: 'JP', name: { en: 'Japan', ru: 'Япония', de: 'Japan', ja: '日本', fr: 'Japon' }, dialCode: '+81' },
  { code: 'IN', name: { en: 'India', ru: 'Индия', de: 'Indien', ja: 'インド', fr: 'Inde' }, dialCode: '+91' },
  { code: 'KZ', name: { en: 'Kazakhstan', ru: 'Казахстан', de: 'Kasachstan', ja: 'カザフスタン', fr: 'Kazakhstan' }, dialCode: '+7' },
  { code: 'RU', name: { en: 'Russia', ru: 'Россия', de: 'Russland', ja: 'ロシア', fr: 'Russie' }, dialCode: '+7' },
]
