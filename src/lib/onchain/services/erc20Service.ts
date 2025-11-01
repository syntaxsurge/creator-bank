import { erc20Abi } from 'viem'
import type { Address } from 'viem'

import { OnchainService, ServiceConfig } from './base'

export class Erc20Service extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  allowance(owner: Address, spender: Address) {
    return this.publicClient.readContract({
      abi: erc20Abi,
      address: this.address,
      functionName: 'allowance',
      args: [owner, spender]
    }) as Promise<bigint>
  }

  balanceOf(account: Address) {
    return this.publicClient.readContract({
      abi: erc20Abi,
      address: this.address,
      functionName: 'balanceOf',
      args: [account]
    }) as Promise<bigint>
  }

  decimals() {
    return this.publicClient.readContract({
      abi: erc20Abi,
      address: this.address,
      functionName: 'decimals'
    }) as Promise<number>
  }

  name() {
    return this.publicClient.readContract({
      abi: erc20Abi,
      address: this.address,
      functionName: 'name'
    }) as Promise<string>
  }

  symbol() {
    return this.publicClient.readContract({
      abi: erc20Abi,
      address: this.address,
      functionName: 'symbol'
    }) as Promise<string>
  }

  totalSupply() {
    return this.publicClient.readContract({
      abi: erc20Abi,
      address: this.address,
      functionName: 'totalSupply'
    }) as Promise<bigint>
  }

  approve(spender: Address, amount: bigint) {
    return this.executeContractTx({
      abi: erc20Abi,
      address: this.address,
      functionName: 'approve',
      args: [spender, amount]
    })
  }
}
