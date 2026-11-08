/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __yadche_updateSW?: (reloadPage?: boolean) => Promise<void>
}
