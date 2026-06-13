import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api, imageFor } from '../api/client'
import Icon from '../components/Icon'
import { EmptyState } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { useGuestStore, usePreferencesStore, useSessionStore } from '../store/app'
import { formatMoney } from '../utils/format'

export default function Cart() {
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.cart
  const token = useSessionStore((state) => state.accessToken)
  const guest = useGuestStore()
  const queryClient = useQueryClient()
  useDocumentMeta(translations.common.cart, translations.meta.cartDescription, locale)
  const serverCart = useQuery({
    queryKey: ['cart', locale, currency],
    queryFn: () => api.cart(locale, currency),
    enabled: Boolean(token),
  })
  const guestProducts = useQuery({
    queryKey: ['products', 'guest-cart', locale, currency],
    queryFn: () => api.products({ locale, currency, page_size: 100 }),
    enabled: !token && guest.cart.length > 0,
  })
  const update = useMutation({
    mutationFn: ({ id, quantity }: { id: number; quantity: number }) => api.updateCart(id, quantity, locale, currency),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })
  const remove = useMutation({
    mutationFn: (id: number) => api.deleteCart(id, locale, currency),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cart'] }),
  })

  const lines = token
    ? serverCart.data?.items || []
    : guest.cart.flatMap((entry) => {
        const product = guestProducts.data?.items.find((item) => item.id === entry.product_id)
        return product ? [{ id: product.id, quantity: entry.quantity, line_minor: product.price_minor * entry.quantity, product }] : []
      })
  const subtotal = token ? serverCart.data?.subtotal_minor || 0 : lines.reduce((total, line) => total + line.line_minor, 0)
  const digits = token ? serverCart.data?.currency_digits || 2 : lines[0]?.product.currency_digits || 2

  return (
    <section className="container commerce-page">
      <div className="commerce-heading reveal">
        <span className="eyebrow"><span />{copy.eyebrow}</span>
        <h1>{translations.common.cart}</h1>
        <p>{lines.length ? `${lines.reduce((sum, line) => sum + line.quantity, 0)} ${copy.ready}` : ''}</p>
      </div>
      {!lines.length ? (
        <EmptyState icon="cart" title={translations.common.emptyCart} text={copy.emptyText} action={translations.common.viewCatalog} />
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {lines.map((line) => (
              <article className="cart-line reveal" key={line.id}>
                <Link className="cart-line-image" to={`/product/${line.product.id}`}><img src={imageFor(line.product.image)} alt={line.product.name} /></Link>
                <div className="cart-line-copy">
                  <small>{line.product.category}</small><Link to={`/product/${line.product.id}`}>{line.product.name}</Link>
                  <span>{line.product.material} · SKU {line.product.sku}</span>
                  <button className="text-danger mobile-remove" onClick={() => token ? remove.mutate(line.id) : guest.removeCart(line.product.id)}>{translations.common.remove}</button>
                </div>
                <div className="quantity-control">
                  <button aria-label={copy.decrease} onClick={() => {
                    const quantity = Math.max(1, line.quantity - 1)
                    token ? update.mutate({ id: line.id, quantity }) : guest.setCartQuantity(line.product.id, quantity)
                  }}><Icon name="minus" /></button>
                  <span><small>{copy.quantityShort}</small><strong>{line.quantity}</strong></span>
                  <button aria-label={copy.increase} onClick={() => {
                    const quantity = Math.min(line.product.stock, line.quantity + 1)
                    token ? update.mutate({ id: line.id, quantity }) : guest.setCartQuantity(line.product.id, quantity)
                  }}><Icon name="plus" /></button>
                </div>
                <strong className="cart-line-price">{formatMoney(line.line_minor, currency, digits, locale)}</strong>
                <button className="icon-remove" aria-label={translations.common.remove} onClick={() => token ? remove.mutate(line.id) : guest.removeCart(line.product.id)}><Icon name="close" /></button>
              </article>
            ))}
            <Link className="continue-shopping" to="/catalog"><Icon name="arrow" />{copy.continueShopping}</Link>
          </div>
          <aside className="order-summary">
            <span className="eyebrow"><span />{copy.summary}</span>
            <h2>{copy.yourOrder}</h2>
            <div><span>{translations.common.products}</span><strong>{formatMoney(subtotal, currency, digits, locale)}</strong></div>
            <div><span>{translations.common.shipping}</span><em>{copy.calculatedNext}</em></div>
            <div className="summary-total"><span>{copy.subtotal}</span><strong>{formatMoney(subtotal, currency, digits, locale)}</strong></div>
            <p><Icon name="shield" />{copy.fixedPrice}</p>
            <Link className="button button-primary button-wide" to={token ? '/checkout' : '/auth'}>{translations.common.checkout}<Icon name="arrow" /></Link>
          </aside>
        </div>
      )}
    </section>
  )
}
