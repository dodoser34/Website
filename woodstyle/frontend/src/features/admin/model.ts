import { localeOptions } from '../../i18n/config'
import type { AdminProduct, AdminShippingZone, Locale, ProductTranslation } from '../../types'

export type AdminTab =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'orders'
  | 'users'
  | 'currencies'
  | 'shipping'
  | 'messages'

export interface ProductForm {
  id?: number
  categoryId: number
  slug: string
  sku: string
  price: string
  stock: string
  image: string
  translations: Record<Locale, ProductTranslation>
}

export interface CategoryForm {
  slug: string
  image: string
  translations: Record<Locale, string>
}

export interface ShippingForm {
  names: Record<Locale, string>
  countryCodes: string
  price: string
  freeFrom: string
  etaMinDays: string
  etaMaxDays: string
}

function localizedRecord<T>(factory: () => T): Record<Locale, T> {
  return Object.fromEntries(
    localeOptions.map(({ code }) => [code, factory()]),
  ) as Record<Locale, T>
}

export function createEmptyProductForm(): ProductForm {
  return {
    categoryId: 1,
    slug: '',
    sku: '',
    price: '499.00',
    stock: '10',
    image: '',
    translations: localizedRecord(() => ({
      name: '',
      description: '',
      material: '',
      size: '',
      color: '',
      manufacturer: 'WoodStyle',
      country: '',
    })),
  }
}

export function createEmptyCategoryForm(): CategoryForm {
  return {
    slug: '',
    image: '',
    translations: localizedRecord(() => ''),
  }
}

export function createEmptyShippingForm(): ShippingForm {
  return {
    names: localizedRecord(() => ''),
    countryCodes: '*',
    price: '25.00',
    freeFrom: '',
    etaMinDays: '3',
    etaMaxDays: '7',
  }
}

export function productToForm(product: AdminProduct): ProductForm {
  const form = createEmptyProductForm()
  for (const { code } of localeOptions) {
    form.translations[code] = {
      ...form.translations[code],
      ...product.translations[code],
    }
  }
  return {
    ...form,
    id: product.id,
    categoryId: product.category_id,
    slug: product.slug,
    sku: product.sku,
    price: (product.price_usd_cents / 100).toFixed(2),
    stock: String(product.stock),
    image: product.image,
  }
}

export function fallbackLocaleName(
  translations: Partial<Record<Locale, { name: string }>>,
  locale: Locale,
): string {
  return translations[locale]?.name || translations.en?.name || ''
}

export function shippingZoneName(zone: AdminShippingZone, locale: Locale): string {
  const localizedNames: Record<Locale, string> = {
    en: zone.name_en,
    ru: zone.name_ru,
    de: zone.name_de,
    ja: zone.name_ja,
    fr: zone.name_fr,
  }
  return localizedNames[locale] || zone.name_en
}
