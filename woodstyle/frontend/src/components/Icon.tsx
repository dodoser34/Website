interface IconProps {
  name: 'leaf' | 'search' | 'heart' | 'cart' | 'user' | 'menu' | 'close' | 'arrow' | 'plus' | 'minus' | 'chevron' | 'map' | 'clock' | 'mail' | 'phone' | 'upload' | 'eye' | 'box' | 'truck' | 'shield' | 'sparkles' | 'check' | 'currency' | 'instagram' | 'pinterest' | 'facebook' | 'telegram' | 'whatsapp'
  size?: number
}

const paths: Record<IconProps['name'], React.ReactNode> = {
  leaf: <path d="M19 3C11 4 5 8 5 14c0 3 2 5 5 5 6 0 9-8 9-16ZM5 21c2-6 6-10 12-14" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
  cart: <><path d="M3 4h2l2.2 10.5a2 2 0 0 0 2 1.5h7.7a2 2 0 0 0 2-1.6L20 8H6" /><circle cx="10" cy="20" r="1" /><circle cx="18" cy="20" r="1" /></>,
  user: <><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" /></>,
  menu: <><path d="M4 7h16M4 12h16M4 17h16" /></>,
  close: <path d="m6 6 12 12M18 6 6 18" />,
  arrow: <path d="M5 12h14m-5-5 5 5-5 5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  chevron: <path d="m7 9 5 5 5-5" />,
  map: <><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
  phone: <path d="M7 3H4a1 1 0 0 0-1 1c0 9.4 7.6 17 17 17a1 1 0 0 0 1-1v-3l-5-2-2 2c-3-1-6-4-7-7l2-2-2-5Z" />,
  upload: <><path d="M12 16V4m-4 4 4-4 4 4" /><path d="M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" /></>,
  eye: <><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z" /><circle cx="12" cy="12" r="2.5" /></>,
  box: <><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7 8 4v10l-8-4V7Zm16 0-8 4v10l8-4V7Z" /></>,
  truck: <><path d="M3 6h11v11H3zM14 10h4l3 3v4h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
  shield: <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z" />,
  sparkles: <><path d="m12 3 1.3 3.7L17 8l-3.7 1.3L12 13l-1.3-3.7L7 8l3.7-1.3L12 3Z" /><path d="m5 14 .8 2.2L8 17l-2.2.8L5 20l-.8-2.2L2 17l2.2-.8L5 14Zm14-2 .8 2.2 2.2.8-2.2.8L19 18l-.8-2.2L16 15l2.2-.8L19 12Z" /></>,
  check: <path d="m5 12 4 4L19 6" />,
  currency: <><circle cx="12" cy="12" r="9" /><path d="M15 8.5c-.7-.5-1.7-.8-3-.8-1.7 0-3 .8-3 2s1 1.8 3.2 2.3c2 .4 2.8 1.1 2.8 2.2 0 1.3-1.3 2.2-3.2 2.2-1.3 0-2.5-.4-3.3-1M12 5.5v13" /></>,
  instagram: <><rect x="4" y="4" width="16" height="16" rx="4" /><circle cx="12" cy="12" r="3.2" /><circle cx="16.8" cy="7.2" r=".7" fill="currentColor" stroke="none" /></>,
  pinterest: <><circle cx="12" cy="12" r="9" /><path d="M10.3 20c.4-1.5 1-3.9 1.2-4.8m0 0c.5.9 1.4 1.4 2.5 1.4 2.6 0 4.3-2.4 4.3-5.3 0-2.7-2.2-5-5.7-5-4.1 0-6.3 2.7-6.3 5.6 0 1.4.5 2.6 1.6 3.1.2.1.4 0 .5-.2l.3-1.1c.1-.3 0-.4-.2-.7-.3-.4-.6-.9-.6-1.7 0-2 1.6-3.6 4.3-3.6 2.3 0 3.7 1.4 3.7 3.4 0 2.2-1.1 3.8-2.6 3.8-.8 0-1.4-.7-1.2-1.5.2-1 .7-2.1.7-2.8 0-.7-.4-1.2-1.1-1.2-.9 0-1.6.9-1.6 2.1 0 .8.3 1.3.3 1.3l-.9 3.7" /></>,
  facebook: <path d="M14 8h2V4h-3c-3 0-5 2-5 5v2H6v4h2v5h4v-5h3l.6-4H12V9c0-.7.4-1 2-1Z" />,
  telegram: <><path d="M21 5 3.7 11.9c-.9.4-.9 1.6.1 1.9l4.2 1.3 1.6 4.7c.3.9 1.4 1 1.9.2l2.3-3.3 4.2 3.1c.8.6 1.9.1 2.1-.9L22 6.2c.2-.9-.3-1.5-1-1.2Z" /><path d="m8 15 9.2-6.1-7.6 8.2" /></>,
  whatsapp: <><path d="M20 11.7a8 8 0 0 1-11.8 7L4 20l1.3-4A8 8 0 1 1 20 11.7Z" /><path d="M9.2 8.6c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.8 1.8c.1.3.1.5-.1.7l-.4.5c-.1.1-.2.3-.1.5.4.8 1.2 1.7 2.2 2.2.2.1.4.1.5-.1l.7-.8c.2-.2.4-.2.7-.1l1.7.8c.3.1.4.3.4.6 0 .7-.6 1.6-1.3 1.8-.7.2-2.5 0-4.4-1.5-1.6-1.3-2.8-3.1-3.1-4.3-.3-1.1.2-2.1.5-2.6Z" /></>,
}

export default function Icon({ name, size = 20 }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}
