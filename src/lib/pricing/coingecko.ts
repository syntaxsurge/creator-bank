const PRICE_TTL_MS = 10 * 60_000

type CachedPrice = {
  value: number
  expiresAt: number
}

const priceCache = new Map<string, CachedPrice>()
const inFlight = new Map<string, Promise<number | null>>()

type CoingeckoResponse = Record<string, { usd?: number }>

async function requestPrice(id: string): Promise<number | null> {
  const response = await fetch(
    `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(id)}&vs_currencies=usd`,
    {
      headers: {
        accept: 'application/json'
      }
    }
  )

  if (!response.ok) {
    throw new Error(`Failed to fetch price for ${id} (${response.status})`)
  }

  const data = (await response.json()) as CoingeckoResponse
  const price = data[id]?.usd
  if (typeof price !== 'number' || !Number.isFinite(price) || price <= 0) {
    console.warn(
      `Coingecko returned invalid price for "${id}". Using fallback if provided.`
    )
    return null
  }

  priceCache.set(id, {
    value: price,
    expiresAt: Date.now() + PRICE_TTL_MS
  })

  return price
}

export function getCachedCoingeckoUsdPrice(id: string) {
  const cached = priceCache.get(id)
  if (cached && cached.expiresAt > Date.now()) {
    return cached.value
  }
  return null
}

export async function getCoingeckoUsdPrice(id: string): Promise<number | null> {
  const cached = getCachedCoingeckoUsdPrice(id)
  if (cached !== null) {
    return cached
  }

  let pending = inFlight.get(id)
  if (!pending) {
    pending = requestPrice(id)
      .catch(error => {
        console.warn(`Failed to fetch price for "${id}"`, error)
        return null
      })
      .finally(() => {
        inFlight.delete(id)
      })
    inFlight.set(id, pending)
  }
  return pending!
}
