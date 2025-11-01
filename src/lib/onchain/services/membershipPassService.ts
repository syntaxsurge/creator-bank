import type { Address } from 'viem'

import { membershipPass1155Abi } from '@/lib/onchain/abi'

import { OnchainService, ServiceConfig } from './base'

export type CourseData = {
  price: bigint
  splitter: Address
  creator: Address
  duration: bigint
  transferCooldown: bigint
}

type ReadCourseTuple = [bigint, Address, Address, bigint, bigint]
type PassStateTuple = [bigint, bigint]
type TransferCheckTuple = [boolean, bigint, bigint]

type ReadCourseStruct = {
  price: bigint
  splitter: Address
  creator: Address
  duration: bigint
  transferCooldown: bigint
}

type PassStateStruct = {
  expiresAt: bigint
  cooldownEndsAt: bigint
}

type TransferCheckStruct = {
  eligible: boolean
  availableAt: bigint
  expiresAt: bigint
}

export class MembershipPassService extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  async hasPass(user: Address, courseId: bigint) {
    return this.publicClient.readContract({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'hasPass',
      args: [user, courseId]
    }) as Promise<boolean>
  }

  async getCourse(courseId: bigint): Promise<CourseData> {
    const result = (await this.publicClient.readContract({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'getCourse',
      args: [courseId]
    })) as unknown

    if (Array.isArray(result)) {
      const [price, splitter, creator, duration, transferCooldown] =
        result as ReadCourseTuple
      return {
        price,
        splitter,
        creator,
        duration,
        transferCooldown
      }
    }

    const struct = result as ReadCourseStruct
    return {
      price: struct.price,
      splitter: struct.splitter,
      creator: struct.creator,
      duration: struct.duration,
      transferCooldown: struct.transferCooldown
    }
  }

  async getPassState(courseId: bigint, account: Address) {
    const result = (await this.publicClient.readContract({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'getPassState',
      args: [courseId, account]
    })) as unknown

    if (Array.isArray(result)) {
      const [expiresAt, cooldownEndsAt] = result as PassStateTuple
      return { expiresAt, cooldownEndsAt }
    }

    const struct = result as PassStateStruct
    return {
      expiresAt: struct.expiresAt,
      cooldownEndsAt: struct.cooldownEndsAt
    }
  }

  async isPassActive(courseId: bigint, account: Address) {
    return this.publicClient.readContract({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'isPassActive',
      args: [courseId, account]
    }) as Promise<boolean>
  }

  async canTransfer(courseId: bigint, account: Address) {
    const result = (await this.publicClient.readContract({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'canTransfer',
      args: [courseId, account]
    })) as unknown

    if (Array.isArray(result)) {
      const [eligible, availableAt, expiresAt] = result as TransferCheckTuple
      return { eligible, availableAt, expiresAt }
    }

    const struct = result as TransferCheckStruct
    return {
      eligible: struct.eligible,
      availableAt: struct.availableAt,
      expiresAt: struct.expiresAt
    }
  }

  async balanceOf(account: Address, courseId: bigint) {
    const result = (await this.publicClient.readContract({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'balanceOf',
      args: [account, courseId]
    })) as unknown
    if (typeof result === 'bigint') return result
    if (Array.isArray(result)) {
      const [value] = result as [bigint]
      return value
    }
    const numeric = BigInt(result as any)
    return numeric
  }

  async setPrice(courseId: bigint, newPrice: bigint) {
    return this.executeContractTx({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'setPrice',
      args: [courseId, newPrice]
    })
  }

  async setSplitter(courseId: bigint, splitter: Address) {
    return this.executeContractTx({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'setSplitter',
      args: [courseId, splitter]
    })
  }

  async setCourseConfig(
    courseId: bigint,
    duration: bigint,
    transferCooldown: bigint
  ) {
    return this.executeContractTx({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'setCourseConfig',
      args: [courseId, duration, transferCooldown]
    })
  }

  async isApprovedForAll(owner: Address, operator: Address) {
    return this.publicClient.readContract({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'isApprovedForAll',
      args: [owner, operator]
    }) as Promise<boolean>
  }

  async setApprovalForAll(operator: Address, approved: boolean) {
    return this.executeContractTx({
      abi: membershipPass1155Abi,
      address: this.address,
      functionName: 'setApprovalForAll',
      args: [operator, approved]
    })
  }
}
