import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import Preview from './Preview.tsx'

const isPreview = window.location.pathname === '/preview';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {isPreview ? <Preview /> : <App />}
  </StrictMode>,
)
