'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

import { ChevronDown, ExternalLink, Wallet } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useSettlementTokenBalance } from '@/hooks/use-settlement-token-balance'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import { MEZO_TESTNET_HUB_URL, SETTLEMENT_TOKEN_SYMBOL } from '@/lib/config'
import { formatSettlementToken } from '@/lib/settlement-token'

export function HeaderUtilityMenu() {
  const [open, setOpen] = useState(false)
  const { address, chainId: walletChainId, isConnected } = useWalletAccount()
  const {
    value: musdBalance,
    isLoading: isBalanceLoading,
    isError: isBalanceError,
    isSupportedChain
  } = useSettlementTokenBalance({ address, chainId: walletChainId })

  const balanceText = useMemo(() => {
    if (!isConnected) return '--'
    if (!isSupportedChain) return '--'
    if (isBalanceLoading) return 'Loading...'
    if (musdBalance !== null) {
      return formatSettlementToken(musdBalance, { maximumFractionDigits: 2 })
    }
    if (isBalanceError) return 'Unavailable'
    return `0 ${SETTLEMENT_TOKEN_SYMBOL}`
  }, [
    isBalanceError,
    isBalanceLoading,
    isConnected,
    isSupportedChain,
    musdBalance
  ])

  const balanceHint = useMemo(() => {
    if (!isConnected) return 'Connect your wallet to view settlement funds.'
    if (!isSupportedChain) {
      return 'Switch your wallet to Mezo Testnet (chain 31611) to sync balance.'
    }
    if (isBalanceError) return 'Unable to sync balance right now.'
    if (isBalanceLoading) return 'Fetching the latest balance...'
    return `${SETTLEMENT_TOKEN_SYMBOL} balance reflects the connected wallet.`
  }, [
    isBalanceError,
    isBalanceLoading,
    isConnected,
    isSupportedChain
  ])

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          type='button'
          variant='outline'
          size='sm'
          className='group flex items-center gap-2 rounded-full border-border/70 bg-card/70 px-3 font-medium text-foreground shadow-sm transition hover:bg-accent hover:text-accent-foreground'
          aria-label='Open wallet tools'
        >
          <Wallet className='h-4 w-4 text-muted-foreground transition group-hover:text-foreground' />
          <span>Wallet tools</span>
          <ChevronDown
            className={`h-3 w-3 text-muted-foreground transition ${
              open ? 'rotate-180' : ''
            }`}
            aria-hidden='true'
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align='end'
        className='w-72 rounded-xl border border-border/70 bg-popover/95 p-3 shadow-xl backdrop-blur'
      >
        <DropdownMenuLabel className='text-xs uppercase tracking-wide text-muted-foreground'>
          Settlement balance
        </DropdownMenuLabel>
        <div className='rounded-lg border border-border/60 bg-background/80 p-3'>
          <p className='text-lg font-semibold text-foreground'>{balanceText}</p>
          <p className='mt-1 text-xs text-muted-foreground'>{balanceHint}</p>
        </div>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className='cursor-pointer rounded-md px-2'>
          <Link
            href={MEZO_TESTNET_HUB_URL}
            target='_blank'
            rel='noreferrer noopener'
            className='flex w-full items-center justify-between gap-2 text-sm font-medium text-foreground'
          >
            <span>Get MUSD</span>
            <ExternalLink className='h-4 w-4 text-muted-foreground' />
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
