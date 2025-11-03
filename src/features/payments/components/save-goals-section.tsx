'use client'

import { useMemo, useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  Activity,
  Loader2,
  Plus,
  TrendingDown,
  TrendingUp,
  Trash2
} from 'lucide-react'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { Doc, Id } from '@/convex/_generated/dataModel'
import { useChainPreference } from '@/hooks/use-chain-preference'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import {
  SETTLEMENT_TOKEN_SYMBOL,
  getBlockExplorerUrl,
  getMusdContractAddress
} from '@/lib/config'
import type { MezoChainId } from '@/lib/config'
import {
  formatSettlementToken,
  parseSettlementTokenAmount
} from '@/lib/settlement-token'
import { cn } from '@/lib/utils'

type GoalDoc = Doc<'savingsGoals'>
type MovementDoc = Doc<'savingsGoalMovements'>

type GoalFormValues = {
  name: string
  targetAmount: string
  targetDate?: string
  notes?: string
}

type MovementFormValues = {
  amount: string
  txHash?: string
  memo?: string
}

function formatDate(timestamp?: number | null) {
  if (!timestamp) return null
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
  return formatter.format(new Date(timestamp))
}

function formatMovementType(type: MovementDoc['type']) {
  return type === 'credit' ? 'Contribution' : 'Withdrawal'
}

function percentage(current: bigint, target: bigint) {
  if (target === 0n) return 0
  const result = Number((current * 100n) / target)
  return Math.min(result, 999)
}

function renderProgressBar(progress: number) {
  const ratio = Math.max(0, Math.min(progress, 100))
  return (
    <div className='mt-3 h-2 w-full rounded-full bg-muted'>
      <div
        className='h-2 rounded-full bg-primary transition-all'
        style={{ width: `${ratio}%` }}
      />
    </div>
  )
}

function explorerUrlForChain(chainId: number) {
  if (chainId === 31611 || chainId === 31612) {
    return getBlockExplorerUrl(chainId as MezoChainId)
  }

  return getBlockExplorerUrl()
}

function GoalMovementDialog({
  goal,
  type,
  triggerLabel,
  triggerIcon,
  settlementTokenAddress
}: {
  goal: GoalDoc
  type: MovementDoc['type']
  triggerLabel: string
  triggerIcon?: React.ReactNode
  settlementTokenAddress: string
}) {
  const [open, setOpen] = useState(false)
  const { address } = useWalletAccount()
  const recordMovement = useMutation(api.saveGoals.recordMovement)
  const form = useForm<MovementFormValues>({
    defaultValues: {
      amount: '',
      memo: '',
      txHash: ''
    }
  })

  const onSubmit = async (values: MovementFormValues) => {
    if (!address) {
      toast.error('Connect your wallet to log goal activity.')
      return
    }

    if (!settlementTokenAddress) {
      toast.error('Settlement token configuration missing.')
      return
    }

    try {
      const parsedAmount = parseSettlementTokenAmount(values.amount)
      if (parsedAmount <= 0n) {
        toast.error('Enter a positive amount.')
        return
      }

      await recordMovement({
        ownerAddress: address,
        goalId: goal._id,
        amount: parsedAmount.toString(),
        type,
        memo: values.memo?.trim(),
        txHash: values.txHash?.trim()
      })

      toast.success('Goal activity logged.')
      setOpen(false)
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : 'Unable to log this movement.'
      )
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          type='button'
          variant={type === 'credit' ? 'default' : 'outline'}
          size='sm'
          className='gap-2'
        >
          {triggerIcon}
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {type === 'credit' ? 'Add to goal' : 'Withdraw from goal'}
          </DialogTitle>
          <DialogDescription>
            Log a {formatMovementType(type).toLowerCase()} after submitting the
            on-chain transfer in your wallet.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='space-y-4'
            autoComplete='off'
          >
            <FormField
              control={form.control}
              name='amount'
              rules={{ required: true }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount ({SETTLEMENT_TOKEN_SYMBOL})</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      type='number'
                      min='0'
                      step='0.01'
                      placeholder='0.00'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='txHash'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transaction hash (optional)</FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder='0x...'
                      autoCapitalize='none'
                      autoCorrect='off'
                      spellCheck={false}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='memo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Memo (optional)</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type='submit'>
                {type === 'credit' ? 'Log contribution' : 'Log withdrawal'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}

function GoalActivityList({
  goalId,
  ownerAddress
}: {
  goalId: Id<'savingsGoals'>
  ownerAddress: string | null
}) {
  const movements = useQuery(
    api.saveGoals.listMovements,
    ownerAddress ? { goalId, ownerAddress } : 'skip'
  )

  if (!ownerAddress) {
    return null
  }

  if (!movements) {
    return (
      <div className='flex items-center gap-2 text-sm text-muted-foreground'>
        <Loader2 className='h-4 w-4 animate-spin text-primary' />
        Loading activity…
      </div>
    )
  }

  if (movements.length === 0) {
    return (
      <p className='text-sm text-muted-foreground'>
        No activity recorded yet. Log contributions or withdrawals to keep this
        goal in sync with your wallet.
      </p>
    )
  }

  return (
    <div className='space-y-3'>
      {movements.map(movement => (
        <div
          key={`${movement.recordedAt}-${movement.amount}`}
          className='flex flex-col gap-1 rounded-lg border border-border/60 bg-background/70 p-3 text-sm'
        >
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between'>
            <div className='font-medium text-foreground'>
              {formatMovementType(movement.type)}
            </div>
            <div
              className={cn(
                'font-mono text-xs',
                movement.type === 'credit'
                  ? 'text-emerald-500'
                  : 'text-amber-500'
              )}
            >
              {movement.type === 'credit' ? '+' : '-'}
              {formatSettlementToken(BigInt(movement.amount), {
                maximumFractionDigits: 2,
                minimumFractionDigits: 2
              })}
            </div>
          </div>
          <div className='text-xs text-muted-foreground'>
            Logged {formatDate(movement.recordedAt)}
          </div>
          {movement.memo ? (
            <p className='text-xs text-muted-foreground'>{movement.memo}</p>
          ) : null}
          {movement.txHash ? (
            <a
              href={`${explorerUrlForChain(movement.chainId)}/tx/${movement.txHash}`}
              target='_blank'
              rel='noreferrer'
              className='text-xs text-primary hover:underline'
            >
              View transaction
            </a>
          ) : null}
        </div>
      ))}
    </div>
  )
}

function GoalCard({
  goal,
  settlementTokenAddress
}: {
  goal: GoalDoc
  settlementTokenAddress: string
}) {
  const { address } = useWalletAccount()
  const archiveGoal = useMutation(api.saveGoals.archive)
  const target = BigInt(goal.targetAmount)
  const current = BigInt(goal.currentAmount)
  const percentComplete = target === 0n ? null : percentage(current, target)
  const targetLabel =
    target === 0n
      ? 'Flexible target'
      : formatSettlementToken(target, {
          maximumFractionDigits: 2,
          minimumFractionDigits: 2
        })
  const currentLabel = formatSettlementToken(current, {
    maximumFractionDigits: 2,
    minimumFractionDigits: 2
  })

  const [showActivity, setShowActivity] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleArchive = async () => {
    if (!address) {
      toast.error('Connect your wallet first.')
      return
    }

    try {
      setIsDeleting(true)
      await archiveGoal({ ownerAddress: address, goalId: goal._id })
      toast.success('Goal deleted.')
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to delete this goal right now.'
      )
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className='group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 shadow-lg backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'>
      {/* Decorative gradient orb */}
      <div className='pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 blur-3xl transition-all group-hover:scale-125' />

      <div className='relative space-y-6'>
        {/* Header Section */}
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 space-y-3'>
            <h3 className='text-2xl font-bold text-foreground'>{goal.name}</h3>
            {goal.notes ? (
              <p className='text-sm leading-relaxed text-muted-foreground'>
                {goal.notes}
              </p>
            ) : null}
            {goal.targetDate ? (
              <div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5'>
                <span className='text-xs font-medium text-primary'>
                  Target: {formatDate(goal.targetDate)}
                </span>
              </div>
            ) : null}
          </div>

          {/* Delete Button */}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='h-9 w-9 text-muted-foreground hover:text-destructive'
                disabled={isDeleting}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete this savings goal?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove "{goal.name}" and all its activity
                  history. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleArchive}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                >
                  Delete goal
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Progress Section */}
        <div className='space-y-4 rounded-2xl border border-border/40 bg-background/40 p-6 backdrop-blur-sm'>
          <div className='grid gap-4 sm:grid-cols-2'>
            <div>
              <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                Current Amount
              </p>
              <p className='mt-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent'>
                {currentLabel}
              </p>
            </div>
            <div>
              <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                Target Amount
              </p>
              <p className='mt-1 text-3xl font-bold text-foreground'>
                {targetLabel}
              </p>
            </div>
          </div>

          {typeof percentComplete === 'number' ? (
            <div className='space-y-2'>
              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium text-foreground'>Progress</span>
                <span className='font-semibold text-primary'>
                  {percentComplete}%
                </span>
              </div>
              {renderProgressBar(percentComplete)}
            </div>
          ) : null}
        </div>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-3'>
          <GoalMovementDialog
            goal={goal}
            type='credit'
            triggerLabel='Add funds'
            triggerIcon={<Plus className='h-4 w-4' />}
            settlementTokenAddress={settlementTokenAddress}
          />
          <GoalMovementDialog
            goal={goal}
            type='debit'
            triggerLabel='Withdraw'
            triggerIcon={<TrendingDown className='h-4 w-4' />}
            settlementTokenAddress={settlementTokenAddress}
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => setShowActivity(value => !value)}
            className='gap-2'
          >
            <Activity className='h-4 w-4' />
            {showActivity ? 'Hide activity' : 'View activity'}
          </Button>
        </div>

        {/* Activity Section */}
        {showActivity ? (
          <>
            <Separator className='my-6' />
            <div className='space-y-3'>
              <h4 className='text-sm font-semibold text-foreground'>
                Activity History
              </h4>
              <GoalActivityList goalId={goal._id} ownerAddress={address} />
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}

export function SaveGoalsSection() {
  const { address } = useWalletAccount()
  const { chainId } = useChainPreference()
  const goals = useQuery(
    api.saveGoals.listForOwner,
    address ? { ownerAddress: address } : 'skip'
  )
  const createGoal = useMutation(api.saveGoals.create)

  const [isSubmitting, setSubmitting] = useState(false)
  const [openCreate, setOpenCreate] = useState(false)

  const form = useForm<GoalFormValues>({
    defaultValues: {
      name: '',
      targetAmount: '',
      targetDate: '',
      notes: ''
    }
  })

  const sortedGoals = useMemo(() => {
    if (!goals) return []
    return [...goals].sort((a, b) => b.createdAt - a.createdAt)
  }, [goals])

  const settlementTokenAddress = useMemo(
    () => getMusdContractAddress(chainId) || '',
    [chainId]
  )

  const onSubmit = async (values: GoalFormValues) => {
    if (!address) {
      toast.error('Connect your wallet to create a goal.')
      return
    }

    if (!settlementTokenAddress) {
      toast.error('Settlement token configuration missing.')
      return
    }

    const parsedAmount = parseSettlementTokenAmount(values.targetAmount || '0')

    try {
      setSubmitting(true)
      await createGoal({
        ownerAddress: address,
        name: values.name,
        targetAmount: parsedAmount.toString(),
        targetDate: values.targetDate
          ? new Date(values.targetDate).getTime()
          : undefined,
        notes: values.notes?.trim(),
        chainId,
        tokenAddress: settlementTokenAddress
      })
      toast.success('Savings goal created.')
      form.reset()
      setOpenCreate(false)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to create this goal right now.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className='space-y-10'>
      <div className='rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <h2 className='text-xl font-semibold text-foreground'>
              Savings goal studio
            </h2>
            <p className='max-w-2xl text-sm text-muted-foreground'>
              Track how much MUSD you have earmarked for upcoming expenses while funds stay in your wallet.
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button type='button' size='sm' className='gap-2'>
                <Plus className='h-4 w-4' />
                New savings goal
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-3xl'>
              <DialogHeader>
                <DialogTitle>Create savings goal</DialogTitle>
                <DialogDescription>
                  Define a target amount, optional date, and notes to organize future payouts.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='grid grid-cols-1 gap-5 md:grid-cols-2'
                  autoComplete='off'
                >
                  <FormField
                    control={form.control}
                    name='name'
                    rules={{ required: true }}
                    render={({ field }) => (
                      <FormItem className='md:col-span-1'>
                        <FormLabel>Goal name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder='e.g. Equipment fund' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='targetAmount'
                    render={({ field }) => (
                      <FormItem className='md:col-span-1'>
                        <FormLabel>
                          Target amount ({SETTLEMENT_TOKEN_SYMBOL})
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type='number'
                            min='0'
                            step='0.01'
                            placeholder='0.00'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='targetDate'
                    render={({ field }) => (
                      <FormItem className='md:col-span-1'>
                        <FormLabel>Target date (optional)</FormLabel>
                        <FormControl>
                          <Input {...field} type='date' />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='notes'
                    render={({ field }) => (
                      <FormItem className='md:col-span-2'>
                        <FormLabel>Notes (optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            rows={3}
                            placeholder='Add context for this goal.'
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <DialogFooter className='md:col-span-2 flex items-center justify-end'>
                    <Button type='submit' disabled={isSubmitting}>
                      {isSubmitting ? 'Creating goal...' : 'Create goal'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className='space-y-4'>
        <div>
          <h2 className='text-xl font-semibold text-foreground'>
            Active goals
          </h2>
          <p className='text-sm text-muted-foreground'>
            Track how much MUSD you have committed to upcoming expenses. Record
            contributions each time you move funds using your wallet so
            reporting stays accurate.
          </p>
        </div>

        {!goals ? (
          <div className='flex items-center justify-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-10 text-sm text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin text-primary' />
            Loading goals…
          </div>
        ) : goals.length === 0 ? (
          <div className='rounded-2xl border border-dashed border-border/70 bg-muted/20 p-8 text-center text-sm text-muted-foreground'>
            Use the New savings goal button above to start earmarking funds.
          </div>
        ) : (
          sortedGoals.map(goal => (
            <GoalCard
              key={goal._id}
              goal={goal}
              settlementTokenAddress={settlementTokenAddress}
            />
          ))
        )}
      </div>
    </div>
  )
}
