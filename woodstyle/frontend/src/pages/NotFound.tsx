import { Link } from 'react-router-dom'

import Icon from '../components/Icon'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { usePreferencesStore } from '../store/app'

export default function NotFound() {
  const locale = usePreferencesStore((state) => state.locale)
  useDocumentMeta('Page not found', 'Return to the WoodStyle collection.', locale)
  return (
    <section className="container status-page">
      <span className="status-code">404</span>
      <span className="empty-icon"><Icon name="leaf" size={32} /></span>
      <h1>This page is not part of the collection</h1>
      <p>The address may have changed, or the page is no longer available.</p>
      <div>
        <Link className="button button-primary" to="/catalog">Explore catalog</Link>
        <Link className="button button-ghost" to="/">Return home</Link>
      </div>
    </section>
  )
}
