import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource/manrope/latin-400.css'
import '@fontsource/manrope/cyrillic-400.css'
import '@fontsource/manrope/latin-500.css'
import '@fontsource/manrope/cyrillic-500.css'
import '@fontsource/manrope/latin-600.css'
import '@fontsource/manrope/cyrillic-600.css'
import '@fontsource/manrope/latin-700.css'
import '@fontsource/manrope/cyrillic-700.css'
import '@fontsource/prata/latin-400.css'
import '@fontsource/prata/cyrillic-400.css'

import App from './app/App'
import { AppProviders } from './app/providers'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppProviders>
        <App />
      </AppProviders>
    </BrowserRouter>
  </StrictMode>,
)
