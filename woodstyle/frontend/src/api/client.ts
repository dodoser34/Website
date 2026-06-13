import { accountApi } from './account'
import { adminApi } from './admin'
import { catalogApi } from './catalog'

export { imageFor } from './images'
export { request } from './http'

export const api = {
  ...catalogApi,
  ...accountApi,
  admin: adminApi,
}
