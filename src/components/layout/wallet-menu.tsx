'use client'

import { useMemo } from 'react'

import { ConnectButton } from '@rainbow-me/rainbowkit'
import { Badge } from '@/components/ui/badge'
import { useSettlementTokenBalance } from '@/hooks/use-settlement-token-balance'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import { formatSettlementToken } from '@/lib/settlement-token'
import { SETTLEMENT_TOKEN_SYMBOL } from '@/lib/config'

const CHAIN_LABELS: Record<number, string> = {
  31611: 'Mezo Testnet',
  31612: 'Mezo Mainnet'
}

export function WalletMenu() {
  const {
    address,
    chainId: walletChainId,
    isConnected
  } = useWalletAccount()
  const { value: musdBalance, isSupportedChain, isLoading, isError } =
    useSettlementTokenBalance({ address, chainId: walletChainId })
  const networkLabel = useMemo(() => {
    if (!walletChainId) return null
    return CHAIN_LABELS[walletChainId] ?? `Chain ${walletChainId}`
  }, [walletChainId])
  const balanceLabel = useMemo(() => {
    if (!isConnected || !isSupportedChain) return null
    if (isLoading) return `${SETTLEMENT_TOKEN_SYMBOL} …`
    if (musdBalance !== null) {
      return formatSettlementToken(musdBalance, { maximumFractionDigits: 2 })
    }
    if (isError) return `${SETTLEMENT_TOKEN_SYMBOL} ?`
    return `0 ${SETTLEMENT_TOKEN_SYMBOL}`
  }, [isConnected, isSupportedChain, isLoading, musdBalance, isError])

  return (
    <div className='flex items-center gap-2'>
      {balanceLabel ? (
        <Badge variant='outline' className='hidden md:flex'>
          {balanceLabel}
        </Badge>
      ) : null}
      {networkLabel ? (
        <Badge variant='outline' className='hidden md:flex'>
          {networkLabel}
        </Badge>
      ) : null}
      <ConnectButton label='Connect wallet' />
    </div>
  )
}
