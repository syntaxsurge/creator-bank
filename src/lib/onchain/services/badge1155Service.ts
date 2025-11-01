import type { Address } from 'viem'

import { badge1155Abi } from '@/lib/onchain/abi'

import { OnchainService, ServiceConfig } from './base'

export class Badge1155Service extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  async mintCompletion(to: Address, courseId: bigint) {
    return this.executeContractTx({
      abi: badge1155Abi,
      address: this.address,
      functionName: 'mintCompletion',
      args: [to, courseId]
    })
  }

  async mintBatch(recipients: Address[], courseId: bigint) {
    return this.executeContractTx({
      abi: badge1155Abi,
      address: this.address,
      functionName: 'mintBatch',
      args: [recipients, courseId]
    })
  }
}
