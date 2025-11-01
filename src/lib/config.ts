/**
 * Runtime configuration helpers for Mezo integrations.
 *
 * The previous implementation exposed build-time constants, which made it
 * impossible to switch between Mezo Testnet (31611) and Mezo Mainnet (31612)
 * without rebuilding the bundle. The hackathon demo requires a toggle, so the
 * helpers below normalise environment variables, persist the preferred chain in
 * localStorage, and notify subscribers whenever the user switches networks.
 */

export type MezoChainId = 31611 | 31612

type ChainConfig = { rpcUrls: string[]; explorerUrl: string }

const SUPPORTED_CHAIN_IDS: readonly MezoChainId[] = [31611, 31612]
const CHAIN_STORAGE_KEY = 'creatorbank:preferred-chain-id'

const DEFAULT_CHAIN_CONFIG: Record<MezoChainId, ChainConfig> = {
  31611: {
    rpcUrls: ['https://rpc.test.mezo.org'],
    explorerUrl: 'https://explorer.test.mezo.org/'
  },
  31612: {
    rpcUrls: [
      'https://rpc-http.mezo.boar.network',
      'https://rpc_evm-mezo.imperator.co',
      'https://mainnet.mezo.public.validationcloud.io'
    ],
    explorerUrl: 'https://explorer.mezo.org/'
  }
}

const PUBLIC_ENV_VARS = {
  NEXT_PUBLIC_MEZO_RPC_URLS: process.env.NEXT_PUBLIC_MEZO_RPC_URLS ?? '',
  NEXT_PUBLIC_MEZO_BLOCK_EXPLORER_URL:
    process.env.NEXT_PUBLIC_MEZO_BLOCK_EXPLORER_URL ?? '',
  NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS ?? '',
  NEXT_PUBLIC_REGISTRAR_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_REGISTRAR_CONTRACT_ADDRESS ?? '',
  NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS ?? '',
  NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS ?? '',
  NEXT_PUBLIC_REVENUE_SPLIT_ROUTER_ADDRESS:
    process.env.NEXT_PUBLIC_REVENUE_SPLIT_ROUTER_ADDRESS ?? '',
  NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS:
    process.env.NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS ?? '',
  NEXT_PUBLIC_WRAPPED_BTC_ADDRESS:
    process.env.NEXT_PUBLIC_WRAPPED_BTC_ADDRESS ?? '',
  NEXT_PUBLIC_MUSD_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_MUSD_CONTRACT_ADDRESS ?? '',
  NEXT_PUBLIC_PYTH_CONTRACT_ADDRESS:
    process.env.NEXT_PUBLIC_PYTH_CONTRACT_ADDRESS ?? '',
  NEXT_PUBLIC_TIGRIS_ROUTER_ADDRESS:
    process.env.NEXT_PUBLIC_TIGRIS_ROUTER_ADDRESS ?? ''
} as const

function isSupportedChainId(value: unknown): value is MezoChainId {
  return value === 31611 || value === 31612
}

function parseChainId(value: unknown): MezoChainId | null {
  if (typeof value === 'number' && isSupportedChainId(value)) {
    return value
  }

  const numeric = Number(value)
  if (Number.isFinite(numeric) && isSupportedChainId(numeric)) {
    return numeric as MezoChainId
  }

  return null
}

const DEFAULT_CHAIN_ID =
  parseChainId(process.env.NEXT_PUBLIC_MEZO_CHAIN_ID) ?? 31611

let activeChainId: MezoChainId = DEFAULT_CHAIN_ID
let bootstrappedFromStorage = false

type ChainPreferenceListener = () => void
const listeners = new Set<ChainPreferenceListener>()

function resolveDefaultChainConfig(chainId: MezoChainId): ChainConfig {
  return DEFAULT_CHAIN_CONFIG[chainId] ?? DEFAULT_CHAIN_CONFIG[31611]
}

function parseRpcUrls(value: string | undefined, defaults: string[]) {
  if (!value) return defaults
  const entries = value
    .split(',')
    .map(entry => entry.trim())
    .filter(Boolean)
  return entries.length > 0 ? entries : defaults
}

function readStoredChainId(): MezoChainId | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(CHAIN_STORAGE_KEY)
    return raw ? parseChainId(raw) : null
  } catch (error) {
    console.warn('[CreatorBank] Failed to read stored chain id', error)
    return null
  }
}

function persistChainId(chainId: MezoChainId) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(CHAIN_STORAGE_KEY, String(chainId))
  } catch (error) {
    console.warn('[CreatorBank] Failed to persist chain id', error)
  }
}

function bootstrapChainPreferenceFromStorage() {
  if (bootstrappedFromStorage) return
  bootstrappedFromStorage = true
  const stored = readStoredChainId()
  if (stored) {
    activeChainId = stored
  }
}

function notifyChainPreferenceChanged() {
  listeners.forEach(listener => listener())
}

export function getSupportedChainIds(): readonly MezoChainId[] {
  return SUPPORTED_CHAIN_IDS
}

export function getDefaultChainId(): MezoChainId {
  return DEFAULT_CHAIN_ID
}

export function getActiveChainId(): MezoChainId {
  if (typeof window !== 'undefined') {
    bootstrapChainPreferenceFromStorage()
  }
  return activeChainId
}

export function setActiveChainId(chainId: MezoChainId) {
  if (!isSupportedChainId(chainId) || chainId === activeChainId) return
  activeChainId = chainId
  persistChainId(chainId)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('creatorbank:chain-changed', { detail: chainId })
    )
  }
  notifyChainPreferenceChanged()
}

export function subscribeToChainPreference(
  listener: ChainPreferenceListener
): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function readChainScopedEnv(
  key: string,
  chainId: MezoChainId
): string | undefined {
  void chainId
  return PUBLIC_ENV_VARS[key as keyof typeof PUBLIC_ENV_VARS]
}

export function getRpcUrls(chainId?: MezoChainId): string[] {
  const resolvedChainId = chainId ?? getActiveChainId()
  const defaults = resolveDefaultChainConfig(resolvedChainId)
  const configured = readChainScopedEnv(
    'NEXT_PUBLIC_MEZO_RPC_URLS',
    resolvedChainId
  )
  return parseRpcUrls(configured, defaults.rpcUrls)
}

export function getBlockExplorerUrl(chainId?: MezoChainId): string {
  const resolvedChainId = chainId ?? getActiveChainId()
  const defaults = resolveDefaultChainConfig(resolvedChainId)
  const configured = readChainScopedEnv(
    'NEXT_PUBLIC_MEZO_BLOCK_EXPLORER_URL',
    resolvedChainId
  )
  const url = (configured ?? defaults.explorerUrl).trim()
  return url.replace(/\/$/, '')
}

function getAddressForKey(key: string, chainId?: MezoChainId): string {
  const resolvedChainId = chainId ?? getActiveChainId()
  const configured = readChainScopedEnv(key, resolvedChainId)
  return configured?.trim() ?? ''
}

export function getPlatformTreasuryAddress(chainId?: MezoChainId): string {
  return getAddressForKey('NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS', chainId)
}

export function getMembershipContractAddress(chainId?: MezoChainId): string {
  return getAddressForKey('NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS', chainId)
}

export function getBadgeContractAddress(chainId?: MezoChainId): string {
  return getAddressForKey('NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS', chainId)
}

export function getRegistrarContractAddress(chainId?: MezoChainId): string {
  return getAddressForKey('NEXT_PUBLIC_REGISTRAR_CONTRACT_ADDRESS', chainId)
}

export function getMarketplaceContractAddress(chainId?: MezoChainId): string {
  return getAddressForKey('NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS', chainId)
}

export function getRevenueSplitRouterAddress(chainId?: MezoChainId): string {
  return getAddressForKey('NEXT_PUBLIC_REVENUE_SPLIT_ROUTER_ADDRESS', chainId)
}

export function getWrappedBtcContractAddress(chainId?: MezoChainId): string {
  return getAddressForKey('NEXT_PUBLIC_WRAPPED_BTC_ADDRESS', chainId)
}

export function getMusdContractAddress(chainId?: MezoChainId): string {
  return getAddressForKey('NEXT_PUBLIC_MUSD_CONTRACT_ADDRESS', chainId) ?? ''
}

export function getPythContractAddress(chainId?: MezoChainId): string {
  return (
    getAddressForKey('NEXT_PUBLIC_PYTH_CONTRACT_ADDRESS', chainId) ||
    '0x2880aB155794e7179c9eE2e38200202908C17B43'
  )
}

export function getTigrisRouterAddress(chainId?: MezoChainId): string {
  return (
    getAddressForKey('NEXT_PUBLIC_TIGRIS_ROUTER_ADDRESS', chainId) ||
    '0x16A76d3cd3C1e3CE843C6680d6B37E9116b5C706'
  )
}

export function getChainName(
  chainId: MezoChainId = getActiveChainId()
): string {
  return chainId === 31612 ? 'Mezo Mainnet' : 'Mezo Testnet'
}

export const SUBSCRIPTION_PRICE_USD =
  process.env.NEXT_PUBLIC_SUBSCRIPTION_PRICE_USD ?? '99'

export const SETTLEMENT_TOKEN_SYMBOL = 'MUSD'
export const SETTLEMENT_TOKEN_DECIMALS = 18

const DEFAULT_MEMBERSHIP_DURATION_SECONDS = 60 * 60 * 24 * 30
const DEFAULT_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS = 60 * 60 * 24

function parsePositiveInt(value: string | undefined, fallback: number) {
  if (!value) return fallback
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.floor(parsed)
}

export const MEMBERSHIP_DURATION_SECONDS = parsePositiveInt(
  process.env.NEXT_PUBLIC_MEMBERSHIP_DURATION_SECONDS,
  DEFAULT_MEMBERSHIP_DURATION_SECONDS
)

export const MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS = parsePositiveInt(
  process.env.NEXT_PUBLIC_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS,
  DEFAULT_MEMBERSHIP_TRANSFER_COOLDOWN_SECONDS
)
