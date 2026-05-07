import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from '@/contexts/AuthContext'
import { App } from './App'
import './index.css'

const root = document.getElementById('root')!

createRoot(root).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              background: '#1a1c2e',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '12px',
              fontSize: '14px',
              fontFamily: 'Space Grotesk, system-ui, sans-serif',
            },
            success: { iconTheme: { primary: '#7c5cff', secondary: '#fff' } },
            error: { iconTheme: { primary: '#f87171', secondary: '#fff' } },
          }}
        />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>,
)
