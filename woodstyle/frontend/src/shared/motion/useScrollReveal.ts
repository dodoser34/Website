import { useEffect } from 'react'

export function useScrollReveal(key: string) {
  useEffect(() => {
    let observer: IntersectionObserver | undefined
    let mutationObserver: MutationObserver | undefined
    let frame = 0
    const observed = new WeakSet<HTMLElement>()
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const revealImmediately = reducedMotion || !('IntersectionObserver' in window)

    const registerElements = () => {
      const elements = Array.from(document.querySelectorAll<HTMLElement>('.reveal'))
      elements.forEach((element) => {
        if (observed.has(element)) return
        observed.add(element)

        const parent = element.parentElement
        if (parent) {
          const order = Array.from(parent.children).filter((child) => child.classList.contains('reveal')).indexOf(element)
          element.style.setProperty('--reveal-order', String(Math.min(Math.max(order, 0), 6)))
        }

        if (revealImmediately) {
          element.classList.add('is-visible')
          return
        }

        observer?.observe(element)
      })
    }

    frame = window.requestAnimationFrame(() => {
      if (!revealImmediately) {
        observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return
            entry.target.classList.add('is-visible')
            observer?.unobserve(entry.target)
          })
        }, {
          rootMargin: '0px 0px -12% 0px',
          threshold: 0.16,
        })
      }

      registerElements()
      mutationObserver = new MutationObserver(registerElements)
      mutationObserver.observe(document.body, { childList: true, subtree: true })
    })

    return () => {
      window.cancelAnimationFrame(frame)
      observer?.disconnect()
      mutationObserver?.disconnect()
    }
  }, [key])
}
