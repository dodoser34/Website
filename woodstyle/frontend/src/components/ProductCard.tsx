import { useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'motion/react'
import { useState } from 'react'
import { Link } from 'react-router-dom'

import { api, imageFor } from '../api/client'
import { galleryPathsFor } from '../api/images'
import { getTranslations } from '../i18n'
import { useGuestStore, usePreferencesStore, useSessionStore } from '../store/app'
import type { Product } from '../types'
import { formatMoney } from '../utils/format'
import { useReducedMotion } from '../shared/motion/useReducedMotion'
import { useToast } from '../shared/ui/ToastProvider'
import Icon from './Icon'

export default function ProductCard({ product }: { product: Product }) {
  const { locale, currency } = usePreferencesStore()
  const copy = getTranslations(locale)
  const token = useSessionStore((state) => state.accessToken)
  const guestFavorites = useGuestStore((state) => state.favorites)
  const toggleGuestFavorite = useGuestStore((state) => state.toggleFavorite)
  const addGuestCart = useGuestStore((state) => state.addCart)
  const [added, setAdded] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const queryClient = useQueryClient()
  const toast = useToast()
  const reducedMotion = useReducedMotion()
  const serverFavorites = queryClient.getQueryData<Product[]>(['favorites', locale, currency])
  const gallery = galleryPathsFor(product.image)
  const primaryImage = gallery[0] || product.image
  const alternateImage = gallery[1]
  const favorite = token
    ? Boolean(serverFavorites?.some((item) => item.id === product.id))
    : guestFavorites.includes(product.id)

  const favoriteMutation = useMutation({
    mutationFn: () => favorite ? api.deleteFavorite(product.id) : api.addFavorite(product.id),
    onMutate: async () => {
      const key = ['favorites', locale, currency]
      await queryClient.cancelQueries({ queryKey: key })
      const previous = queryClient.getQueryData<Product[]>(key)
      queryClient.setQueryData<Product[]>(key, (current = []) =>
        favorite
          ? current.filter((item) => item.id !== product.id)
          : [...current, product],
      )
      return { previous, key }
    },
    onError: (error, _variables, context) => {
      if (context) queryClient.setQueryData(context.key, context.previous)
      toast.push(error.message, 'error')
    },
    onSuccess: () => {
      toast.push(favorite ? 'Removed from favorites' : 'Added to favorites', 'success')
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['favorites'] }),
  })
  const cartMutation = useMutation({
    mutationFn: () => api.addCart(product.id, 1, locale, currency),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cart'] })
      setAdded(true)
      toast.push(copy.common.addedToCart, 'success')
      window.setTimeout(() => setAdded(false), 1600)
    },
    onError: (error) => toast.push(error.message, 'error'),
  })

  const addCart = () => {
    if (token) cartMutation.mutate()
    else {
      addGuestCart(product.id, 1)
      setAdded(true)
      toast.push(copy.common.addedToCart, 'success')
      window.setTimeout(() => setAdded(false), 1600)
    }
  }

  return (
    <motion.article
      className="product-card"
      whileHover={reducedMotion ? undefined : { y: -4 }}
      whileTap={reducedMotion ? undefined : { scale: 0.995 }}
      transition={{ duration: 0.22 }}
    >
      <div className="product-media">
        <Link className="product-image" to={`/product/${product.id}`}>
          <motion.img
            className="product-image-primary"
            layoutId={reducedMotion ? undefined : `product-image-${product.id}`}
            src={imageFor(primaryImage)}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onLoad={() => setImageLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: imageLoaded ? 1 : 0 }}
            transition={{ duration: 0.3 }}
          />
          {alternateImage ? (
            <img
              className="product-image-secondary"
              src={imageFor(alternateImage)}
              alt=""
              loading="lazy"
              decoding="async"
              aria-hidden="true"
            />
          ) : null}
        </Link>
        <span className="product-category">{product.category}</span>
        <button
          className={`favorite-button ${favorite ? 'is-favorite' : ''}`}
          onClick={() => {
            if (token) favoriteMutation.mutate()
            else {
              toggleGuestFavorite(product.id)
              toast.push(
                favorite ? 'Removed from favorites' : 'Added to favorites',
                'success',
              )
            }
          }}
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
    </motion.article>
  )
}
