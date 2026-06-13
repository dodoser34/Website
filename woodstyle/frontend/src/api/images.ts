import bedImage from '../assets/images/bed.jpg'
import chairImage from '../assets/images/chair.jpg'
import dresserImage from '../assets/images/dresser.jpg'
import sofaImage from '../assets/images/sofa-square-v2.jpg'
import tableImage from '../assets/images/table.jpg'
import wardrobeImage from '../assets/images/wardrobe.jpg'
import { API_ORIGIN } from './http'

const imageMap: Record<string, string> = {
  'bed.jpg': bedImage,
  'chair.jpg': chairImage,
  'dresser.jpg': dresserImage,
  'hero.jpg': sofaImage,
  'table.jpg': tableImage,
  'wardrobe.jpg': wardrobeImage,
}

export function imageFor(path: string): string {
  if (!path) return sofaImage
  if (path.startsWith('/media/')) return `${API_ORIGIN}${path}`
  if (/^https?:\/\//.test(path)) return path
  return imageMap[path] || sofaImage
}
