import { NextResponse } from 'next/server'

import {
  createPublicClient,
  defineChain,
  fallback,
  getContract,
  http
} from 'viem'
import type { Address, PublicClient } from 'viem'

import {
  getBlockExplorerUrl,
  getChainName,
  getRpcUrls,
  getSupportedChainIds
} from '@/lib/config'

const CHAIN_CONFIGS = getSupportedChainIds().map(chainId => {
  const rpcUrls = getRpcUrls(chainId)
  return {
    chainId,
    name: getChainName(chainId),
    network: 'mezo-testnet',
    testnet: true,
    rpcUrls,
    explorerUrl: getBlockExplorerUrl(chainId)
  }
})

const PYTH_CONTRACT = '0x2880aB155794e7179c9eE2e38200202908C17B43'

const PYTH_ABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'id', type: 'bytes32' },
      { internalType: 'uint256', name: 'age', type: 'uint256' }
    ],
    name: 'getPriceNoOlderThan',
    outputs: [
      {
        components: [
          { internalType: 'int64', name: 'price', type: 'int64' },
          { internalType: 'uint64', name: 'conf', type: 'uint64' },
          { internalType: 'int32', name: 'expo', type: 'int32' },
          { internalType: 'uint256', name: 'publishTime', type: 'uint256' }
        ],
        internalType: 'struct PythStructs.Price',
        name: '',
        type: 'tuple'
      }
    ],
    stateMutability: 'view',
    type: 'function'
  }
] as const

const PRICE_FEEDS = [
  {
    id: '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43' as const,
    label: 'BTC / USD'
  },
  {
    id: '0x0617a9b725011a126a2b9fd53563f4236501f32cf76d877644b943394606c6de' as const,
    label: 'MUSD / USD'
  }
] as const

const MAX_STALENESS_SECONDS = 60 * 60

type RpcStatus = {
  chainId: number
  name: string
  explorerUrl: string
  status: 'ok' | 'error'
  blockNumber?: string
  latencyMs?: number
  error?: string
}

type OracleStatus = {
  id: string
  label: string
  status: 'ok' | 'stale' | 'error'
  price?: number
  conf?: number
  expo?: number
  publishTime?: number
  ageSeconds?: number
  error?: string
}

function defineMezoChain(config: (typeof CHAIN_CONFIGS)[number]) {
  return defineChain({
    id: config.chainId,
    name: config.name,
    network: config.network,
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
}

async function createClient(
  config: (typeof CHAIN_CONFIGS)[number]
): Promise<{ client: PublicClient | null; status: RpcStatus }> {
  const chain = defineMezoChain(config)
  const started = Date.now()

  try {
    const client = createPublicClient({
      chain,
      transport: fallback(config.rpcUrls.map(url => http(url)))
    })
    const blockNumber = await client.getBlockNumber()
    const latencyMs = Date.now() - started
    return {
      client,
      status: {
        chainId: config.chainId,
        name: config.name,
        explorerUrl: config.explorerUrl,
        status: 'ok',
        blockNumber: blockNumber.toString(),
        latencyMs
      }
    }
  } catch (error) {
    return {
      client: null,
      status: {
        chainId: config.chainId,
        name: config.name,
        explorerUrl: config.explorerUrl,
        status: 'error',
        error: error instanceof Error ? error.message : 'RPC unreachable'
      }
    }
  }
}

function normalizePrice(price: bigint, expo: number) {
  const multiplier = Math.pow(10, expo)
  return Number(price) * multiplier
}

async function readOracle(
  client: PublicClient,
  feedId: `0x${string}`,
  maxAge: number
): Promise<Omit<OracleStatus, 'label' | 'id'>> {
  try {
    const contract = getContract({
      address: PYTH_CONTRACT as Address,
      abi: PYTH_ABI,
      client
    })
    const response = await contract.read.getPriceNoOlderThan([
      feedId,
      BigInt(maxAge)
    ])
    const publishTime = Number(response.publishTime)
    const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000) - publishTime)

    const normalizedPrice = normalizePrice(
      BigInt(response.price),
      response.expo
    )
    const normalizedConf = normalizePrice(BigInt(response.conf), response.expo)

    return {
      status: ageSeconds > maxAge ? 'stale' : 'ok',
      price: normalizedPrice,
      conf: normalizedConf,
      expo: response.expo,
      publishTime,
      ageSeconds
    }
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unable to read oracle'
    }
  }
}

export async function GET() {
  const clientResults = await Promise.all(
    CHAIN_CONFIGS.map(config => createClient(config))
  )

  const rpcStatuses = clientResults.map(result => result.status)
  const healthyClient =
    clientResults.find(result => result.client !== null)?.client ?? null

  let oracleStatuses: OracleStatus[] = []

  if (healthyClient) {
    oracleStatuses = await Promise.all(
      PRICE_FEEDS.map(async feed => {
        const oracleResult = await readOracle(
          healthyClient,
          feed.id,
          MAX_STALENESS_SECONDS
        )
        return {
          id: feed.id,
          label: feed.label,
          ...oracleResult
        }
      })
    )
  } else {
    oracleStatuses = PRICE_FEEDS.map(feed => ({
      id: feed.id,
      label: feed.label,
      status: 'error',
      error: 'No healthy RPC available to read oracle data.'
    }))
  }

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    rpc: rpcStatuses,
    oracle: oracleStatuses
  })
}
