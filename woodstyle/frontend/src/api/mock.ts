import { usePreferencesStore, useSessionStore } from '../store/app'
import type {
  Address,
  AdminCategory,
  AdminMessage,
  AdminProduct,
  AdminShippingZone,
  Cart,
  Currency,
  Locale,
  Order,
  PaginatedProducts,
  Product,
  ProductTranslation,
  ShippingOption,
  User,
} from '../types'

export const frontendOnly = import.meta.env.VITE_FRONTEND_ONLY === 'true'

const LOCALES: Locale[] = ['en', 'ru', 'de', 'ja', 'fr']
const STORAGE_KEY = 'woodstyle-static-api-v1'

type StoredUser = User & { password: string }

interface StoredCartItem {
  product_id: number
  quantity: number
}

interface MockState {
  products: AdminProduct[]
  categories: AdminCategory[]
  users: StoredUser[]
  carts: Record<string, StoredCartItem[]>
  favorites: Record<string, number[]>
  addresses: Record<string, Address[]>
  orders: Order[]
  currencies: Currency[]
  shipping: AdminShippingZone[]
  messages: AdminMessage[]
  nextIds: {
    product: number
    category: number
    user: number
    address: number
    order: number
    message: number
    shipping: number
  }
}

interface MockRequestOptions extends RequestInit {
  auth?: boolean
}

const categorySeed = [
  ['sofas', 'Sofas', 'hero.jpg'],
  ['beds', 'Beds', 'bed.jpg'],
  ['wardrobes', 'Wardrobes', 'wardrobe.jpg'],
  ['tables', 'Tables', 'table.jpg'],
  ['chairs', 'Chairs', 'chair.jpg'],
  ['dressers', 'Dressers', 'dresser.jpg'],
] as const

const productSeed = [
  {
    id: 1,
    category: 'sofas',
    slug: 'lofty-sofa',
    sku: 'WS-0001',
    image: 'hero.jpg',
    price: 124900,
    stock: 12,
    popularity: 98,
    name: 'Lofty Sofa',
    description: 'A modular deep-seat sofa with soft textured upholstery.',
    material: 'Solid oak, boucle',
    size: '248 x 104 x 76 cm',
    color: 'Warm beige',
  },
  {
    id: 2,
    category: 'beds',
    slug: 'sense-bed',
    sku: 'WS-0002',
    image: 'bed.jpg',
    price: 98900,
    stock: 9,
    popularity: 94,
    name: 'Sense Bed',
    description: 'A natural oak bed with a flowing headboard and stable base.',
    material: 'Solid oak',
    size: '160 x 200 cm',
    color: 'Natural oak',
  },
  {
    id: 3,
    category: 'wardrobes',
    slug: 'slide-wardrobe',
    sku: 'WS-0003',
    image: 'wardrobe.jpg',
    price: 149900,
    stock: 7,
    popularity: 86,
    name: 'Slide Wardrobe',
    description: 'A spacious wardrobe with a clean facade and thoughtful storage.',
    material: 'Oak veneer, MDF',
    size: '180 x 60 x 220 cm',
    color: 'Honey oak',
  },
  {
    id: 4,
    category: 'tables',
    slug: 'frame-table',
    sku: 'WS-0004',
    image: 'table.jpg',
    price: 87900,
    stock: 15,
    popularity: 91,
    name: 'Frame Table',
    description: 'A dining table with an expressive top and a light silhouette.',
    material: 'Solid ash',
    size: '180 x 90 x 75 cm',
    color: 'Walnut',
  },
  {
    id: 5,
    category: 'chairs',
    slug: 'line-chair',
    sku: 'WS-0005',
    image: 'chair.jpg',
    price: 24900,
    stock: 28,
    popularity: 80,
    name: 'Line Chair',
    description: 'An ergonomic chair with a soft back and solid wooden frame.',
    material: 'Solid ash, matting',
    size: '48 x 54 x 82 cm',
    color: 'Tobacco',
  },
  {
    id: 6,
    category: 'dressers',
    slug: 'mod-dresser',
    sku: 'WS-0006',
    image: 'dresser.jpg',
    price: 69900,
    stock: 11,
    popularity: 84,
    name: 'Mod Dresser',
    description: 'A compact dresser with six soft-closing drawers.',
    material: 'Oak veneer, solid wood',
    size: '120 x 45 x 78 cm',
    color: 'Natural oak',
  },
] as const

const galleryMap: Record<string, string[]> = {
  'hero.jpg': [
    'products/lofty-sofa-front.jpg',
    'products/lofty-sofa-angle.jpg',
    'products/lofty-sofa-rear.jpg',
  ],
  'bed.jpg': [
    'products/sense-bed-front.jpg',
    'products/sense-bed-angle.jpg',
    'products/sense-bed-rear.jpg',
  ],
  'wardrobe.jpg': [
    'products/slide-wardrobe-front.jpg',
    'products/slide-wardrobe-angle.jpg',
    'products/slide-wardrobe-open.jpg',
  ],
  'table.jpg': [
    'products/frame-table-front.jpg',
    'products/frame-table-angle-left.jpg',
    'products/frame-table-angle-right.jpg',
  ],
  'chair.jpg': [
    'products/line-chair-front.jpg',
    'products/line-chair-angle.jpg',
    'products/line-chair-rear.jpg',
  ],
  'dresser.jpg': [
    'products/mod-dresser-front.jpg',
    'products/mod-dresser-angle.jpg',
    'products/mod-dresser-open.jpg',
  ],
}

const currencySeed: Currency[] = [
  ['USD', 'US Dollar', '$', 2, '1'],
  ['KZT', 'Kazakhstani Tenge', 'KZT', 2, '510'],
  ['EUR', 'Euro', 'EUR', 2, '0.92'],
  ['GBP', 'Pound Sterling', 'GBP', 2, '0.79'],
  ['RUB', 'Russian Ruble', 'RUB', 2, '71.9077'],
  ['CNY', 'Chinese Yuan', 'CNY', 2, '7.24'],
  ['JPY', 'Japanese Yen', 'JPY', 0, '157.50'],
  ['CAD', 'Canadian Dollar', 'CA$', 2, '1.37'],
  ['AUD', 'Australian Dollar', 'A$', 2, '1.52'],
  ['CHF', 'Swiss Franc', 'CHF', 2, '0.82'],
  ['INR', 'Indian Rupee', 'INR', 2, '85.50'],
].map(([code, name, symbol, decimalDigits, rateFromUsd]) => ({
  code: String(code),
  name: String(name),
  symbol: String(symbol),
  decimal_digits: Number(decimalDigits),
  rate_from_usd: String(rateFromUsd),
  is_enabled: true,
}))

function localizedName(value: string): Record<Locale, { name: string }> {
  return Object.fromEntries(
    LOCALES.map((locale) => [locale, { name: value }]),
  ) as Record<Locale, { name: string }>
}

function localizedProduct(value: {
  name: string
  description: string
  material: string
  size: string
  color: string
}): Record<Locale, ProductTranslation> {
  return Object.fromEntries(
    LOCALES.map((locale) => [
      locale,
      {
        ...value,
        manufacturer: 'WoodStyle',
        country: 'Kazakhstan',
      },
    ]),
  ) as Record<Locale, ProductTranslation>
}

function initialState(): MockState {
  const categories: AdminCategory[] = categorySeed.map(([slug, name, image], index) => ({
    id: index + 1,
    slug,
    image,
    parent_id: null,
    is_active: true,
    translations: localizedName(name),
  }))
  const categoryId = new Map(categories.map((category) => [category.slug, category.id]))
  const products: AdminProduct[] = productSeed.map((product) => ({
    id: product.id,
    category_id: categoryId.get(product.category) || 1,
    slug: product.slug,
    sku: product.sku,
    price_usd_cents: product.price,
    stock: product.stock,
    image: product.image,
    popularity: product.popularity,
    is_active: true,
    translations: localizedProduct({
      name: product.name,
      description: product.description,
      material: product.material,
      size: product.size,
      color: product.color,
    }),
  }))
  const now = new Date().toISOString()
  return {
    products,
    categories,
    users: [
      {
        id: 1,
        email: 'admin@woodstyle.com',
        password: 'Admin123!',
        role: 'admin',
        first_name: 'WoodStyle',
        last_name: 'Admin',
        phone: '+7 7172 55 01 74',
        locale: 'en',
        currency_code: 'USD',
        is_active: true,
        created_at: now,
      },
      {
        id: 2,
        email: 'customer@woodstyle.com',
        password: 'Customer123!',
        role: 'customer',
        first_name: 'Alex',
        last_name: 'Morgan',
        phone: '+7 700 555 01 74',
        locale: 'en',
        currency_code: 'USD',
        is_active: true,
        created_at: now,
      },
    ],
    carts: { '2': [{ product_id: 4, quantity: 1 }] },
    favorites: { '2': [1, 5] },
    addresses: {
      '2': [
        {
          id: 1,
          label: 'Home',
          recipient_name: 'Alex Morgan',
          phone: '+7 700 555 01 74',
          country_code: 'KZ',
          region: 'Astana',
          city: 'Astana',
          postal_code: '010000',
          address_line1: 'Dostyk street, 12',
          address_line2: '',
          is_default: true,
        },
      ],
    },
    orders: [],
    currencies: currencySeed,
    shipping: [
      {
        id: 1,
        name_en: 'Local delivery in Kazakhstan',
        name_ru: 'Local delivery in Kazakhstan',
        name_de: 'Local delivery in Kazakhstan',
        name_ja: 'Local delivery in Kazakhstan',
        name_fr: 'Local delivery in Kazakhstan',
        country_codes: 'KZ',
        price_usd_cents: 1500,
        free_from_usd_cents: 150000,
        eta_min_days: 1,
        eta_max_days: 3,
        is_active: true,
      },
      {
        id: 2,
        name_en: 'International delivery',
        name_ru: 'International delivery',
        name_de: 'International delivery',
        name_ja: 'International delivery',
        name_fr: 'International delivery',
        country_codes: '*',
        price_usd_cents: 6500,
        free_from_usd_cents: 250000,
        eta_min_days: 7,
        eta_max_days: 21,
        is_active: true,
      },
    ],
    messages: [
      {
        id: 1,
        name: 'Demo Visitor',
        phone: '+7 700 000 00 00',
        email: 'demo@example.com',
        message: 'I would like to visit the Astana showroom.',
        is_processed: false,
        created_at: now,
      },
    ],
    nextIds: {
      product: 7,
      category: 7,
      user: 3,
      address: 2,
      order: 1,
      message: 2,
      shipping: 3,
    },
  }
}

function loadState(): MockState {
  if (typeof localStorage === 'undefined') return initialState()
  const saved = localStorage.getItem(STORAGE_KEY)
  if (!saved) {
    const state = initialState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return state
  }
  try {
    return JSON.parse(saved) as MockState
  } catch {
    const state = initialState()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return state
  }
}

function saveState(state: MockState) {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }
}

function localeFrom(value: string | null): Locale {
  return LOCALES.includes(value as Locale)
    ? (value as Locale)
    : usePreferencesStore.getState().locale
}

function currencyFrom(state: MockState, value: string | null): Currency {
  return (
    state.currencies.find((currency) => currency.code === value && currency.is_enabled) ||
    state.currencies.find((currency) => currency.code === 'USD') ||
    state.currencies[0]
  )
}

function convertMinor(usdCents: number, currency: Currency): number {
  const rate = Number(currency.rate_from_usd || 1)
  const factor = 10 ** currency.decimal_digits
  return Math.round((usdCents / 100) * rate * factor)
}

function categoryFor(state: MockState, product: AdminProduct) {
  return state.categories.find((category) => category.id === product.category_id)
}

function productResponse(
  state: MockState,
  product: AdminProduct,
  locale: Locale,
  currency: Currency,
): Product {
  const translation = product.translations[locale] || product.translations.en
  const category = categoryFor(state, product)
  const categoryTranslation = category?.translations[locale] || category?.translations.en
  const gallery = galleryMap[product.image] || [product.image]
  return {
    id: product.id,
    slug: product.slug,
    sku: product.sku,
    name: translation?.name || product.slug,
    description: translation?.description || '',
    material: translation?.material || '',
    size: translation?.size || '',
    color: translation?.color || '',
    manufacturer: translation?.manufacturer || 'WoodStyle',
    country: translation?.country || 'Kazakhstan',
    category: categoryTranslation?.name || category?.slug || '',
    category_id: product.category_id,
    category_slug: category?.slug || '',
    image: product.image,
    images: gallery.map((path, index) => ({
      id: index + 1,
      path,
      alt: translation?.name || product.slug,
    })),
    price_usd_cents: product.price_usd_cents,
    price_minor: convertMinor(product.price_usd_cents, currency),
    currency: currency.code,
    currency_digits: currency.decimal_digits,
    stock: product.stock,
    popularity: product.popularity,
    is_active: product.is_active,
  }
}

function categoryResponse(state: MockState, category: AdminCategory, locale: Locale) {
  return {
    id: category.id,
    name: category.translations[locale]?.name || category.translations.en?.name || category.slug,
    slug: category.slug,
    image: category.image,
    parent_id: category.parent_id,
    product_count: state.products.filter(
      (product) => product.category_id === category.id && product.is_active,
    ).length,
  }
}

function parsePath(path: string) {
  const url = new URL(path, 'https://woodstyle.local')
  return { pathname: url.pathname, search: url.searchParams }
}

function parseBody(options: MockRequestOptions): Record<string, unknown> {
  if (!options.body || options.body instanceof FormData) return {}
  if (typeof options.body === 'string') return JSON.parse(options.body || '{}') as Record<string, unknown>
  return {}
}

function tokenPair(userId: number) {
  return {
    access_token: `mock-access-${userId}-${Date.now()}`,
    refresh_token: `mock-refresh-${userId}`,
  }
}

function publicUser(user: StoredUser): User {
  const { password: _password, ...safeUser } = user
  void _password
  return safeUser
}

function headerValue(headers: HeadersInit | undefined, name: string): string {
  if (!headers) return ''
  if (headers instanceof Headers) return headers.get(name) || ''
  if (Array.isArray(headers)) {
    return headers.find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] || ''
  }
  return String((headers as Record<string, string>)[name] || (headers as Record<string, string>)[name.toLowerCase()] || '')
}

function userFromRequest(state: MockState, options: MockRequestOptions): StoredUser {
  const authorization = headerValue(options.headers, 'Authorization')
  const token = authorization.replace(/^Bearer\s+/i, '') || useSessionStore.getState().accessToken
  const match = token.match(/^mock-access-(\d+)-/)
  const user = match ? state.users.find((item) => item.id === Number(match[1])) : null
  if (!user || !user.is_active) throw new Error('Authentication required')
  return user
}

function adminFromRequest(state: MockState, options: MockRequestOptions): StoredUser {
  const user = userFromRequest(state, options)
  if (user.role !== 'admin') throw new Error('Administrator access required')
  return user
}

function cartResponse(
  state: MockState,
  userId: number,
  locale: Locale,
  currency: Currency,
): Cart {
  const items = state.carts[String(userId)] || []
  const lines = items.flatMap((item) => {
    const product = state.products.find((entry) => entry.id === item.product_id)
    if (!product) return []
    const productData = productResponse(state, product, locale, currency)
    return [{
      id: product.id,
      quantity: item.quantity,
      line_usd_cents: product.price_usd_cents * item.quantity,
      line_minor: productData.price_minor * item.quantity,
      product: productData,
    }]
  })
  return {
    items: lines,
    subtotal_usd_cents: lines.reduce((sum, line) => sum + line.line_usd_cents, 0),
    subtotal_minor: lines.reduce((sum, line) => sum + line.line_minor, 0),
    currency: currency.code,
    currency_digits: currency.decimal_digits,
    item_count: lines.reduce((sum, line) => sum + line.quantity, 0),
  }
}

function shippingName(zone: AdminShippingZone, locale: Locale): string {
  return (zone[`name_${locale}` as keyof AdminShippingZone] as string) || zone.name_en
}

function shippingResponse(
  zone: AdminShippingZone,
  locale: Locale,
  currency: Currency,
  subtotalUsdCents: number,
): ShippingOption {
  const free = zone.free_from_usd_cents !== null && subtotalUsdCents >= zone.free_from_usd_cents
  const priceUsdCents = free ? 0 : zone.price_usd_cents
  return {
    id: zone.id,
    name: shippingName(zone, locale),
    price_usd_cents: priceUsdCents,
    price_minor: convertMinor(priceUsdCents, currency),
    currency: currency.code,
    currency_digits: currency.decimal_digits,
    eta_min_days: zone.eta_min_days,
    eta_max_days: zone.eta_max_days,
  }
}

async function fileToDataUrl(body: BodyInit | null | undefined): Promise<string> {
  if (!(body instanceof FormData)) return 'hero.jpg'
  const file = body.get('file')
  if (!(file instanceof File)) return 'hero.jpg'
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || 'hero.jpg'))
    reader.onerror = () => reject(new Error('Upload failed'))
    reader.readAsDataURL(file)
  })
}

export async function mockRefreshAccessToken(): Promise<string> {
  const state = loadState()
  const refreshToken = useSessionStore.getState().refreshToken
  const match = refreshToken.match(/^mock-refresh-(\d+)$/)
  const user = match ? state.users.find((item) => item.id === Number(match[1])) : null
  if (!user) throw new Error('Session refresh failed')
  const tokens = tokenPair(user.id)
  useSessionStore.getState().setTokens(tokens.access_token, tokens.refresh_token)
  return tokens.access_token
}

export async function mockRequest<T>(
  path: string,
  options: MockRequestOptions = {},
): Promise<T> {
  const state = loadState()
  const { pathname, search } = parsePath(path)
  const method = (options.method || 'GET').toUpperCase()
  const body = parseBody(options)
  const locale = localeFrom(search.get('locale'))
  const currency = currencyFrom(state, search.get('currency') || usePreferencesStore.getState().currency)

  if (pathname === '/auth/login' && method === 'POST') {
    const email = String(body.email || '').toLowerCase()
    const password = String(body.password || '')
    const user = state.users.find((item) => item.email.toLowerCase() === email && item.password === password)
    if (!user) throw new Error('Invalid email or password')
    return tokenPair(user.id) as T
  }

  if (pathname === '/auth/register' && method === 'POST') {
    const email = String(body.email || '').toLowerCase()
    if (state.users.some((user) => user.email.toLowerCase() === email)) {
      throw new Error('Email already registered')
    }
    const user: StoredUser = {
      id: state.nextIds.user++,
      email,
      password: String(body.password || ''),
      role: 'customer',
      first_name: String(body.first_name || 'Customer'),
      last_name: String(body.last_name || ''),
      phone: String(body.phone || ''),
      locale,
      currency_code: String(body.currency_code || currency.code),
      is_active: true,
      created_at: new Date().toISOString(),
    }
    state.users.push(user)
    saveState(state)
    return tokenPair(user.id) as T
  }

  if (pathname === '/auth/refresh' && method === 'POST') {
    const refreshToken = String(body.refresh_token || useSessionStore.getState().refreshToken)
    const match = refreshToken.match(/^mock-refresh-(\d+)$/)
    const user = match ? state.users.find((item) => item.id === Number(match[1])) : null
    if (!user) throw new Error('Session refresh failed')
    return tokenPair(user.id) as T
  }

  if (pathname === '/auth/logout' && method === 'POST') return { message: 'Signed out' } as T

  if (pathname === '/products' && method === 'GET') {
    let products = state.products
      .filter((product) => product.is_active)
      .map((product) => productResponse(state, product, locale, currency))
    const query = (search.get('q') || '').toLowerCase().trim()
    const category = search.get('category') || ''
    const minPrice = Number(search.get('min_price') || 0)
    const maxPrice = Number(search.get('max_price') || 0)
    if (query) {
      products = products.filter((product) =>
        `${product.name} ${product.sku} ${product.material} ${product.description}`
          .toLowerCase()
          .includes(query),
      )
    }
    if (category) products = products.filter((product) => product.category_slug === category)
    if (minPrice) products = products.filter((product) => product.price_usd_cents >= minPrice)
    if (maxPrice) products = products.filter((product) => product.price_usd_cents <= maxPrice)
    const sort = search.get('sort') || 'popular'
    products = [...products].sort((left, right) => {
      if (sort === 'price-asc') return left.price_usd_cents - right.price_usd_cents
      if (sort === 'price-desc') return right.price_usd_cents - left.price_usd_cents
      if (sort === 'newest') return right.id - left.id
      return right.popularity - left.popularity
    })
    const page = Math.max(1, Number(search.get('page') || 1))
    const pageSize = Math.max(1, Number(search.get('page_size') || 9))
    const total = products.length
    const pages = Math.max(1, Math.ceil(total / pageSize))
    return {
      items: products.slice((page - 1) * pageSize, page * pageSize),
      page,
      page_size: pageSize,
      total,
      pages,
    } satisfies PaginatedProducts as T
  }

  const productMatch = pathname.match(/^\/products\/(\d+)$/)
  if (productMatch && method === 'GET') {
    const product = state.products.find((item) => item.id === Number(productMatch[1]) && item.is_active)
    if (!product) throw new Error('Product not found')
    return productResponse(state, product, locale, currency) as T
  }

  if (pathname === '/categories' && method === 'GET') {
    return state.categories
      .filter((category) => category.is_active)
      .map((category) => categoryResponse(state, category, locale)) as T
  }

  if (pathname === '/currencies' && method === 'GET') {
    const allCodes = search.get('all_codes') === 'true'
    return state.currencies.filter((item) => allCodes || item.is_enabled) as T
  }

  if (pathname === '/me' && method === 'GET') return publicUser(userFromRequest(state, options)) as T

  if (pathname === '/me' && method === 'PATCH') {
    const user = userFromRequest(state, options)
    Object.assign(user, {
      first_name: body.first_name ?? user.first_name,
      last_name: body.last_name ?? user.last_name,
      phone: body.phone ?? user.phone,
      locale: body.locale ?? user.locale,
      currency_code: body.currency_code ?? user.currency_code,
    })
    saveState(state)
    return publicUser(user) as T
  }

  if (pathname === '/me/addresses' && method === 'GET') {
    const user = userFromRequest(state, options)
    return (state.addresses[String(user.id)] || []) as T
  }

  if (pathname === '/me/addresses' && method === 'POST') {
    const user = userFromRequest(state, options)
    const address = { ...(body as unknown as Address), id: state.nextIds.address++ }
    const key = String(user.id)
    state.addresses[key] = [...(state.addresses[key] || []), address]
    saveState(state)
    return address as T
  }

  const addressDeleteMatch = pathname.match(/^\/me\/addresses\/(\d+)$/)
  if (addressDeleteMatch && method === 'DELETE') {
    const user = userFromRequest(state, options)
    const key = String(user.id)
    state.addresses[key] = (state.addresses[key] || []).filter((address) => address.id !== Number(addressDeleteMatch[1]))
    saveState(state)
    return undefined as T
  }

  if (pathname === '/me/cart' && method === 'GET') {
    const user = userFromRequest(state, options)
    return cartResponse(state, user.id, locale, currency) as T
  }

  if (pathname === '/me/cart/items' && method === 'POST') {
    const user = userFromRequest(state, options)
    const key = String(user.id)
    const productId = Number(body.product_id)
    const quantity = Number(body.quantity || 1)
    const cart = state.carts[key] || []
    const existing = cart.find((item) => item.product_id === productId)
    if (existing) existing.quantity = Math.min(99, existing.quantity + quantity)
    else cart.push({ product_id: productId, quantity })
    state.carts[key] = cart
    saveState(state)
    return cartResponse(state, user.id, locale, currency) as T
  }

  const cartItemMatch = pathname.match(/^\/me\/cart\/items\/(\d+)$/)
  if (cartItemMatch && (method === 'PATCH' || method === 'DELETE')) {
    const user = userFromRequest(state, options)
    const key = String(user.id)
    const productId = Number(cartItemMatch[1])
    if (method === 'PATCH') {
      state.carts[key] = (state.carts[key] || []).map((item) =>
        item.product_id === productId ? { ...item, quantity: Number(body.quantity || 1) } : item,
      )
    } else {
      state.carts[key] = (state.carts[key] || []).filter((item) => item.product_id !== productId)
    }
    saveState(state)
    return cartResponse(state, user.id, locale, currency) as T
  }

  if (pathname === '/me/cart/merge' && method === 'POST') {
    const user = userFromRequest(state, options)
    const key = String(user.id)
    const cart = state.carts[key] || []
    for (const item of (body.items || []) as StoredCartItem[]) {
      const existing = cart.find((entry) => entry.product_id === item.product_id)
      if (existing) existing.quantity = Math.min(99, existing.quantity + item.quantity)
      else cart.push({ product_id: item.product_id, quantity: item.quantity })
    }
    state.carts[key] = cart
    saveState(state)
    return cartResponse(state, user.id, locale, currency) as T
  }

  if (pathname === '/me/favorites' && method === 'GET') {
    const user = userFromRequest(state, options)
    const favoriteIds = state.favorites[String(user.id)] || []
    return favoriteIds
      .map((id) => state.products.find((product) => product.id === id && product.is_active))
      .filter(Boolean)
      .map((product) => productResponse(state, product as AdminProduct, locale, currency)) as T
  }

  const favoriteMatch = pathname.match(/^\/me\/favorites\/(\d+)$/)
  if (favoriteMatch && (method === 'POST' || method === 'DELETE')) {
    const user = userFromRequest(state, options)
    const key = String(user.id)
    const productId = Number(favoriteMatch[1])
    const favorites = state.favorites[key] || []
    state.favorites[key] = method === 'POST'
      ? [...new Set([...favorites, productId])]
      : favorites.filter((id) => id !== productId)
    saveState(state)
    return { ok: true } as T
  }

  if (pathname === '/checkout/shipping-options' && method === 'GET') {
    const country = (search.get('country') || '').toUpperCase()
    const subtotal = Number(search.get('subtotal_usd_cents') || 0)
    return state.shipping
      .filter((zone) => zone.is_active)
      .filter((zone) => zone.country_codes === '*' || zone.country_codes.split(',').map((code) => code.trim().toUpperCase()).includes(country))
      .map((zone) => shippingResponse(zone, locale, currency, subtotal)) as T
  }

  if (pathname === '/checkout/order' && method === 'POST') {
    const user = userFromRequest(state, options)
    const cart = cartResponse(state, user.id, locale, currency)
    if (!cart.items.length) throw new Error('Cart is empty')
    const zone = state.shipping.find((item) => item.id === Number(body.shipping_zone_id))
    if (!zone) throw new Error('Shipping option not found')
    const shipping = shippingResponse(zone, locale, currency, cart.subtotal_usd_cents)
    const now = new Date().toISOString()
    const order: Order = {
      id: state.nextIds.order++,
      status: 'pending_payment',
      currency: currency.code,
      currency_digits: currency.decimal_digits,
      exchange_rate: currency.rate_from_usd,
      subtotal_usd_cents: cart.subtotal_usd_cents,
      shipping_usd_cents: shipping.price_usd_cents,
      total_usd_cents: cart.subtotal_usd_cents + shipping.price_usd_cents,
      total_minor: cart.subtotal_minor + shipping.price_minor,
      shipping_address: body.address as Address,
      created_at: now,
      items: cart.items.map((line, index) => ({
        id: index + 1,
        product_id: line.product.id,
        product_name: line.product.name,
        sku: line.product.sku,
        quantity: line.quantity,
        unit_price_usd_cents: line.product.price_usd_cents,
      })),
      payment: null,
      history: [{ status: 'pending_payment', note: '', created_at: now }],
    }
    state.orders.unshift(order)
    saveState(state)
    return order as T
  }

  if (pathname === '/checkout/pay' && method === 'POST') {
    const user = userFromRequest(state, options)
    const order = state.orders.find((item) => item.id === Number(body.order_id))
    if (!order) throw new Error('Order not found')
    const digits = String(body.card_number || '').replace(/\D/g, '')
    const now = new Date().toISOString()
    const paid = digits !== '4000000000000002'
    order.status = paid ? 'paid' : 'payment_failed'
    order.payment = {
      provider: 'frontend-demo',
      status: paid ? 'paid' : 'declined',
      reference: String(body.idempotency_key || `demo-${order.id}`),
      last4: digits.slice(-4),
      paid_at: paid ? now : null,
    }
    order.history.push({ status: order.status, note: '', created_at: now })
    if (paid) state.carts[String(user.id)] = []
    saveState(state)
    return order as T
  }

  if (pathname === '/me/orders' && method === 'GET') {
    userFromRequest(state, options)
    return state.orders as T
  }

  if (pathname === '/contact' && method === 'POST') {
    state.messages.unshift({
      id: state.nextIds.message++,
      name: String(body.name || ''),
      phone: String(body.phone || ''),
      email: String(body.email || ''),
      message: String(body.message || ''),
      is_processed: false,
      created_at: new Date().toISOString(),
    })
    saveState(state)
    return { message: 'Message sent' } as T
  }

  if (pathname.startsWith('/admin')) adminFromRequest(state, options)

  if (pathname === '/admin/dashboard' && method === 'GET') {
    const statusCounts = state.orders.reduce<Record<string, number>>((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {})
    return {
      revenue_usd_cents: state.orders.filter((order) => order.status === 'paid').reduce((sum, order) => sum + order.total_usd_cents, 0),
      orders: state.orders.length,
      users: state.users.length,
      products: state.products.length,
      status_counts: statusCounts,
    } as T
  }

  if (pathname === '/admin/products' && method === 'GET') return state.products as T

  if (pathname === '/admin/products' && method === 'POST') {
    const product = { ...(body as unknown as AdminProduct), id: state.nextIds.product++ }
    state.products.unshift(product)
    saveState(state)
    return product as T
  }

  const adminProductMatch = pathname.match(/^\/admin\/products\/(\d+)$/)
  if (adminProductMatch && (method === 'PUT' || method === 'DELETE')) {
    const product = state.products.find((item) => item.id === Number(adminProductMatch[1]))
    if (!product) throw new Error('Product not found')
    if (method === 'DELETE') product.is_active = false
    else Object.assign(product, body)
    saveState(state)
    return product as T
  }

  if (pathname === '/admin/categories' && method === 'GET') return state.categories as T

  if (pathname === '/admin/categories' && method === 'POST') {
    const category = { ...(body as unknown as AdminCategory), id: state.nextIds.category++ }
    state.categories.push(category)
    saveState(state)
    return category as T
  }

  if (pathname === '/admin/orders' && method === 'GET') return state.orders as T

  const adminOrderMatch = pathname.match(/^\/admin\/orders\/(\d+)$/)
  if (adminOrderMatch && method === 'PATCH') {
    const order = state.orders.find((item) => item.id === Number(adminOrderMatch[1]))
    if (!order) throw new Error('Order not found')
    order.status = String(body.status || order.status)
    order.history.push({ status: order.status, note: String(body.note || ''), created_at: new Date().toISOString() })
    saveState(state)
    return order as T
  }

  if (pathname === '/admin/users' && method === 'GET') return state.users.map(publicUser) as T

  if (pathname === '/admin/carts' && method === 'GET') {
    return Object.entries(state.carts).flatMap(([userId, items]) => {
      const user = state.users.find((item) => item.id === Number(userId))
      return items.flatMap((item) => {
        const product = state.products.find((entry) => entry.id === item.product_id)
        return user && product
          ? [{ email: user.email, product_name: product.translations.en?.name || product.slug, quantity: item.quantity }]
          : []
      })
    }) as T
  }

  if (pathname === '/admin/currencies' && method === 'GET') return state.currencies as T

  const currencyMatch = pathname.match(/^\/admin\/currencies\/([A-Z]{3})$/)
  if (currencyMatch && method === 'PATCH') {
    const item = state.currencies.find((currency) => currency.code === currencyMatch[1])
    if (!item) throw new Error('Currency not found')
    Object.assign(item, body)
    saveState(state)
    return item as T
  }

  if (pathname === '/admin/shipping' && method === 'GET') return state.shipping as T

  if (pathname === '/admin/shipping' && method === 'POST') {
    const zone = { ...(body as unknown as AdminShippingZone), id: state.nextIds.shipping++ }
    state.shipping.push(zone)
    saveState(state)
    return zone as T
  }

  if (pathname === '/admin/messages' && method === 'GET') return state.messages as T

  const messageMatch = pathname.match(/^\/admin\/messages\/(\d+)$/)
  if (messageMatch && method === 'PATCH') {
    const message = state.messages.find((item) => item.id === Number(messageMatch[1]))
    if (!message) throw new Error('Message not found')
    message.is_processed = true
    saveState(state)
    return message as T
  }

  if (pathname === '/storage/images' && method === 'POST') {
    return { path: await fileToDataUrl(options.body) } as T
  }

  throw new Error(`Mock endpoint is not implemented: ${method} ${pathname}`)
}
