import { imageFor } from '../../api/client'
import Icon from '../../components/Icon'
import { Badge } from '../../components/ui'
import { getTranslations } from '../../i18n'
import type { AdminDashboard, AdminProduct, Locale } from '../../types'
import { formatUsd } from '../../utils/format'
import { fallbackLocaleName } from './model'
import { useReducedMotion } from '../../shared/motion/useReducedMotion'

type IconName = Parameters<typeof Icon>[0]['name']

function AnimatedValue({
  value,
  format,
}: {
  value: number
  format: (value: number) => string
}) {
  const reducedMotion = useReducedMotion()
  const [display, setDisplay] = useState(reducedMotion ? value : 0)
  useEffect(() => {
    if (reducedMotion) {
      setDisplay(value)
      return
    }
    const controls = animate(0, value, {
      duration: 0.75,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (current) => setDisplay(current),
    })
    return () => controls.stop()
  }, [reducedMotion, value])
  return <>{format(Math.round(display))}</>
}

export function DashboardPanel({
  dashboard,
  products,
  locale,
}: {
  dashboard?: AdminDashboard
  products: AdminProduct[]
  locale: Locale
}) {
  const translations = getTranslations(locale)
  const copy = translations.admin.dashboard
  const statusCounts = dashboard?.status_counts || {}
  const maxStatus = Math.max(1, ...Object.values(statusCounts))
  const revenue = Number(dashboard?.revenue_usd_cents || 0)
  const orderCount = Number(dashboard?.orders || 0)

  return (
    <>
      <div className="stats-grid">
        {[
          [copy.revenue, revenue, 'sparkles', copy.allSales, (value: number) => formatUsd(value, locale)],
          [copy.orders, orderCount, 'box', `${Object.values(statusCounts).reduce((sum, value) => sum + value, 0)} ${copy.total}`, String],
          [copy.averageOrder, orderCount ? Math.round(revenue / orderCount) : 0, 'currency', copy.allOrders, (value: number) => formatUsd(value, locale)],
          [copy.customers, Number(dashboard?.users || 0), 'user', `${Number(dashboard?.products || 0)} ${copy.products}`, String],
        ].map(([label, value, icon, note, formatter]) => (
          <article key={String(label)}>
            <span className="stat-icon"><Icon name={icon as IconName} /></span>
            <small>{label as string}</small>
            <strong><AnimatedValue value={value as number} format={formatter as (value: number) => string} /></strong>
            <em>{note as string}</em>
          </article>
        ))}
      </div>
      <div className="dashboard-grid">
        <section className="admin-panel dashboard-chart">
          <header>
            <div><small>{copy.storeHealth}</small><h2>{copy.orderDistribution}</h2></div>
            <Badge>{copy.allTime}</Badge>
          </header>
          <div className="status-chart">
            {Object.entries(statusCounts).length ? Object.entries(statusCounts).map(([key, value]) => (
              <div key={key}>
                <span>
                  <strong>{translations.orders.statuses[key as keyof typeof translations.orders.statuses] || key.replaceAll('_', ' ')}</strong>
                  <em>{value}</em>
                </span>
                <i><b style={{ width: `${Math.max(8, value / maxStatus * 100)}%` }} /></i>
              </div>
            )) : <p>{copy.noData}</p>}
          </div>
        </section>
        <section className="admin-panel top-products">
          <header><div><small>{copy.catalog}</small><h2>{copy.popularProducts}</h2></div></header>
          {products
            .slice()
            .sort((a, b) => b.popularity - a.popularity)
            .slice(0, 4)
            .map((item, index) => (
              <article key={item.id}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <img src={imageFor(item.image)} alt="" />
                <div>
                  <strong>{fallbackLocaleName(item.translations, locale)}</strong>
                  <small>{item.sku} · {item.stock} {copy.inStock}</small>
                </div>
                <em>{item.popularity}</em>
              </article>
            ))}
        </section>
      </div>
    </>
  )
}
import { animate } from 'motion/react'
import { useEffect, useState } from 'react'
