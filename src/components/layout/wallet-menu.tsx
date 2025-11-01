'use client'

import { useMemo } from 'react'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useChainId } from 'wagmi'

import { Badge } from '@/components/ui/badge'

const CHAIN_LABELS: Record<number, string> = {
  31611: 'Mezo Testnet',
  31612: 'Mezo Mainnet'
}

export function WalletMenu() {
  const chainId = useChainId()
  const networkLabel = useMemo(() => {
    if (!chainId) return null
    return CHAIN_LABELS[chainId] ?? `Chain ${chainId}`
  }, [chainId])

  return (
    <div className='flex items-center gap-2'>
      {networkLabel ? (
        <Badge variant='outline' className='hidden md:flex'>
          {networkLabel}
        </Badge>
      ) : null}
      <ConnectButton label='Connect wallet' />
    </div>
  )
}
