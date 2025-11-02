'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { toast } from 'sonner'
import { Address, formatUnits, parseAbi, parseUnits } from 'viem'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useChainPreference } from '@/hooks/use-chain-preference'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import {
  SETTLEMENT_TOKEN_DECIMALS,
  SETTLEMENT_TOKEN_SYMBOL,
  getMusdContractAddress,
  getTigrisMusdBtcPoolAddress,
  getTigrisRouterAddress,
  getWrappedBtcContractAddress
} from '@/lib/config'
import { Erc20Service, TigrisRouterService } from '@/lib/onchain/services'
import {
  formatSettlementToken,
  parseSettlementTokenAmount
} from '@/lib/settlement-token'

type SwapDirection = 'musdToBtc' | 'btcToMusd'

const DEFAULT_SLIPPAGE = '0.5'
const TIGRIS_POOL_ABI = parseAbi([
  'function token0() view returns (address)',
  'function token1() view returns (address)'
])

export function SwapSection() {
  const { address, walletClient, publicClient } = useWalletAccount()
  const { chainId } = useChainPreference()

  const routerAddress = useMemo(() => {
    const value = getTigrisRouterAddress(chainId)
    return value ? (value as Address) : undefined
  }, [chainId])
  const musdAddress = useMemo(() => {
    const value = getMusdContractAddress(chainId)
    return value ? (value as Address) : undefined
  }, [chainId])
  const configuredBtcAddress = useMemo(() => {
    const value = getWrappedBtcContractAddress(chainId)
    return value ? (value as Address) : undefined
  }, [chainId])
  const poolAddress = useMemo(() => {
    const value = getTigrisMusdBtcPoolAddress(chainId)
    return value ? (value as Address) : undefined
  }, [chainId])

  const [direction, setDirection] = useState<SwapDirection>('musdToBtc')
  const [amountIn, setAmountIn] = useState('')
  const [slippage, setSlippage] = useState(DEFAULT_SLIPPAGE)
  const [estimating, setEstimating] = useState(false)
  const [estimatedOut, setEstimatedOut] = useState<string | null>(null)
  const [estimatedOutRaw, setEstimatedOutRaw] = useState<bigint | null>(null)
  const [musdDecimals, setMusdDecimals] = useState<number>(
    SETTLEMENT_TOKEN_DECIMALS
  )
  const [btcDecimals, setBtcDecimals] = useState<number>(18)
  const [musdBalance, setMusdBalance] = useState<bigint | null>(null)
  const [btcBalance, setBtcBalance] = useState<bigint | null>(null)
  const [pendingSwap, setPendingSwap] = useState(false)
  const [discoveredBtcAddress, setDiscoveredBtcAddress] =
    useState<Address | null>(null)

  const routerService = useMemo(() => {
    if (!publicClient || !walletClient || !routerAddress) {
      return null
    }
    try {
      return new TigrisRouterService({
        publicClient,
        walletClient,
        address: routerAddress,
        account: address as Address | undefined
      })
    } catch (error) {
      console.error(error)
      return null
    }
  }, [address, publicClient, walletClient, routerAddress])

  const musdService = useMemo(() => {
    if (!publicClient || !walletClient || !musdAddress) {
      return null
    }
    try {
      return new Erc20Service({
        publicClient,
        walletClient,
        address: musdAddress,
        account: address as Address | undefined
      })
    } catch (error) {
      console.error(error)
      return null
    }
  }, [address, publicClient, walletClient, musdAddress])

  const btcService = useMemo(() => {
    const btcAddress = configuredBtcAddress ?? discoveredBtcAddress ?? undefined
    if (!publicClient || !walletClient || !btcAddress) {
      return null
    }
    try {
      return new Erc20Service({
        publicClient,
        walletClient,
        address: btcAddress,
        account: address as Address | undefined
      })
    } catch (error) {
      console.error(error)
      return null
    }
  }, [
    address,
    configuredBtcAddress,
    discoveredBtcAddress,
    publicClient,
    walletClient
  ])

  useEffect(() => {
    const fetchDecimals = async () => {
      try {
        if (musdService) {
          const value = await musdService.decimals()
          setMusdDecimals(value)
        }
        if (btcService) {
          const value = await btcService.decimals()
          setBtcDecimals(value)
        }
      } catch (error) {
        console.error('Unable to load token metadata', error)
      }
    }
    fetchDecimals()
  }, [musdService, btcService])

  useEffect(() => {
    if (!publicClient || !poolAddress || !musdAddress) {
      setDiscoveredBtcAddress(null)
      return
    }

    let cancelled = false

    const resolvePoolTokens = async () => {
      try {
        const [token0, token1] = await Promise.all([
          publicClient.readContract({
            abi: TIGRIS_POOL_ABI,
            address: poolAddress,
            functionName: 'token0'
          }) as Promise<Address>,
          publicClient.readContract({
            abi: TIGRIS_POOL_ABI,
            address: poolAddress,
            functionName: 'token1'
          }) as Promise<Address>
        ])
        const normalizedMusd = musdAddress.toLowerCase()
        const candidate =
          token0.toLowerCase() === normalizedMusd ? token1 : token0
        if (!cancelled) {
          setDiscoveredBtcAddress(candidate as Address)
        }
      } catch (error) {
        console.error('Unable to resolve Tigris pool tokens', error)
        if (!cancelled) {
          setDiscoveredBtcAddress(null)
        }
      }
    }

    resolvePoolTokens()

    return () => {
      cancelled = true
    }
  }, [musdAddress, poolAddress, publicClient])

  const refreshBalances = useCallback(async () => {
    if (!address) return
    try {
      if (musdService) {
        const balance = await musdService.balanceOf(address as Address)
        setMusdBalance(balance)
      }
      if (btcService) {
        const balance = await btcService.balanceOf(address as Address)
        setBtcBalance(balance)
      }
    } catch (error) {
      console.error('Unable to fetch balances', error)
    }
  }, [address, btcService, musdService])

  useEffect(() => {
    refreshBalances()
  }, [refreshBalances])

  const btcTokenAddress =
    configuredBtcAddress ?? discoveredBtcAddress ?? undefined

  const inputTokenAddress =
    direction === 'musdToBtc' ? musdAddress : btcTokenAddress

  const outputTokenAddress =
    direction === 'musdToBtc' ? btcTokenAddress : musdAddress

  const inputDecimals = direction === 'musdToBtc' ? musdDecimals : btcDecimals
  const outputDecimals = direction === 'musdToBtc' ? btcDecimals : musdDecimals

  const inputService = direction === 'musdToBtc' ? musdService : btcService

  useEffect(() => {
    const estimate = async () => {
      if (!routerService || !inputTokenAddress || !outputTokenAddress) {
        setEstimatedOut(null)
        setEstimatedOutRaw(null)
        return
      }

      if (!amountIn || Number(amountIn) <= 0) {
        setEstimatedOut(null)
        setEstimatedOutRaw(null)
        return
      }

      try {
        const parsed =
          direction === 'musdToBtc'
            ? parseSettlementTokenAmount(amountIn)
            : parseUnits(amountIn, inputDecimals)

        if (parsed <= 0n) {
          setEstimatedOut(null)
          setEstimatedOutRaw(null)
          return
        }

        setEstimating(true)
        const path =
          direction === 'musdToBtc'
            ? [inputTokenAddress, outputTokenAddress]
            : [inputTokenAddress, outputTokenAddress]

        const amountsOut = await routerService.getAmountsOut(parsed, path)
        const outputRaw = amountsOut.at(-1) ?? 0n
        setEstimatedOutRaw(outputRaw)
        setEstimatedOut(formatUnits(outputRaw, outputDecimals))
      } catch (error) {
        console.error('Unable to estimate swap output', error)
        setEstimatedOut(null)
        setEstimatedOutRaw(null)
      } finally {
        setEstimating(false)
      }
    }

    estimate()
  }, [
    amountIn,
    direction,
    inputDecimals,
    outputDecimals,
    inputTokenAddress,
    outputTokenAddress,
    routerService
  ])

  const handleSwapDirection = () => {
    setAmountIn('')
    setEstimatedOut(null)
    setEstimatedOutRaw(null)
    setDirection(prev => (prev === 'musdToBtc' ? 'btcToMusd' : 'musdToBtc'))
  }

  const handleSwap = async () => {
    if (!address) {
      toast.error('Connect your wallet to swap tokens.')
      return
    }
    if (
      !routerService ||
      !inputTokenAddress ||
      !outputTokenAddress ||
      !inputService
    ) {
      toast.error('Swap contracts unavailable. Check your configuration.')
      return
    }
    if (!amountIn || Number(amountIn) <= 0) {
      toast.error('Enter an amount to swap.')
      return
    }
    if (!estimatedOutRaw || estimatedOutRaw <= 0n) {
      toast.error('Unable to compute expected output. Adjust your amount.')
      return
    }

    const parsedAmount =
      direction === 'musdToBtc'
        ? parseSettlementTokenAmount(amountIn)
        : parseUnits(amountIn, inputDecimals)

    if (parsedAmount <= 0n) {
      toast.error('Enter an amount greater than zero.')
      return
    }

    const slippageNumber = Math.max(0, Number(slippage) || 0)
    const slippageBps = Math.floor(slippageNumber * 100)
    const minOut =
      estimatedOutRaw - (estimatedOutRaw * BigInt(slippageBps)) / BigInt(10000)

    setPendingSwap(true)
    try {
      const routerAddressHex = routerAddress as Address
      const allowance = await inputService.allowance(
        address as Address,
        routerAddressHex
      )

      if (allowance < parsedAmount) {
        const approval = await inputService.approve(
          routerAddressHex,
          parsedAmount
        )
        await approval.wait()
      }

      const path =
        direction === 'musdToBtc'
          ? [inputTokenAddress, outputTokenAddress]
          : [inputTokenAddress, outputTokenAddress]

      const swap = await routerService.swapExactTokensForTokens({
        amountIn: parsedAmount,
        amountOutMin: minOut < 0n ? 0n : minOut,
        path,
        recipient: address as Address
      })

      await swap.wait()
      toast.success('Swap completed successfully.')
      setAmountIn('')
      setEstimatedOut(null)
      setEstimatedOutRaw(null)
      await refreshBalances()
    } catch (error: any) {
      console.error('Swap failed', error)
      toast.error(error?.shortMessage ?? error?.message ?? 'Swap failed.')
    } finally {
      setPendingSwap(false)
    }
  }

  if (!routerAddress || !musdAddress || !btcTokenAddress) {
    return (
      <div className='rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-sm text-muted-foreground'>
        Configure the Tigris router, MUSD, and BTC liquidity pool addresses to
        enable swaps.
      </div>
    )
  }

  const musdBalanceFormatted =
    musdBalance !== null
      ? formatSettlementToken(musdBalance, { maximumFractionDigits: 4 })
      : null
  const btcBalanceFormatted =
    btcBalance !== null
      ? `${Number(formatUnits(btcBalance, btcDecimals)).toFixed(4)} BTC`
      : null

  return (
    <div className='rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
      <div className='mb-6 space-y-1'>
        <h2 className='text-lg font-semibold text-foreground'>
          Convert liquidity
        </h2>
        <p className='text-sm text-muted-foreground'>
          Swap between {SETTLEMENT_TOKEN_SYMBOL} and wrapped BTC using Tigris
          liquidity.
        </p>
      </div>

      <div className='space-y-6'>
        <div className='grid gap-5 md:grid-cols-2'>
          <div className='space-y-3 rounded-xl border border-border/70 bg-background/70 p-4'>
            <Label className='text-xs uppercase text-muted-foreground'>
              You send
            </Label>
            <Input
              placeholder='0.00'
              value={amountIn}
              onChange={event => setAmountIn(event.target.value)}
              className='text-lg'
            />
            <p className='text-xs text-muted-foreground'>
              Balance:{' '}
              {direction === 'musdToBtc'
                ? (musdBalanceFormatted ?? '—')
                : (btcBalanceFormatted ?? '—')}
            </p>
          </div>

          <div className='space-y-3 rounded-xl border border-border/70 bg-background/70 p-4'>
            <Label className='text-xs uppercase text-muted-foreground'>
              You receive
            </Label>
            <Input
              value={
                estimating
                  ? 'Estimating...'
                  : estimatedOut !== null
                    ? estimatedOut
                    : ''
              }
              readOnly
              className='text-lg'
            />
            <p className='text-xs text-muted-foreground'>
              Output token:{' '}
              {direction === 'musdToBtc'
                ? 'Wrapped BTC'
                : SETTLEMENT_TOKEN_SYMBOL}
            </p>
          </div>
        </div>

        <div className='flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
          <div className='flex items-center gap-3'>
            <Label htmlFor='slippage' className='text-sm text-muted-foreground'>
              Slippage (%)
            </Label>
            <Input
              id='slippage'
              className='w-24'
              type='number'
              min={0}
              max={100}
              step={0.1}
              value={slippage}
              onChange={event => setSlippage(event.target.value)}
            />
          </div>

          <Button type='button' variant='outline' onClick={handleSwapDirection}>
            Flip direction
          </Button>
        </div>

        <Separator />

        <Button
          type='button'
          size='lg'
          onClick={handleSwap}
          disabled={pendingSwap || !walletClient}
        >
          {pendingSwap
            ? 'Confirming swap...'
            : direction === 'musdToBtc'
              ? `Swap ${SETTLEMENT_TOKEN_SYMBOL} for BTC`
              : `Swap BTC for ${SETTLEMENT_TOKEN_SYMBOL}`}
        </Button>
      </div>
    </div>
  )
}
