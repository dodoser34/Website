import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { api, imageFor } from '../api/client'
import { getTranslations } from '../i18n'
import { useGuestStore, usePreferencesStore, useSessionStore } from '../store/app'
import type { Product } from '../types'
import { formatMoney } from '../utils/format'
import Icon from './Icon'

export default function ProductCard({ product }: { product: Product }) {
  const { locale, currency } = usePreferencesStore()
  const copy = getTranslations(locale)
  const token = useSessionStore((state) => state.accessToken)
  const guestFavorites = useGuestStore((state) => state.favorites)
  const toggleGuestFavorite = useGuestStore((state) => state.toggleFavorite)
  const addGuestCart = useGuestStore((state) => state.addCart)
  const [added, setAdded] = useState(false)
  const queryClient = useQueryClient()
  const serverFavorites = queryClient.getQueryData<Product[]>(['favorites', locale, currency])
  const favorite = token
    ? Boolean(serverFavorites?.some((item) => item.id === product.id))
    : guestFavorites.includes(product.id)

  const favoriteMutation = useMutation({
    mutationFn: () => favorite ? api.deleteFavorite(product.id) : api.addFavorite(product.id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })
  const cartMutation = useMutation({
    mutationFn: () => api.addCart(product.id, 1, locale, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1600)
    },
  })

  const addCart = () => {
    if (token) cartMutation.mutate()
    else {
      addGuestCart(product.id, 1)
      setAdded(true)
      window.setTimeout(() => setAdded(false), 1600)
    }
  }

  return (
    <article className="product-card reveal">
      <div className="product-media">
        <Link className="product-image" to={`/product/${product.id}`}>
          <img src={imageFor(product.image)} alt={product.name} loading="lazy" decoding="async" />
        </Link>
        <span className="product-category">{product.category}</span>
        <button
          className={`favorite-button ${favorite ? 'is-favorite' : ''}`}
          onClick={() => token ? favoriteMutation.mutate() : toggleGuestFavorite(product.id)}
          aria-label={copy.common.favorites}
        >
          <Icon name="heart" size={18} />
        </button>
      </div>
      <div className="product-card-body">
        <div className="product-card-copy">
          <Link to={`/product/${product.id}`}>{product.name}</Link>
          <small>{product.material || product.category}</small>
        </div>
        <div className="product-card-price">
          <strong>{formatMoney(product.price_minor, product.currency, product.currency_digits, locale)}</strong>
          <span className={product.stock ? 'stock-dot' : 'stock-dot out'}>{product.stock ? `${product.stock} ${copy.common.inStock}` : copy.common.outOfStock}</span>
        </div>
        <button className={`card-cart-button ${added ? 'is-added' : ''}`} onClick={addCart} disabled={product.stock === 0 || cartMutation.isPending}>
          <Icon name={added ? 'check' : 'cart'} size={18} />
          <span>{added ? copy.common.added : copy.common.addToCart}</span>
        </button>
      </div>
    </article>
  )
}
