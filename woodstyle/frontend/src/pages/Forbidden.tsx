import { Link } from 'react-router-dom'

import Icon from '../components/Icon'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { usePreferencesStore } from '../store/app'

export default function Forbidden() {
  const locale = usePreferencesStore((state) => state.locale)
  useDocumentMeta('Access restricted', 'This area requires administrator access.', locale)
  return (
    <section className="container status-page">
      <span className="status-code">403</span>
      <span className="empty-icon"><Icon name="shield" size={32} /></span>
      <h1>Access restricted</h1>
      <p>This area is available only to WoodStyle administrators.</p>
      <div>
        <Link className="button button-primary" to="/">Return home</Link>
        <Link className="button button-ghost" to="/profile">Open profile</Link>
      </div>
    </section>
  )
}
