'use client'

import { useCallback, useSyncExternalStore } from 'react'

import {
  MezoChainId,
  getActiveChainId,
  getBlockExplorerUrl,
  getChainName,
  getDefaultChainId,
  getRpcUrls,
  getSupportedChainIds,
  setActiveChainId,
  subscribeToChainPreference
} from '@/lib/config'

export function useChainPreference() {
  const chainId = useSyncExternalStore<MezoChainId>(
    subscribeToChainPreference,
    getActiveChainId,
    getDefaultChainId
  )

  const setChainId = useCallback((nextChainId: MezoChainId) => {
    setActiveChainId(nextChainId)
  }, [])

  return {
    chainId,
    chainName: getChainName(chainId),
    rpcUrls: getRpcUrls(chainId),
    explorerUrl: getBlockExplorerUrl(chainId),
    supportedChainIds: getSupportedChainIds(),
    setChainId
  }
}
