import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useState } from 'react'

import { api, imageFor } from '../api/client'
import BrandMark from '../components/BrandMark'
import Icon from '../components/Icon'
import { Badge, FileDropzone, Field, SelectField, TextareaField } from '../components/ui'
import { CurrencyRow } from '../features/admin/CurrencyRow'
import { DashboardPanel } from '../features/admin/DashboardPanel'
import { LanguageTabs } from '../features/admin/LanguageTabs'
import { MessagesPanel } from '../features/admin/MessagesPanel'
import {
  createEmptyCategoryForm,
  createEmptyProductForm,
  createEmptyShippingForm,
  fallbackLocaleName,
  productToForm,
  shippingZoneName,
  type AdminTab,
} from '../features/admin/model'
import { OrdersTable } from '../features/admin/OrdersTable'
import { UsersTables } from '../features/admin/UsersTables'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { localeOptions } from '../i18n/config'
import { getTranslations } from '../i18n'
import { usePreferencesStore, useSessionStore } from '../store/app'
import type { Locale } from '../types'
 

type IconName = Parameters<typeof Icon>[0]['name']

export default function Admin() {
  const locale = usePreferencesStore((state) => state.locale)
  const currentUser = useSessionStore((state) => state.user)
  const translations = getTranslations(locale)
  const copy = translations.admin
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [search, setSearch] = useState('')
  const [editorLocale, setEditorLocale] = useState<Locale>('en')
  const [productForm, setProductForm] = useState(createEmptyProductForm)
  const [categoryForm, setCategoryForm] = useState(createEmptyCategoryForm)
  const [shippingForm, setShippingForm] = useState(createEmptyShippingForm)
  const [notice, setNotice] = useState<{ text: string; error?: boolean } | null>(null)
  const queryClient = useQueryClient()
  useDocumentMeta(copy.tabs[tab], copy.description, locale)

  const dashboard = useQuery({ queryKey: ['admin-dashboard'], queryFn: api.admin.dashboard })
  const productsQuery = useQuery({ queryKey: ['admin-products'], queryFn: api.admin.products })
  const categoriesQuery = useQuery({ queryKey: ['admin-categories'], queryFn: api.admin.categories })
  const ordersQuery = useQuery({ queryKey: ['admin-orders'], queryFn: api.admin.orders })
  const usersQuery = useQuery({ queryKey: ['admin-users'], queryFn: api.admin.users })
  const cartsQuery = useQuery({ queryKey: ['admin-carts'], queryFn: api.admin.carts })
  const currenciesQuery = useQuery({ queryKey: ['admin-currencies'], queryFn: api.admin.currencies })
  const shippingQuery = useQuery({ queryKey: ['admin-shipping'], queryFn: api.admin.shipping })
  const messagesQuery = useQuery({ queryKey: ['admin-messages'], queryFn: api.admin.messages })

  const products = productsQuery.data || []
  const categories = categoriesQuery.data || []
  const orders = ordersQuery.data || []
  const users = usersQuery.data || []
  const messages = messagesQuery.data || []
  const shipping = shippingQuery.data || []
  const query = search.trim().toLowerCase()

  const saveProduct = useMutation({
    mutationFn: () => api.admin.saveProduct({
      category_id: Number(productForm.categoryId),
      slug: productForm.slug,
      sku: productForm.sku,
      price_usd_cents: Math.round(Number(productForm.price) * 100),
      stock: Number(productForm.stock),
      image: productForm.image,
      popularity: 0,
      is_active: true,
      translations: Object.fromEntries(localeOptions.map(({ code }) => {
        const fallback = productForm.translations.en
        const current = productForm.translations[code]
        return [code, {
          ...current,
          name: current.name || fallback.name,
          description: current.description || fallback.description,
        }]
      })),
    }, productForm.id),
    onSuccess: () => {
      setProductForm(createEmptyProductForm())
      setNotice({ text: copy.editor.saved })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
      queryClient.invalidateQueries({ queryKey: ['products'] })
    },
    onError: (error) => setNotice({ text: error.message, error: true }),
  })
  const deleteProduct = useMutation({
    mutationFn: api.admin.deleteProduct,
    onSuccess: () => {
      setNotice({ text: copy.editor.hidden })
      queryClient.invalidateQueries({ queryKey: ['admin-products'] })
    },
  })
  const saveCategory = useMutation({
    mutationFn: () => api.admin.createCategory({
      slug: categoryForm.slug,
      image: categoryForm.image,
      parent_id: null,
      is_active: true,
      translations: Object.fromEntries(localeOptions.map(({ code }) => [
        code,
        { name: categoryForm.translations[code] || categoryForm.translations.en },
      ])),
    }),
    onSuccess: () => {
      setCategoryForm(createEmptyCategoryForm())
      setNotice({ text: copy.categories.created })
      queryClient.invalidateQueries({ queryKey: ['admin-categories'] })
    },
  })
  const updateOrder = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => api.admin.updateOrder(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-orders'] }),
  })
  const createShipping = useMutation({
    mutationFn: () => api.admin.createShipping({
      name_en: shippingForm.names.en,
      name_ru: shippingForm.names.ru || shippingForm.names.en,
      name_de: shippingForm.names.de || shippingForm.names.en,
      name_ja: shippingForm.names.ja || shippingForm.names.en,
      name_fr: shippingForm.names.fr || shippingForm.names.en,
      country_codes: shippingForm.countryCodes,
      price_usd_cents: Math.round(Number(shippingForm.price) * 100),
      free_from_usd_cents: shippingForm.freeFrom ? Math.round(Number(shippingForm.freeFrom) * 100) : null,
      eta_min_days: Number(shippingForm.etaMinDays),
      eta_max_days: Number(shippingForm.etaMaxDays),
      is_active: true,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-shipping'] })
      setShippingForm(createEmptyShippingForm())
      setNotice({ text: copy.shipping.created })
    },
  })
  const processMessage = useMutation({
    mutationFn: api.admin.processMessage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-messages'] }),
  })

  const editProduct = (item: (typeof products)[number]) => {
    setProductForm(productToForm(item))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const upload = async (file?: File) => {
    if (!file) return
    try {
      const result = await api.admin.upload(file)
      setProductForm((form) => ({ ...form, image: result.path }))
      setNotice({ text: copy.editor.uploaded })
    } catch (error) {
      setNotice({ text: error instanceof Error ? error.message : copy.editor.uploadFailed, error: true })
    }
  }

  const tabs = useMemo(
    () => [
      ['dashboard', copy.tabs.dashboard, 'sparkles'],
      ['products', copy.tabs.products, 'box'],
      ['categories', copy.tabs.categories, 'leaf'],
      ['orders', copy.tabs.orders, 'truck'],
      ['users', copy.tabs.users, 'user'],
      ['currencies', copy.tabs.currencies, 'currency'],
      ['shipping', copy.tabs.shipping, 'map'],
      ['messages', copy.tabs.messages, 'mail'],
    ] as Array<[AdminTab, string, IconName]>,
    [copy],
  )
  const visibleProducts = products.filter((item) => `${Object.values(item.translations).map((translation) => translation?.name).join(' ')} ${item.sku}`.toLowerCase().includes(query))

  return (
    <section className="admin-page">
      <aside className="admin-sidebar">
        <div className="admin-brand"><span className="brand-mark"><BrandMark size={29} /></span><span><strong>WoodStyle</strong><small>{copy.studioAdministration}</small></span></div>
        <nav>{tabs.map(([key, label, icon]) => <button key={key} className={tab === key ? 'active' : ''} onClick={() => { setTab(key); setSearch('') }}><Icon name={icon} /><span>{label}</span>{key === 'messages' && messages.filter((item) => !Boolean(item.is_processed)).length > 0 && <em>{messages.filter((item) => !Boolean(item.is_processed)).length}</em>}</button>)}</nav>
        <div className="admin-sidebar-footer"><span className="admin-online-dot" /><span><strong>{copy.storeSystem}</strong><small>{copy.operational}</small></span></div>
      </aside>

      <div className="admin-content">
        <header className="admin-header">
          <div><span className="eyebrow"><span />{copy.eyebrow}</span><h1>{copy.tabs[tab]}</h1><p>{copy.description}</p></div>
          {tab !== 'dashboard' && <label className="admin-search"><Icon name="search" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={copy.search} /></label>}
          <div className="admin-account-chip">
            <span>{(currentUser?.first_name?.[0] || 'A').toUpperCase()}</span>
            <div><strong>{currentUser?.first_name || 'Admin'} {currentUser?.last_name}</strong><small>{currentUser?.email}</small></div>
            <Icon name="shield" size={16} />
          </div>
        </header>
        {notice && <div className={`toast ${notice.error ? 'error' : 'success'}`}><Icon name={notice.error ? 'close' : 'check'} /><span>{notice.text}</span><button onClick={() => setNotice(null)}><Icon name="close" size={15} /></button></div>}

        {tab === 'dashboard' && <DashboardPanel dashboard={dashboard.data} products={products} locale={locale} />}

        {tab === 'products' && (
          <>
            <section className="admin-panel product-editor">
              <header className="panel-title">
                <div>
                  <small>{productForm.id ? `#${productForm.id}` : copy.editor.newListing}</small>
                  <h2>{productForm.id ? copy.editor.editProduct : copy.editor.addProduct}</h2>
                </div>
                <LanguageTabs activeLocale={editorLocale} onChange={setEditorLocale} />
              </header>
              <div className="product-editor-grid">
                <div className="editor-fields">
                  <Field
                    label={`${translations.common.name} · ${editorLocale.toUpperCase()}`}
                    required
                    value={productForm.translations[editorLocale].name}
                    onChange={(event) => setProductForm((form) => ({
                      ...form,
                      translations: {
                        ...form.translations,
                        [editorLocale]: { ...form.translations[editorLocale], name: event.target.value },
                      },
                    }))}
                  />
                  <TextareaField
                    label={`${translations.common.description} · ${editorLocale.toUpperCase()}`}
                    rows={5}
                    value={productForm.translations[editorLocale].description}
                    onChange={(event) => setProductForm((form) => ({
                      ...form,
                      translations: {
                        ...form.translations,
                        [editorLocale]: { ...form.translations[editorLocale], description: event.target.value },
                      },
                    }))}
                  />
                  <div className="admin-form-grid compact">
                    <Field label="Slug" placeholder="oak-dining-table" value={productForm.slug} onChange={(event) => setProductForm({ ...productForm, slug: event.target.value })} />
                    <Field label="SKU" placeholder="WS-TBL-001" value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value })} />
                    <Field label={copy.editor.priceUsd} type="number" step="0.01" min="0" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} />
                    <Field label={copy.editor.stock} type="number" min="0" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} />
                    <SelectField label={copy.editor.category} value={productForm.categoryId} onChange={(event) => setProductForm({ ...productForm, categoryId: Number(event.target.value) })}>
                      {categories.map((item) => <option value={item.id} key={item.id}>{fallbackLocaleName(item.translations, locale) || item.slug}</option>)}
                    </SelectField>
                    <Field label={copy.editor.imagePath} value={productForm.image} onChange={(event) => setProductForm({ ...productForm, image: event.target.value })} />
                  </div>
                </div>
                <FileDropzone label={copy.editor.uploadImage} hint={copy.editor.uploadHint} preview={productForm.image ? imageFor(productForm.image) : undefined} onChange={upload} />
              </div>
              <div className="admin-form-actions">
                <button className="button button-primary" onClick={() => saveProduct.mutate()} disabled={saveProduct.isPending || !productForm.translations.en.name || !productForm.slug || !productForm.sku}>{saveProduct.isPending ? copy.editor.saving : copy.editor.saveProduct}<Icon name="check" /></button>
                {productForm.id && <button className="button button-ghost" onClick={() => setProductForm(createEmptyProductForm())}>{copy.editor.cancelEdit}</button>}
              </div>
            </section>
            <section className="admin-panel table-wrap">
              <header className="panel-title"><div><small>{visibleProducts.length} {copy.editor.listings}</small><h2>{copy.editor.productCatalog}</h2></div></header>
              <table><thead><tr><th>ID</th><th>{translations.common.product}</th><th>SKU</th><th>USD</th><th>{copy.editor.stock}</th><th>{translations.common.status}</th><th /></tr></thead>
                <tbody>{visibleProducts.map((item) => <tr key={item.id}><td data-label="ID">{item.id}</td><td data-label={translations.common.product}><div className="table-product"><img src={imageFor(item.image)} alt="" /><span><strong>{fallbackLocaleName(item.translations, locale) || item.slug}</strong><small>{item.translations.en?.name}</small></span></div></td><td data-label="SKU">{item.sku}</td><td data-label="USD">${(item.price_usd_cents / 100).toFixed(2)}</td><td data-label={copy.editor.stock}>{item.stock}</td><td data-label={translations.common.status}><Badge tone={item.is_active ? 'success' : 'danger'}>{item.is_active ? translations.common.active : translations.common.hidden}</Badge></td><td className="row-actions"><button className="small-button" onClick={() => editProduct(item)}>{translations.common.edit}</button><button className="small-button danger" onClick={() => { if (window.confirm(copy.editor.hideConfirm)) deleteProduct.mutate(item.id) }}>{translations.common.hide}</button></td></tr>)}</tbody>
              </table>
              {!visibleProducts.length && <div className="admin-empty"><Icon name="search" /><strong>{copy.editor.noProducts}</strong></div>}
            </section>
          </>
        )}

        {tab === 'categories' && (
          <>
            <section className="admin-panel">
              <header className="panel-title">
                <div><small>{copy.categories.structure}</small><h2>{copy.categories.newCategory}</h2></div>
                <LanguageTabs activeLocale={editorLocale} onChange={setEditorLocale} />
              </header>
              <div className="admin-form-grid">
                <Field label="Slug" placeholder="dining-tables" value={categoryForm.slug} onChange={(event) => setCategoryForm({ ...categoryForm, slug: event.target.value })} />
                <Field label={`${translations.common.name} · ${editorLocale.toUpperCase()}`} value={categoryForm.translations[editorLocale]} onChange={(event) => setCategoryForm((form) => ({ ...form, translations: { ...form.translations, [editorLocale]: event.target.value } }))} />
                <Field label={translations.common.image} value={categoryForm.image} onChange={(event) => setCategoryForm({ ...categoryForm, image: event.target.value })} />
              </div>
              <button className="button button-primary" onClick={() => saveCategory.mutate()} disabled={!categoryForm.slug || !categoryForm.translations.en}>{copy.categories.create}<Icon name="plus" /></button>
            </section>
            <section className="admin-panel table-wrap">
              <table>
                <thead><tr><th>ID</th>{localeOptions.map((option) => <th key={option.code}>{option.shortLabel}</th>)}<th>Slug</th><th>{copy.categories.productCount}</th><th>{translations.common.status}</th></tr></thead>
                <tbody>
                  {categories.filter((item) => `${Object.values(item.translations).map((translation) => translation?.name).join(' ')} ${item.slug}`.toLowerCase().includes(query)).map((item) => (
                    <tr key={item.id}>
                      <td data-label="ID">{item.id}</td>
                      {localeOptions.map((option) => <td data-label={option.shortLabel} key={option.code}>{item.translations[option.code]?.name || '—'}</td>)}
                      <td data-label="Slug">{item.slug}</td>
                      <td data-label={copy.categories.productCount}>{products.filter((product) => product.category_id === item.id).length}</td>
                      <td><Badge tone={item.is_active ? 'success' : 'danger'}>{item.is_active ? translations.common.active : translations.common.hidden}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          </>
        )}

        {tab === 'orders' && <OrdersTable locale={locale} orders={orders.filter((order) => `${order.id} ${order.status} ${order.shipping_address.recipient_name}`.toLowerCase().includes(query))} onChange={(id, status) => updateOrder.mutate({ id, status })} />}
        {tab === 'users' && <UsersTables locale={locale} users={users.filter((user) => `${user.email} ${user.first_name} ${user.last_name}`.toLowerCase().includes(query))} carts={cartsQuery.data || []} />}

        {tab === 'currencies' && (
          <section className="admin-panel table-wrap"><header className="panel-title"><div><small>ISO 4217</small><h2>{copy.currencies.title}</h2><p>{copy.currencies.help}</p></div></header><table><thead><tr><th>{copy.currencies.code}</th><th>{copy.currencies.name}</th><th>{copy.currencies.symbol}</th><th>{copy.currencies.rate}</th><th>{copy.currencies.enabled}</th><th /></tr></thead><tbody>{(currenciesQuery.data || []).filter((item) => `${item.code} ${item.name}`.toLowerCase().includes(query)).map((item) => <CurrencyRow locale={locale} key={item.code} item={item} />)}</tbody></table></section>
        )}

        {tab === 'shipping' && (
          <>
            <section className="admin-panel">
              <header className="panel-title"><div><small>{copy.shipping.rates}</small><h2>{copy.shipping.newZone}</h2></div><LanguageTabs activeLocale={editorLocale} onChange={setEditorLocale} /></header>
              <div className="admin-form-grid">
                <Field label={`${translations.common.name} · ${editorLocale.toUpperCase()}`} value={shippingForm.names[editorLocale]} onChange={(event) => setShippingForm((form) => ({ ...form, names: { ...form.names, [editorLocale]: event.target.value } }))} />
                <Field label={copy.shipping.countryCodes} hint="US,CA or *" value={shippingForm.countryCodes} onChange={(event) => setShippingForm({ ...shippingForm, countryCodes: event.target.value.toUpperCase() })} />
                <Field label={copy.shipping.priceUsd} inputMode="decimal" value={shippingForm.price} onChange={(event) => setShippingForm({ ...shippingForm, price: event.target.value })} />
                <Field label={copy.shipping.freeFrom} placeholder={translations.common.optional} value={shippingForm.freeFrom} onChange={(event) => setShippingForm({ ...shippingForm, freeFrom: event.target.value })} />
                <div className="field"><span className="field-label">{copy.shipping.eta}</span><div className="inline-inputs"><input aria-label={copy.shipping.eta} value={shippingForm.etaMinDays} onChange={(event) => setShippingForm({ ...shippingForm, etaMinDays: event.target.value })} /><input aria-label={copy.shipping.eta} value={shippingForm.etaMaxDays} onChange={(event) => setShippingForm({ ...shippingForm, etaMaxDays: event.target.value })} /></div></div>
              </div>
              <button className="button button-primary" onClick={() => createShipping.mutate()} disabled={!shippingForm.names.en}>{copy.shipping.create}<Icon name="plus" /></button>
            </section>
            <section className="admin-panel table-wrap">
              <table>
                <thead><tr><th>{translations.common.name}</th><th>{copy.shipping.countries}</th><th>{copy.shipping.price}</th><th>{copy.shipping.free}</th><th>ETA</th><th>{copy.shipping.status}</th></tr></thead>
                <tbody>{shipping.filter((item) => `${item.name_en} ${item.name_ru} ${item.name_de} ${item.name_ja} ${item.name_fr} ${item.country_codes}`.toLowerCase().includes(query)).map((item) => <tr key={item.id}><td data-label={translations.common.name}><strong>{shippingZoneName(item, locale)}</strong><small>{item.name_en}</small></td><td data-label={copy.shipping.countries}>{item.country_codes}</td><td data-label={copy.shipping.price}>${(item.price_usd_cents / 100).toFixed(2)}</td><td data-label={copy.shipping.free}>{item.free_from_usd_cents ? `$${(item.free_from_usd_cents / 100).toFixed(2)}` : '—'}</td><td data-label="ETA">{item.eta_min_days}–{item.eta_max_days} {translations.common.days}</td><td><Badge tone={item.is_active ? 'success' : 'danger'}>{item.is_active ? translations.common.active : translations.common.hidden}</Badge></td></tr>)}</tbody>
              </table>
            </section>
          </>
        )}

        {tab === 'messages' && <MessagesPanel messages={messages} locale={locale} query={query} onProcess={(id) => processMessage.mutate(id)} />}
      </div>
    </section>
  )
}
