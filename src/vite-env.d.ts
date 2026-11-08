/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface Window {
  __yadche_updateSW?: (reloadPage?: boolean) => Promise<void>
}

/** نسخه‌ی اپ از package.json (از vite define) */
declare const __APP_VERSION__: string
