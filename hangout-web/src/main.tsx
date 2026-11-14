import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { Providers } from './app/providers'
import { router } from './app/router'
import { applyTheme } from './app/theme'
import { config } from './lib/config'
import './index.css'

applyTheme()

async function start() {
  // Mock API (MSW) until the Java backend is live. Turn off with VITE_USE_MOCKS=false.
  if (config.useMocks) {
    const { worker } = await import('./mocks/browser')
    await worker.start()
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <Providers>
        <RouterProvider router={router} />
      </Providers>
    </StrictMode>,
  )
}

void start()
