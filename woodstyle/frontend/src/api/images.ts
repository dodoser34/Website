import frameTableAngleLeft from '../assets/images/products/frame-table-angle-left.jpg'
import frameTableAngleRight from '../assets/images/products/frame-table-angle-right.jpg'
import frameTableFront from '../assets/images/products/frame-table-front.jpg'
import lineChairAngle from '../assets/images/products/line-chair-angle.jpg'
import lineChairFront from '../assets/images/products/line-chair-front.jpg'
import lineChairRear from '../assets/images/products/line-chair-rear.jpg'
import loftySofaAngle from '../assets/images/products/lofty-sofa-angle.jpg'
import loftySofaFront from '../assets/images/products/lofty-sofa-front.jpg'
import loftySofaRear from '../assets/images/products/lofty-sofa-rear.jpg'
import modDresserAngle from '../assets/images/products/mod-dresser-angle.jpg'
import modDresserFront from '../assets/images/products/mod-dresser-front.jpg'
import modDresserOpen from '../assets/images/products/mod-dresser-open.jpg'
import senseBedAngle from '../assets/images/products/sense-bed-angle.jpg'
import senseBedFront from '../assets/images/products/sense-bed-front.jpg'
import senseBedRear from '../assets/images/products/sense-bed-rear.jpg'
import slideWardrobeAngle from '../assets/images/products/slide-wardrobe-angle.jpg'
import slideWardrobeFront from '../assets/images/products/slide-wardrobe-front.jpg'
import slideWardrobeOpen from '../assets/images/products/slide-wardrobe-open.jpg'
import { API_ORIGIN } from './http'

const imageMap: Record<string, string> = {
  'bed.jpg': senseBedFront,
  'chair.jpg': lineChairFront,
  'dresser.jpg': modDresserFront,
  'hero.jpg': loftySofaFront,
  'table.jpg': frameTableFront,
  'wardrobe.jpg': slideWardrobeFront,
  'products/frame-table-angle-left.jpg': frameTableAngleLeft,
  'products/frame-table-angle-right.jpg': frameTableAngleRight,
  'products/frame-table-front.jpg': frameTableFront,
  'products/line-chair-angle.jpg': lineChairAngle,
  'products/line-chair-front.jpg': lineChairFront,
  'products/line-chair-rear.jpg': lineChairRear,
  'products/lofty-sofa-angle.jpg': loftySofaAngle,
  'products/lofty-sofa-front.jpg': loftySofaFront,
  'products/lofty-sofa-rear.jpg': loftySofaRear,
  'products/mod-dresser-angle.jpg': modDresserAngle,
  'products/mod-dresser-front.jpg': modDresserFront,
  'products/mod-dresser-open.jpg': modDresserOpen,
  'products/sense-bed-angle.jpg': senseBedAngle,
  'products/sense-bed-front.jpg': senseBedFront,
  'products/sense-bed-rear.jpg': senseBedRear,
  'products/slide-wardrobe-angle.jpg': slideWardrobeAngle,
  'products/slide-wardrobe-front.jpg': slideWardrobeFront,
  'products/slide-wardrobe-open.jpg': slideWardrobeOpen,
}

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

for (const paths of Object.values(galleryMap)) {
  galleryMap[paths[0]] = paths
}

export function imageFor(path: string): string {
  if (!path) return loftySofaFront
  if (/^(data|blob):/.test(path)) return path
  if (path.startsWith('/media/')) return API_ORIGIN ? `${API_ORIGIN}${path}` : loftySofaFront
  if (/^https?:\/\//.test(path)) return path
  return imageMap[path] || loftySofaFront
}

export function galleryPathsFor(path: string): string[] {
  return galleryMap[path] || []
}
