import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './index.css'

// PWA: ثبت Service Worker (حالت autoUpdate)
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    // در نسخه‌ی وب، بروزرسانی خودکار در پس‌زمینه انجام می‌شود
  },
})

// برای استفاده در دیباگ/تست
window.__yadche_updateSW = updateSW

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
