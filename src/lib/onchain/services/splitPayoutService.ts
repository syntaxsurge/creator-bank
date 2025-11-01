import type { Address } from 'viem'

import { splitPayoutAbi } from '@/lib/onchain/abi'

import { OnchainService, ServiceConfig } from './base'

export class SplitPayoutService extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  async pending(recipient: Address) {
    return this.publicClient.readContract({
      abi: splitPayoutAbi,
      address: this.address,
      functionName: 'pending',
      args: [recipient]
    }) as Promise<bigint>
  }

  async release(recipient: Address) {
    return this.executeContractTx({
      abi: splitPayoutAbi,
      address: this.address,
      functionName: 'release',
      args: [recipient]
    })
  }
}
