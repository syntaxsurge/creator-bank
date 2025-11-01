import { useCallback, useEffect, useState } from 'react'

import {
  getCachedCoingeckoUsdPrice,
  getCoingeckoUsdPrice
} from '@/lib/pricing/coingecko'

type UseTokenUsdRateOptions = {
  autoFetch?: boolean
  fallbackRate?: number
}

export function useTokenUsdRate(
  coingeckoId: string,
  options: UseTokenUsdRateOptions = {}
) {
  const { autoFetch = false, fallbackRate } = options
  const initial = getCachedCoingeckoUsdPrice(coingeckoId)
  const [rate, setRate] = useState<number | null>(() => {
    if (initial !== null) return initial
    if (typeof fallbackRate === 'number' && Number.isFinite(fallbackRate)) {
      return fallbackRate
    }
    return null
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const next = await getCoingeckoUsdPrice(coingeckoId)
      if (next && Number.isFinite(next)) {
        setRate(next)
        return next
      }
      if (typeof fallbackRate === 'number' && Number.isFinite(fallbackRate)) {
        setRate(fallbackRate)
        return fallbackRate
      }
      setRate(null)
      return null
    } catch (err) {
      const nextError =
        err instanceof Error ? err : new Error('Failed to fetch price')
      setError(nextError)
      if (typeof fallbackRate === 'number' && Number.isFinite(fallbackRate)) {
        setRate(fallbackRate)
        return fallbackRate
      }
      return null
    } finally {
      setLoading(false)
    }
  }, [coingeckoId, fallbackRate])

  useEffect(() => {
    if (!autoFetch) return
    if (rate !== null) return
    void refresh()
  }, [autoFetch, rate, refresh])

  return {
    rate,
    loading,
    error,
    refresh
  }
}
