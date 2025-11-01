import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { normalizeAddress, requireUserByWallet } from './utils'

type LineItemInput = {
  description: string
  quantity: number
  unitAmount: string
}

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

    return await ctx.db
      .query('invoices')
      .withIndex('by_ownerId', q => q.eq('ownerId', owner._id))
      .order('desc')
      .collect()
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
    paylinkHandle: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const normalizedToken = normalizeAddress(args.tokenAddress)

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
      status: 'issued',
      notes: args.notes,
      totalAmount: totalAmount.toString(),
      tokenAddress: normalizedToken,
      chainId: args.chainId,
      createdAt: now,
      updatedAt: now,
      paidAt: undefined,
      paymentTxHash: undefined,
      paylinkHandle: args.paylinkHandle,
      lineItems
    })

    return {
      slug,
      number,
      totalAmount: totalAmount.toString()
    }
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
