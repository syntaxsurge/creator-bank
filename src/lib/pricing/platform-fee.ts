import {
  encodeFunctionData,
  erc20Abi,
  parseUnits,
  type PublicClient
} from 'viem'

import {
  SETTLEMENT_TOKEN_DECIMALS,
  SETTLEMENT_TOKEN_SYMBOL,
  SUBSCRIPTION_PRICE_USD,
  getMusdContractAddress,
  getPlatformTreasuryAddress,
  subscribeToChainPreference
} from '@/lib/config'
import { formatSettlementToken } from '@/lib/settlement-token'

export type PlatformFeeQuote = {
  usdAmount: number
  symbol: string
  decimals: number
  amount: bigint
  displayAmount: string
  treasuryAddress: `0x${string}`
  params: {
    to: `0x${string}`
    data?: `0x${string}`
    value: bigint
  }
}

type ResolvePlatformFeeQuoteArgs = {
  treasuryAddress?: `0x${string}` | null
}

type BalanceValidationArgs = {
  quote: PlatformFeeQuote
  account?: `0x${string}` | null
  publicClient?: PublicClient | null
}

type BalanceValidationResult = { ok: true } | { ok: false; reason: string }

const PLATFORM_FEE_CACHE_TTL_MS = 5 * 60_000

type CachedFeeQuote = {
  quote: PlatformFeeQuote
  expiresAt: number
}

let cachedQuote: CachedFeeQuote | null = null

subscribeToChainPreference(() => {
  cachedQuote = null
})

function ensureTreasuryAddress(treasury?: `0x${string}` | null) {
  if (!treasury) {
    const fallback = getPlatformTreasuryAddress() as `0x${string}` | ''
    if (!fallback) {
      throw new Error('Treasury address is not configured.')
    }
    return fallback
  }
  return treasury
}

function ensureTokenAddress(): `0x${string}` {
  const token = getMusdContractAddress() as `0x${string}` | ''
  if (!token) {
    throw new Error('MUSD contract address is not configured.')
  }
  return token
}

function parseUsdAmountString(): string {
  const normalized = (SUBSCRIPTION_PRICE_USD ?? '').trim()
  if (!normalized) {
    throw new Error('Platform fee must be specified in USD.')
  }
  if (!/^\d+(\.\d+)?$/.test(normalized)) {
    throw new Error('Platform fee must be a positive number.')
  }
  return normalized
}

function formatSettlementAmount(amount: bigint) {
  return formatSettlementToken(amount)
}

export async function resolvePlatformFeeQuote(
  args: ResolvePlatformFeeQuoteArgs = {}
): Promise<PlatformFeeQuote> {
  const now = Date.now()
  if (cachedQuote && cachedQuote.expiresAt > now) {
    return cachedQuote.quote
  }

  const treasuryAddress = ensureTreasuryAddress(args.treasuryAddress)
  const tokenAddress = ensureTokenAddress()
  const amountString = parseUsdAmountString()
  const amount = parseUnits(amountString, SETTLEMENT_TOKEN_DECIMALS)
  const usdAmount = Number(amountString)
  const displayAmount = formatSettlementAmount(amount)
  const transferData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [treasuryAddress, amount]
  })

  const quote: PlatformFeeQuote = {
    usdAmount,
    symbol: SETTLEMENT_TOKEN_SYMBOL,
    decimals: SETTLEMENT_TOKEN_DECIMALS,
    amount,
    displayAmount,
    treasuryAddress,
    params: {
      to: tokenAddress,
      data: transferData,
      value: 0n
    }
  }

  cachedQuote = {
    quote,
    expiresAt: now + PLATFORM_FEE_CACHE_TTL_MS
  }

  return quote
}

export async function validatePlatformFeeBalance({
  quote,
  account,
  publicClient
}: BalanceValidationArgs): Promise<BalanceValidationResult> {
  if (!account) {
    return {
      ok: false,
      reason: 'Connect your wallet to pay the platform fee.'
    }
  }

  if (!publicClient) {
    return {
      ok: false,
      reason:
        'Blockchain client is unavailable. Please reconnect and try again.'
    }
  }

  const tokenAddress = ensureTokenAddress()
  const balance = (await publicClient.readContract({
    abi: erc20Abi,
    address: tokenAddress,
    functionName: 'balanceOf',
    args: [account]
  })) as bigint
  if (balance < quote.amount) {
    const diff = quote.amount - balance
    return {
      ok: false,
      reason: `You need at least ${quote.displayAmount} to cover the platform fee. You are short by ${formatSettlementAmount(diff)}.`
    }
  }

  return { ok: true }
}
