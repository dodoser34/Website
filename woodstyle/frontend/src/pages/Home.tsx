import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'

import { api, imageFor } from '../api/client'
import diningImage from '../assets/images/editorial-dining-v1.webp'
import heroImage from '../assets/images/hero-wide-v2.jpg'
import materialImage from '../assets/images/material-oak-detail-v1.webp'
import BrandMark from '../components/BrandMark'
import ProductCard from '../components/ProductCard'
import Icon from '../components/Icon'
import { EmptyState, Skeleton } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'

export default function Home() {
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.home
  useDocumentMeta(translations.meta.homeTitle, copy.lead, locale)
  const products = useQuery({
    queryKey: ['products', 'home', locale, currency],
    queryFn: () => api.products({ locale, currency, page_size: 4 }),
  })
  const categories = useQuery({
    queryKey: ['categories', locale],
    queryFn: () => api.categories(locale),
  })

  return (
    <>
      <section className="home-hero">
        <div className="container hero-grid">
          <div className="hero-copy reveal">
            <span className="eyebrow"><span />{copy.eyebrow}</span>
            <h1>{copy.title}</h1>
            <p>{copy.lead}</p>
            <div className="hero-buttons">
              <Link className="button button-primary" to="/catalog">{copy.primary}<Icon name="arrow" size={18} /></Link>
              <Link className="button button-ghost" to="/about">{copy.secondary}</Link>
            </div>
            <div className="hero-signature">
              <span><strong>10</strong>{copy.years}</span>
              <span><strong>160+</strong>{copy.currencies}</span>
              <span><strong>5</strong>{copy.serviceLanguages}</span>
            </div>
          </div>
          <div className="hero-visual reveal reveal-delay-1">
            <img src={heroImage} alt={copy.heroAlt} fetchPriority="high" />
            <span className="hero-emblem"><BrandMark size={68} /></span>
            <div className="hero-floating-card">
              <span>01</span>
              <div><small>{copy.collection}</small><strong>Natural Living</strong></div>
              <Icon name="arrow" size={18} />
            </div>
          </div>
        </div>
      </section>

      <section className="service-strip">
        <div className="container service-strip-grid">
          {copy.services.map((service, index) => (
            <article key={service.title}>
              <Icon name={(['sparkles', 'truck', 'shield', 'leaf'] as const)[index]} size={22} />
              <span><strong>{service.title}</strong><small>{service.text}</small></span>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-heading reveal">
            <div><span className="eyebrow"><span />{copy.categories}</span><h2>{copy.categoriesTitle}</h2></div>
            <Link className="text-link" to="/catalog">{copy.viewAll}<Icon name="arrow" size={17} /></Link>
          </div>
          <div className="categories-grid">
            {(categories.data || []).slice(0, 4).map((category, index) => (
              <Link className={`category-card reveal reveal-delay-${Math.min(index, 3)}`} key={category.id} to={`/catalog?category=${category.slug}`}>
                <div className="category-image"><img src={imageFor(category.image)} alt={category.name} loading="lazy" /></div>
                <span><strong>{category.name}</strong><small>{category.product_count} {translations.common.pieces}</small></span>
                <Icon name="arrow" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="editorial-split">
        <div className="editorial-image reveal"><img src={diningImage} alt="" loading="lazy" /></div>
        <div className="editorial-copy reveal reveal-delay-1">
          <span className="eyebrow light"><span />{copy.editorialEyebrow}</span>
          <h2>{copy.editorialTitle}</h2>
          <p>{copy.editorialText}</p>
          <Link className="button button-light" to="/catalog?category=tables">{copy.editorialCta}<Icon name="arrow" /></Link>
        </div>
      </section>

      <section className="section section-collection">
        <div className="container">
          <div className="section-heading reveal">
            <div><span className="eyebrow"><span />{copy.popular}</span><h2>{copy.popularTitle}</h2></div>
          </div>
          {products.isLoading ? (
            <div className="products-grid">{[0, 1, 2, 3].map((item) => <div className="product-skeleton" key={item}><Skeleton /><Skeleton /><Skeleton /></div>)}</div>
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

      <section className="container showroom-cta reveal">
        <div>
          <span className="eyebrow light"><span />Köln · Kleine Budengasse 1-3</span>
          <h2>{copy.showroomTitle}</h2>
          <p>{copy.showroomText}</p>
        </div>
        <Link className="button button-light" to="/contacts">{copy.showroomCta}<Icon name="arrow" /></Link>
      </section>
    </>
  )
}
