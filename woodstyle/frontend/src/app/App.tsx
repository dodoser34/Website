import { AnimatePresence } from 'motion/react'
import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Footer from '../components/Footer'
import Header from '../components/Header'
import { Skeleton } from '../components/ui'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'
import { useSessionStore } from '../store/app'
import { useScrollReveal } from '../shared/motion/useScrollReveal'
import { AnimatedPage } from '../shared/ui/AnimatedPage'

const About = lazy(() => import('../pages/About'))
const Admin = lazy(() => import('../pages/Admin'))
const Auth = lazy(() => import('../pages/Auth'))
const Cart = lazy(() => import('../pages/Cart'))
const Catalog = lazy(() => import('../pages/Catalog'))
const Checkout = lazy(() => import('../pages/Checkout'))
const Contacts = lazy(() => import('../pages/Contacts'))
const Favorites = lazy(() => import('../pages/Favorites'))
const Forbidden = lazy(() => import('../pages/Forbidden'))
const Home = lazy(() => import('../pages/Home'))
const Orders = lazy(() => import('../pages/Orders'))
const Product = lazy(() => import('../pages/Product'))
const Profile = lazy(() => import('../pages/Profile'))
const NotFound = lazy(() => import('../pages/NotFound'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' }), [pathname])
  return null
}

function Protected({ children }: { children: React.ReactNode }) {
  const token = useSessionStore((state) => state.accessToken)
  const ready = useSessionStore((state) => state.ready)
  if (!ready) return <div className="container route-skeleton"><Skeleton /><Skeleton /></div>
  return token ? children : <Navigate to="/auth" replace />
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((state) => state.user)
  const ready = useSessionStore((state) => state.ready)
  if (!ready) return <div className="container route-skeleton"><Skeleton /><Skeleton /></div>
  if (!user) return <Navigate to="/auth" replace />
  return user.role === 'admin' ? children : <Navigate to="/forbidden" replace />
}

export default function App() {
  const location = useLocation()
  const adminLayout = location.pathname.startsWith('/admin')
  const locale = usePreferencesStore((state) => state.locale)
  const copy = getTranslations(locale)
  useScrollReveal(location.pathname)

  return (
    <div className={`app-shell ${adminLayout ? 'admin-shell' : ''}`}>
      <ScrollToTop />
      {!adminLayout && <Header />}
      <main className={adminLayout ? 'admin-main' : undefined}>
        <Suspense fallback={<div className="container route-skeleton"><Skeleton /><Skeleton /><span>{copy.common.loading}</span></div>}>
          <AnimatePresence mode="wait" initial={false}>
            <AnimatedPage key={location.pathname}>
              <Routes location={location}>
                <Route path="/" element={<Home />} />
                <Route path="/catalog" element={<Catalog />} />
                <Route path="/product/:id" element={<Product />} />
                <Route path="/favorites" element={<Favorites />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/about" element={<About />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/checkout" element={<Protected><Checkout /></Protected>} />
                <Route path="/profile" element={<Protected><Profile /></Protected>} />
                <Route path="/orders" element={<Protected><Orders /></Protected>} />
                <Route path="/admin" element={<AdminOnly><Admin /></AdminOnly>} />
                <Route path="/forbidden" element={<Forbidden />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnimatedPage>
          </AnimatePresence>
        </Suspense>
      </main>
      {!adminLayout && <Footer />}
    </div>
  )
}
