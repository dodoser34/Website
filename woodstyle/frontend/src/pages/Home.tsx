import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api, imageFor } from '../api/client'
import heroImage from '../assets/images/site/home-hero-v3.webp'
import materialImage from '../assets/images/site/material-walnut-detail-v2.webp'
import ProductCard from '../components/ProductCard'
import Icon from '../components/Icon'
import { EmptyState, Skeleton } from '../components/ui'
import { showroom } from '../config/showroom'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'

export default function Home() {
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.home
  const office = showroom(locale)
  useDocumentMeta(translations.meta.homeTitle, copy.lead, locale)
  const products = useQuery({
    queryKey: ['products', 'home', locale, currency],
    queryFn: () => api.products({ locale, currency, page_size: 5 }),
  })
  const categories = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api.categories(locale),
  })

  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-visual reveal reveal-delay-1">
            <img src={heroImage} alt={copy.heroAlt} fetchPriority="high" />
          </div>
          <div className="hero-copy reveal">
            <span className="eyebrow">{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.lead}</p>
            <div className="hero-buttons">
              <Link className="button button-primary" to="/catalog">{copy.primary}<Icon name="arrow" size={18} /></Link>
              <Link className="button button-ghost" to="/about">{copy.secondary}<Icon name="arrow" size={17} /></Link>
            </div>
          </div>
        </div>
      </section>

      <section className="section home-categories">
        <div className="container">
          <div className="section-heading reveal">
            <div><h2>{copy.categoriesTitle}</h2></div>
            <Link className="text-link" to="/catalog">{copy.viewAll}<Icon name="arrow" size={17} /></Link>
          </div>
          <div className="categories-grid">
            {(categories.data || []).slice(0, 5).map((category, index) => (
              <Link className={`category-card reveal reveal-delay-${Math.min(index, 3)}`} key={category.id} to={`/catalog?category=${category.slug}`}>
                <div className="category-image"><img src={imageFor(category.image)} alt={category.name} loading="lazy" /></div>
                <span><strong>{category.name}</strong><small>{category.product_count} {translations.common.pieces}</small></span>
                <Icon name="arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section section-collection home-products">
        <div className="container">
          <div className="section-heading reveal">
            <div><h2>{copy.popular}</h2></div>
            <Link className="text-link" to="/catalog">{copy.viewAll}<Icon name="arrow" size={17} /></Link>
          </div>
          {products.isLoading ? (
            <div className="products-grid">{[0, 1, 2, 3, 4].map((item) => <div className="product-skeleton" key={item}><Skeleton /><Skeleton /><Skeleton /></div>)}</div>
          ) : products.isError ? (
            <EmptyState title={copy.unavailableTitle} text={products.error.message} />
          ) : (
            <div className="products-grid products-grid-home">{products.data?.items.map((product) => <ProductCard product={product} key={product.id} />)}</div>
          )}
        </div>
      </section>

      <section className="container materials-feature">
        <div className="materials-copy reveal">
          <span className="eyebrow"><span />{copy.materialsEyebrow}</span>
          <h2>{copy.materialsTitle}</h2>
          <p>{copy.materialsText}</p>
          <Link className="text-link" to="/about">{copy.materialsCta}<Icon name="arrow" /></Link>
        </div>
        <div className="materials-image reveal reveal-delay-1"><img src={materialImage} alt="" loading="lazy" /></div>
      </section>

      <section className="service-strip home-service-strip">
        <div className="container service-strip-grid">
          {copy.services.map((service, index) => (
            <article key={service.title}>
              <Icon name={(['leaf', 'sparkles', 'clock', 'shield'] as const)[index]} size={22} />
              <span><strong>{service.title}</strong><small>{service.text}</small></span>
            </article>
          ))}
        </div>
      </section>

      <section className="container showroom-cta reveal">
        <div>
          <span className="eyebrow light"><span />{office.address}</span>
          <h2>{copy.showroomTitle}</h2>
          <p>{copy.showroomText}</p>
        </div>
        <Link className="button button-light" to="/contacts">{copy.showroomCta}<Icon name="arrow" /></Link>
      </section>
    </>
  )
}
