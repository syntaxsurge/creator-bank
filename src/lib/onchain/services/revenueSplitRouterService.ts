import type { Address } from 'viem'

import { revenueSplitRouterAbi } from '@/lib/onchain/abi'

import { OnchainService, ServiceConfig } from './base'

export class RevenueSplitRouterService extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  async splitTransfer(
    token: Address,
    recipients: readonly Address[],
    sharesBps: readonly number[],
    amount: bigint
  ) {
    return this.executeContractTx({
      abi: revenueSplitRouterAbi,
      address: this.address,
      functionName: 'splitTransfer',
      args: [token, recipients, sharesBps, amount]
    })
  }
}
