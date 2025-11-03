import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    walletAddress: v.string(),
    displayName: v.optional(v.string()),
    avatarUrl: v.optional(v.string()),
    about: v.optional(v.string())
  }).index('by_wallet', ['walletAddress']),
  groups: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    shortDescription: v.optional(v.string()),
    aboutUrl: v.optional(v.string()),
    thumbnailUrl: v.optional(v.string()),
    galleryUrls: v.optional(v.array(v.string())),
    tags: v.optional(v.array(v.string())),
    visibility: v.optional(v.union(v.literal('public'), v.literal('private'))),
    billingCadence: v.optional(
      v.union(v.literal('free'), v.literal('monthly'))
    ),
    ownerId: v.id('users'),
    price: v.number(),
    memberNumber: v.number(),
    endsOn: v.optional(v.number()),
    subscriptionId: v.optional(v.string()),
    lastSubscriptionPaidAt: v.optional(v.number()),
    lastSubscriptionTxHash: v.optional(v.string())
  })
    .index('by_name', ['name'])
    .index('by_ownerId', ['ownerId'])
    .index('by_subscriptionId', ['subscriptionId']),
  groupAdministrators: defineTable({
    groupId: v.id('groups'),
    adminId: v.id('users'),
    shareBps: v.number()
  })
    .index('by_groupId', ['groupId'])
    .index('by_adminId', ['adminId']),
  userGroups: defineTable({
    userId: v.id('users'),
    groupId: v.id('groups'),
    status: v.optional(v.union(v.literal('active'), v.literal('left'))),
    joinedAt: v.optional(v.number()),
    leftAt: v.optional(v.number()),
    passExpiresAt: v.optional(v.number())
  })
    .index('by_userId', ['userId'])
    .index('by_groupId', ['groupId']),
  posts: defineTable({
    title: v.string(),
    content: v.optional(v.string()),
    authorId: v.id('users'),
    groupId: v.id('groups'),
    lessonId: v.optional(v.id('lessons'))
  })
    .index('by_title', ['title'])
    .index('by_groupId', ['groupId'])
    .index('by_lessonId', ['lessonId']),
  comments: defineTable({
    postId: v.id('posts'),
    content: v.string(),
    authorId: v.id('users')
  }).index('by_postId', ['postId']),
  likes: defineTable({
    postId: v.id('posts'),
    userId: v.id('users')
  })
    .index('by_postId', ['postId'])
    .index('by_postId_userId', ['postId', 'userId']),
  courses: defineTable({
    title: v.string(),
    description: v.string(),
    groupId: v.id('groups'),
    thumbnailUrl: v.optional(v.string())
  }).index('by_groupId', ['groupId']),
  modules: defineTable({
    title: v.string(),
    courseId: v.id('courses')
  }).index('by_courseId', ['courseId']),
  lessons: defineTable({
    title: v.string(),
    description: v.string(),
    moduleId: v.id('modules'),
    youtubeUrl: v.string()
  }).index('by_moduleId', ['moduleId']),
  paylinks: defineTable({
    handle: v.string(),
    ownerId: v.id('users'),
    receivingAddress: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    chainId: v.number(),
    tokenAddress: v.string(),
    lastSyncedBlock: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(),
    archivedAt: v.optional(v.number())
  })
    .index('by_handle', ['handle'])
    .index('by_ownerId', ['ownerId']),
  paylinkPayments: defineTable({
    paylinkId: v.id('paylinks'),
    txHash: v.string(),
    sender: v.string(),
    amount: v.string(),
    blockNumber: v.number(),
    chainId: v.number(),
    detectedAt: v.number(),
    invoiceSlug: v.optional(v.string())
  })
    .index('by_paylinkId', ['paylinkId'])
    .index('by_txHash', ['txHash']),
  invoices: defineTable({
    ownerId: v.id('users'),
    slug: v.string(),
    number: v.string(),
    title: v.optional(v.string()),
    customerName: v.optional(v.string()),
    customerEmail: v.optional(v.string()),
    dueAt: v.optional(v.number()),
    status: v.union(v.literal('draft'), v.literal('issued'), v.literal('paid')),
    notes: v.optional(v.string()),
    totalAmount: v.string(),
    tokenAddress: v.string(),
    chainId: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    paidAt: v.optional(v.number()),
    paymentTxHash: v.optional(v.string()),
    issuanceTxHash: v.optional(v.string()),
    paylinkHandle: v.optional(v.string()),
    payerAddress: v.optional(v.string()),
    registryAddress: v.optional(v.string()),
    registryInvoiceId: v.optional(v.string()),
    referenceHash: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    lineItems: v.array(
      v.object({
        description: v.string(),
        quantity: v.number(),
        unitAmount: v.string()
      })
    )
  })
    .index('by_ownerId', ['ownerId'])
    .index('by_slug', ['slug']),
  payoutSchedules: defineTable({
    ownerId: v.id('users'),
    name: v.string(),
    tokenAddress: v.string(),
    chainId: v.number(),
    recipients: v.array(
      v.object({
        address: v.string(),
        shareBps: v.number(),
        label: v.optional(v.string())
      })
    ),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index('by_ownerId', ['ownerId']),
  payoutExecutions: defineTable({
    scheduleId: v.id('payoutSchedules'),
    txHash: v.string(),
    totalAmount: v.string(),
    executedAt: v.number()
  })
    .index('by_scheduleId', ['scheduleId'])
    .index('by_txHash', ['txHash']),
  savingsGoals: defineTable({
    ownerId: v.id('users'),
    name: v.string(),
    targetAmount: v.string(),
    currentAmount: v.string(),
    chainId: v.number(),
    tokenAddress: v.string(),
    targetDate: v.optional(v.number()),
    notes: v.optional(v.string()),
    archivedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number()
  })
    .index('by_ownerId', ['ownerId'])
    .index('by_ownerId_createdAt', ['ownerId', 'createdAt']),
  savingsGoalMovements: defineTable({
    goalId: v.id('savingsGoals'),
    type: v.union(v.literal('credit'), v.literal('debit')),
    amount: v.string(),
    chainId: v.number(),
    recordedAt: v.number(),
    txHash: v.optional(v.string()),
    memo: v.optional(v.string())
  })
    .index('by_goalId', ['goalId'])
    .index('by_txHash', ['txHash'])
})
