'use client'

import { ReactNode, useMemo } from 'react'

import { RainbowKitProvider } from '@rainbow-me/rainbowkit'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeProvider as NextThemeProvider } from 'next-themes'
import { WagmiProvider } from 'wagmi'

import { usePassportConfig } from '@/hooks/use-passport-config'
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
  const wagmiConfig = usePassportConfig()

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
