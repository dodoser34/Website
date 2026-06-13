import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'

import { api } from '../api/client'
import Icon from '../components/Icon'
import { Field, SelectField } from '../components/ui'
import { countries } from '../config/showroom'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { localeOptions } from '../i18n/config'
import { getTranslations, interpolate } from '../i18n'
import { usePreferencesStore, useSessionStore } from '../store/app'
import type { Address, Locale } from '../types'

const blankAddress = (locale: Locale): Address => ({
  label: getTranslations(locale).profile.homeLabel,
  recipient_name: '',
  phone: '',
  country_code: 'DE',
  region: 'Nordrhein-Westfalen',
  city: '',
  postal_code: '',
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
  const [form, setForm] = useState<{ first_name: string; last_name: string; phone: string; locale: Locale; currency_code: string }>({
    first_name: '', last_name: '', phone: '', locale: 'en', currency_code: 'USD',
  })
  const [address, setAddress] = useState<Address>(() => blankAddress(locale))
  const [profileError, setProfileError] = useState('')
  const [addressError, setAddressError] = useState('')
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
    },
    onError: (error) => setAddressError(error.message),
  })
  const deleteAddress = useMutation({
    mutationFn: api.deleteAddress,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['addresses'] }),
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

  return (
    <section className="container commerce-page profile-page">
      <div className="profile-welcome">
        <div className="profile-avatar">{(me.data?.first_name?.[0] || me.data?.email?.[0] || 'W').toUpperCase()}</div>
        <div>
          <span className="eyebrow"><span />{me.data?.email}</span>
          <h1>{interpolate(copy.welcome, { name: me.data?.first_name || '' })}</h1>
          <p>{copy.lead}</p>
        </div>
        <div className="profile-status-card">
          <Icon name="shield" />
          <span><strong>{copy.protectedTitle}</strong><small>{copy.protectedText}</small></span>
        </div>
      </div>

      <div className="profile-layout">
        <nav className="profile-nav">
          <Link className="active" to="/profile"><Icon name="user" />{translations.common.profile}</Link>
          <Link to="/orders"><Icon name="box" />{translations.common.orders}</Link>
          <Link to="/favorites"><Icon name="heart" />{translations.common.favorites}</Link>
          <Link to="/cart"><Icon name="cart" />{translations.common.cart}</Link>
        </nav>

        <div className="profile-content">
          <form className="form-panel" onSubmit={(event) => { event.preventDefault(); if (profileValid) save.mutate() }}>
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
            <Field label={translations.common.phone} placeholder="+49 221 555 0174" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
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

          <section className="form-panel">
            <header><span>02</span><div><h2>{copy.savedAddresses}</h2><p>{copy.addressesHelp}</p></div></header>
            <div className="saved-addresses">
              {(addresses.data || []).map((item) => (
                <article key={item.id}>
                  <span className="address-icon"><Icon name="map" /></span>
                  <div><strong>{item.label}</strong><span>{item.recipient_name}</span><small>{item.address_line1}{item.address_line2 ? `, ${item.address_line2}` : ''}, {item.city}, {item.country_code} {item.postal_code}</small></div>
                  <div className="address-actions">
                    {item.is_default && <em>{copy.defaultAddress}</em>}
                    <button type="button" aria-label={copy.deleteAddress} onClick={() => {
                      if (item.id && window.confirm(copy.confirmDeleteAddress)) deleteAddress.mutate(item.id)
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
                <Field label={translations.common.phone} required value={address.phone} onChange={(event) => setAddress({ ...address, phone: event.target.value })} />
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
    </section>
  )
}
