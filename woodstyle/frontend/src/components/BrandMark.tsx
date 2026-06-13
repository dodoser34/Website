interface BrandMarkProps {
  size?: number
  className?: string
}

export default function BrandMark({ size = 42, className = '' }: BrandMarkProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="32" cy="32" r="29" stroke="currentColor" strokeWidth="2" />
      <path
        d="M18 22c5 1 9 4 14 10 5-6 9-9 14-10-1 8-5 14-14 20-9-6-13-12-14-20Z"
        fill="currentColor"
        opacity=".18"
      />
      <path d="M18 22c5 1 9 4 14 10 5-6 9-9 14-10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M32 32v17M24 39c3 0 6 2 8 5M40 39c-3 0-6 2-8 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M24 17c2-2 5-3 8-3s6 1 8 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity=".6" />
    </svg>
  )
}
