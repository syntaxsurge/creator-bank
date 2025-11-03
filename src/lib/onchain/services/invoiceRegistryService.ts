import { parseEventLogs } from 'viem'
import type { Address } from 'viem'

import { invoiceRegistryAbi } from '@/lib/onchain/abi'

import { OnchainService, ServiceConfig } from './base'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

type IssueInvoiceParams = {
  token: Address
  amount: bigint
  referenceHash: `0x${string}`
  payer?: Address | null
  account?: Address
}

type IssueInvoiceResult = {
  hash: `0x${string}`
  invoiceId: bigint
}

type SettleInvoiceParams = {
  invoiceId: bigint
  account?: Address
}

type SettleInvoiceResult = {
  hash: `0x${string}`
  payer: Address
}

type RegistryInvoice = {
  issuer: Address
  token: Address
  payer: Address
  amount: bigint
  paid: boolean
  referenceHash: `0x${string}`
}

export class InvoiceRegistryService extends OnchainService {
  readonly address: Address

  constructor(config: ServiceConfig & { address: Address }) {
    super(config)
    this.address = config.address
  }

  async issueInvoice(params: IssueInvoiceParams): Promise<IssueInvoiceResult> {
    const walletClient = this.requireWalletClient()
    const account = this.resolveAccount(params.account)
    const payer = params.payer ?? ZERO_ADDRESS

    const { request } = await this.publicClient.simulateContract({
      account,
      address: this.address,
      abi: invoiceRegistryAbi,
      functionName: 'issueInvoice',
      args: [payer, params.token, params.amount, params.referenceHash]
    })

    const hash = await walletClient.writeContract(request)
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash
    })

    const issueEvents = parseEventLogs({
      abi: invoiceRegistryAbi,
      logs: receipt.logs,
      eventName: 'InvoiceIssued'
    }) as Array<{ args?: { invoiceId?: bigint } }>

    const invoiceId = issueEvents[0]?.args?.invoiceId
    if (typeof invoiceId === 'undefined') {
      throw new Error('Invoice issuance transaction missing log.')
    }

    return { hash, invoiceId: BigInt(invoiceId) }
  }

  async settleInvoice(
    params: SettleInvoiceParams
  ): Promise<SettleInvoiceResult> {
    const walletClient = this.requireWalletClient()
    const account = this.resolveAccount(params.account)

    const { request } = await this.publicClient.simulateContract({
      account,
      address: this.address,
      abi: invoiceRegistryAbi,
      functionName: 'settleInvoice',
      args: [params.invoiceId]
    })

    const hash = await walletClient.writeContract(request)
    const receipt = await this.publicClient.waitForTransactionReceipt({
      hash
    })

    const settleEvents = parseEventLogs({
      abi: invoiceRegistryAbi,
      logs: receipt.logs,
      eventName: 'InvoiceSettled'
    }) as Array<{ args?: { payer?: Address } }>

    const payer = settleEvents[0]?.args?.payer
    if (!payer) {
      throw new Error('Invoice settlement transaction missing log.')
    }

    return { hash, payer: payer as Address }
  }

  async getInvoice(invoiceId: bigint): Promise<RegistryInvoice> {
    const result = (await this.publicClient.readContract({
      address: this.address,
      abi: invoiceRegistryAbi,
      functionName: 'getInvoice',
      args: [invoiceId]
    })) as RegistryInvoice

    return result
  }
}
