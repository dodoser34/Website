import type {
  AdminCartItem,
  AdminCategory,
  AdminDashboard,
  AdminMessage,
  AdminProduct,
  AdminShippingZone,
  Currency,
  Order,
  User,
} from '../types'
import { request } from './http'

export const adminApi = {
  dashboard: () => request<AdminDashboard>('/admin/dashboard', { auth: true }),
  products: () => request<AdminProduct[]>('/admin/products', { auth: true }),
  saveProduct: (payload: Record<string, unknown>, id?: number) =>
    request<AdminProduct>(id ? `/admin/products/${id}` : '/admin/products', {
      method: id ? 'PUT' : 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  deleteProduct: (id: number) =>
    request(`/admin/products/${id}`, { method: 'DELETE', auth: true }),
  categories: () => request<AdminCategory[]>('/admin/categories', { auth: true }),
  createCategory: (payload: Record<string, unknown>) =>
    request('/admin/categories', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  orders: () => request<Order[]>('/admin/orders', { auth: true }),
  updateOrder: (id: number, status: string) =>
    request<Order>(`/admin/orders/${id}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify({ status, note: '' }),
    }),
  users: () => request<User[]>('/admin/users', { auth: true }),
  carts: () => request<AdminCartItem[]>('/admin/carts', { auth: true }),
  currencies: () => request<Currency[]>('/admin/currencies', { auth: true }),
  updateCurrency: (code: string, payload: Record<string, unknown>) =>
    request<Currency>(`/admin/currencies/${code}`, {
      method: 'PATCH',
      auth: true,
      body: JSON.stringify(payload),
    }),
  shipping: () => request<AdminShippingZone[]>('/admin/shipping', { auth: true }),
  createShipping: (payload: Record<string, unknown>) =>
    request('/admin/shipping', {
      method: 'POST',
      auth: true,
      body: JSON.stringify(payload),
    }),
  messages: () => request<AdminMessage[]>('/admin/messages', { auth: true }),
  processMessage: (id: number) =>
    request(`/admin/messages/${id}`, { method: 'PATCH', auth: true }),
  upload: (file: File) => {
    const data = new FormData()
    data.append('file', file)
    return request<{ path: string }>('/storage/images', {
      method: 'POST',
      auth: true,
      body: data,
    })
  },
}
