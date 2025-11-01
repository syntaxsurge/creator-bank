import { SETTLEMENT_TOKEN_SYMBOL } from '@/lib/config'

const TOKEN_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 4
})

const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 0,
  maximumFractionDigits: 2
})

type BillingCadence = 'free' | 'monthly' | undefined

export function formatGroupPriceLabel(
  price: number | undefined,
  cadence: BillingCadence,
  options?: { includeCadence?: boolean; usdRate?: number | null }
) {
  const includeCadence = options?.includeCadence ?? true
  if (!price || price <= 0 || cadence === 'free') {
    return includeCadence ? 'Free' : 'Join for free'
  }
  const usdRate = options?.usdRate
  const amount =
    typeof usdRate === 'number' && usdRate > 0
      ? USD_FORMATTER.format(price * usdRate)
      : `${TOKEN_FORMATTER.format(price)} ${SETTLEMENT_TOKEN_SYMBOL}`
  if (!includeCadence) {
    return amount
  }
  const cadenceLabel = cadence === 'monthly' || !cadence ? 'month' : cadence
  return `${amount}/${cadenceLabel}`
}
