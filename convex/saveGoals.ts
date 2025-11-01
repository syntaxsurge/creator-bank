import { v } from 'convex/values'

import { mutation, query } from './_generated/server'
import { normalizeAddress, requireUserByWallet } from './utils'

function ensurePositiveAmount(raw: string) {
  const amount = BigInt(raw)
  if (amount < 0n) {
    throw new Error('Amounts must be non-negative')
  }
  return amount
}

export const listForOwner = query({
  args: {
    ownerAddress: v.string()
  },
  handler: async (ctx, { ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)

    const goals = await ctx.db
      .query('savingsGoals')
      .withIndex('by_ownerId', q => q.eq('ownerId', owner._id))
      .order('desc')
      .collect()

    return goals.filter(goal => !goal.archivedAt)
  }
})

export const listMovements = query({
  args: {
    goalId: v.id('savingsGoals'),
    ownerAddress: v.string()
  },
  handler: async (ctx, { goalId, ownerAddress }) => {
    const owner = await requireUserByWallet(ctx, ownerAddress)

    const goal = await ctx.db.get(goalId)
    if (!goal || goal.ownerId !== owner._id) {
      throw new Error('Savings goal not found')
    }

    return await ctx.db
      .query('savingsGoalMovements')
      .withIndex('by_goalId', q => q.eq('goalId', goalId))
      .order('desc')
      .collect()
  }
})

export const create = mutation({
  args: {
    ownerAddress: v.string(),
    name: v.string(),
    targetAmount: v.string(),
    targetDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    tokenAddress: v.string(),
    chainId: v.number()
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)

    const trimmedName = args.name.trim()
    if (!trimmedName) {
      throw new Error('Goal name is required')
    }

    const preparedTarget = ensurePositiveAmount(args.targetAmount)

    const now = Date.now()
    await ctx.db.insert('savingsGoals', {
      ownerId: owner._id,
      name: trimmedName,
      targetAmount: preparedTarget.toString(),
      currentAmount: '0',
      chainId: args.chainId,
      tokenAddress: normalizeAddress(args.tokenAddress),
      targetDate: args.targetDate,
      notes: args.notes,
      archivedAt: undefined,
      createdAt: now,
      updatedAt: now
    })
  }
})

export const updateDetails = mutation({
  args: {
    ownerAddress: v.string(),
    goalId: v.id('savingsGoals'),
    name: v.optional(v.string()),
    targetAmount: v.optional(v.string()),
    targetDate: v.optional(v.union(v.number(), v.null())),
    notes: v.optional(v.union(v.string(), v.null()))
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const goal = await ctx.db.get(args.goalId)

    if (!goal || goal.ownerId !== owner._id) {
      throw new Error('Savings goal not found')
    }

    const patch: Partial<typeof goal> = {
      updatedAt: Date.now()
    }

    if (typeof args.name !== 'undefined') {
      const trimmed = args.name.trim()
      if (!trimmed) {
        throw new Error('Goal name cannot be empty')
      }
      patch.name = trimmed
    }

    if (typeof args.targetAmount !== 'undefined') {
      const amount = ensurePositiveAmount(args.targetAmount)
      patch.targetAmount = amount.toString()
    }

    if (typeof args.targetDate !== 'undefined') {
      patch.targetDate = args.targetDate ?? undefined
    }

    if (typeof args.notes !== 'undefined') {
      const normalized =
        typeof args.notes === 'string' && args.notes.trim().length > 0
          ? args.notes.trim()
          : undefined
      patch.notes = normalized
    }

    await ctx.db.patch(args.goalId, patch)
  }
})

export const archive = mutation({
  args: {
    ownerAddress: v.string(),
    goalId: v.id('savingsGoals')
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const goal = await ctx.db.get(args.goalId)

    if (!goal || goal.ownerId !== owner._id) {
      throw new Error('Savings goal not found')
    }

    if (goal.archivedAt) {
      return
    }

    await ctx.db.patch(goal._id, {
      archivedAt: Date.now(),
      updatedAt: Date.now()
    })
  }
})

export const recordMovement = mutation({
  args: {
    ownerAddress: v.string(),
    goalId: v.id('savingsGoals'),
    amount: v.string(),
    type: v.union(v.literal('credit'), v.literal('debit')),
    txHash: v.optional(v.string()),
    memo: v.optional(v.string())
  },
  handler: async (ctx, args) => {
    const owner = await requireUserByWallet(ctx, args.ownerAddress)
    const goal = await ctx.db.get(args.goalId)

    if (!goal || goal.ownerId !== owner._id) {
      throw new Error('Savings goal not found')
    }

    if (goal.archivedAt) {
      throw new Error('Archived goals cannot be updated')
    }

    const preparedAmount = ensurePositiveAmount(args.amount)
    if (preparedAmount === 0n) {
      throw new Error('Movement amount must be greater than zero')
    }

    const currentAmount = BigInt(goal.currentAmount)
    const nextAmount =
      args.type === 'credit'
        ? currentAmount + preparedAmount
        : currentAmount - preparedAmount

    if (nextAmount < 0n) {
      throw new Error('Insufficient balance in this goal to withdraw')
    }

    const normalizedHash =
      typeof args.txHash === 'string' && args.txHash.trim().length > 0
        ? args.txHash.trim().toLowerCase()
        : undefined

    if (normalizedHash) {
      const existing = await ctx.db
        .query('savingsGoalMovements')
        .withIndex('by_txHash', q => q.eq('txHash', normalizedHash))
        .unique()

      if (existing) {
        throw new Error('This transaction hash has already been logged')
      }
    }

    const memo =
      typeof args.memo === 'string' && args.memo.trim().length > 0
        ? args.memo.trim()
        : undefined

    const now = Date.now()
    await ctx.db.insert('savingsGoalMovements', {
      goalId: args.goalId,
      type: args.type,
      amount: preparedAmount.toString(),
      chainId: goal.chainId,
      recordedAt: now,
      txHash: normalizedHash,
      memo
    })

    await ctx.db.patch(args.goalId, {
      currentAmount: nextAmount.toString(),
      updatedAt: now
    })
  }
})
