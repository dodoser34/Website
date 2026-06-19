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

const formatCardPreviewNumber = (value: string) => {
  const digits = value.replace(/\D/g, '').padEnd(16, '•').slice(0, 16)
  return digits.replace(/(.{4})/g, '$1 ').trim()
}

const cardBrandFor = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('4')) return 'VISA'
  if (/^5[1-5]/.test(digits)) return 'MASTERCARD'
  if (/^3[47]/.test(digits)) return 'AMEX'
  return 'WOODSTYLE'
}

const demoPaymentCards = [
  {
    kind: 'success',
    holder: 'Demo Buyer',
    number: '4242 4242 4242 4242',
    expiry: '12/30',
    cvc: '123',
  },
  {
    kind: 'decline',
    holder: 'Declined Demo',
    number: '4000 0000 0000 0002',
    expiry: '12/30',
    cvc: '123',
  },
] as const

const demoPaymentCopy = {
  en: {
    title: 'Presentation payment',
    text: 'Fill a demo card in one click and complete checkout quickly.',
    success: 'Approved demo',
    decline: 'Declined demo',
    use: 'Use card',
  },
  ru: {
    title: 'Оплата для презентации',
    text: 'Подставьте демо-карту в один клик и быстро завершите checkout.',
    success: 'Успешная демо-карта',
    decline: 'Отклоненная демо-карта',
    use: 'Подставить',
  },
  de: {
    title: 'Präsentationszahlung',
    text: 'Demo-Karte mit einem Klick einsetzen und den Checkout schnell abschließen.',
    success: 'Freigegebene Demo',
    decline: 'Abgelehnte Demo',
    use: 'Einsetzen',
  },
  ja: {
    title: 'プレゼン用決済',
    text: 'デモカードを1クリックで入力して、すぐにチェックアウトできます。',
    success: '承認デモ',
    decline: '拒否デモ',
    use: '入力',
  },
  fr: {
    title: 'Paiement de présentation',
    text: 'Remplissez une carte de démo en un clic pour finaliser rapidement.',
    success: 'Démo approuvée',
    decline: 'Démo refusée',
    use: 'Utiliser',
  },
} as const

export default function Checkout() {
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.checkout
  const user = useSessionStore((state) => state.user)
  const reviewLabel = {
    en: 'Review',
    ru: 'Проверка',
    de: 'Prüfung',
    ja: '確認',
    fr: 'Vérification',
  }[locale]
  const defaultCity = locale === 'ru' ? 'Астана' : 'Astana'
  const [country, setCountry] = useState('KZ')
  const [shippingId, setShippingId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null)
  const [cardSide, setCardSide] = useState<'front' | 'back'>('front')
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
  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<CheckoutValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      recipient_name: user ? `${user.first_name} ${user.last_name}`.trim() : '',
      phone: user?.phone || '',
      country_code: 'KZ',
      region: defaultCity,
      city: defaultCity,
      postal_code: '010000',
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
  const cardholderPreview = watch('cardholder')?.trim() || copy.cardholder
  const cardNumberPreview = formatCardPreviewNumber(watch('card_number') || '')
  const expiryPreview = watch('expiry') || 'MM/YY'
  const cvcPreview = (watch('cvc') || '').padEnd(3, '•').slice(0, 4)
  const cardBrand = cardBrandFor(watch('card_number') || '')
  const demoCopy = demoPaymentCopy[locale]
  const useDemoPaymentCard = (card: (typeof demoPaymentCards)[number]) => {
    setCardSide('front')
    setValue('cardholder', card.holder, { shouldDirty: true, shouldValidate: true })
    setValue('card_number', card.number, { shouldDirty: true, shouldValidate: true })
    setValue('expiry', card.expiry, { shouldDirty: true, shouldValidate: true })
    setValue('cvc', card.cvc, { shouldDirty: true, shouldValidate: true })
  }

  return (
    <section className="container commerce-page checkout-page">
      <div className="commerce-heading reveal">
        <span className="eyebrow"><span />{copy.eyebrow}</span><h1>{copy.title}</h1>
        <div className="checkout-steps"><span className="active">1 <em>{copy.address}</em></span><span className="active">2 <em>{copy.shipping}</em></span><span className="active">3 <em>{copy.payment}</em></span><span>4 <em>{reviewLabel}</em></span></div>
      </div>
      <form className="checkout-layout" onSubmit={handleSubmit(submit)}>
        <div className="checkout-form">
          <section className="form-panel reveal">
            <header><span>01</span><div><h2>{copy.address}</h2><p>{copy.addressHelp}</p></div></header>
            <div className="form-row">
              <Field label={copy.recipient} autoComplete="name" placeholder={copy.fullName} error={errors.recipient_name ? copy.recipientError : ''} {...register('recipient_name')} />
              <Field label={translations.common.phone} autoComplete="tel" placeholder="+7 7172 55 01 74" error={errors.phone ? copy.phoneError : ''} {...register('phone')} />
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
              <Field label={copy.city} autoComplete="address-level2" placeholder={defaultCity} error={errors.city ? copy.cityError : ''} {...register('city')} />
              <Field label={copy.postalCode} autoComplete="postal-code" placeholder="010000" error={errors.postal_code ? copy.postalCodeError : ''} {...register('postal_code')} />
            </div>
            <Field label={copy.streetAddress} autoComplete="address-line1" placeholder={copy.streetPlaceholder} error={errors.address_line1 ? copy.streetError : ''} {...register('address_line1')} />
            <Field label={copy.apartment} autoComplete="address-line2" placeholder={translations.common.optional} {...register('address_line2')} />
          </section>

          <section className="form-panel reveal reveal-delay-1">
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

          <section className="form-panel payment-panel reveal reveal-delay-2">
            <header><span>03</span><div><h2>{copy.payment}</h2><p>{copy.secure}</p></div></header>
            <div className={`payment-card payment-card-live ${cardSide === 'back' ? 'is-flipped' : ''}`} aria-label={copy.payment}>
              <div className="payment-card-face payment-card-front">
                <div className="payment-card-top">
                  <span className="payment-chip" aria-hidden="true" />
                  <strong>{cardBrand}</strong>
                </div>
                <span className="payment-card-number">{cardNumberPreview}</span>
                <div className="payment-card-bottom">
                  <span><small>{copy.cardholder}</small><strong>{cardholderPreview}</strong></span>
                  <span><small>{copy.expiry}</small><strong>{expiryPreview}</strong></span>
                </div>
              </div>
              <div className="payment-card-face payment-card-back">
                <span className="payment-card-strip" />
                <div className="payment-card-cvc"><small>CVC</small><strong>{cvcPreview}</strong></div>
                <p>{copy.secure}</p>
              </div>
            </div>
            <div className="demo-payment-cards">
              <div>
                <strong>{demoCopy.title}</strong>
                <small>{demoCopy.text}</small>
              </div>
              {demoPaymentCards.map((card) => (
                <article key={card.number} className={`demo-payment-card demo-payment-card-${card.kind}`}>
                  <span>
                    <strong>{card.kind === 'success' ? demoCopy.success : demoCopy.decline}</strong>
                    <small>{card.number} · {card.expiry} · CVC {card.cvc}</small>
                  </span>
                  <button type="button" onClick={() => useDemoPaymentCard(card)}>{demoCopy.use}</button>
                </article>
              ))}
            </div>
            <Field label={copy.cardholder} autoComplete="cc-name" placeholder="ANNA MORGAN" error={errors.cardholder ? copy.cardholderError : ''} {...register('cardholder')} onFocus={() => setCardSide('front')} />
            <Field label={copy.cardNumber} inputMode="numeric" autoComplete="cc-number" placeholder="0000 0000 0000 0000" error={errors.card_number ? copy.cardNumberError : ''} {...register('card_number', {
              onChange: (event) => setValue('card_number', event.target.value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ')),
            })} onFocus={() => setCardSide('front')} />
            <div className="form-row">
              <Field label={copy.expiry} inputMode="numeric" autoComplete="cc-exp" placeholder="MM/YY" error={errors.expiry ? 'MM/YY' : ''} {...register('expiry', {
                onChange: (event) => {
                  const value = event.target.value.replace(/\D/g, '').slice(0, 4)
                  setValue('expiry', value.length > 2 ? `${value.slice(0, 2)}/${value.slice(2)}` : value)
                },
              })} onFocus={() => setCardSide('front')} />
              <Field label="CVC" inputMode="numeric" autoComplete="cc-csc" placeholder="123" error={errors.cvc ? copy.cvcError : ''} {...register('cvc', {
                onChange: (event) => setValue('cvc', event.target.value.replace(/\D/g, '').slice(0, 4)),
              })} onFocus={() => setCardSide('back')} />
            </div>
          </section>
        </div>

        <aside className="order-summary checkout-summary reveal reveal-delay-1">
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
