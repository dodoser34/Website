import { useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom'

import { api } from '../api/client'
import { localeOptions } from '../i18n/config'
import { getTranslations } from '../i18n'
import { useGuestStore, usePreferencesStore, useSessionStore } from '../store/app'
import type { Locale } from '../types'
import { useToast } from '../shared/ui/ToastProvider'
import BrandMark from './BrandMark'
import Icon from './Icon'

export default function Header() {
  const [open, setOpen] = useState(false)
  const [accountOpen, setAccountOpen] = useState(false)
  const { pathname } = useLocation()
  const { locale, currency, setLocale, setCurrency } = usePreferencesStore()
  const { accessToken, user, setUser, logout } = useSessionStore()
  const guestCart = useGuestStore((state) => state.cart)
  const guestFavorites = useGuestStore((state) => state.favorites)
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const copy = getTranslations(locale)
  const currencies = useQuery({ queryKey: ['currencies'], queryFn: () => api.currencies() })
  const me = useQuery({ queryKey: ['me', accessToken], queryFn: api.me, enabled: Boolean(accessToken) })
  const cart = useQuery({
    queryKey: ['cart', locale, currency],
    queryFn: () => api.cart(locale, currency),
    enabled: Boolean(accessToken),
  })
  const favorites = useQuery({
    queryKey: ['favorites', locale, currency],
    queryFn: () => api.favorites(locale, currency),
    enabled: Boolean(accessToken),
  })

  useEffect(() => {
    setOpen(false)
    setAccountOpen(false)
  }, [pathname])

  useEffect(() => {
    if (me.data) setUser(me.data)
    if (me.isError) logout()
  }, [logout, me.data, me.isError, setUser])

  useEffect(() => {
    document.body.classList.toggle('menu-open', open)
    return () => document.body.classList.remove('menu-open')
  }, [open])

  const signOut = async () => {
    try {
      await api.logout(useSessionStore.getState().refreshToken)
    } catch {
      // Local state must still be cleared if the server session already expired.
    }
    logout()
    queryClient.clear()
    toast.push(copy.common.logout, 'info')
    navigate('/')
  }

  const cartCount = accessToken
    ? cart.data?.item_count || 0
    : guestCart.reduce((total, item) => total + item.quantity, 0)
  const favoriteCount = accessToken ? favorites.data?.length || 0 : guestFavorites.length

  return (
    <>
      <div className="announcement-bar">
        <div className="container">
          <span>{copy.header.announcement}</span>
          <Link to="/contacts">{copy.header.showroomVisit}<Icon name="arrow" size={15} /></Link>
        </div>
      </div>
      <header className="site-header">
        <div className="container header-inner">
          <Link className="brand" to="/">
            <span className="brand-mark"><BrandMark size={32} /></span>
            <span><strong>WoodStyle</strong><small>{copy.header.brandLine}</small></span>
          </Link>

          <nav className={`main-nav ${open ? 'is-open' : ''}`} aria-label={copy.header.navigationLabel}>
            <div className="mobile-nav-heading">
              <span>{copy.header.menu}</span>
              <button onClick={() => setOpen(false)} aria-label={copy.header.closeMenu}><Icon name="close" /></button>
            </div>
            <NavLink to="/" end>{copy.common.home}</NavLink>
            <NavLink to="/catalog">{copy.common.catalog}</NavLink>
            <NavLink to="/about">{copy.common.about}</NavLink>
            <NavLink to="/contacts">{copy.common.contacts}</NavLink>
            {user?.role === 'admin' && <NavLink to="/admin">{copy.common.admin}</NavLink>}
            <div className="mobile-nav-contact">
              <small>{copy.header.headquarters}</small>
              <strong>Kleine Budengasse 1-3, Köln</strong>
              <a href="tel:+492215550174">+49 221 555 0174</a>
            </div>
          </nav>

          <div className="header-actions">
            <label className="compact-select" aria-label={copy.common.language}>
              <select value={locale} onChange={(event) => setLocale(event.target.value as Locale)}>
                {localeOptions.map((option) => (
                  <option value={option.code} key={option.code}>{option.shortLabel} · {option.name}</option>
                ))}
              </select>
              <Icon name="chevron" size={13} />
            </label>
            <label className="compact-select currency-select" aria-label={copy.common.currency}>
              <select value={currency} onChange={(event) => setCurrency(event.target.value)}>
                {(currencies.data || []).map((item) => <option key={item.code} value={item.code}>{item.code} · {item.symbol}</option>)}
              </select>
              <Icon name="chevron" size={13} />
            </label>
            <Link className="icon-button desktop-action" to="/catalog" aria-label={copy.common.search}><Icon name="search" /></Link>
            <Link className="icon-button desktop-action counted-action" to="/favorites" aria-label={copy.common.favorites}>
              <Icon name="heart" />
              <AnimatePresence mode="popLayout">
                {favoriteCount > 0 && <motion.span key={favoriteCount} className="action-badge" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>{favoriteCount}</motion.span>}
              </AnimatePresence>
            </Link>
            <Link className="icon-button counted-action" to="/cart" aria-label={copy.common.cart}>
              <Icon name="cart" />
              <AnimatePresence mode="popLayout">
                {cartCount > 0 && <motion.span key={cartCount} className="action-badge" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.6, opacity: 0 }}>{cartCount}</motion.span>}
              </AnimatePresence>
            </Link>
            {accessToken ? (
              <div className="account-menu">
                <button className="account-trigger" onClick={() => setAccountOpen((value) => !value)} aria-expanded={accountOpen}>
                  <span className="account-avatar">{(user?.first_name?.[0] || user?.email?.[0] || 'W').toUpperCase()}</span>
                  <span className="account-trigger-copy">
                    <strong>{user?.first_name || copy.common.account}</strong>
                    <small>{user?.role === 'admin' ? copy.header.administrator : copy.header.member}</small>
                  </span>
                  <Icon name="chevron" size={14} />
                </button>
                <AnimatePresence>
                {accountOpen && (
                  <motion.div className="account-dropdown" initial={{ opacity: 0, y: -8, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -6, scale: 0.98 }}>
                    <div className="account-dropdown-head">
                      <span className="account-avatar large">{(user?.first_name?.[0] || user?.email?.[0] || 'W').toUpperCase()}</span>
                      <span><strong>{user?.first_name} {user?.last_name}</strong><small>{user?.email}</small></span>
                    </div>
                    <Link to="/profile"><Icon name="user" />{copy.common.account}</Link>
                    <Link to="/orders"><Icon name="box" />{copy.common.orders}</Link>
                    <Link to="/favorites"><Icon name="heart" />{copy.common.favorites}</Link>
                    {user?.role === 'admin' && <Link to="/admin"><Icon name="sparkles" />{copy.common.admin}</Link>}
                    <button onClick={signOut}><Icon name="close" />{copy.common.logout}</button>
                  </motion.div>
                )}
                </AnimatePresence>
              </div>
            ) : <Link className="header-login" to="/auth">{copy.common.login}</Link>}
            <button className="icon-button menu-button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-label={copy.header.toggleMenu}>
              <Icon name={open ? 'close' : 'menu'} />
            </button>
          </div>
        </div>
      </header>
      {open && <button className="menu-backdrop" aria-label={copy.header.closeMenu} onClick={() => setOpen(false)} />}
    </>
  )
}
