import Icon from '../../components/Icon'
import { Badge } from '../../components/ui'
import { getTranslations } from '../../i18n'
import type { AdminMessage, Locale } from '../../types'
import { formatDate } from '../../utils/format'

export function MessagesPanel({
  messages,
  locale,
  query,
  onProcess,
}: {
  messages: AdminMessage[]
  locale: Locale
  query: string
  onProcess: (id: number) => void
}) {
  const copy = getTranslations(locale).admin.messages
  const visible = messages.filter((item) =>
    `${item.name} ${item.email} ${item.message}`.toLowerCase().includes(query),
  )

  return (
    <section className="admin-panel messages-list">
      <header className="panel-title">
        <div>
          <small>{messages.filter((item) => !item.is_processed).length} {copy.new}</small>
          <h2>{copy.title}</h2>
        </div>
      </header>
      {visible.length ? visible.map((item) => (
        <article className={item.is_processed ? 'processed' : ''} key={item.id}>
          <header>
            <span className="message-avatar">{item.name.charAt(0).toUpperCase()}</span>
            <div><strong>{item.name}</strong><span>{item.email} · {item.phone}</span></div>
            <Badge tone={item.is_processed ? 'success' : 'warning'}>
              {item.is_processed ? copy.processed : copy.newStatus}
            </Badge>
          </header>
          <p>{item.message}</p>
          <footer>
            <small>{formatDate(item.created_at, locale, { dateStyle: 'medium', timeStyle: 'short' })}</small>
            {!item.is_processed && (
              <button className="small-button" onClick={() => onProcess(item.id)}>
                {copy.markProcessed}<Icon name="check" size={15} />
              </button>
            )}
          </footer>
        </article>
      )) : (
        <div className="admin-empty"><Icon name="mail" /><strong>{copy.empty}</strong></div>
      )}
    </section>
  )
}
