import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import Icon from '../components/Icon'
import { Badge, EmptyState, PageHero } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'
import { formatDate, formatMoney } from '../utils/format'

const statusOrder = ['pending_payment', 'paid', 'processing', 'shipped', 'delivered']

export default function Orders() {
  const { locale } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.orders
  const orders = useQuery({ queryKey: ['orders'], queryFn: api.orders })
  useDocumentMeta(translations.common.orders, translations.meta.ordersDescription, locale)
  const statusLabel = (status: string) => {
    return copy.statuses[status as keyof typeof copy.statuses] || status
  }

  return (
    <section className="orders-page">
      <PageHero eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} />
      <div className="container orders-content">
        {!orders.data?.length ? (
          <EmptyState icon="box" title={copy.emptyTitle} text={copy.emptyText} action={translations.common.viewCatalog} />
        ) : (
          <div className="orders-list">
            {orders.data.map((order) => {
              const activeStep = statusOrder.indexOf(order.status)
              const failed = ['cancelled', 'payment_failed'].includes(order.status)
              return (
                <article className="order-card reveal" key={order.id}>
                  <header>
                    <div><small>{copy.order}</small><strong>#{String(order.id).padStart(5, '0')}</strong><span>{formatDate(order.created_at, locale, { year: 'numeric', month: 'long', day: 'numeric' })}</span></div>
                    <Badge tone={failed ? 'danger' : order.status === 'delivered' ? 'success' : 'warning'}>{statusLabel(order.status)}</Badge>
                  </header>
                  {!failed && <div className="order-timeline">
                    {statusOrder.slice(1).map((status, index) => <span className={activeStep >= index + 1 ? 'complete' : ''} key={status}><i>{activeStep > index + 1 ? <Icon name="check" size={13} /> : index + 1}</i><em>{statusLabel(status)}</em></span>)}
                  </div>}
                  <div className="order-body">
                    <div className="order-items">{order.items.map((item) => <span key={item.id}><strong>{item.product_name}</strong><small>SKU {item.sku} · {translations.common.quantity} {item.quantity}</small></span>)}</div>
                    <div className="order-delivery"><small>{copy.delivery}</small><strong>{order.shipping_address.recipient_name}</strong><span>{order.shipping_address.address_line1}<br />{order.shipping_address.city}, {order.shipping_address.country_code} {order.shipping_address.postal_code}</span></div>
                  </div>
                  <footer>
                    <span>{order.payment?.last4 ? `${copy.card} •••• ${order.payment.last4}` : statusLabel(order.status)}</span>
                    <div><small>{copy.orderTotal}</small><strong>{formatMoney(order.total_minor, order.currency, order.currency_digits, locale)}</strong></div>
                  </footer>
                </article>
              )
            })}
          </div>
        )}
        <Link className="profile-back-link" to="/profile"><Icon name="arrow" />{copy.back}</Link>
      </div>
    </section>
  )
}
