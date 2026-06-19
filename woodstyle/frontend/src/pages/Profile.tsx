import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import profileHero from '../assets/images/site/profile-hero-v1.webp'
import Icon from '../components/Icon'
import { Badge, Field, SelectField } from '../components/ui'
import { countries } from '../config/showroom'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { localeOptions } from '../i18n/config'
import { getTranslations, interpolate } from '../i18n'
import { usePreferencesStore, useSessionStore } from '../store/app'
import type { Address, Locale } from '../types'
import { formatDate, formatMoney } from '../utils/format'
import { ConfirmDialog } from '../shared/ui/ConfirmDialog'
import { useToast } from '../shared/ui/ToastProvider'

const blankAddress = (locale: Locale): Address => ({
  label: getTranslations(locale).profile.homeLabel,
  recipient_name: '',
  phone: '',
  country_code: 'KZ',
  region: locale === 'ru' ? 'Астана' : 'Astana',
  city: locale === 'ru' ? 'Астана' : 'Astana',
  postal_code: '010000',
  address_line1: '',
  address_line2: '',
  is_default: false,
})

export default function Profile() {
  const { locale, setLocale, setCurrency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.profile
  const setUser = useSessionStore((state) => state.setUser)
  const queryClient = useQueryClient()
  const me = useQuery({ queryKey: ['me'], queryFn: api.me })
  const currencies = useQuery({ queryKey: ['currencies'], queryFn: () => api.currencies() })
  const addresses = useQuery({ queryKey: ['addresses'], queryFn: api.addresses })
  const orders = useQuery({ queryKey: ['orders'], queryFn: api.orders })
  const [form, setForm] = useState<{ first_name: string; last_name: string; phone: string; locale: Locale; currency_code: string }>({
    first_name: '', last_name: '', phone: '', locale: 'en', currency_code: 'USD',
  })
  const [address, setAddress] = useState<Address>(() => blankAddress(locale))
  const [profileError, setProfileError] = useState('')
  const [addressError, setAddressError] = useState('')
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null)
  const toast = useToast()
  useDocumentMeta(translations.common.account, translations.meta.profileDescription, locale)

  useEffect(() => {
    if (!me.data) return
    setForm({
      first_name: me.data.first_name,
      last_name: me.data.last_name,
      phone: me.data.phone,
      locale: me.data.locale,
      currency_code: me.data.currency_code,
    })
    setAddress((current) => ({
      ...current,
      recipient_name: current.recipient_name || `${me.data.first_name} ${me.data.last_name}`.trim(),
      phone: current.phone || me.data.phone,
    }))
  }, [me.data])

  const save = useMutation({
    mutationFn: () => api.updateProfile(form),
    onMutate: () => setProfileError(''),
    onSuccess: (user) => {
      setUser(user)
      setLocale(user.locale)
      setCurrency(user.currency_code)
      queryClient.setQueryData(['me'], user)
      toast.push(copy.saved, 'success')
    },
    onError: (error) => setProfileError(error.message),
  })
  const addAddress = useMutation({
    mutationFn: () => api.addAddress({
      ...address,
      country_code: address.country_code.toUpperCase(),
    }),
    onMutate: () => setAddressError(''),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setAddress({
        ...blankAddress(locale),
        recipient_name: `${form.first_name} ${form.last_name}`.trim(),
        phone: form.phone,
      })
      toast.push(copy.addAddress, 'success')
    },
    onError: (error) => setAddressError(error.message),
  })
  const deleteAddress = useMutation({
    mutationFn: api.deleteAddress,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] })
      setDeleteAddressId(null)
      toast.push(copy.deleteAddress, 'success')
    },
    onError: (error) => toast.push(error.message, 'error'),
  })

  const profileValid = form.first_name.trim().length > 0 && form.currency_code.length === 3
  const addressValid = useMemo(
    () =>
      address.label.trim().length > 0 &&
      address.recipient_name.trim().length >= 2 &&
      address.phone.trim().length >= 7 &&
      address.country_code.length === 2 &&
      address.city.trim().length >= 2 &&
      address.postal_code.trim().length >= 2 &&
      address.address_line1.trim().length >= 3,
    [address],
  )
  const pageTitle = {
    en: 'Your Profile',
    ru: 'Ваш профиль',
    de: 'Ihr Profil',
    ja: 'プロフィール',
    fr: 'Votre profil',
  }[locale]

  return (
    <section className="container commerce-page profile-page">
      <div className="profile-hero-strip reveal">
        <div>
          <span className="eyebrow"><span />{translations.common.account}</span>
          <h1>{pageTitle}</h1>
          <strong>{interpolate(copy.welcome, { name: me.data?.first_name || '' })}</strong>
          <p>{copy.lead}</p>
        </div>
        <img src={profileHero} alt="" />
      </div>
      <div className="profile-welcome reveal reveal-delay-1">
        <div className="profile-avatar">{(me.data?.first_name?.[0] || me.data?.email?.[0] || 'W').toUpperCase()}</div>
        <div>
          <span className="eyebrow"><span />{me.data?.email}</span>
          <h2>{me.data?.first_name} {me.data?.last_name}</h2>
          <p>{me.data?.phone || copy.lead}</p>
        </div>
        <div className="profile-status-card">
          <Icon name="shield" />
          <span><strong>{copy.protectedTitle}</strong><small>{copy.protectedText}</small></span>
        </div>
      </div>

      <div className="profile-overview-grid">
        <section className="profile-overview-card reveal">
          <span className="eyebrow"><span />{translations.common.profile}</span>
          <div className="profile-overview-person">
            <span className="profile-avatar">{(me.data?.first_name?.[0] || me.data?.email?.[0] || 'W').toUpperCase()}</span>
            <div><strong>{me.data?.first_name} {me.data?.last_name}</strong><small>{me.data?.email}</small><small>{me.data?.phone || '—'}</small></div>
          </div>
        </section>
        <section className="profile-recent-orders reveal reveal-delay-1">
          <header><h2>{translations.common.orders}</h2><Link to="/orders">{translations.common.orders}<Icon name="arrow" size={15} /></Link></header>
          {(orders.data || []).slice(0, 3).map((order) => (
            <Link to="/orders" key={order.id}>
              <span><strong>#{String(order.id).padStart(5, '0')}</strong><small>{formatDate(order.created_at, locale)}</small></span>
              <Badge tone={order.status === 'delivered' ? 'success' : 'warning'}>{order.status}</Badge>
              <strong>{formatMoney(order.total_minor, order.currency, order.currency_digits, locale)}</strong>
            </Link>
          ))}
          {!orders.isLoading && !orders.data?.length && <p>{translations.orders.emptyText}</p>}
        </section>
      </div>

      <div className="profile-layout">
        <nav className="profile-nav reveal">
          <Link className="active" to="/profile"><Icon name="user" />{translations.common.profile}</Link>
          <Link to="/orders"><Icon name="box" />{translations.common.orders}</Link>
          <Link to="/favorites"><Icon name="heart" />{translations.common.favorites}</Link>
          <Link to="/cart"><Icon name="cart" />{translations.common.cart}</Link>
        </nav>

        <div className="profile-content">
          <form className="form-panel reveal" onSubmit={(event) => { event.preventDefault(); if (profileValid) save.mutate() }}>
            <header><span>01</span><div><h2>{copy.personalDetails}</h2><p>{copy.personalHelp}</p></div></header>
            <div className="profile-email-card">
              <Icon name="mail" />
              <span><small>{translations.common.email}</small><strong>{me.data?.email || '—'}</strong></span>
              <em>{copy.verified}</em>
            </div>
            <div className="form-row">
              <Field label={copy.firstName} required value={form.first_name} onChange={(event) => setForm({ ...form, first_name: event.target.value })} />
              <Field label={copy.lastName} value={form.last_name} onChange={(event) => setForm({ ...form, last_name: event.target.value })} />
            </div>
            <Field label={translations.common.phone} placeholder="+7 7172 55 01 74" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
            <div className="form-row">
              <SelectField label={copy.interfaceLanguage} value={form.locale} onChange={(event) => setForm({ ...form, locale: event.target.value as Locale })}>
                {localeOptions.map((option) => <option value={option.code} key={option.code}>{option.name}</option>)}
              </SelectField>
              <SelectField label={copy.preferredCurrency} value={form.currency_code} onChange={(event) => setForm({ ...form, currency_code: event.target.value })}>
                {(currencies.data || []).map((item) => <option key={item.code} value={item.code}>{item.code} · {item.symbol} · {item.name}</option>)}
              </SelectField>
            </div>
            {save.isSuccess && <p className="form-message success">{copy.saved}</p>}
            {profileError && <p className="form-message error">{profileError}</p>}
            <button type="submit" className="button button-primary" disabled={save.isPending || !profileValid}>{save.isPending ? translations.common.saving : translations.common.save}<Icon name="check" /></button>
          </form>

          <section className="form-panel reveal reveal-delay-1">
            <header><span>02</span><div><h2>{copy.savedAddresses}</h2><p>{copy.addressesHelp}</p></div></header>
            <div className="saved-addresses">
              {(addresses.data || []).map((item) => (
                <article key={item.id}>
                  <span className="address-icon"><Icon name="map" /></span>
                  <div><strong>{item.label}</strong><span>{item.recipient_name}</span><small>{item.address_line1}{item.address_line2 ? `, ${item.address_line2}` : ''}, {item.city}, {item.country_code} {item.postal_code}</small></div>
                  <div className="address-actions">
                    {item.is_default && <em>{copy.defaultAddress}</em>}
                    <button type="button" aria-label={copy.deleteAddress} onClick={() => {
                      if (item.id) setDeleteAddressId(item.id)
                    }}><Icon name="close" size={16} /></button>
                  </div>
                </article>
              ))}
              {!addresses.isLoading && !addresses.data?.length && <p className="subtle-empty">{copy.noAddresses}</p>}
            </div>

            <form className="address-form" onSubmit={(event) => { event.preventDefault(); if (addressValid) addAddress.mutate() }}>
              <div className="form-row">
                <Field label={copy.addressLabel} required placeholder={copy.homeLabel} value={address.label} onChange={(event) => setAddress({ ...address, label: event.target.value })} />
                <Field label={copy.recipient} required value={address.recipient_name} onChange={(event) => setAddress({ ...address, recipient_name: event.target.value })} />
              </div>
              <div className="form-row">
                <Field label={translations.common.phone} required placeholder="+7 7172 55 01 74" value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} />
                <SelectField label={copy.country} value={address.country_code} onChange={(event) => setAddress({ ...address, country_code: event.target.value })}>
                  {countries.map((item) => <option key={item.code} value={item.code}>{item.name[locale]} · {item.dialCode}</option>)}
                </SelectField>
              </div>
              <div className="form-row">
                <Field label={copy.region} value={address.region} onChange={(event) => setAddress({ ...address, region: event.target.value })} />
                <Field label={copy.city} required value={address.city} onChange={(event) => setAddress({ ...address, city: event.target.value })} />
              </div>
              <div className="form-row">
                <Field label={copy.postalCode} required value={address.postal_code} onChange={(event) => setAddress({ ...address, postal_code: event.target.value })} />
                <Field label={copy.streetAddress} required value={address.address_line1} onChange={(event) => setAddress({ ...address, address_line1: event.target.value })} />
              </div>
              <Field label={copy.apartment} value={address.address_line2} onChange={(event) => setAddress({ ...address, address_line2: event.target.value })} />
              <label className="checkbox-field">
                <input type="checkbox" checked={address.is_default} onChange={(event) => setAddress({ ...address, is_default: event.target.checked })} />
                <span><Icon name="check" size={14} /></span>
                <strong>{copy.useDefault}</strong>
              </label>
              {addressError && <p className="form-message error">{addressError}</p>}
              {deleteAddress.isError && <p className="form-message error">{deleteAddress.error.message}</p>}
              <button type="submit" className="button button-secondary" disabled={addAddress.isPending || !addressValid}>{addAddress.isPending ? copy.adding : copy.addAddress}<Icon name="plus" /></button>
            </form>
          </section>
        </div>
      </div>
      <ConfirmDialog
        open={deleteAddressId !== null}
        title={copy.deleteAddress}
        message={copy.confirmDeleteAddress}
        confirmLabel={translations.common.remove}
        cancelLabel={translations.common.cancel}
        danger
        onClose={() => setDeleteAddressId(null)}
        onConfirm={() => {
          if (deleteAddressId !== null) deleteAddress.mutate(deleteAddressId)
        }}
      />
    </section>
  )
}
