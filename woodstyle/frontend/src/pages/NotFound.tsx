import { Link } from 'react-router-dom'

import statusImage from '../assets/images/site/not-found-scene-v1.webp'
import Icon from '../components/Icon'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { usePreferencesStore } from '../store/app'

export default function NotFound() {
  const locale = usePreferencesStore((state) => state.locale)
  const copy = {
    en: { title: 'Page Not Found', text: 'We cannot find the page you are looking for. Let us get you back to something beautiful.', home: 'Back home', catalog: 'Browse catalog' },
    ru: { title: 'Страница не найдена', text: 'Мы не смогли найти нужную страницу. Вернёмся к красивым вещам.', home: 'На главную', catalog: 'Открыть каталог' },
    de: { title: 'Seite nicht gefunden', text: 'Die gesuchte Seite wurde nicht gefunden. Kehren wir zu etwas Schönem zurück.', home: 'Zur Startseite', catalog: 'Katalog ansehen' },
    ja: { title: 'ページが見つかりません', text: 'お探しのページは見つかりませんでした。美しい家具の世界へ戻りましょう。', home: 'ホームへ戻る', catalog: 'カタログを見る' },
    fr: { title: 'Page introuvable', text: 'La page recherchée est introuvable. Revenons à quelque chose de beau.', home: 'Retour à l’accueil', catalog: 'Voir le catalogue' },
  }[locale]
  useDocumentMeta(copy.title, copy.text, locale)
  return (
    <section className="status-scene status-scene-404" style={{ backgroundImage: `url(${statusImage})` }}>
      <div className="status-scene-card">
        <span className="empty-icon"><Icon name="leaf" size={26} /></span>
        <span className="status-code">404</span>
        <h1>{copy.title}</h1>
        <i />
        <p>{copy.text}</p>
        <div>
          <Link className="button button-primary" to="/">{copy.home}</Link>
          <Link className="button button-secondary" to="/catalog">{copy.catalog}</Link>
        </div>
      </div>
    </section>
  )
}
