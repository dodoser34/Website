import { localeOptions } from '../../i18n/config'
import type { Locale } from '../../types'

export function LanguageTabs({
  activeLocale,
  onChange,
}: {
  activeLocale: Locale
  onChange: (locale: Locale) => void
}) {
  return (
    <div className="language-tabs">
      {localeOptions.map((option) => (
        <button
          className={activeLocale === option.code ? 'active' : ''}
          key={option.code}
          onClick={() => onChange(option.code)}
          type="button"
        >
          {option.shortLabel}
        </button>
      ))}
    </div>
  )
}
