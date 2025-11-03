import { v } from 'convex/values'
import { parseAbi } from 'viem'

import { api } from './_generated/api'
import { action, mutation, query } from './_generated/server'
import { getPublicClientForChain } from './chains'
import { normalizeAddress, requireUserByWallet } from './utils'

type LineItemInput = {
  description: string
  quantity: number
  unitAmount: string
}

const INVOICE_REGISTRY_ABI = parseAbi([
  'function getInvoice(uint256 invoiceId) view returns (address issuer, address token, address payer, uint256 amount, bool paid, bytes32 referenceHash)'
])

function generateSlug() {
  const now = Date.now().toString(36)
  const random = Math.random().toString(36).slice(2, 8)
  return `inv-${now}-${random}`
}

function generateInvoiceNumber(existingCount: number) {
  const now = new Date()
  const year = now.getFullYear()
  const sequence = (existingCount + 1).toString().padStart(4, '0')
  return `CB-${year}-${sequence}`
}

function computeTotalAmount(lineItems: LineItemInput[]) {
  return lineItems.reduce((total, item) => {
    const quantity = Math.max(0, Math.floor(item.quantity))
    const unitAmount = BigInt(item.unitAmount)
    return total + unitAmount * BigInt(quantity)
  }, 0n)
}

export const listForOwner = query({
  args: {
    ownerAddress: v.string()
  },
  handler: async (ctx, { ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)

    const invoices = await ctx.db
      .query('invoices')
      .withIndex('by_ownerId', q => q.eq('ownerId', owner._id))
      .order('desc')
      .collect()

    return invoices.filter(invoice => typeof invoice.archivedAt === 'undefined')
  }
})

export const getBySlug = query({
  args: { slug: v.string() },
  handler: async (ctx, { slug }) => {
    return await ctx.db
      .query('invoices')
      .withIndex('by_slug', q => q.eq('slug', slug))
      .unique()
  }
})

export const create = mutation({
  args: {
    ownerAddress: v.string(),
    title: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    notes: v.optional(v.string()),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitAmount: v.string()
      })
    ),
    tokenAddress: v.string(),
    chainId: v.number(),
    paylinkHandle: v.optional(v.string()),
    payerAddress: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const normalizedToken = normalizeAddress(args.tokenAddress)
    const normalizedPayer = args.payerAddress
      ? normalizeAddress(args.payerAddress)
      : undefined

    if (args.lineItems.length === 0) {
      throw new Error('Invoices require at least one line item')
    }

    const lineItems = args.lineItems.map(item => ({
      description: item.description.trim(),
      quantity: Math.max(0, Math.floor(item.quantity)),
      unitAmount: BigInt(item.unitAmount).toString()
    }))

    const totalAmount = computeTotalAmount(lineItems)

    const existingInvoices = await ctx.db
      .query('invoices')
      .withIndex('by_ownerId', q => q.eq('ownerId', owner._id))
      .collect()

    const existingCount = existingInvoices.length

    const now = Date.now()

    const slug = generateSlug()
    const number = generateInvoiceNumber(existingCount)

    await ctx.db.insert('invoices', {
      ownerId: owner._id,
      slug,
      number,
      title: args.title,
      customerName: args.customerName,
      customerEmail: args.customerEmail,
      dueAt: args.dueAt,
      status: 'draft',
      notes: args.notes,
      totalAmount: totalAmount.toString(),
      tokenAddress: normalizedToken,
      chainId: args.chainId,
      createdAt: now,
      updatedAt: now,
      paidAt: undefined,
      paymentTxHash: undefined,
      paylinkHandle: args.paylinkHandle,
      payerAddress: normalizedPayer,
      registryAddress: undefined,
      registryInvoiceId: undefined,
      referenceHash: undefined,
      archivedAt: undefined,
      lineItems
    })

    return {
      slug,
      number,
      totalAmount: totalAmount.toString()
    }
  }
})

export const registerOnchain = mutation({
  args: {
    ownerAddress: v.string(),
    slug: v.string(),
    registryAddress: v.string(),
    registryInvoiceId: v.string(),
    referenceHash: v.string(),
    txHash: v.string()
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)

    const invoice = await ctx.db
      .query('invoices')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique()

    if (!invoice || invoice.ownerId !== owner._id) {
      throw new Error('Invoice not found')
    }

    await ctx.db.patch(invoice._id, {
      registryAddress: normalizeAddress(args.registryAddress),
      registryInvoiceId: args.registryInvoiceId,
      referenceHash: args.referenceHash,
      chainId: 31611,
      issuanceTxHash: args.txHash,
      status: 'issued',
      updatedAt: Date.now()
    })
  }
})

export const updateNotes = mutation({
  args: {
    ownerAddress: v.string(),
    slug: v.string(),
    notes: v.optional(v.string()),
    dueAt: v.optional(v.number())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)

    const invoice = await ctx.db
      .query('invoices')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique()

    if (!invoice || invoice.ownerId !== owner._id) {
      throw new Error('Invoice not found')
    }

    await ctx.db.patch(invoice._id, {
      notes: typeof args.notes === 'undefined' ? invoice.notes : args.notes,
      dueAt: typeof args.dueAt === 'undefined' ? invoice.dueAt : args.dueAt,
      updatedAt: Date.now()
    })
  }
})

export const attachPaylink = mutation({
  args: {
    ownerAddress: v.string(),
    slug: v.string(),
    paylinkHandle: v.string()
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)

    const invoice = await ctx.db
      .query('invoices')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique()

    if (!invoice || invoice.ownerId !== owner._id) {
      throw new Error('Invoice not found')
    }

    await ctx.db.patch(invoice._id, {
      paylinkHandle: args.paylinkHandle,
      updatedAt: Date.now()
    })
  }
})

export const archive = mutation({
  args: {
    ownerAddress: v.string(),
    slug: v.string()
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)

    const invoice = await ctx.db
      .query('invoices')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique()

    if (!invoice || invoice.ownerId !== owner._id) {
      throw new Error('Invoice not found')
    }

    if (invoice.status === 'paid') {
      throw new Error('Paid invoices cannot be removed.')
    }

    await ctx.db.patch(invoice._id, {
      archivedAt: Date.now(),
      updatedAt: Date.now()
    })
  }
})

export const recordSettlement = action({
  args: {
    slug: v.string(),
    txHash: v.string()
  },
  handler: async (ctx, args) => {
    const invoice = await ctx.runQuery(api.invoices.getBySlug, {
      slug: args.slug
    })

    if (!invoice) {
      return { ok: false, reason: 'invoice_not_found' }
    }

    if (!invoice.registryAddress || !invoice.registryInvoiceId) {
      return { ok: false, reason: 'invoice_not_registered' }
    }

    const registryInvoiceId = BigInt(invoice.registryInvoiceId)

    const client = getPublicClientForChain(invoice.chainId)
    const [, , payer, amount, paid, referenceHash] =
      (await client.readContract({
        address: invoice.registryAddress as `0x${string}`,
        abi: INVOICE_REGISTRY_ABI,
        functionName: 'getInvoice',
        args: [registryInvoiceId]
      })) as readonly [
        string,
        string,
        string,
        bigint,
        boolean,
        `0x${string}`
      ]

    if (!paid) {
      return { ok: false, reason: 'invoice_unpaid' }
    }

    if (amount.toString() !== invoice.totalAmount) {
      return { ok: false, reason: 'amount_mismatch' }
    }

    if (
      invoice.referenceHash &&
      invoice.referenceHash.toLowerCase() !==
        referenceHash.toLowerCase()
    ) {
      return { ok: false, reason: 'reference_mismatch' }
    }

    const owner = await ctx.runQuery(api.users.getById, {
      userId: invoice.ownerId
    })

    if (!owner) {
      return { ok: false, reason: 'owner_missing' }
    }

    await ctx.runMutation(api.invoices.markPaid, {
      ownerAddress: owner.walletAddress,
      slug: args.slug,
      paymentTxHash: args.txHash,
      paidAt: Date.now()
    })

    return {
      ok: true,
      payer,
      amount: amount.toString()
    }
  }
})

export const markPaid = mutation({
  args: {
    ownerAddress: v.string(),
    slug: v.string(),
    paymentTxHash: v.string(),
    paidAt: v.number()
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)

    const invoice = await ctx.db
      .query('invoices')
      .withIndex('by_slug', q => q.eq('slug', args.slug))
      .unique()

    if (!invoice || invoice.ownerId !== owner._id) {
      throw new Error('Invoice not found')
    }

    if (invoice.status === 'paid') {
      return
    }

    await ctx.db.patch(invoice._id, {
      status: 'paid',
      paidAt: args.paidAt,
      paymentTxHash: args.paymentTxHash.toLowerCase(),
      updatedAt: Date.now()
    })
  }
})
