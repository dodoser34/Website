import { describe, expect, it } from 'vitest'

import { getTranslations } from '../i18n'
import { localeOptions } from '../i18n/config'
import { formatDate, formatMoney } from './format'

describe('international formatting', () => {
  it('formats currencies with their decimal rules', () => {
    expect(formatMoney(12345, 'USD', 2, 'en')).toContain('123.45')
    expect(formatMoney(12345, 'JPY', 0, 'en')).toContain('12,345')
  })

  it('returns localized navigation labels', () => {
    expect(getTranslations('en').common.catalog).toBe('Catalog')
    expect(getTranslations('ru').common.catalog).toBe('Каталог')
    expect(getTranslations('de').common.catalog).toBe('Katalog')
    expect(getTranslations('ja').common.catalog).toBe('カタログ')
    expect(getTranslations('fr').common.catalog).toBe('Catalogue')
  })

  it('provides localized commerce and admin copy for every locale', () => {
    const checkoutLabels = localeOptions.map(({ code }) =>
      getTranslations(code).checkout.title,
    )
    const adminLabels = localeOptions.map(({ code }) =>
      getTranslations(code).admin.tabs.dashboard,
    )

    expect(new Set(checkoutLabels).size).toBe(localeOptions.length)
    expect(new Set(adminLabels).size).toBe(localeOptions.length)
  })

  it('formats dates and money for every supported locale', () => {
    for (const { code } of localeOptions) {
      expect(formatMoney(12345, 'EUR', 2, code)).toMatch(/123/)
      expect(formatDate('2026-06-13T12:00:00Z', code)).toBeTruthy()
    }
  })
})
