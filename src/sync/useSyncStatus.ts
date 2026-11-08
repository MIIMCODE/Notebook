import { useEffect, useState } from 'react'
import { getSyncState } from '../db'
import { getSyncStatus, onSyncStatus, type SyncStatus } from './engine'

export function useSyncStatus(): { status: SyncStatus; lastSyncAt: number; version: number } {
  const [status, setStatus] = useState<SyncStatus>(getSyncStatus())
  const [lastSyncAt, setLastSyncAt] = useState(0)
  const [version, setVersion] = useState(0)

  useEffect(() => {
    const un = onSyncStatus((s) => {
      setStatus(s)
      if (s === 'idle') setVersion((v) => v + 1)
    })
    void getSyncState().then((s) => setLastSyncAt(s.lastPullAt || s.lastPushAt))
    return un
  }, [])

  return { status, lastSyncAt, version }
}
