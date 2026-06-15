import type {
  Address,
  Cart,
  Locale,
  Order,
  Product,
  ShippingOption,
  User,
} from '../types'
import { request } from './http'

export const accountApi = {
  register: (payload: Record<string, unknown>) =>
    request<{ access_token: string; refresh_token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  login: (payload: { email: string; password: string }) =>
    request<{ access_token: string; refresh_token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  refresh: (refreshToken = '') =>
    request<{ access_token: string; refresh_token: string }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
    }),
  logout: (refreshToken = '') =>
    request<{ message: string }>('/auth/logout', {
      method: 'POST',
      body: JSON.stringify(refreshToken ? { refresh_token: refreshToken } : {}),
    }),
  me: () => request<User>('/me', { auth: true }),
  updateProfile: (payload: Partial<User>) =>
    request<User>('/me', {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),
  addresses: () => request<Address[]>('/me/addresses', { auth: true }),
  addAddress: (payload: Address) =>
    request<Address>('/me/addresses', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  deleteAddress: (addressId: number) =>
    request<void>(`/me/addresses/${addressId}`, {
      method: 'DELETE',
      auth: true,
    }),
  cart: (locale: Locale, currency: string) =>
    request<Cart>(`/me/cart?locale=${locale}&currency=${currency}`, { auth: true }),
  addCart: (productId: number, quantity: number, locale: Locale, currency: string) =>
    request<Cart>(`/me/cart/items?locale=${locale}&currency=${currency}`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ product_id: productId, quantity }),
    }),
  updateCart: (itemId: number, quantity: number, locale: Locale, currency: string) =>
    request<Cart>(`/me/cart/items/${itemId}?locale=${locale}&currency=${currency}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ quantity }),
    }),
  deleteCart: (itemId: number, locale: Locale, currency: string) =>
    request<Cart>(`/me/cart/items/${itemId}?locale=${locale}&currency=${currency}`, {
      method: 'DELETE',
      auth: true,
    }),
  mergeCart: (
    items: Array<{ product_id: number; quantity: number }>,
    locale: Locale,
    currency: string,
  ) =>
    request<Cart>(`/me/cart/merge?locale=${locale}&currency=${currency}`, {
      method: 'POST',
      auth: true,
      body: JSON.stringify({ items }),
    }),
  favorites: (locale: Locale, currency: string) =>
    request<Product[]>(`/me/favorites?locale=${locale}&currency=${currency}`, {
      auth: true,
    }),
  addFavorite: (productId: number) =>
    request(`/me/favorites/${productId}`, { method: 'POST', auth: true }),
  deleteFavorite: (productId: number) =>
    request(`/me/favorites/${productId}`, { method: 'DELETE', auth: true }),
  shipping: (
    country: string,
    subtotalUsdCents: number,
    locale: Locale,
    currency: string,
  ) =>
    request<ShippingOption[]>(
      `/checkout/shipping-options?country=${country}&subtotal_usd_cents=${subtotalUsdCents}&locale=${locale}&currency=${currency}`,
    ),
  createOrder: (payload: {
    shipping_zone_id: number
    currency_code: string
    address: Address
  }) =>
    request<Order>('/checkout/order', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  pay: (
    orderId: number,
    cardNumber: string,
    cardholder: string,
    idempotencyKey: string,
  ) =>
    request<Order>('/checkout/pay', {
      method: 'POST',
      auth: true,
      body: JSON.stringify({
        order_id: orderId,
        card_number: cardNumber,
        cardholder,
        idempotency_key: idempotencyKey,
      }),
    }),
  orders: () => request<Order[]>('/me/orders', { auth: true }),
  contact: (payload: Record<string, string>) =>
    request<{ message: string }>('/contact', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
}
