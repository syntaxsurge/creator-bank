import type { Address } from 'viem'

import { registrarAbi } from '@/lib/onchain/abi'

import { OnchainService, ServiceConfig } from './base'

export class RegistrarService extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  async registerCourse(
    courseId: bigint,
    price: bigint,
    recipients: Address[],
    sharesBps: number[],
    durationSeconds: bigint,
    transferCooldownSeconds: bigint
  ) {
    return this.executeContractTx({
      abi: registrarAbi,
      address: this.address,
      functionName: 'registerCourse',
      args: [
        courseId,
        price,
        recipients,
        sharesBps,
        durationSeconds,
        transferCooldownSeconds
      ]
    })
  }
}
