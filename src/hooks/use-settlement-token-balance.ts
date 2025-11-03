'use client'

import { useMemo } from 'react'

import { useBalance } from 'wagmi'

import type { MezoChainId } from '@/lib/config'
import { getMusdContractAddress } from '@/lib/config'

type Params = {
  address?: `0x${string}` | null
  chainId?: number | null
}

type Result = {
  value: bigint | null
  tokenAddress: `0x${string}` | null
  isSupportedChain: boolean
  isLoading: boolean
  isError: boolean
}

function toMezoChainId(chainId?: number | null): MezoChainId | null {
  if (chainId === 31611) {
    return chainId
  }
  return null
}

/**
 * Watches the connected wallet's MUSD balance on Mezo so UIs can surface the
 * current settlement liquidity without duplicating wagmi configuration.
 */
export function useSettlementTokenBalance({
  address,
  chainId
}: Params): Result {
  const mezoChainId = toMezoChainId(chainId)
  const tokenAddress = useMemo(() => {
    return mezoChainId ? getMusdContractAddress(mezoChainId) : ''
  }, [mezoChainId])

  const canQuery =
    Boolean(address) && Boolean(tokenAddress) && Boolean(mezoChainId)

  const { data, isLoading, isError } = useBalance({
    address: address ?? undefined,
    chainId: mezoChainId ?? undefined,
    token: tokenAddress ? (tokenAddress as `0x${string}`) : undefined,
    query: {
      enabled: canQuery,
      refetchInterval: canQuery ? 10000 : false
    }
  })

  return {
    value: data?.value ?? null,
    tokenAddress: tokenAddress ? (tokenAddress as `0x${string}`) : null,
    isSupportedChain: Boolean(mezoChainId),
    isLoading,
    isError
  }
}
