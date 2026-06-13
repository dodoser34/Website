import type { Locale } from '../types'
import { intlLocaleFor } from '../i18n/config'

export function formatMoney(
  amountMinor: number,
  currency: string,
  digits: number,
  locale: Locale,
): string {
  return new Intl.NumberFormat(intlLocaleFor(locale), {
    style: 'currency',
    currency,
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(amountMinor / 10 ** digits)
}

export function formatUsd(cents: number, locale: Locale): string {
  return formatMoney(cents, 'USD', 2, locale)
}

export function formatDate(
  value: string | Date,
  locale: Locale,
  options: Intl.DateTimeFormatOptions = {},
): string {
  return new Intl.DateTimeFormat(intlLocaleFor(locale), options).format(new Date(value))
}
