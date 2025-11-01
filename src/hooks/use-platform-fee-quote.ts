'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useChainPreference } from '@/hooks/use-chain-preference'
import {
  SUBSCRIPTION_PRICE_USD,
  getPlatformTreasuryAddress
} from '@/lib/config'
import {
  PlatformFeeQuote,
  resolvePlatformFeeQuote
} from '@/lib/pricing/platform-fee'

type UsePlatformFeeQuoteOptions = {
  autoFetch?: boolean
}

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})

function formatSubscriptionUsdLabel() {
  const parsed = Number(SUBSCRIPTION_PRICE_USD)
  if (!Number.isFinite(parsed)) {
    return `$${SUBSCRIPTION_PRICE_USD} USD/month`
  }
  return `${USD_FORMATTER.format(parsed)}/month`
}

export function usePlatformFeeQuote(options: UsePlatformFeeQuoteOptions = {}) {
  const { autoFetch = false } = options
  const [quote, setQuote] = useState<PlatformFeeQuote | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const { chainId } = useChainPreference()

  const treasuryAddress = useMemo(() => {
    const value = getPlatformTreasuryAddress(chainId)
    return value ? (value as `0x${string}`) : null
  }, [chainId])

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      if (!treasuryAddress) {
        throw new Error('Platform treasury address is not configured')
      }
      const next = await resolvePlatformFeeQuote({
        treasuryAddress
      })
      setQuote(next)
      return next
    } catch (err) {
      const error =
        err instanceof Error ? err : new Error('Failed to resolve pricing')
      setError(error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [treasuryAddress])

  useEffect(() => {
    if (!autoFetch) return
    void refresh()
  }, [autoFetch, refresh])

  const usdLabel = useMemo(() => formatSubscriptionUsdLabel(), [])
  const settlementLabel = useMemo(
    () => (quote ? `${quote.displayAmount}/month` : null),
    [quote]
  )

  return {
    quote,
    label: usdLabel,
    usdLabel,
    settlementLabel,
    loading,
    error,
    refresh
  }
}
