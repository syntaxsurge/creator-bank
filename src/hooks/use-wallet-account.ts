'use client'

import { useCallback, useMemo } from 'react'

import { useConnectModal } from '@rainbow-me/rainbowkit'
import type { PublicClient, WalletClient } from 'viem'
import {
  useAccount,
  useDisconnect,
  usePublicClient,
  useWalletClient
} from 'wagmi'

type WalletAccount = {
  address: `0x${string}` | null
  chainId: number | null
  originAddress: `0x${string}` | null
  originChain: string | null
  status: ReturnType<typeof useAccount>['status']
  isConnected: boolean
  connect: () => void
  disconnect: () => void
  publicClient: PublicClient | null
  walletClient: WalletClient | null
}

/**
 * Normalizes wagmi/RainbowKit state into a single hook so the rest of the app
 * can remain agnostic about connector details.
 */
export function useWalletAccount(): WalletAccount {
  const { address, chainId, status, isConnected } = useAccount()
  const publicClient = usePublicClient({ chainId: chainId ?? undefined })
  const { data: walletClient } = useWalletClient({
    chainId: chainId ?? undefined
  })
  const { disconnectAsync } = useDisconnect()
  const { openConnectModal } = useConnectModal()

  const connect = useCallback(() => {
    openConnectModal?.()
  }, [openConnectModal])

  const disconnect = useCallback(() => {
    if (!isConnected) return
    disconnectAsync().catch(error => {
      console.error('Failed to disconnect wallet', error)
    })
  }, [disconnectAsync, isConnected])

  return useMemo(
    () => ({
      address: address ?? null,
      chainId: chainId ?? null,
      originAddress: (address ?? null) as `0x${string}` | null,
      originChain: chainId ? (`eip155:${chainId}` as const) : null,
      status,
      isConnected,
      connect,
      disconnect,
      publicClient: (publicClient ?? null) as PublicClient | null,
      walletClient: (walletClient ?? null) as WalletClient | null
    }),
    [
      address,
      chainId,
      status,
      isConnected,
      connect,
      disconnect,
      publicClient,
      walletClient
    ]
  )
}
