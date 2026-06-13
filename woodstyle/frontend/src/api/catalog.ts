import type { Category, Currency, Locale, PaginatedProducts, Product } from '../types'
import { request } from './http'

export const catalogApi = {
  products: (params: Record<string, string | number | undefined>) => {
    const search = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '') search.set(key, String(value))
    })
    return request<PaginatedProducts>(`/products?${search}`)
  },
  product: (id: string | number, locale: Locale, currency: string) =>
    request<Product>(`/products/${id}?locale=${locale}&currency=${currency}`),
  categories: (locale: Locale) =>
    request<Category[]>(`/categories?locale=${locale}`),
  currencies: (allCodes = false) =>
    request<Currency[]>(`/currencies?all_codes=${allCodes}`),
}
