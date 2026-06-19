import { Link } from 'react-router-dom'

import { showroom } from '../config/showroom'
import { socialLinks } from '../config/socials'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'
import BrandMark from './BrandMark'
import Icon from './Icon'

export default function Footer() {
  const locale = usePreferencesStore((state) => state.locale)
  const copy = getTranslations(locale)
  const office = showroom(locale)
  return (
    <footer className="site-footer">
      <div className="container footer-top">
        <div className="footer-intro">
          <span className="footer-wordmark"><BrandMark size={25} /><strong>WOODSTYLE</strong><small>INTERNATIONAL</small></span>
          <p>{copy.footer.description}</p>
          <div className="footer-socials" aria-label="Social networks">
            {socialLinks.map((social) => (
              <a key={social.label} href={social.href} target="_blank" rel="noreferrer" aria-label={social.label}>
                <Icon name={social.icon} size={15} />
              </a>
            ))}
          </div>
        </div>
        <div className="footer-column">
          <strong>{copy.footer.collection}</strong>
          <Link to="/catalog">{copy.common.catalog}</Link>
          <Link to="/favorites">{copy.common.favorites}</Link>
          <Link to="/cart">{copy.common.cart}</Link>
        </div>
        <div className="footer-column">
          <strong>{copy.footer.studio}</strong>
          <Link to="/about">{copy.common.about}</Link>
          <Link to="/contacts">{copy.common.contacts}</Link>
          <Link to="/orders">{copy.common.orders}</Link>
        </div>
        <div className="footer-column footer-contact">
          <strong>{copy.footer.headquarters}</strong>
          <span>{office.address}</span>
          <a href={`mailto:${office.email}`}>{office.email}</a>
          <a href={`tel:${office.phone.replace(/\s/g, '')}`}>{office.phone}</a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 WoodStyle International</span>
        <span>{copy.footer.note}</span>
        <span>{copy.footer.languages}</span>
      </div>
    </footer>
  )
}
