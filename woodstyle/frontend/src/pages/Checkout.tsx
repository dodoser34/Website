import { zodResolver } from '@hookform/resolvers/zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { api, imageFor } from '../api/client'
import Icon from '../components/Icon'
import { EmptyState, Field, SelectField } from '../components/ui'
import { countries } from '../config/showroom'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { usePreferencesStore, useSessionStore } from '../store/app'
import { Modal } from '../shared/ui/Modal'
import { useToast } from '../shared/ui/ToastProvider'
import type { Address, Order } from '../types'
import { formatMoney } from '../utils/format'

const checkoutSchema = z.object({
  recipient_name: z.string().min(2),
  phone: z.string().min(7),
  country_code: z.string().length(2),
  region: z.string(),
  city: z.string().min(2),
  postal_code: z.string().min(2),
  address_line1: z.string().min(3),
  address_line2: z.string(),
  cardholder: z.string().min(2),
  card_number: z.string().min(19),
  expiry: z.string().regex(/^\d{2}\/\d{2}$/),
  cvc: z.string().min(3).max(4),
})
type CheckoutValues = z.infer<typeof checkoutSchema>

export default function Checkout() {
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.checkout
  const user = useSessionStore((state) => state.user)
  const [country, setCountry] = useState('US')
  const [shippingId, setShippingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  useDocumentMeta(copy.title, copy.secure, locale)
  const cart = useQuery({ queryKey: ['cart', locale, currency], queryFn: () => api.cart(locale, currency) })
  const shipping = useQuery({
    queryKey: ['shipping', country, cart.data?.subtotal_usd_cents, locale, currency],
    queryFn: () => api.shipping(country, cart.data?.subtotal_usd_cents || 0, locale, currency),
    enabled: country.length === 2 && Boolean(cart.data?.items.length),
  })
  useEffect(() => {
    if (shipping.data?.length && !shipping.data.some((item) => item.id === shippingId)) setShippingId(shipping.data[0].id)
  }, [shipping.data, shippingId])
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipient_name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
      phone: user?.phone || '',
      country_code: 'US',
      region: '',
      city: '',
      postal_code: '',
      address_line1: '',
      address_line2: '',
      cardholder: user ? `${user.first_name} ${user.last_name}`.trim() : '',
      card_number: '',
      expiry: '12/30',
      cvc: '123',
    },
  })

  const submit = async (values: CheckoutValues) => {
    if (!shippingId) return setError(copy.selectShipping)
    setError('')
    const address: Address = {
      label: copy.orderAddressLabel,
      recipient_name: values.recipient_name,
      phone: values.phone,
      country_code: values.country_code.toUpperCase(),
      region: values.region,
      city: values.city,
      postal_code: values.postal_code,
      address_line1: values.address_line1,
      address_line2: values.address_line2,
      is_default: false,
    }
    try {
      const order = await api.createOrder({ shipping_zone_id: shippingId, currency_code: currency, address })
      const paid = await api.pay(
        order.id,
        values.card_number,
        values.cardholder,
        crypto.randomUUID(),
      )
      await queryClient.invalidateQueries({ queryKey: ['cart'] })
      if (paid.status === 'paid') {
        setCompletedOrder(paid)
        toast.push(`Order #${paid.id} created`, 'success')
      } else {
        setError(copy.cardDeclined)
        toast.push(copy.cardDeclined, 'error')
      }
    } catch (reason) {
      const failure = reason instanceof Error ? reason.message : copy.failure
      setError(failure)
      toast.push(failure, 'error')
    }
  }

  if (!cart.isLoading && !cart.data?.items.length) return <section className="container commerce-page"><EmptyState icon="cart" title={copy.emptyCart} action={copy.returnCatalog} /></section>
  const selectedShipping = shipping.data?.find((item) => item.id === shippingId)
  const totalMinor = (cart.data?.subtotal_minor || 0) + (selectedShipping?.price_minor || 0)

  return (
    <section className="container commerce-page checkout-page">
      <div className="commerce-heading">
        <span className="eyebrow"><span />{copy.eyebrow}</span><h1>{copy.title}</h1>
        <div className="checkout-steps"><span className="active">1 <em>{copy.address}</em></span><span className="active">2 <em>{copy.shipping}</em></span><span className="active">3 <em>{copy.payment}</em></span></div>
      </div>
      <form className="checkout-layout" onSubmit={handleSubmit(submit)}>
        <div className="checkout-form">
          <section className="form-panel">
            <header><span>01</span><div><h2>{copy.address}</h2><p>{copy.addressHelp}</p></div></header>
            <div className="form-row">
              <Field label={copy.recipient} autoComplete="name" placeholder={copy.fullName} error={errors.recipient_name ? copy.recipientError : ''} {...register('recipient_name')} />
              <Field label={translations.common.phone} autoComplete="tel" placeholder="+49 221 555 0174" error={errors.phone ? copy.phoneError : ''} {...register('phone')} />
            </div>
            <div className="form-row">
              <SelectField label={copy.country} {...register('country_code')} onChange={(event) => {
                register('country_code').onChange(event)
                setCountry(event.target.value)
              }}>
                {countries.map((item) => <option key={item.code} value={item.code}>{item.name[locale]}</option>)}
              </SelectField>
              <Field label={copy.region} autoComplete="address-level1" placeholder={copy.regionPlaceholder} {...register('region')} />
            </div>
            <div className="form-row">
              <Field label={copy.city} autoComplete="address-level2" placeholder={copy.city} error={errors.city ? copy.cityError : ''} {...register('city')} />
              <Field label={copy.postalCode} autoComplete="postal-code" placeholder="50667" error={errors.postal_code ? copy.postalCodeError : ''} {...register('postal_code')} />
            </div>
            <Field label={copy.streetAddress} autoComplete="address-line1" placeholder={copy.streetPlaceholder} error={errors.address_line1 ? copy.streetError : ''} {...register('address_line1')} />
            <Field label={copy.apartment} autoComplete="address-line2" placeholder={translations.common.optional} {...register('address_line2')} />
          </section>

          <section className="form-panel">
            <header><span>02</span><div><h2>{copy.shipping}</h2><p>{copy.shippingHelp}</p></div></header>
            <div className="shipping-options">
              {shipping.isLoading && <p>{copy.calculating}</p>}
              {(shipping.data || []).map((option) => (
                <label key={option.id} className={shippingId === option.id ? 'selected' : ''}>
                  <input type="radio" checked={shippingId === option.id} onChange={() => setShippingId(option.id)} />
                  <span className="shipping-radio" />
                  <span><strong>{option.name}</strong><small>{option.eta_min_days}–{option.eta_max_days} {translations.common.days}</small></span>
                  <strong>{formatMoney(option.price_minor, currency, option.currency_digits, locale)}</strong>
                </label>
              ))}
              {!shipping.isLoading && !shipping.data?.length && <p className="form-message error">{copy.noShipping}</p>}
            </div>
          </section>

          <section className="form-panel payment-panel">
            <header><span>03</span><div><h2>{copy.payment}</h2><p>{copy.secure}</p></div></header>
            <div className="payment-card">
              <Icon name="leaf" /><span>WOODSTYLE</span><strong>•••• •••• •••• 4242</strong><small>{copy.payment}</small>
            </div>
            <Field label={copy.cardholder} autoComplete="cc-name" placeholder="ANNA MORGAN" error={errors.cardholder ? copy.cardholderError : ''} {...register('cardholder')} />
            <Field label={copy.cardNumber} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" error={errors.card_number ? copy.cardNumberError : ''} {...register('card_number', {
              onChange: (event) => setValue('card_number', event.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')),
            })} />
            <div className="form-row">
              <Field label={copy.expiry} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" error={errors.expiry ? 'MM/YY' : ''} {...register('expiry', {
                onChange: (event) => {
                  const value = event.target.value.replace(/\D/g, '').slice(0, 4)
                  setValue('expiry', value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value)
                },
              })} />
              <Field label="CVC" inputMode="numeric" autoComplete="cc-csc" placeholder="123" error={errors.cvc ? copy.cvcError : ''} {...register('cvc', {
                onChange: (event) => setValue('cvc', event.target.value.replace(/\D/g, '').slice(0, 4)),
              })} />
            </div>
          </section>
        </div>

        <aside className="order-summary checkout-summary">
          <span className="eyebrow"><span />{copy.summary}</span><h2>{copy.yourSelection}</h2>
          <div className="checkout-items">
            {(cart.data?.items || []).map((item) => (
              <article key={item.id}>
                <img src={imageFor(item.product.image)} alt="" />
                <span><strong>{item.product.name}</strong><small>{translations.common.quantity}: {item.quantity}</small></span>
                <strong>{formatMoney(item.line_minor, currency, cart.data?.currency_digits || 2, locale)}</strong>
              </article>
            ))}
          </div>
          <div><span>{translations.common.products}</span><strong>{formatMoney(cart.data?.subtotal_minor || 0, currency, cart.data?.currency_digits || 2, locale)}</strong></div>
          <div><span>{translations.common.shipping}</span><strong>{formatMoney(selectedShipping?.price_minor || 0, currency, cart.data?.currency_digits || 2, locale)}</strong></div>
          <div className="summary-total"><span>{translations.common.total}</span><strong>{formatMoney(totalMinor, currency, cart.data?.currency_digits || 2, locale)}</strong></div>
          {error && <p className="form-message error">{error}</p>}
          <button className={`button button-primary button-wide ${isSubmitting ? 'is-loading' : ''}`} disabled={isSubmitting || !shippingId}>{isSubmitting ? copy.processing : copy.pay}<Icon name="shield" /></button>
          <small className="summary-footnote"><Icon name="shield" />{copy.secure}</small>
        </aside>
      </form>
      <Modal
        open={Boolean(completedOrder)}
        onClose={() => navigate('/orders')}
        title="Payment approved"
        className="checkout-result-modal"
        footer={<button className="button button-primary" onClick={() => navigate('/orders')}>View order <Icon name="arrow" /></button>}
      >
        <span className="success-seal"><Icon name="check" size={30} /></span>
        <p>Your order <strong>#{completedOrder?.id}</strong> is confirmed. The fixed total and delivery details are available in your order history.</p>
      </Modal>
    </section>
  )
}
