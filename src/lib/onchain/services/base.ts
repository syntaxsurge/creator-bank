import type { Abi, Address, PublicClient, WalletClient } from 'viem'

export type ServiceConfig = {
  publicClient: PublicClient
  walletClient?: WalletClient | null
  account?: Address | null
}

export abstract class OnchainService {
  protected readonly publicClient: PublicClient
  protected readonly walletClient: WalletClient | null
  protected readonly account: Address | null

  protected constructor(config: ServiceConfig) {
    this.publicClient = config.publicClient
    this.walletClient = config.walletClient ?? null
    this.account = config.account ?? null
  }

  protected requireWalletClient(): WalletClient {
    if (!this.walletClient) {
      throw new Error(
        'Wallet client required for this operation. Connect a wallet configured for Mezo.'
      )
    }
    return this.walletClient
  }

  protected resolveAccount(explicit?: Address): Address {
    if (explicit) return explicit
    if (this.account) return this.account
    const walletAccount = this.walletClient?.account
    if (!walletAccount) {
      throw new Error(
        'Active account unavailable. Please reconnect your wallet.'
      )
    }
    return walletAccount.address as Address
  }

  protected async executeContractTx(params: {
    abi: Abi
    address: Address
    functionName: string
    args?: unknown[]
    value?: bigint
    account?: Address
  }) {
    const walletClient = this.requireWalletClient()
    const account = this.resolveAccount(params.account)
    const hash = await walletClient.writeContract({
      account,
      address: params.address,
      abi: params.abi,
      functionName: params.functionName,
      args: params.args ?? [],
      value: params.value,
      chain: walletClient.chain
    })

    return {
      hash,
      wait: () =>
        this.publicClient.waitForTransactionReceipt({
          hash
        })
    }
  }
}
