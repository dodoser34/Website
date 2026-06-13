import { useQuery } from '@tanstack/react-query'

import { api } from '../api/client'
import ProductCard from '../components/ProductCard'
import { EmptyState, PageHero } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { useGuestStore, usePreferencesStore, useSessionStore } from '../store/app'

export default function Favorites() {
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.favorites
  const token = useSessionStore((state) => state.accessToken)
  const guestFavorites = useGuestStore((state) => state.favorites)
  useDocumentMeta(translations.common.favorites, translations.meta.favoritesDescription, locale)
  const server = useQuery({
    queryKey: ['favorites', locale, currency],
    queryFn: () => api.favorites(locale, currency),
    enabled: Boolean(token),
  })
  const guest = useQuery({
    queryKey: ['products', 'guest-favorites', locale, currency],
    queryFn: () => api.products({ locale, currency, page_size: 100 }),
    enabled: !token && guestFavorites.length > 0,
  })
  const products = token ? server.data || [] : (guest.data?.items || []).filter((item) => guestFavorites.includes(item.id))

  return (
    <section className="favorites-page">
      <PageHero eyebrow={copy.eyebrow} title={translations.common.favorites} lead={copy.lead} />
      <div className="container favorites-content">
        {!products.length ? (
          <EmptyState icon="heart" title={translations.common.emptyFavorites} text={copy.emptyText} action={translations.common.viewCatalog} />
        ) : <div className="products-grid catalog-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </div>
    </section>
  )
}
