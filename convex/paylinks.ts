import { v } from 'convex/values'
import { parseAbiItem } from 'viem'
import type { Address } from 'viem'

import { api } from './_generated/api'
import { action, mutation, query } from './_generated/server'
import { getPublicClientForChain } from './chains'
import { normalizeAddress, requireUserByWallet } from './utils'

type PaylinkPaymentPayload = {
  txHash: string
  sender: string
  amount: string
  blockNumber: number
  chainId: number
  detectedAt: number
  invoiceSlug?: string
}

type SyncTransfersResult = {
  inserted: Array<{
    txHash: string
    amount: string
    sender: string
    detectedAt: number
    invoiceSlug?: string
  }>
  latestBlock: number | null
}

const TRANSFER_EVENT = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
)

function normalizeHandle(handle: string) {
  return handle.trim().toLowerCase()
}

export const listForOwner = query({
  args: {
    ownerAddress: v.string()
  },
  handler: async (ctx, { ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)

    const paylinks = await ctx.db
      .query('paylinks')
      .withIndex('by_ownerId', q => q.eq('ownerId', owner._id))
      .collect()

    return paylinks.filter(paylink => paylink.isActive)
  }
})

export const paymentsForPaylink = query({
  args: { paylinkId: v.id('paylinks') },
  handler: async (ctx, { paylinkId }) => {
    return await ctx.db
      .query('paylinkPayments')
      .withIndex('by_paylinkId', q => q.eq('paylinkId', paylinkId))
      .order('desc')
      .collect()
  }
})

export const getByHandle = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    return await ctx.db
      .query('paylinks')
      .withIndex('by_handle', q => q.eq('handle', normalizeHandle(handle)))
      .unique()
  }
})

export const getByHandleForSync = query({
  args: { handle: v.string() },
  handler: async (ctx, { handle }) => {
    return await ctx.db
      .query('paylinks')
      .withIndex('by_handle', q => q.eq('handle', normalizeHandle(handle)))
      .unique()
  }
})

export const create = mutation({
  args: {
    ownerAddress: v.string(),
    handle: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    chainId: v.number(),
    tokenAddress: v.string(),
    receivingAddress: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const handle = normalizeHandle(args.handle)

    if (!handle) {
      throw new Error('Handle is required')
    }

    const existing = await ctx.db
      .query('paylinks')
      .withIndex('by_handle', q => q.eq('handle', handle))
      .unique()

    if (existing) {
      throw new Error('Handle already in use')
    }

    const now = Date.now()

    const paylinkId = await ctx.db.insert('paylinks', {
      handle,
      ownerId: owner._id,
      receivingAddress: normalizeAddress(
        args.receivingAddress ?? args.ownerAddress
      ),
      title: args.title,
      description: args.description,
      chainId: args.chainId,
      tokenAddress: normalizeAddress(args.tokenAddress),
      lastSyncedBlock: undefined,
      createdAt: now,
      updatedAt: now,
      isActive: true,
      archivedAt: undefined
    })

    return paylinkId
  }
})

export const update = mutation({
  args: {
    ownerAddress: v.string(),
    paylinkId: v.id('paylinks'),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    receivingAddress: v.optional(v.string()),
    isActive: v.optional(v.boolean())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const paylink = await ctx.db.get(args.paylinkId)

    if (!paylink || paylink.ownerId !== owner._id) {
      throw new Error('Paylink not found')
    }

    const payload: Record<string, unknown> = {
      updatedAt: Date.now()
    }

    if (typeof args.title !== 'undefined') {
      payload.title = args.title
    }

    if (typeof args.description !== 'undefined') {
      payload.description = args.description
    }

    if (typeof args.receivingAddress !== 'undefined') {
      payload.receivingAddress = normalizeAddress(args.receivingAddress)
    }

    if (typeof args.isActive !== 'undefined') {
      payload.isActive = args.isActive
    }

    await ctx.db.patch(args.paylinkId, payload)
  }
})

export const archive = mutation({
  args: {
    ownerAddress: v.string(),
    paylinkId: v.id('paylinks')
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const paylink = await ctx.db.get(args.paylinkId)

    if (!paylink || paylink.ownerId !== owner._id) {
      throw new Error('Paylink not found')
    }

    if (!paylink.isActive && paylink.archivedAt) {
      return
    }

    await ctx.db.patch(args.paylinkId, {
      isActive: false,
      archivedAt: Date.now(),
      updatedAt: Date.now()
    })
  }
})

export const applySyncResult = mutation({
  args: {
    paylinkId: v.id('paylinks'),
    latestSyncedBlock: v.number(),
    payments: v.array(
      v.object({
        txHash: v.string(),
        sender: v.string(),
        amount: v.string(),
        blockNumber: v.number(),
        chainId: v.number(),
        detectedAt: v.number(),
        invoiceSlug: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    const paylink = await ctx.db.get(args.paylinkId)
    if (!paylink) {
      throw new Error('Paylink not found')
    }

    const insertedPayments: Array<{
      txHash: string
      amount: string
      sender: string
      detectedAt: number
      invoiceSlug?: string
    }> = []

    for (const payment of args.payments) {
      const normalizedTxHash = payment.txHash.toLowerCase()
      const existing = await ctx.db
        .query('paylinkPayments')
        .withIndex('by_txHash', q => q.eq('txHash', normalizedTxHash))
        .first()

      if (existing) {
        continue
      }

      await ctx.db.insert('paylinkPayments', {
        paylinkId: args.paylinkId,
        txHash: normalizedTxHash,
        sender: normalizeAddress(payment.sender),
        amount: payment.amount,
        blockNumber: payment.blockNumber,
        chainId: payment.chainId,
        detectedAt: payment.detectedAt,
        invoiceSlug: payment.invoiceSlug
      })

      insertedPayments.push({
        txHash: normalizedTxHash,
        amount: payment.amount,
        sender: normalizeAddress(payment.sender),
        detectedAt: payment.detectedAt,
        invoiceSlug: payment.invoiceSlug ?? undefined
      })

      const invoiceSlug = payment.invoiceSlug

      if (invoiceSlug) {
        const invoice = await ctx.db
          .query('invoices')
          .withIndex('by_slug', q => q.eq('slug', invoiceSlug))
          .unique()

        if (invoice && invoice.status !== 'paid') {
          await ctx.db.patch(invoice._id, {
            status: 'paid',
            paidAt: payment.detectedAt,
            paymentTxHash: normalizedTxHash,
            updatedAt: Date.now()
          })
        }
      }
    }

    const nextSyncedBlock = Math.max(
      args.latestSyncedBlock,
      paylink.lastSyncedBlock ?? 0
    )

    await ctx.db.patch(args.paylinkId, {
      lastSyncedBlock: nextSyncedBlock,
      updatedAt: Date.now()
    })

    return insertedPayments
  }
})

export const syncTransfers = action({
  args: {
    handle: v.string(),
    invoiceSlug: v.optional(v.string()),
    expectedAmount: v.optional(v.string())
  },
  handler: async (ctx, args): Promise<SyncTransfersResult> => {
    const paylink = await ctx.runQuery(api.paylinks.getByHandleForSync, {
      handle: args.handle
    })

    if (!paylink || !paylink.isActive) {
      return {
        inserted: [] as SyncTransfersResult['inserted'],
        latestBlock: null
      }
    }

    const client = getPublicClientForChain(paylink.chainId)
    const latestBlock = await client.getBlockNumber()

    const fromBlock = paylink.lastSyncedBlock
      ? BigInt(paylink.lastSyncedBlock + 1)
      : latestBlock > 5000n
        ? latestBlock - 5000n
        : 0n

    const logs = await client.getLogs({
      address: paylink.tokenAddress as Address,
      event: TRANSFER_EVENT,
      args: {
        to: paylink.receivingAddress as Address
      },
      fromBlock,
      toBlock: latestBlock
    })

    if (logs.length === 0) {
      if (
        !paylink.lastSyncedBlock ||
        paylink.lastSyncedBlock < Number(latestBlock)
      ) {
        await ctx.runMutation(api.paylinks.applySyncResult, {
          paylinkId: paylink._id,
          latestSyncedBlock: Number(latestBlock),
          payments: []
        })
      }
      return {
        inserted: [] as SyncTransfersResult['inserted'],
        latestBlock: Number(latestBlock)
      }
    }

    const expectedAmount =
      typeof args.expectedAmount !== 'undefined'
        ? BigInt(args.expectedAmount)
        : null

    const paymentsPayload: PaylinkPaymentPayload[] = []

    for (const log of logs) {
      const block = await client.getBlock({ blockNumber: log.blockNumber })
      const amount = log.args?.value as bigint

      let invoiceSlug: string | undefined
      if (
        expectedAmount !== null &&
        amount === expectedAmount &&
        args.invoiceSlug
      ) {
        invoiceSlug = args.invoiceSlug
      }

      paymentsPayload.push({
        txHash: log.transactionHash,
        sender: log.args?.from as string,
        amount: amount.toString(),
        blockNumber: Number(log.blockNumber),
        chainId: paylink.chainId,
        detectedAt: Number(block.timestamp) * 1000,
        invoiceSlug
      })
    }

    const inserted = await ctx.runMutation(api.paylinks.applySyncResult, {
      paylinkId: paylink._id,
      latestSyncedBlock: Number(latestBlock),
      payments: paymentsPayload
    })

    return {
      inserted,
      latestBlock: Number(latestBlock)
    }
  }
})
