# CreatorBank Smart Contracts

This Hardhat workspace contains the Solidity contracts powering CreatorBank’s memberships, marketplace, registrar, split payouts, and badges on Mezo.

## Contract Suite

| Contract | Purpose |
| --- | --- |
| `MembershipPass1155.sol` | ERC-1155 passes priced in native BTC with expiry + cooldown enforcement. |
| `MembershipMarketplace.sol` | Primary + secondary listings, renewals, platform fee routing. |
| `Registrar.sol` | Deploys `SplitPayout` contracts and registers course pricing/config in one call. |
| `helpers/SplitPayout.sol` | Pull-based splitter for collaborator payouts (one instance per course). |
| `Badge1155.sol` | Soulbound badges awarded on course completion. |
| `RevenueSplitRouter.sol` | Optional helper to route membership revenue directly to collaborators. |

## Getting started

```bash
cd blockchain
pnpm install
cp .env.example .env
```

Populate `.env` using the template below. Scripts bail out when required values are missing.

### Environment variables

| Key | Purpose | When |
| --- | --- | --- |
| `PRIVATE_KEY` | Deployer/admin wallet for all scripts. | Before first deployment |
| `MEZO_TESTNET_RPC_URL` | Mezo testnet RPC (default `https://rpc.test.mezo.org`). | Before first deployment |
| `MEZO_MAINNET_RPC_URL` | Mezo mainnet RPC (default `https://rpc-http.mezo.boar.network`). | When promoting to mainnet |
| `MEMBERSHIP_METADATA_URI` | Base URI for membership token metadata. | Optional |
| `BADGE_METADATA_URI` | Base URI for badge metadata. | Optional |
| `MARKETPLACE_TREASURY_ADDRESS` | Address receiving platform fees. | Before marketplace deployment |
| `MARKETPLACE_FEE_BPS` | Platform fee (defaults to `250` → 2.5%). | Optional |
| `MARKETPLACE_MAX_LISTING_DURATION_SECONDS` | Max secondary listing duration (default 7 days). | Optional |
| `MEMBERSHIP_CONTRACT_ADDRESS` | Populated after deploying `MembershipPass1155`. Required for registrar/marketplace scripts. | After contract deployment |
| `REGISTRAR_CONTRACT_ADDRESS` | Populated after deploying `Registrar`. Required when updating marketplace hooks. | After contract deployment |

Each deployment logs addresses to `deployment.log`. Mirror the values into `.env` so subsequent runs reattach instead of redeploying. Copy any frontend-facing addresses into the app’s `.env.local` prefixed with `NEXT_PUBLIC_`.

### Typical commands

```bash
npx hardhat compile
npx hardhat run scripts/deployMembershipPass.ts --network mezotestnet
npx hardhat run scripts/deployRegistrar.ts --network mezotestnet
npx hardhat run scripts/deployMarketplace.ts --network mezotestnet
npx hardhat run scripts/deployBadge1155.ts --network mezotestnet
npx hardhat run scripts/deployRevenueSplitRouter.ts --network mezotestnet
```

Compilation outputs ABIs under `artifacts/` and TypeScript bindings under `typechain-types/`.

### Deployment flow

1. **MembershipPass1155** – deploy, capture address in `.env` as `MEMBERSHIP_CONTRACT_ADDRESS`.
2. **Badge1155** – optional but recommended; log address for reference.
3. **Registrar** – requires `MEMBERSHIP_CONTRACT_ADDRESS`. Grants registrar role on the pass contract.
4. **MembershipMarketplace** – requires membership + treasury addresses. Configures fees and cooldowns.
5. **RevenueSplitRouter** – optional helper for direct revenue distribution.

Registrar deploys a fresh `SplitPayout` per course. Minting and renewals always flow through the marketplace to enforce cooldowns and revenue splits.

### Housekeeping

- After compiling or deploying, run `pnpm contracts:sync-abis` from the repo root to refresh frontend ABIs.
- `pnpm lint:check-solidity` enforces Solhint rules. Use `pnpm lint:fix-solidity` for autofixes.
- Hardhat networks: `mezotestnet` (31611) and `mezomainnet` (31612) share London EVM config. Update `.env` and frontend envs when switching environments.

Happy building on Mezo!
