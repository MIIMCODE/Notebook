import {
  db,
  emitDbChange,
  getSettings,
  saveSettings,
  getSyncState,
  saveSyncState,
  getDeviceId,
} from '../index'

export { getSettings, saveSettings, getSyncState, saveSyncState, getDeviceId }

export const settingsRepo = {
  get: getSettings,
  save: saveSettings,
  sync: getSyncState,
  saveSync: saveSyncState,
  deviceId: getDeviceId,

  async resetOnboarding(): Promise<void> {
    await saveSettings({ onboarded: false })
  },

  /** پاک‌سازی کامل داده‌های محلی (قبل از خروج/ورود مجدد) */
  async clearLocal(): Promise<void> {
    await db.delete()
    await db.open()
    emitDbChange('settings')
  },
}
