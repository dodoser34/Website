import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  PropsWithChildren,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { useId } from 'react'
import { Link } from 'react-router-dom'

import Icon from './Icon'

export function PageHero({
  eyebrow,
  title,
  lead,
  aside,
}: {
  eyebrow: string
  title: string
  lead?: string
  aside?: ReactNode
}) {
  return (
    <section className="page-hero reveal">
      <div className="container page-hero-inner">
        <div>
          <span className="eyebrow"><span />{eyebrow}</span>
          <h1>{title}</h1>
          {lead && <p>{lead}</p>}
        </div>
        {aside}
      </div>
    </section>
  )
}

export function Field({
  label,
  hint,
  error,
  className = '',
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  hint?: string
  error?: string
}) {
  const generatedId = useId()
  const inputId = props.id || generatedId
  const helpId = `${inputId}-help`
  return (
    <label className={`field ${error ? 'field-error' : ''} ${className}`}>
      <span className="field-label">{label}</span>
      <input
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? helpId : undefined}
        {...props}
        id={inputId}
      />
      {(error || hint) && <small id={helpId}>{error || hint}</small>}
    </label>
  )
}

export function SelectField({
  label,
  hint,
  children,
  className = '',
  ...props
}: PropsWithChildren<
  SelectHTMLAttributes<HTMLSelectElement> & {
    label: string
    hint?: string
  }
>) {
  const generatedId = useId()
  const inputId = props.id || generatedId
  const helpId = `${inputId}-help`
  return (
    <label className={`field ${className}`}>
      <span className="field-label">{label}</span>
      <span className="select-shell">
        <select
          {...props}
          id={inputId}
          aria-describedby={hint ? helpId : undefined}
        >
          {children}
        </select>
        <Icon name="chevron" size={16} />
      </span>
      {hint && <small id={helpId}>{hint}</small>}
    </label>
  )
}

export function TextareaField({
  label,
  hint,
  error,
  className = '',
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string
  hint?: string
  error?: string
}) {
  const generatedId = useId()
  const inputId = props.id || generatedId
  const helpId = `${inputId}-help`
  return (
    <label className={`field ${error ? 'field-error' : ''} ${className}`}>
      <span className="field-label">{label}</span>
      <textarea
        aria-invalid={Boolean(error)}
        aria-describedby={error || hint ? helpId : undefined}
        {...props}
        id={inputId}
      />
      {(error || hint) && <small id={helpId}>{error || hint}</small>}
    </label>
  )
}

export function EmptyState({
  icon = 'leaf',
  title,
  text,
  action,
  to = '/catalog',
}: {
  icon?: 'leaf' | 'heart' | 'cart' | 'box' | 'search'
  title: string
  text?: string
  action?: string
  to?: string
}) {
  return (
    <div className="empty-state reveal">
      <span className="empty-icon"><Icon name={icon} size={30} /></span>
      <h2>{title}</h2>
      {text && <p>{text}</p>}
      {action && <Link className="button button-primary" to={to}>{action}<Icon name="arrow" size={18} /></Link>}
    </div>
  )
}

export function Skeleton({ className = '' }: { className?: string }) {
  return <span className={`skeleton ${className}`} aria-hidden="true" />
}

export function Badge({ children, tone = 'neutral' }: PropsWithChildren<{ tone?: 'neutral' | 'success' | 'warning' | 'danger' }>) {
  return <span className={`badge badge-${tone}`}>{children}</span>
}

export function FileDropzone({
  label,
  hint,
  preview,
  onChange,
}: {
  label: string
  hint: string
  preview?: string
  onChange: (file?: File) => void
}) {
  return (
    <label className="file-dropzone">
      {preview ? <img src={preview} alt="" /> : <span className="file-dropzone-icon"><Icon name="upload" /></span>}
      <strong>{label}</strong>
      <small>{hint}</small>
      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => onChange(event.target.files?.[0])} />
    </label>
  )
}

export function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
}) {
  return <button className={`button button-${variant} ${className}`} {...props}>{children}</button>
}
