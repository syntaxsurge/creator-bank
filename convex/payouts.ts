import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { normalizeAddress, requireUserByWallet } from './utils'

type RecipientInput = {
  address: string
  shareBps: number
  label?: string
}

function sanitizeRecipients(recipients: RecipientInput[]) {
  if (recipients.length === 0) {
    throw new Error('At least one recipient is required')
  }

  const sanitized = recipients.map(recipient => ({
    address: normalizeAddress(recipient.address),
    shareBps: Math.max(0, Math.floor(recipient.shareBps)),
    label: recipient.label?.trim()
  }))

  const totalShare = sanitized.reduce((total, recipient) => {
    return total + recipient.shareBps
  }, 0)

  if (totalShare !== 10000) {
    throw new Error(
      'Recipient allocations must total 10000 basis points (100%)'
    )
  }

  return sanitized
}

export const listSchedules = query({
  args: {
    ownerAddress: v.string()
  },
  handler: async (ctx, { ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)

    return await ctx.db
      .query('payoutSchedules')
      .withIndex('by_ownerId', q => q.eq('ownerId', owner._id))
      .collect()
  }
})

export const executionsForSchedule = query({
  args: {
    scheduleId: v.id('payoutSchedules')
  },
  handler: async (ctx, { scheduleId }) => {
    return await ctx.db
      .query('payoutExecutions')
      .withIndex('by_scheduleId', q => q.eq('scheduleId', scheduleId))
      .order('desc')
      .collect()
  }
})

export const createSchedule = mutation({
  args: {
    ownerAddress: v.string(),
    name: v.string(),
    tokenAddress: v.string(),
    chainId: v.number(),
    recipients: v.array(
      v.object({
        address: v.string(),
        shareBps: v.number(),
        label: v.optional(v.string())
      })
    )
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const recipients = sanitizeRecipients(args.recipients)
    const now = Date.now()

    const scheduleId = await ctx.db.insert('payoutSchedules', {
      ownerId: owner._id,
      name: args.name.trim(),
      tokenAddress: normalizeAddress(args.tokenAddress),
      chainId: args.chainId,
      recipients,
      createdAt: now,
      updatedAt: now
    })

    return scheduleId
  }
})

export const updateSchedule = mutation({
  args: {
    ownerAddress: v.string(),
    scheduleId: v.id('payoutSchedules'),
    name: v.optional(v.string()),
    recipients: v.optional(
      v.array(
        v.object({
          address: v.string(),
          shareBps: v.number(),
          label: v.optional(v.string())
        })
      )
    )
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const schedule = await ctx.db.get(args.scheduleId)

    if (!schedule || schedule.ownerId !== owner._id) {
      throw new Error('Schedule not found')
    }

    const payload: Record<string, unknown> = {
      updatedAt: Date.now()
    }

    if (typeof args.name !== 'undefined') {
      payload.name = args.name.trim()
    }

    if (typeof args.recipients !== 'undefined') {
      payload.recipients = sanitizeRecipients(args.recipients)
    }

    await ctx.db.patch(args.scheduleId, payload)
  }
})

export const deleteSchedule = mutation({
  args: {
    ownerAddress: v.string(),
    scheduleId: v.id('payoutSchedules')
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const schedule = await ctx.db.get(args.scheduleId)

    if (!schedule || schedule.ownerId !== owner._id) {
      throw new Error('Schedule not found')
    }

    const executions = await ctx.db
      .query('payoutExecutions')
      .withIndex('by_scheduleId', q => q.eq('scheduleId', args.scheduleId))
      .collect()

    for (const execution of executions) {
      await ctx.db.delete(execution._id)
    }

    await ctx.db.delete(args.scheduleId)
  }
})

export const recordExecution = mutation({
  args: {
    ownerAddress: v.string(),
    scheduleId: v.id('payoutSchedules'),
    txHash: v.string(),
    totalAmount: v.string(),
    executedAt: v.number()
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const schedule = await ctx.db.get(args.scheduleId)

    if (!schedule || schedule.ownerId !== owner._id) {
      throw new Error('Schedule not found')
    }

    const normalizedTxHash = args.txHash.toLowerCase()

    const existing = await ctx.db
      .query('payoutExecutions')
      .withIndex('by_txHash', q => q.eq('txHash', normalizedTxHash))
      .first()

    if (existing) {
      return
    }

    await ctx.db.insert('payoutExecutions', {
      scheduleId: args.scheduleId,
      txHash: normalizedTxHash,
      totalAmount: BigInt(args.totalAmount).toString(),
      executedAt: args.executedAt
    })
  }
})
