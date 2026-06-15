import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { api } from '../api/client'
import Icon from '../components/Icon'
import ProductCard from '../components/ProductCard'
import { EmptyState, PageHero, Skeleton } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'
import { Drawer } from '../shared/ui/Drawer'

export default function Catalog() {
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.catalog
  const [params, setParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const search = params.get('q') || ''
  const category = params.get('category') || ''
  const sort = params.get('sort') || 'popular'
  const minPrice = params.get('min') || ''
  const maxPrice = params.get('max') || ''
  const page = Number(params.get('page') || 1)
  useDocumentMeta(copy.title, copy.lead, locale)

  const categories = useQuery({ queryKey: ['categories', locale], queryFn: () => api.categories(locale) })
  const products = useQuery({
    queryKey: ['products', locale, currency, search, category, sort, page, minPrice, maxPrice],
    queryFn: () => api.products({
      locale,
      currency,
      q: search,
      category,
      sort,
      min_price: minPrice ? Math.round(Number(minPrice) * 100) : undefined,
      max_price: maxPrice ? Math.round(Number(maxPrice) * 100) : undefined,
      page,
      page_size: 9,
    }),
  })

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    if (key !== 'page') next.delete('page')
    setParams(next)
  }
  const clear = () => setParams(new URLSearchParams())
  const activeFilters = [
    category && (categories.data || []).find((item) => item.slug === category)?.name,
    search && `"${search}"`,
    minPrice && `${copy.from} $${minPrice}`,
    maxPrice && `${copy.to} $${maxPrice}`,
  ].filter(Boolean) as string[]
  const filterControls = (mobile = false) => (
    <>
      <div className="filters-title">
        <div><small>{copy.eyebrow}</small><h2>{copy.filters}</h2></div>
      </div>
      <div className="filter-group">
        <h3>{copy.room}</h3>
        <label className="filter-option"><input type="radio" checked={!category} onChange={() => update('category', '')} /><span>{copy.all}</span></label>
        {(categories.data || []).map((item) => (
          <label className="filter-option" key={item.id}>
            <input type="radio" checked={category === item.slug} onChange={() => update('category', item.slug)} />
            <span>{item.name}</span><small>{item.product_count}</small>
          </label>
        ))}
      </div>
      <div className="filter-group">
        <h3>{copy.priceRange}</h3>
        <div className="price-inputs">
          <label><span>{copy.from}</span><input aria-label={copy.minimumPrice} type="number" min="0" placeholder="0" value={minPrice} onChange={(event) => update('min', event.target.value)} /></label>
          <label><span>{copy.to}</span><input aria-label={copy.maximumPrice} type="number" min="0" placeholder="5000" value={maxPrice} onChange={(event) => update('max', event.target.value)} /></label>
        </div>
      </div>
      {activeFilters.length > 0 && <button className="clear-filters" onClick={clear}><Icon name="close" size={15} />{copy.clear}</button>}
      {mobile && <button className="button button-primary mobile-apply" onClick={() => setFiltersOpen(false)}>{copy.showProducts}</button>}
    </>
  )

  return (
    <div className="catalog-page">
      <PageHero
        eyebrow={copy.eyebrow}
        title={copy.title}
        lead={copy.lead}
        aside={
          <label className="catalog-search">
            <Icon name="search" />
            <input value={search} onChange={(event) => update('q', event.target.value)} placeholder={translations.common.search} />
            {search && <button onClick={() => update('q', '')} aria-label={copy.clearSearch}><Icon name="close" size={17} /></button>}
          </label>
        }
      />

      <section className="container catalog-shell">
        <div className="mobile-filter-bar">
          <button className="button button-secondary" onClick={() => setFiltersOpen(true)}>{copy.filters}{activeFilters.length > 0 && <span>{activeFilters.length}</span>}</button>
          <label className="toolbar-select">
            <select value={sort} onChange={(event) => update('sort', event.target.value)}>
              <option value="popular">{copy.sort.popular}</option>
              <option value="price-asc">{copy.sort.priceAsc}</option>
              <option value="price-desc">{copy.sort.priceDesc}</option>
              <option value="newest">{copy.sort.newest}</option>
            </select><Icon name="chevron" size={15} />
          </label>
        </div>

        <aside className="filters-panel">{filterControls()}</aside>
        <Drawer open={filtersOpen} onClose={() => setFiltersOpen(false)} title={copy.filters}>
          <div className="mobile-drawer-filters">{filterControls(true)}</div>
        </Drawer>

        <div className="catalog-results">
          <div className="catalog-toolbar">
            <div>
              <span><strong>{products.data?.total || 0}</strong> {copy.found}</span>
              {activeFilters.length > 0 && <div className="filter-chips">{activeFilters.map((filter) => <span key={filter}>{filter}</span>)}</div>}
            </div>
            <label className="toolbar-select desktop-sort">
              <select value={sort} onChange={(event) => update('sort', event.target.value)}>
                <option value="popular">{copy.sort.popular}</option>
                <option value="price-asc">{copy.sort.priceAsc}</option>
                <option value="price-desc">{copy.sort.priceDesc}</option>
                <option value="newest">{copy.sort.newest}</option>
              </select><Icon name="chevron" size={15} />
            </label>
          </div>
          {products.isLoading ? (
            <div className="products-grid catalog-grid">{Array.from({ length: 6 }).map((_, index) => <div className="product-skeleton" key={index}><Skeleton /><Skeleton /><Skeleton /></div>)}</div>
          ) : products.isError ? (
            <EmptyState title={copy.loadError} text={products.error.message} />
          ) : !products.data?.items.length ? (
            <EmptyState icon="search" title={copy.noTitle} text={copy.noText} action={copy.clear} to="/catalog" />
          ) : (
            <>
              <div className="products-grid catalog-grid">{products.data.items.map((item) => <ProductCard key={item.id} product={item} />)}</div>
              <div className="pagination">
                <button disabled={page <= 1} onClick={() => update('page', String(page - 1))}><Icon name="arrow" />{translations.common.previous}</button>
                <span>{copy.page} <strong>{page}</strong> / {products.data.pages || 1}</span>
                <button disabled={page >= (products.data.pages || 1)} onClick={() => update('page', String(page + 1))}>{translations.common.next}<Icon name="arrow" /></button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  )
}
