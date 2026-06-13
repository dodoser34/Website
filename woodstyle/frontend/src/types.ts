export type Locale = 'en' | 'ru' | 'de' | 'ja' | 'fr'

export interface ShowroomConfig {
  name: string
  address: string
  phone: string
  email: string
  mapsUrl: string
  embedUrl: string
  hours: Array<{ days: string; hours: string }>
}

export interface CountryOption {
  code: string
  name: Record<Locale, string>
  dialCode: string
}

export interface User {
  id: number
  email: string
  role: 'customer' | 'admin'
  first_name: string
  last_name: string
  phone: string
  locale: Locale
  currency_code: string
  is_active: boolean
  created_at: string
}

export interface Currency {
  code: string
  name: string
  symbol: string
  decimal_digits: number
  rate_from_usd: string
  is_enabled: boolean
}

export interface Category {
  id: number
  name: string
  slug: string
  image: string
  parent_id: number | null
  product_count: number
}

export interface Product {
  id: number
  slug: string
  sku: string
  name: string
  description: string
  material: string
  size: string
  color: string
  manufacturer: string
  country: string
  category: string
  category_id: number
  category_slug: string
  image: string
  images: Array<{ id: number; path: string; alt: string }>
  price_usd_cents: number
  price_minor: number
  currency: string
  currency_digits: number
  stock: number
  popularity: number
  is_active: boolean
}

export interface PaginatedProducts {
  items: Product[]
  page: number
  page_size: number
  total: number
  pages: number
}

export interface CartLine {
  id: number
  quantity: number
  line_usd_cents: number
  line_minor: number
  product: Product
}

export interface Cart {
  items: CartLine[]
  subtotal_usd_cents: number
  subtotal_minor: number
  currency: string
  currency_digits: number
  item_count: number
}

export interface Address {
  id?: number
  label: string
  recipient_name: string
  phone: string
  country_code: string
  region: string
  city: string
  postal_code: string
  address_line1: string
  address_line2: string
  is_default: boolean
}

export interface ShippingOption {
  id: number
  name: string
  price_usd_cents: number
  price_minor: number
  currency: string
  currency_digits: number
  eta_min_days: number
  eta_max_days: number
}

export interface Order {
  id: number
  status: string
  currency: string
  currency_digits: number
  exchange_rate: string
  subtotal_usd_cents: number
  shipping_usd_cents: number
  total_usd_cents: number
  total_minor: number
  shipping_address: Address
  created_at: string
  items: Array<{
    id: number
    product_id: number | null
    product_name: string
    sku: string
    quantity: number
    unit_price_usd_cents: number
  }>
  payment: null | {
    provider: string
    status: string
    reference: string
    last4: string
    paid_at: string | null
  }
  history: Array<{ status: string; note: string; created_at: string }>
}

export interface ProductTranslation {
  name: string
  description: string
  material: string
  size: string
  color: string
  manufacturer: string
  country: string
}

export interface AdminProduct {
  id: number
  category_id: number
  slug: string
  sku: string
  price_usd_cents: number
  stock: number
  image: string
  popularity: number
  is_active: boolean
  translations: Partial<Record<Locale, ProductTranslation>>
}

export interface AdminCategory {
  id: number
  slug: string
  image: string
  parent_id: number | null
  is_active: boolean
  translations: Partial<Record<Locale, { name: string }>>
}

export interface AdminDashboard {
  revenue_usd_cents: number
  orders: number
  users: number
  products: number
  status_counts: Record<string, number>
}

export interface AdminCartItem {
  email: string
  product_name: string
  quantity: number
}

export interface AdminShippingZone {
  id: number
  name_en: string
  name_ru: string
  name_de: string
  name_ja: string
  name_fr: string
  country_codes: string
  price_usd_cents: number
  free_from_usd_cents: number | null
  eta_min_days: number
  eta_max_days: number
  is_active: boolean
}

export interface AdminMessage {
  id: number
  name: string
  phone: string
  email: string
  message: string
  is_processed: boolean
  created_at: string
}
