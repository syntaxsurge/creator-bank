import { formatUnits, parseUnits } from 'viem'

import {
  SETTLEMENT_TOKEN_DECIMALS,
  SETTLEMENT_TOKEN_SYMBOL
} from '@/lib/config'

const DEFAULT_MAX_FRACTION_DIGITS = 4

type FormatOptions = {
  minimumFractionDigits?: number
  maximumFractionDigits?: number
}

/**
 * Converts a human readable token amount into the smallest unit for the
 * settlement token (MUSD).
 */
export function parseSettlementTokenAmount(value: string | number) {
  const normalized = typeof value === 'number' ? value.toString() : value.trim()
  if (normalized === '') {
    return 0n
  }
  return parseUnits(normalized, SETTLEMENT_TOKEN_DECIMALS)
}

function formatSettlementTokenNumber(amount: bigint) {
  return Number(formatUnits(amount, SETTLEMENT_TOKEN_DECIMALS))
}

export function formatSettlementToken(amount: bigint, options?: FormatOptions) {
  const maximumFractionDigits =
    options?.maximumFractionDigits ?? DEFAULT_MAX_FRACTION_DIGITS
  const minimumFractionDigits = options?.minimumFractionDigits ?? 0
  const value = formatSettlementTokenNumber(amount)
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits,
    maximumFractionDigits
  })
  return `${formatter.format(value)} ${SETTLEMENT_TOKEN_SYMBOL}`
}

export function describeSettlementAmount(amount: number | string) {
  return `${amount} ${SETTLEMENT_TOKEN_SYMBOL}`
}
