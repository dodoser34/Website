import { useState } from 'react'

import { api } from '../api/client'
import showroomImage from '../assets/images/showroom-reception-v1.webp'
import Icon from '../components/Icon'
import { Button, Field, TextareaField } from '../components/ui'
import { showroom } from '../config/showroom'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'

export default function Contacts() {
  const locale = usePreferencesStore((state) => state.locale)
  const translations = getTranslations(locale)
  const copy = translations.contacts
  const config = showroom(locale)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' })
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')
  useDocumentMeta(copy.title, copy.lead, locale)

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setStatus('sending')
    try {
      await api.contact(form)
      setStatus('success')
      setMessage(copy.sent)
      setForm({ name: '', phone: '', email: '', message: '' })
    } catch (reason) {
      setStatus('error')
      setMessage(reason instanceof Error ? reason.message : copy.sendError)
    }
  }

  return (
    <div className="contacts-page">
      <section className="contact-hero">
        <img src={showroomImage} alt="" />
        <div className="contact-hero-overlay" />
        <div className="container contact-hero-copy reveal">
          <span className="eyebrow light"><span />{copy.eyebrow}</span>
          <h1>{copy.title}</h1>
          <p>{copy.lead}</p>
          <span className="location-note"><Icon name="map" size={17} />{copy.headquarters}</span>
        </div>
      </section>

      <section className="container contact-details-grid">
        <article className="contact-detail-card reveal">
          <Icon name="map" />
          <small>{copy.details}</small>
          <strong>{config.name}</strong>
          <p>{config.address}</p>
          <a className="text-link" href={config.mapsUrl} target="_blank" rel="noreferrer">{copy.route}<Icon name="arrow" size={16} /></a>
        </article>
        <article className="contact-detail-card reveal reveal-delay-1">
          <Icon name="clock" />
          <small>{copy.hours}</small>
          <div className="hours-list">{config.hours.map((row) => <span key={row.days}><strong>{row.days}</strong><em>{row.hours}</em></span>)}</div>
        </article>
        <article className="contact-detail-card reveal reveal-delay-2">
          <Icon name="mail" />
          <small>{copy.getInTouch}</small>
          <a href={`mailto:${config.email}`}>{config.email}</a>
          <a href={`tel:${config.phone.replace(/\s/g, '')}`}>{config.phone}</a>
          <p>{copy.replyTime}</p>
        </article>
      </section>

      <section className="container map-section reveal">
        <div className="map-frame">
          {mapLoaded ? (
            <iframe
              src={config.embedUrl}
              title={copy.mapTitle}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />
          ) : (
            <div className="map-placeholder">
              <span className="map-pin"><Icon name="map" size={30} /></span>
              <div><strong>Kleine Budengasse 1-3, Köln</strong><p>{copy.mapPrivacy}</p></div>
              <Button onClick={() => setMapLoaded(true)}>{copy.loadMap}<Icon name="arrow" /></Button>
            </div>
          )}
        </div>
      </section>

      <section className="container contact-form-section">
        <div className="contact-form-copy reveal">
          <span className="eyebrow"><span />{config.email}</span>
          <h2>{copy.formTitle}</h2>
          <p>{copy.formText}</p>
          <div className="contact-assurances">
            {copy.assurances.map((assurance) => <span key={assurance}><Icon name="check" />{assurance}</span>)}
          </div>
        </div>
        <form className="contact-form reveal reveal-delay-1" onSubmit={submit}>
          <div className="form-row">
            <Field label={copy.yourName} placeholder={copy.namePlaceholder} required minLength={2} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
            <Field label={translations.common.phone} placeholder="+49 221 555 0174" required minLength={7} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
          </div>
          <Field label={translations.common.email} type="email" placeholder="name@example.com" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
          <TextareaField label={copy.message} placeholder={copy.messagePlaceholder} required minLength={10} rows={6} value={form.message} onChange={(event) => setForm({ ...form, message: event.target.value })} />
          {message && <p className={`form-message ${status === 'error' ? 'error' : 'success'}`}>{message}</p>}
          <Button disabled={status === 'sending'}>{status === 'sending' ? copy.sending : copy.send}<Icon name="arrow" /></Button>
        </form>
      </section>
    </div>
  )
}
