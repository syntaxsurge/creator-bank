'use client'

import { useEffect, useState } from 'react'

import type { Config as WagmiConfig } from 'wagmi'

/**
 * Dynamically loads the Passport wagmi config on the client. Passport currently
 * reads from browser APIs, so we delay the import until after hydration.
 */
export function usePassportConfig() {
  const [config, setConfig] = useState<WagmiConfig | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      const passport = await import('@mezo-org/passport')
      if (cancelled) return
      const resolved = passport.getConfig({ appName: 'CreatorBank' })
      setConfig(resolved)
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [])

  return config
}
