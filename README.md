# CreatorBank: Bitcoin-Native Memberships on Mezo

CreatorBank is a full-stack dApp for creators and communities to run bitcoin-backed memberships, paylinks, and classroom experiences on the [Mezo](https://mezo.org/) network. The platform leans on Mezo Passport for wallet onboarding, settles every payment in MUSD, and read/writes on-chain data through viem-powered services.

## Why it matters

- **Bitcoin-first onboarding.** Passport lets members connect with Bitcoin-native wallets alongside familiar EVM wallets, so there is no “pick a chain” friction.
- **Recurring revenue without custodians.** Memberships, payouts, and marketplaces operate through audited smart contracts deployed to Mezo testnet/mainnet.
- **Creator tooling in one place.** Courses, paylinks, invoices, swaps, and payouts live in a single UI wired to the same chain data and Convex backend.

## Feature highlights

- Mezo Passport login via RainbowKit + Wagmi configuration (testnet by default, mainnet-ready).
- MUSD pricing with direct USD parity; Pyth helpers backstop additional asset conversions when needed.
- On-chain services for memberships, marketplace listings, registrar wiring, and split payouts built on viem `PublicClient` + wallet clients.
- Convex-backed data model for groups, posts, classroom content, paylinks, invoices, and membership rosters.
- Marketplace with listing, cancellation, renewal, and cooldown enforcement for membership passes.
- Creator dashboard with save goals, payouts, and status monitors for RPC/oracle health.
- Persistent network toggle in the header that switches between Mezo Testnet and Mainnet without a redeploy, updating RPCs, explorers, and contract wiring on the fly.

## Prerequisites

- Node.js ≥ 18
- `pnpm` ≥ 9
- Convex CLI (`npm install -g convex`) to run/query Convex locally
- A Mezo wallet (Passport-compatible) funded on **Mezo Testnet** for development
- Optional: Mezo mainnet wallet + RPC access for production verification

## Quick start

```bash
git clone <repo-url>
cd creator-bank
pnpm install

# Copy environment template and fill in values
cp .env.example .env.local

# Start convex backend alongside Next.js
pnpm convex:dev &
pnpm dev
```

The default setup connects to Mezo Testnet (`chainId: 31611`). Update `.env.local` to point at mainnet values when you are ready to promote.

> The network selector in the header persists your preference (Testnet/Mainnet)
> in local storage and hot-swaps RPCs, explorers, and contract wiring without
> restarting the app.

## Environment variables (frontend)

`CreatorBank` reads contract + RPC settings from a single set of environment
variables. Set `NEXT_PUBLIC_MEZO_CHAIN_ID` (defaults to Mezo Testnet `31611`) and
define the required endpoints and contract addresses directly.

```env
NEXT_PUBLIC_MEZO_CHAIN_ID="31611"  # default preference shown on first load

# RPC + explorer endpoints
NEXT_PUBLIC_MEZO_RPC_URLS="https://rpc.test.mezo.org"
NEXT_PUBLIC_MEZO_BLOCK_EXPLORER_URL="https://explorer.test.mezo.org/"

# Contract addresses (update with your deployed values)
NEXT_PUBLIC_MEMBERSHIP_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_BADGE_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_REGISTRAR_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_MARKETPLACE_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_REVENUE_SPLIT_ROUTER_ADDRESS="0x..."
NEXT_PUBLIC_PLATFORM_TREASURY_ADDRESS="0x..."
NEXT_PUBLIC_MUSD_CONTRACT_ADDRESS="0x..."
NEXT_PUBLIC_PYTH_CONTRACT_ADDRESS="0x2880aB155794e7179c9eE2e38200202908C17B43"
NEXT_PUBLIC_TIGRIS_ROUTER_ADDRESS="0x..."
NEXT_PUBLIC_WRAPPED_BTC_ADDRESS="0x..."

# Platform configuration
NEXT_PUBLIC_SUBSCRIPTION_PRICE_USD="99"
```

> **Tip:** The network selector in the UI just reuses these values; update the
> single source of truth in `.env` / `.env.local` before switching chains.

## Environment variables (Hardhat workspace)

Inside `blockchain/.env` configure:

```env
PRIVATE_KEY="0xyour_private_key"                # never commit this
MEZO_TESTNET_RPC_URL="https://rpc.test.mezo.org"
MEZO_MAINNET_RPC_URL="https://rpc-http.mezo.boar.network"
MARKETPLACE_TREASURY_ADDRESS="0x..."
MEMBERSHIP_METADATA_URI="ipfs://..."
BADGE_METADATA_URI="ipfs://..."
```

Run scripts with `cd blockchain && pnpm install && npx hardhat compile`. Networks `mezotestnet` (31611) and `mezomainnet` (31612) are preconfigured.

## Core contracts

- `MembershipPass1155.sol` – ERC-1155 passes with price, duration, and cooldown metadata
- `MembershipMarketplace.sol` – primary/secondary listings and renewals
- `Registrar.sol` – wires membership + marketplace + split contracts in one call
- `SplitPayout.sol` – pull-based split router for collaborators settled in MUSD
- `Badge1155.sol` – soulbound completion badges

Artifacts sync into the frontend with `pnpm contracts:sync-abis`.

## Key commands

| Command | Description |
| --- | --- |
| `pnpm dev` | Next.js dev server (requires `.env.local` and Convex dev server) |
| `pnpm build && pnpm start` | Production build + serve |
| `pnpm typecheck` | TypeScript validation (run before committing) |
| `pnpm lint` | ESLint pass |
| `pnpm convex:dev` | Launch Convex dev server |
| `pnpm contracts:sync-abis` | Copy Hardhat ABIs into `src/lib/onchain/abi/artifacts` |

## On-chain flow

1. **Creator onboarding** – connect through Passport, configure pricing, media, admins, and submit the platform fee in MUSD (1:1 with USD).
2. **Registrar sync** – UI calls `Registrar.registerCourse`, creating the split payout contract and registering membership pricing in `MembershipPass1155`.
3. **Membership joins** – members purchase via `MembershipMarketplace` (ERC-1155 mint + split payout) with MUSD settlements. Free groups skip minting.
4. **Marketplace & renewals** – listings respect cooldowns; renewals extend expiry without issuing new tokens.
5. **Payouts** – collaborators call `SplitPayout.release` to pull their share of MUSD.

## Testing checklist

- `pnpm typecheck`
- `pnpm lint`
- `pnpm convex:dev` + `pnpm dev` for end-to-end manual testing on Mezo Testnet
- Hardhat unit/integration tests under `blockchain/test`

## Conventions & notes

- Wagmi + RainbowKit + Mezo Passport provide wallet context; avoid reintroducing legacy providers.
- viem `PublicClient`/`WalletClient` live in `src/lib/onchain` and should be reused by new services.
- Prices display via `src/lib/settlement-token.ts` (MUSD with 1:1 USD labels); Coingecko integrations are limited to auxiliary analytics.
- Keep Convex schema changes in sync with frontend queries/mutations.

Happy building on Mezo with CreatorBank!
