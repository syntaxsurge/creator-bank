import {
  createPublicClient,
  defineChain,
  fallback,
  http
} from 'viem'
import type { PublicClient } from 'viem'

type ChainConfig = {
  name: string
  rpcUrls: string[]
  explorerUrl: string
}

const DEFAULT_CHAIN_CONFIGS: Record<number, ChainConfig> = {
  31611: {
    name: 'Mezo Testnet',
    rpcUrls: ['https://rpc.test.mezo.org'],
    explorerUrl: 'https://explorer.test.mezo.org'
  }
}

const cachedPublicClients = new Map<number, PublicClient>()

function parseList(value: string | undefined) {
  if (!value) return []
  return value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
}

function resolveChainConfig(chainId: number): ChainConfig {
  const defaults =
    DEFAULT_CHAIN_CONFIGS[chainId] ?? DEFAULT_CHAIN_CONFIGS[31611]
  const envOverride =
    process.env[`MEZO_RPC_URLS_${chainId}`] ??
    process.env.NEXT_PUBLIC_MEZO_RPC_URLS

  const rpcUrls = parseList(envOverride)
  return {
    ...defaults,
    rpcUrls: rpcUrls.length > 0 ? rpcUrls : defaults.rpcUrls
  }
}

export function getPublicClientForChain(chainId: number) {
  const existing = cachedPublicClients.get(chainId)
  if (existing) return existing

  const config = resolveChainConfig(chainId)
  const chain = defineChain({
    id: chainId,
    name: config.name,
    network: 'mezo-testnet',
    nativeCurrency: {
      name: 'Bitcoin',
      symbol: 'BTC',
      decimals: 18
    },
    rpcUrls: {
      default: { http: config.rpcUrls },
      public: { http: config.rpcUrls }
    },
    blockExplorers: {
      default: { name: 'Mezo Explorer', url: config.explorerUrl }
    },
    testnet: true
  })

  const client = createPublicClient({
    chain,
    transport: fallback(config.rpcUrls.map(url => http(url)))
  })

  cachedPublicClients.set(chainId, client)
  return client
}
