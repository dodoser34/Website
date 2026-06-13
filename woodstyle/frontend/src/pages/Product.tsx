import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { api, imageFor } from '../api/client'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import { Badge, EmptyState, Skeleton } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { useGuestStore, usePreferencesStore, useSessionStore } from '../store/app'
import type { Product as ProductType } from '../types'
import { formatMoney } from '../utils/format'

export default function Product() {
  const { id = '' } = useParams()
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.product
  const token = useSessionStore((state) => state.accessToken)
  const guestFavorites = useGuestStore((state) => state.favorites)
  const toggleGuestFavorite = useGuestStore((state) => state.toggleFavorite)
  const addGuestCart = useGuestStore((state) => state.addCart)
  const [quantity, setQuantity] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [lightbox, setLightbox] = useState(false)
  const [added, setAdded] = useState(false)
  const queryClient = useQueryClient()
  const product = useQuery({ queryKey: ['product', id, locale, currency], queryFn: () => api.product(id, locale, currency) })
  const favorites = useQuery({
    queryKey: ['favorites', locale, currency],
    queryFn: () => api.favorites(locale, currency),
    enabled: Boolean(token),
  })
  const related = useQuery({
    queryKey: ['products', 'related', product.data?.category_slug, locale, currency],
    queryFn: () => api.products({ locale, currency, category: product.data?.category_slug, page_size: 4 }),
    enabled: Boolean(product.data?.category_slug),
  })
  const cartMutation = useMutation({
    mutationFn: (item: ProductType) => api.addCart(item.id, quantity, locale, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1600)
    },
  })
  const favoriteMutation = useMutation({
    mutationFn: (item: ProductType) => favorites.data?.some((favorite) => favorite.id === item.id) ? api.deleteFavorite(item.id) : api.addFavorite(item.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })

  useDocumentMeta(
    product.data?.name || copy.fallbackTitle,
    product.data?.description || '',
    locale,
  )
  if (product.isLoading) return <div className="container product-loading"><Skeleton /><Skeleton /></div>
  if (!product.data || product.isError) {
    return <div className="container commerce-page"><EmptyState icon="box" title={copy.notFound} action={translations.common.viewCatalog} /></div>
  }
  const item = product.data
  const favorite = token ? Boolean(favorites.data?.some((value) => value.id === item.id)) : guestFavorites.includes(item.id)
  const gallery = item.images.length ? item.images : [{ id: 0, path: item.image, alt: item.name }]
  const image = gallery[Math.min(activeImage, gallery.length - 1)]
  const addToCart = () => {
    if (token) cartMutation.mutate(item)
    else {
      addGuestCart(item.id, quantity)
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1600)
    }
  }

  return (
    <div className="product-page">
      <div className="container breadcrumbs">
        <Link to="/">{translations.common.home}</Link><span>/</span>
        <Link to="/catalog">{translations.common.catalog}</Link><span>/</span><strong>{item.name}</strong>
      </div>
      <section className="container product-main">
        <div className="product-gallery reveal">
          <div className="gallery-thumbs">
            {gallery.map((entry, index) => (
              <button key={entry.id} className={index === activeImage ? 'active' : ''} onClick={() => setActiveImage(index)}>
                <img src={imageFor(entry.path)} alt="" />
              </button>
            ))}
          </div>
          <button className="gallery-main" onClick={() => setLightbox(true)} aria-label={copy.openGallery}>
            <img src={imageFor(image.path)} alt={image.alt || item.name} />
            <span><Icon name="eye" />{copy.viewLarger}</span>
          </button>
        </div>

        <div className="product-info reveal reveal-delay-1">
          <div className="product-title-row">
            <div><span className="eyebrow"><span />{item.category}</span><h1>{item.name}</h1></div>
            <button className={`favorite-text-button ${favorite ? 'is-favorite' : ''}`} onClick={() => token ? favoriteMutation.mutate(item) : toggleGuestFavorite(item.id)} aria-label={translations.common.favorites}><Icon name="heart" /></button>
          </div>
          <strong className="product-price">{formatMoney(item.price_minor, item.currency, item.currency_digits, locale)}</strong>
          <div className="availability-row">
            <Badge tone={item.stock > 0 ? 'success' : 'danger'}>{item.stock > 0 ? `${item.stock} ${translations.common.inStock}` : translations.common.outOfStock}</Badge>
            <span>SKU {item.sku}</span>
          </div>
          <p className="product-lead">{item.description}</p>
          <div className="purchase-card">
            <div className="quantity-control">
              <button onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Icon name="minus" /></button>
              <span><small>{copy.quantity}</small><strong>{quantity}</strong></span>
              <button onClick={() => setQuantity((value) => Math.min(item.stock, value + 1))}><Icon name="plus" /></button>
            </div>
            <button className={`button button-primary purchase-button ${added ? 'is-added' : ''}`} disabled={!item.stock || cartMutation.isPending} onClick={addToCart}>
              {added ? translations.common.addedToCart : translations.common.addToCart}<Icon name={added ? 'check' : 'cart'} />
            </button>
          </div>
          <div className="product-assurances">
            {copy.assurances.map((assurance, index) => (
              <span key={assurance.title}>
                <Icon name={(['truck', 'shield', 'leaf'] as const)[index]} />
                <strong>{assurance.title}</strong><small>{assurance.text}</small>
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="container product-details">
        <div className="product-detail-copy">
          <span className="eyebrow"><span />{copy.detailsEyebrow}</span>
          <h2>{copy.detailsTitle}</h2>
          <p>{copy.detailsText}</p>
        </div>
        <div className="spec-list">
          {[
            [copy.specs.material, item.material],
            [copy.specs.dimensions, item.size],
            [copy.specs.finish, item.color],
            [copy.specs.maker, item.manufacturer],
            [copy.specs.country, item.country],
          ].map(([label, value]) => <div key={label}><span>{label}</span><strong>{value || '—'}</strong></div>)}
        </div>
      </section>

      <section className="section related-products">
        <div className="container">
          <div className="section-heading"><div><span className="eyebrow"><span />{copy.relatedEyebrow}</span><h2>{copy.relatedTitle}</h2></div></div>
          <div className="products-grid">{(related.data?.items || []).filter((value) => value.id !== item.id).slice(0, 3).map((value) => <ProductCard key={value.id} product={value} />)}</div>
        </div>
      </section>

      {lightbox && (
        <div className="lightbox" role="dialog" aria-modal="true">
          <button className="lightbox-close" onClick={() => setLightbox(false)}><Icon name="close" /></button>
          <img src={imageFor(image.path)} alt={image.alt || item.name} />
          <div className="lightbox-nav">
            <button onClick={() => setActiveImage((activeImage - 1 + gallery.length) % gallery.length)}>{translations.common.previous}</button>
            <span>{activeImage + 1} / {gallery.length}</span>
            <button onClick={() => setActiveImage((activeImage + 1) % gallery.length)}>{translations.common.next}</button>
          </div>
        </div>
      )}
    </div>
  )
}
