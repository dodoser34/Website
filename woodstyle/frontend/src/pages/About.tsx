import atelierImage from '../assets/images/atelier-craft-v1.webp'
import materialImage from '../assets/images/material-oak-detail-v1.webp'
import aboutImage from '../assets/images/about-interior-v2.jpg'
import Icon from '../components/Icon'
import { PageHero } from '../components/ui'
import { useDocumentMeta } from '../hooks/useDocumentMeta'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'

export default function About() {
  const locale = usePreferencesStore((state) => state.locale)
  const copy = getTranslations(locale).about
  useDocumentMeta(copy.title, copy.lead, locale)

  return (
    <div className="about-page">
      <PageHero eyebrow={copy.eyebrow} title={copy.title} lead={copy.lead} />
      <section className="container about-editorial">
        <div className="about-editorial-image reveal"><img src={aboutImage} alt="" /></div>
        <div className="about-editorial-copy reveal reveal-delay-1">
          <span className="section-index">01</span>
          <span className="eyebrow"><span />{copy.philosophy}</span>
          <h2>{copy.storyTitle}</h2>
          <p>{copy.storyText}</p>
          <blockquote>{copy.quote}</blockquote>
        </div>
      </section>

      <section className="about-craft">
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

      <section className="container material-story">
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
