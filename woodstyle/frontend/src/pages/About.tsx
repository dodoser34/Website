import aboutImage from '../assets/images/site/about-story-v3.webp'
import atelierImage from '../assets/images/site/atelier-craft-v2.webp'
import editorialImage from '../assets/images/site/editorial-dining-v2.webp'
import materialImage from '../assets/images/site/material-walnut-detail-v2.webp'
import Icon from '../components/Icon'
import { PageHero } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'

export default function About() {
  const locale = usePreferencesStore((state) => state.locale)
  const copy = getTranslations(locale).about
  const processLabels = {
    en: ['Source', 'Craft', 'Finish', 'Inspect', 'Deliver'],
    ru: ['Отбор', 'Работа', 'Отделка', 'Контроль', 'Доставка'],
    de: ['Auswahl', 'Fertigung', 'Finish', 'Prüfung', 'Lieferung'],
    ja: ['選定', '製作', '仕上げ', '検品', '配送'],
    fr: ['Sélection', 'Fabrication', 'Finition', 'Contrôle', 'Livraison'],
  }[locale]
  const processTitle = {
    en: 'Thoughtful at every step.',
    ru: 'Продумано на каждом этапе.',
    de: 'Durchdacht in jedem Schritt.',
    ja: 'すべての工程にこだわりを。',
    fr: 'Chaque étape est pensée.',
  }[locale]
  useDocumentMeta(copy.title, copy.lead, locale)

  return (
    <div className="about-page">
      <PageHero eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} image={aboutImage} imageAlt="" className="about-page-hero" />
      <section className="container about-editorial" id="story">
        <div className="about-editorial-image reveal"><img src={editorialImage} alt="" /></div>
        <div className="about-editorial-copy reveal reveal-delay-1">
          <span className="section-index">01</span>
          <span className="eyebrow"><span />{copy.philosophy}</span>
          <h2>{copy.storyTitle}</h2>
          <p>{copy.storyText}</p>
          <blockquote>{copy.quote}</blockquote>
        </div>
      </section>

      <section className="about-craft" id="craft">
        <div className="container about-craft-grid">
          <div className="about-craft-copy reveal">
            <span className="section-index">02</span>
            <span className="eyebrow light"><span />{copy.workshop}</span>
            <h2>{copy.craftTitle}</h2>
            <p>{copy.craftText}</p>
            <div className="craft-facts">
              <span><strong>14</strong>{copy.qualityStages}</span>
              <span><strong>3×</strong>{copy.handSanding}</span>
            </div>
          </div>
          <div className="about-craft-image reveal reveal-delay-1"><img src={atelierImage} alt="" loading="lazy" /></div>
        </div>
      </section>

      <section className="container about-values">
        <div className="section-heading reveal"><div><span className="eyebrow"><span />03 · WoodStyle</span><h2>{copy.valuesTitle}</h2></div></div>
        <div className="values-grid">
          {copy.values.map(({ title, text }, index) => (
            <article className={`reveal reveal-delay-${index}`} key={title}>
              <span>0{index + 1}</span><Icon name={index === 0 ? 'leaf' : index === 1 ? 'sparkles' : 'shield'} />
              <h3>{title}</h3><p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="container craft-process reveal">
        <div className="craft-process-heading">
          <span className="eyebrow"><span />WoodStyle</span>
          <h2>{processTitle}</h2>
        </div>
        <div className="craft-process-steps">
          {processLabels.map((label, index) => (
            <article key={label}>
              <span>{index + 1}</span>
              <Icon name={(['leaf', 'sparkles', 'shield', 'check', 'truck'] as const)[index]} />
              <strong>{label}</strong>
            </article>
          ))}
        </div>
      </section>

      <section className="container material-story" id="materials">
        <div className="material-story-image reveal"><img src={materialImage} alt="" loading="lazy" /></div>
        <div className="material-story-copy reveal reveal-delay-1">
          <span className="eyebrow"><span />{copy.paletteEyebrow}</span>
          <h2>{copy.paletteTitle}</h2>
          <p>{copy.paletteText}</p>
        </div>
      </section>
    </div>
  )
}
