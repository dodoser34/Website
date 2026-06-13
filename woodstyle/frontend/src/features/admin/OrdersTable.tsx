import { getTranslations } from '../../i18n'
import type { Locale, Order } from '../../types'
import { formatDate } from '../../utils/format'
import Icon from '../../components/Icon'
import { Badge } from '../../components/ui'

const orderStatuses = [
  'pending_payment',
  'paid',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'payment_failed',
]

function statusTone(status: string) {
  if (['paid', 'delivered', 'processed', 'active'].includes(status)) return 'success' as const
  if (['cancelled', 'payment_failed', 'hidden'].includes(status)) return 'danger' as const
  return 'warning' as const
}

export function OrdersTable({
  orders,
  onChange,
  locale,
}: {
  orders: Order[]
  onChange: (id: number, status: string) => void
  locale: Locale
}) {
  const copy = getTranslations(locale)
  const labels = copy.admin.orders
  const statusLabel = (status: string) =>
    copy.orders.statuses[status as keyof typeof copy.orders.statuses] ?? status

  return (
    <section className="admin-panel table-wrap">
      <header className="panel-title">
        <div><small>{orders.length} {labels.count}</small><h2>{labels.title}</h2></div>
      </header>
      <table>
        <thead><tr><th>{labels.order}</th><th>{labels.created}</th><th>{labels.customer}</th><th>{labels.items}</th><th>{labels.total}</th><th>{labels.status}</th></tr></thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td data-label={labels.order}><strong>#{String(order.id).padStart(5, '0')}</strong></td>
              <td data-label={labels.created}>{formatDate(order.created_at, locale)}</td>
              <td data-label={labels.customer}><strong>{order.shipping_address.recipient_name}</strong><small>{order.shipping_address.city}, {order.shipping_address.country_code}</small></td>
              <td data-label={labels.items}>{order.items.map((item) => `${item.product_name} × ${item.quantity}`).join(', ')}</td>
              <td data-label={labels.total}><strong>{order.currency} {(order.total_minor / 10 ** order.currency_digits).toFixed(order.currency_digits)}</strong></td>
              <td data-label={labels.status}>
                <label className="status-select">
                  <Badge tone={statusTone(order.status)}>{statusLabel(order.status)}</Badge>
                  <select aria-label={labels.status} value={order.status} onChange={(event) => onChange(order.id, event.target.value)}>
                    {orderStatuses.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                  </select>
                </label>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {!orders.length && <div className="admin-empty"><Icon name="box" /><strong>{labels.empty}</strong></div>}
    </section>
  )
}
