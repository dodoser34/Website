import Icon from '../../components/Icon'
import { Badge } from '../../components/ui'
import { getTranslations } from '../../i18n'
import type { AdminCartItem, Locale, User } from '../../types'

export function UsersTables({
  users,
  carts,
  locale,
}: {
  users: User[]
  carts: AdminCartItem[]
  locale: Locale
}) {
  const copy = getTranslations(locale)
  const labels = copy.admin.users

  return (
    <div className="admin-stacked">
      <section className="admin-panel table-wrap">
        <header className="panel-title"><div><small>{users.length} {labels.accounts}</small><h2>{labels.customers}</h2></div></header>
        <table>
          <thead><tr><th>ID</th><th>{copy.common.email}</th><th>{copy.common.name}</th><th>{labels.role}</th><th>{labels.locale}</th><th>{labels.currency}</th><th>{copy.common.status}</th></tr></thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td data-label="ID">{user.id}</td>
                <td data-label={copy.common.email}><strong>{user.email}</strong></td>
                <td data-label={copy.common.name}>{user.first_name} {user.last_name}</td>
                <td data-label={labels.role}>
                  <Badge tone={user.role === 'admin' ? 'warning' : 'neutral'}>
                    {user.role === 'admin' ? copy.header.administrator : copy.header.member}
                  </Badge>
                </td>
                <td data-label={labels.locale}>{user.locale.toUpperCase()}</td>
                <td data-label={labels.currency}>{user.currency_code}</td>
                <td data-label={copy.common.status}><Badge tone={user.is_active ? 'success' : 'danger'}>{user.is_active ? copy.common.active : labels.inactive}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="admin-panel table-wrap">
        <header className="panel-title"><div><small>{labels.openIntent}</small><h2>{labels.carts}</h2></div></header>
        <table>
          <thead><tr><th>{labels.customer}</th><th>{labels.product}</th><th>{labels.quantity}</th></tr></thead>
          <tbody>{carts.map((item, index) => <tr key={`${item.email}-${item.product_name}-${index}`}><td data-label={labels.customer}>{item.email}</td><td data-label={labels.product}>{item.product_name}</td><td data-label={labels.quantity}>{item.quantity}</td></tr>)}</tbody>
        </table>
        {!carts.length && <div className="admin-empty compact"><Icon name="cart" /><strong>{labels.noCarts}</strong></div>}
      </section>
    </div>
  )
}
