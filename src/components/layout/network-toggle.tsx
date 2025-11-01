'use client'

import { useMemo } from 'react'

import { AlertTriangle, Loader2 } from 'lucide-react'
import { useChainId, useSwitchChain } from 'wagmi'

import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select'
import { useChainPreference } from '@/hooks/use-chain-preference'
import type { MezoChainId } from '@/lib/config'

const LABELS: Record<MezoChainId, string> = {
  31611: 'Mezo Testnet',
  31612: 'Mezo Mainnet'
}

export function NetworkToggle() {
  const walletChainId = useChainId()
  const { switchChainAsync, isPending } = useSwitchChain()
  const { chainId, setChainId, supportedChainIds } = useChainPreference()

  const mismatchWarning = useMemo(() => {
    if (!walletChainId) return false
    return walletChainId !== chainId
  }, [walletChainId, chainId])

  async function handleChange(value: string) {
    const parsed = Number(value)
    if (!supportedChainIds.includes(parsed as MezoChainId)) return

    const nextChainId = parsed as MezoChainId
    setChainId(nextChainId)

    if (switchChainAsync) {
      try {
        await switchChainAsync({ chainId: nextChainId })
      } catch (error) {
        console.warn('Wallet declined chain switch', error)
      }
    }
  }

  return (
    <div className='flex items-center gap-2'>
      <Select
        value={String(chainId)}
        onValueChange={handleChange}
        disabled={isPending}
      >
        <SelectTrigger className='w-[160px]'>
          <SelectValue placeholder='Select network' />
        </SelectTrigger>
        <SelectContent align='end'>
          {supportedChainIds.map(id => (
            <SelectItem key={id} value={String(id)}>
              {LABELS[id as MezoChainId]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isPending ? (
        <Loader2 className='h-4 w-4 animate-spin text-muted-foreground' />
      ) : null}
      {mismatchWarning ? (
        <Badge
          variant='outline'
          className='flex items-center gap-1 text-amber-600'
        >
          <AlertTriangle className='h-3.5 w-3.5' />
          Wallet on{' '}
          {LABELS[walletChainId as MezoChainId] ?? `Chain ${walletChainId}`}
        </Badge>
      ) : null}
    </div>
  )
}
