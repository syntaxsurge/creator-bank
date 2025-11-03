import { createPublicClient, defineChain, fallback, http } from 'viem'
import type { PublicClient } from 'viem'

import {
  MezoChainId,
  getActiveChainId,
  getBlockExplorerUrl,
  getRpcUrls,
  subscribeToChainPreference
} from '@/lib/config'

let cachedChainId: MezoChainId = getActiveChainId()

function buildChain(chainId: MezoChainId) {
  const rpcUrls = getRpcUrls(chainId)

  return defineChain({
    id: chainId,
    name: 'Mezo Testnet',
    network: 'mezo-testnet',
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 18
    },
    rpcUrls: {
      default: { http: rpcUrls },
      public: { http: rpcUrls }
    },
    blockExplorers: {
      default: {
        name: 'Mezo Explorer',
        url: getBlockExplorerUrl(chainId)
      }
    },
    testnet: true
  })
}

let cachedChain = buildChain(cachedChainId)
let cachedPublicClient: PublicClient | null = null

subscribeToChainPreference(() => {
  const nextChainId = getActiveChainId()
  cachedChainId = nextChainId
  cachedChain = buildChain(nextChainId)
  cachedPublicClient = null
})

export function getMezoChain() {
  return cachedChain
}

export function getMezoPublicClient(chainId?: MezoChainId): PublicClient {
  if (typeof chainId !== 'undefined' && chainId !== cachedChainId) {
    cachedChainId = chainId
    cachedChain = buildChain(chainId)
    cachedPublicClient = null
  }

  if (!cachedPublicClient) {
    const rpcUrls = getRpcUrls(cachedChainId).map(url => http(url))
    cachedPublicClient = createPublicClient({
      chain: cachedChain,
      transport: fallback(rpcUrls)
    })
  }

  return cachedPublicClient
}
