import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import favoriteHero from '../assets/images/site/favorites-hero-v1.webp'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import { EmptyState } from '../components/ui'
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
  const pageTitle = {
    en: 'Pieces You Love, Saved for You.',
    ru: 'Любимые предметы, сохранённые для вас.',
    de: 'Lieblingsstücke, für Sie gespeichert.',
    ja: 'お気に入りを、あなたのために。',
    fr: 'Vos pièces préférées, gardées pour vous.',
  }[locale]

  return (
    <section className="favorites-page">
      <div className="favorites-hero reveal">
        <div className="container favorites-hero-inner">
          <div>
            <span className="eyebrow"><span />{copy.eyebrow}</span>
            <h1>{pageTitle}</h1>
            <p>{copy.lead}</p>
            <Link className="button button-primary" to="/catalog">{translations.common.viewCatalog}<Icon name="arrow" /></Link>
          </div>
          <img src={favoriteHero} alt="" />
        </div>
      </div>
      <div className="container favorites-content">
        {products.length > 0 && <div className="favorites-toolbar"><strong>{products.length} {translations.common.pieces}</strong><span>Curated for your space</span></div>}
        {!products.length ? (
          <EmptyState icon="heart" title={translations.common.emptyFavorites} text={copy.emptyText} action={translations.common.viewCatalog} />
        ) : <div className="products-grid catalog-grid">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div>}
      </div>
    </section>
  )
}
