import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { z } from 'zod'

import { api } from '../api/client'
import authImage from '../assets/images/site/auth-lifestyle-v1.webp'
import Icon from '../components/Icon'
import { Button, Field } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { useToast } from '../shared/ui/ToastProvider'
import { useGuestStore, usePreferencesStore, useSessionStore } from '../store/app'

const schema = z.object({
  email: z.email(),
  password: z.string().min(8).max(128),
  first_name: z.string().optional(),
  last_name: z.string().optional(),
}).superRefine((value, context) => {
  const localPart = value.email.split('@')[0]?.toLowerCase()
  const password = value.password.toLowerCase()
  if (password === value.email.toLowerCase() || password === localPart) {
    context.addIssue({
      code: 'custom',
      path: ['password'],
      message: 'Password must not match email',
    })
  }
})
type FormValues = z.infer<typeof schema>

const demoAccounts = [
  { role: 'Admin', email: 'admin@woodstyle.com', password: 'Admin123!' },
  { role: 'Customer', email: 'customer@woodstyle.com', password: 'Customer123!' },
] as const

const demoCopy = {
  en: {
    title: 'Demo accounts',
    text: 'Use these accounts to check the admin panel and customer profile.',
    use: 'Use',
  },
  ru: {
    title: 'Пример аккаунтов',
    text: 'Можно быстро проверить вход администратора и обычного покупателя.',
    use: 'Подставить',
  },
  de: {
    title: 'Demo-Konten',
    text: 'Nutzen Sie diese Konten für Adminbereich und Kundenprofil.',
    use: 'Einsetzen',
  },
  ja: {
    title: 'デモアカウント',
    text: '管理画面と通常アカウントの確認に使えます。',
    use: '入力',
  },
  fr: {
    title: 'Comptes démo',
    text: 'Utilisez ces comptes pour tester l’admin et le profil client.',
    use: 'Utiliser',
  },
} as const

export default function Auth() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { locale, currency } = usePreferencesStore()
  const translations = getTranslations(locale)
  const copy = translations.auth
  const { setTokens, setUser } = useSessionStore()
  const { cart, favorites, clearCart, clearFavorites } = useGuestStore()
  const toast = useToast()
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '', first_name: '', last_name: '' },
  })
  const password = watch('password')
  const strength = useMemo(() => {
    if (!password) return 0
    return [password.length >= 8, /[A-Z]/.test(password), /\d/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length
  }, [password])
  useDocumentMeta(mode === 'login' ? copy.titleLogin : copy.titleRegister, mode === 'login' ? copy.leadLogin : copy.leadRegister, locale)

  const useDemoAccount = (account: (typeof demoAccounts)[number]) => {
    setMode('login')
    setValue('email', account.email, { shouldDirty: true, shouldValidate: true })
    setValue('password', account.password, { shouldDirty: true, shouldValidate: true })
  }

  const submit = async (values: FormValues) => {
    setError('')
    try {
      const tokens = mode === 'login'
        ? await api.login({ email: values.email, password: values.password })
        : await api.register({
            ...values,
            first_name: values.first_name || copy.customerFallback,
            locale,
            currency_code: currency,
          })
      setTokens(tokens.access_token, tokens.refresh_token)
      const user = await api.me()
      setUser(user)
      if (cart.length) await api.mergeCart(cart, locale, currency)
      for (const productId of favorites) await api.addFavorite(productId)
      clearCart()
      clearFavorites()
      toast.push(mode === 'login' ? copy.titleLogin : copy.titleRegister, 'success')
      navigate(user.role === 'admin' ? '/admin' : '/profile')
    } catch (reason) {
      const failure = reason instanceof Error ? reason.message : copy.failure
      setError(failure)
      toast.push(failure, 'error')
    }
  }

  return (
    <section className="auth-page">
      <div className="auth-visual reveal">
        <img src={authImage} alt="" />
        <div className="auth-visual-copy"><span className="eyebrow light"><span />{copy.accountEyebrow}</span><h2>{copy.visualTitle}</h2></div>
      </div>
      <div className="auth-card reveal reveal-delay-1">
        <div className="auth-heading">
          <span className="eyebrow"><span />{copy.accountEyebrow}</span>
          <h1>{mode === 'login' ? copy.titleLogin : copy.titleRegister}</h1>
          <p>{mode === 'login' ? copy.leadLogin : copy.leadRegister}</p>
        </div>
        <div className="auth-tabs" role="tablist">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>{copy.loginTab}</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>{copy.registerTab}</button>
        </div>
        <form className="account-form" onSubmit={handleSubmit(submit)}>
          {mode === 'register' && (
            <div className="form-row">
              <Field label={copy.firstName} autoComplete="given-name" placeholder={copy.firstNamePlaceholder} error={errors.first_name?.message} {...register('first_name')} />
              <Field label={copy.lastName} autoComplete="family-name" placeholder={copy.lastNamePlaceholder} {...register('last_name')} />
            </div>
          )}
          <Field label={translations.common.email} type="email" autoComplete="email" placeholder="name@example.com" error={errors.email ? copy.invalidEmail : ''} {...register('email')} />
          <div className="password-field">
            <Field label={copy.password} type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="••••••••" error={errors.password ? copy.shortPassword : ''} {...register('password')} />
            <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={copy.showPassword}><Icon name="eye" /></button>
          </div>
          {mode === 'register' && <div className="password-strength"><span><i style={{ width: `${strength * 25}%` }} /></span><small>{copy.strength[strength]}</small></div>}
          {error && <p className="form-message error">{error}</p>}
          <Button className="button-wide" disabled={isSubmitting}>{isSubmitting ? copy.wait : mode === 'login' ? copy.loginAction : copy.registerAction}<Icon name="arrow" /></Button>
        </form>
        <div className="account-benefits">
          <div><Icon name="shield" /><span><strong>{copy.memberTitle}</strong><small>{copy.memberText}</small></span></div>
          <span><Icon name="check" />{copy.syncedFavorites}</span>
          <span><Icon name="check" />{copy.fasterCheckout}</span>
        </div>
        <div className="demo-accounts reveal reveal-delay-2">
          <div>
            <strong>{demoCopy[locale].title}</strong>
            <small>{demoCopy[locale].text}</small>
          </div>
          {demoAccounts.map((account) => (
            <article key={account.email}>
              <span>
                <strong>{account.role}</strong>
                <small>{account.email}</small>
                <code>{account.password}</code>
              </span>
              <button type="button" onClick={() => useDemoAccount(account)}>{demoCopy[locale].use}</button>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
