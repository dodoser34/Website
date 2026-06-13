import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'

import Footer from '../components/Footer'
import Header from '../components/Header'
import { Skeleton } from '../components/ui'
import { getTranslations } from '../i18n'
import { usePreferencesStore } from '../store/app'
import { useSessionStore } from '../store/app'

const About = lazy(() => import('../pages/About'))
const Admin = lazy(() => import('../pages/Admin'))
const Auth = lazy(() => import('../pages/Auth'))
const Cart = lazy(() => import('../pages/Cart'))
const Catalog = lazy(() => import('../pages/Catalog'))
const Checkout = lazy(() => import('../pages/Checkout'))
const Contacts = lazy(() => import('../pages/Contacts'))
const Favorites = lazy(() => import('../pages/Favorites'))
const Home = lazy(() => import('../pages/Home'))
const Orders = lazy(() => import('../pages/Orders'))
const Product = lazy(() => import('../pages/Product'))
const Profile = lazy(() => import('../pages/Profile'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo({ top: 0, behavior: 'instant' }), [pathname])
  return null
}

function Protected({ children }: { children: React.ReactNode }) {
  const token = useSessionStore((state) => state.accessToken)
  return token ? children : <Navigate to="/auth" replace />
}

function AdminOnly({ children }: { children: React.ReactNode }) {
  const user = useSessionStore((state) => state.user)
  if (!user) return <Navigate to="/auth" replace />
  return user.role === 'admin' ? children : <Navigate to="/profile" replace />
}

export default function App() {
  const locale = usePreferencesStore((state) => state.locale)
  const copy = getTranslations(locale)
  return (
    <div className="app-shell">
      <ScrollToTop />
      <Header />
      <main>
        <Suspense fallback={<div className="container route-skeleton"><Skeleton /><Skeleton /><span>{copy.common.loading}</span></div>}>
          <Routes>
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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
