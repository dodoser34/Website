import { Link } from 'react-router-dom'

import statusImage from '../assets/images/site/forbidden-scene-v1.webp'
import Icon from '../components/Icon'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { usePreferencesStore } from '../store/app'

export default function Forbidden() {
  const locale = usePreferencesStore((state) => state.locale)
  const copy = {
    en: { title: 'Access Restricted', text: 'You do not have permission to view this page. Sign in with an administrator account or return home.', home: 'Return home', signIn: 'Sign in' },
    ru: { title: 'Доступ ограничен', text: 'У вас нет прав для просмотра этой страницы. Войдите как администратор или вернитесь на главную.', home: 'На главную', signIn: 'Войти' },
    de: { title: 'Zugriff eingeschränkt', text: 'Sie haben keine Berechtigung für diese Seite. Melden Sie sich als Administrator an oder kehren Sie zur Startseite zurück.', home: 'Zur Startseite', signIn: 'Anmelden' },
    ja: { title: 'アクセス制限', text: 'このページを表示する権限がありません。管理者としてログインするか、ホームへ戻ってください。', home: 'ホームへ戻る', signIn: 'ログイン' },
    fr: { title: 'Accès restreint', text: 'Vous ne pouvez pas consulter cette page. Connectez-vous comme administrateur ou revenez à l’accueil.', home: 'Retour à l’accueil', signIn: 'Se connecter' },
  }[locale]
  useDocumentMeta(copy.title, copy.text, locale)
  return (
    <section className="status-scene" style={{ backgroundImage: `url(${statusImage})` }}>
      <div className="status-scene-card">
        <span className="empty-icon"><Icon name="shield" size={26} /></span>
        <span className="status-code">403</span>
        <h1>{copy.title}</h1>
        <i />
        <p>{copy.text}</p>
        <div>
          <Link className="button button-primary" to="/">{copy.home}</Link>
          <Link className="button button-secondary" to="/auth">{copy.signIn}</Link>
        </div>
      </div>
    </section>
  )
}
