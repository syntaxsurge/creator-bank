import { parseAbi } from 'viem'
import type { Address } from 'viem'

import { OnchainService, ServiceConfig } from './base'

const tigrisRouterAbi = parseAbi([
  'function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[] memory amounts)',
  'function swapExactTokensForTokens(uint256 amountIn, uint256 amountOutMin, address[] calldata path, address to, uint256 deadline) returns (uint256[] memory amounts)'
])

type SwapParams = {
  amountIn: bigint
  amountOutMin: bigint
  path: Address[]
  recipient?: Address
  deadlineSeconds?: number
}

export class TigrisRouterService extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  getAmountsOut(amountIn: bigint, path: Address[]) {
    return this.publicClient.readContract({
      abi: tigrisRouterAbi,
      address: this.address,
      functionName: 'getAmountsOut',
      args: [amountIn, path]
    }) as Promise<bigint[]>
  }

  async swapExactTokensForTokens(params: SwapParams) {
    const deadline =
      params.deadlineSeconds ??
      Math.floor(Date.now() / 1000) + 60 * 15 /* 15 minutes */

    return this.executeContractTx({
      abi: tigrisRouterAbi,
      address: this.address,
      functionName: 'swapExactTokensForTokens',
      args: [
        params.amountIn,
        params.amountOutMin,
        params.path,
        params.recipient ?? this.resolveAccount(),
        BigInt(deadline)
      ]
    })
  }
}
