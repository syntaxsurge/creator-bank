'use client'

import { ReactNode, useEffect, useMemo, useState } from 'react'

import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import type { Config as WagmiConfig } from 'wagmi'
import { WagmiProvider } from 'wagmi'

import { ConvexClientProvider } from '@/providers/convex-client-provider'

type AppProvidersProps = {
  children: ReactNode
}

/**
 * Aggregates theme, wagmi/Passport, and Convex providers so the rest of the app
 * can rely on a single source of truth for wallet connectivity and data.
 */
export function AppProviders({ children }: AppProvidersProps) {
  const queryClient = useMemo(() => new QueryClient(), [])
  const [wagmiConfig, setWagmiConfig] = useState<WagmiConfig | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadConfig() {
      const passport = await import('@mezo-org/passport')
      const config = passport.getConfig({ appName: 'CreatorBank' })
      if (!cancelled) {
        setWagmiConfig(config)
      }
    }

    loadConfig()

    return () => {
      cancelled = true
    }
  }, [])

  if (!wagmiConfig) {
    return null
  }

  return (
    <NextThemeProvider
      attribute='class'
      defaultTheme='system'
      enableSystem
      disableTransitionOnChange
    >
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          <RainbowKitProvider initialChain={wagmiConfig.chains[0]}>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </NextThemeProvider>
  )
}
