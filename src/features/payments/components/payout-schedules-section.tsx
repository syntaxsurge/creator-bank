'use client'

import { useMemo, useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { Address } from 'viem'

import {
  Loader2,
  Plus,
  Trash2,
  Users,
  Percent,
  Send,
  Clock,
  TrendingUp
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
import { Badge } from '@/components/ui/badge'
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
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { useChainPreference } from '@/hooks/use-chain-preference'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import {
  SETTLEMENT_TOKEN_SYMBOL,
  getMusdContractAddress,
  getRevenueSplitRouterAddress
} from '@/lib/config'
import { RevenueSplitRouterService } from '@/lib/onchain/services'
import {
  formatSettlementToken,
  parseSettlementTokenAmount
} from '@/lib/settlement-token'

type RecipientFormValue = {
  address: string
  shareBps: number
  label?: string
}

type ScheduleFormValues = {
  name: string
  recipients: RecipientFormValue[]
}

type RunState = {
  amount: string
  pending: boolean
}

type ScheduleCardProps = {
  schedule: {
    _id: Id<'payoutSchedules'>
    name: string
    recipients: Array<{
      address: string
      shareBps: number
      label?: string | null
    }>
  }
  runState: RunState
  onChangeAmount: (value: string) => void
  onExecute: () => Promise<void>
  onDelete: () => void
  isDeleting: boolean
  executions:
    | Array<{
        _id: Id<'payoutExecutions'>
        txHash: string
        totalAmount: string
        executedAt: number
      }>
    | undefined
}

function ScheduleExecutions({
  executions
}: {
  executions: ScheduleCardProps['executions']
}) {
  if (!executions || executions.length === 0) {
    return (
      <p className='text-xs text-muted-foreground'>
        No recorded payouts yet. Execute a split to see the history here.
      </p>
    )
  }

  return (
    <div className='space-y-3'>
      {executions.map(execution => (
        <div
          key={execution._id}
          className='flex items-center justify-between rounded-lg border border-border/60 bg-background/80 px-4 py-2 text-xs'
        >
          <span className='font-mono text-muted-foreground'>
            {execution.txHash}
          </span>
          <div className='flex items-center gap-3'>
            <span className='font-medium text-foreground'>
              {formatSettlementToken(BigInt(execution.totalAmount))}
            </span>
            <span className='text-muted-foreground'>
              {new Date(execution.executedAt).toLocaleString()}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

function ScheduleCard({
  schedule,
  runState,
  onChangeAmount,
  onExecute,
  onDelete,
  isDeleting,
  executions
}: ScheduleCardProps) {
  const totalShare = schedule.recipients.reduce((total, recipient) => {
    return total + recipient.shareBps
  }, 0)

  const isValid = totalShare === 10000

  return (
    <div className='group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 shadow-lg backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'>
      {/* Decorative gradient orb */}
      <div className='pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 blur-3xl transition-all group-hover:scale-125' />

      <div className='relative space-y-6'>
        {/* Header Section */}
        <div className='flex items-start justify-between gap-4'>
          <div className='flex-1 space-y-3'>
            <div className='flex items-center gap-3'>
              <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 ring-1 ring-primary/20'>
                <TrendingUp className='h-6 w-6 text-primary' />
              </div>
              <div>
                <h3 className='text-2xl font-bold text-foreground'>
                  {schedule.name}
                </h3>
                <div className='mt-1 flex items-center gap-2'>
                  <Badge variant={isValid ? 'secondary' : 'destructive'}>
                    {(totalShare / 100).toFixed(2)}% {isValid ? 'Valid' : 'Invalid'}
                  </Badge>
                  <span className='text-xs text-muted-foreground'>
                    {schedule.recipients.length} recipients
                  </span>
                </div>
              </div>
            </div>
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
                <AlertDialogTitle>Delete this payout schedule?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the "{schedule.name}" payout schedule.
                  Execution history will be preserved on-chain.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onDelete}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                >
                  Delete schedule
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Execute Payout Section */}
        <div className='rounded-2xl border border-border/40 bg-background/40 p-6 backdrop-blur-sm'>
          <h4 className='mb-4 flex items-center gap-2 text-sm font-semibold text-foreground'>
            <Send className='h-4 w-4' />
            Execute Payout
          </h4>
          <div className='flex flex-col gap-3 sm:flex-row'>
            <Input
              placeholder={`Amount in ${SETTLEMENT_TOKEN_SYMBOL}`}
              value={runState.amount}
              onChange={event => onChangeAmount(event.target.value)}
              className='flex-1'
            />
            <Button
              type='button'
              onClick={onExecute}
              disabled={runState.pending || !isValid}
              className='gap-2'
            >
              <Send className='h-4 w-4' />
              {runState.pending ? 'Executing...' : 'Execute'}
            </Button>
          </div>
          {!isValid && (
            <p className='mt-2 text-xs text-destructive'>
              Total allocation must equal 100% to execute payouts
            </p>
          )}
        </div>

        {/* Recipients Grid */}
        <div className='space-y-4'>
          <h4 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
            <Users className='h-4 w-4' />
            Recipients
          </h4>
          <div className='grid gap-4 sm:grid-cols-2'>
            {schedule.recipients.map((recipient, idx) => (
              <div
                key={`${recipient.address}-${recipient.shareBps}`}
                className='rounded-2xl border border-border/40 bg-background/40 p-4 backdrop-blur-sm'
              >
                <div className='flex items-start justify-between gap-2'>
                  <div className='flex-1 space-y-2'>
                    {recipient.label ? (
                      <p className='text-sm font-medium text-foreground'>
                        {recipient.label}
                      </p>
                    ) : (
                      <p className='text-xs text-muted-foreground'>
                        Recipient {idx + 1}
                      </p>
                    )}
                    <p className='break-all font-mono text-xs text-muted-foreground'>
                      {recipient.address}
                    </p>
                  </div>
                  <div className='flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1'>
                    <Percent className='h-3 w-3 text-primary' />
                    <span className='text-sm font-semibold text-primary'>
                      {(recipient.shareBps / 100).toFixed(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Execution History */}
        <div className='space-y-3'>
          <h4 className='flex items-center gap-2 text-sm font-semibold text-foreground'>
            <Clock className='h-4 w-4' />
            Execution History
          </h4>
          <ScheduleExecutions executions={executions} />
        </div>
      </div>
    </div>
  )
}

function ScheduleCardContainer({
  schedule,
  runState,
  onChangeAmount,
  onExecute,
  onDelete,
  isDeleting
}: Omit<ScheduleCardProps, 'executions'>) {
  const executions = useQuery(api.payouts.executionsForSchedule, {
    scheduleId: schedule._id
  })

  return (
    <ScheduleCard
      schedule={schedule}
      runState={runState}
      onChangeAmount={onChangeAmount}
      onExecute={onExecute}
      onDelete={onDelete}
      isDeleting={isDeleting}
      executions={executions}
    />
  )
}

export function PayoutSchedulesSection() {
  const { address, publicClient, walletClient } = useWalletAccount()
  const { chainId } = useChainPreference()
  const schedules = useQuery(
    api.payouts.listSchedules,
    address ? { ownerAddress: address } : 'skip'
  )
  const createSchedule = useMutation(api.payouts.createSchedule)
  const recordExecution = useMutation(api.payouts.recordExecution)
  const deleteSchedule = useMutation(api.payouts.deleteSchedule)

  const [runStates, setRunStates] = useState<Record<string, RunState>>({})
  const [deletingId, setDeletingId] = useState<Id<'payoutSchedules'> | null>(
    null
  )

  const settlementTokenAddress = useMemo(
    () => getMusdContractAddress(chainId) || '',
    [chainId]
  )

  const splitRouterAddress = useMemo(
    () => getRevenueSplitRouterAddress(chainId) || '',
    [chainId]
  )

  const routerService = useMemo(() => {
    if (!publicClient || !walletClient || !address || !splitRouterAddress) {
      return null
    }

    try {
      return new RevenueSplitRouterService({
        publicClient,
        walletClient,
        account: address as Address,
        address: splitRouterAddress as Address
      })
    } catch (error) {
      console.error(error)
      return null
    }
  }, [address, publicClient, walletClient, splitRouterAddress])

  const form = useForm<ScheduleFormValues>({
    defaultValues: {
      name: '',
      recipients: [
        {
          address: '',
          shareBps: 10000,
          label: 'Primary'
        }
      ]
    }
  })

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'recipients'
  })
  const [openCreate, setOpenCreate] = useState(false)

  const handleSubmit = async (values: ScheduleFormValues) => {
    if (!address) {
      toast.error('Connect your wallet to create payout schedules.')
      return
    }

    if (!settlementTokenAddress) {
      toast.error('Settlement token configuration missing. Contact support.')
      return
    }

    if (values.recipients.length === 0) {
      toast.error('Add at least one recipient.')
      return
    }

    const totalShare = values.recipients.reduce((total, recipient) => {
      return total + Math.max(0, Math.floor(recipient.shareBps))
    }, 0)

    if (totalShare !== 10000) {
      toast.error('Recipient allocations must sum to 100%.')
      return
    }

    try {
      await createSchedule({
        ownerAddress: address,
        name: values.name.trim(),
        chainId,
        tokenAddress: settlementTokenAddress,
        recipients: values.recipients.map(recipient => ({
          address: recipient.address.trim(),
          shareBps: Math.max(0, Math.floor(recipient.shareBps)),
          label: recipient.label?.trim()
        }))
      })

      toast.success('Payout schedule created.')
      form.reset({
        name: '',
        recipients: [
          {
            address: '',
            shareBps: 10000,
            label: 'Primary'
          }
        ]
      })
      setOpenCreate(false)
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to create schedule. Please try again.'
      )
    }
  }

  const changeRunState = (scheduleId: string, patch: Partial<RunState>) => {
    setRunStates(prev => ({
      ...prev,
      [scheduleId]: {
        amount: prev[scheduleId]?.amount ?? '',
        pending: prev[scheduleId]?.pending ?? false,
        ...patch
      }
    }))
  }

  const handleDelete = async (scheduleId: Id<'payoutSchedules'>) => {
    if (!address) {
      toast.error('Connect your wallet to manage payout schedules.')
      return
    }

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(
        'Remove this payout schedule? Execution history will be deleted.'
      )
      if (!confirmed) {
        return
      }
    }

    try {
      setDeletingId(scheduleId)
      await deleteSchedule({ ownerAddress: address, scheduleId })
      setRunStates(prev => {
        const next = { ...prev }
        delete next[scheduleId]
        return next
      })
      toast.success('Payout schedule removed.')
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to remove this schedule right now.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  const handleExecute = async (schedule: ScheduleCardProps['schedule']) => {
    if (!address) {
      toast.error('Connect your wallet to execute payouts.')
      return
    }

    if (!routerService || !settlementTokenAddress) {
      toast.error('Split router unavailable. Verify your wallet connection.')
      return
    }

    const scheduleKey = schedule._id
    const amountInput = runStates[scheduleKey]?.amount ?? ''
    const amount = parseSettlementTokenAmount(amountInput)

    if (amount <= 0n) {
      toast.error('Enter an amount greater than zero.')
      return
    }

    changeRunState(scheduleKey, { pending: true })

    try {
      const response = await routerService.splitTransfer(
        settlementTokenAddress as Address,
        schedule.recipients.map(recipient => recipient.address as Address),
        schedule.recipients.map(recipient => recipient.shareBps),
        amount
      )

      await response.wait()
      await recordExecution({
        ownerAddress: address,
        scheduleId: schedule._id,
        txHash: response.hash,
        totalAmount: amount.toString(),
        executedAt: Date.now()
      })

      toast.success('Payout executed successfully.')
      changeRunState(scheduleKey, { amount: '', pending: false })
    } catch (error: any) {
      console.error(error)
      toast.error(error?.shortMessage ?? error?.message ?? 'Payout failed.')
      changeRunState(scheduleKey, { pending: false })
    }
  }

  return (
    <div className='space-y-8'>
      <div className='rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <h2 className='text-xl font-semibold text-foreground'>
              Recurring payout studio
            </h2>
            <p className='max-w-2xl text-sm text-muted-foreground'>
              Define collaborator splits and launch on-chain transfers with one click.
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button type='button' size='sm' className='gap-2'>
                <Plus className='h-4 w-4' />
                New payout schedule
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-3xl'>
              <DialogHeader>
                <DialogTitle>Create payout schedule</DialogTitle>
                <DialogDescription>
                  Allocate percentages across recipients. Shares must total 100% before saving.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className='space-y-5'
                  autoComplete='off'
                >
                  <FormField
                    control={form.control}
                    name='name'
                    rules={{ required: 'Enter a schedule name' }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule name</FormLabel>
                        <FormControl>
                          <Input placeholder='Creator payroll' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='space-y-4'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-medium text-foreground'>
                        Recipients
                      </h3>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          append({
                            address: '',
                            shareBps: Math.max(
                              0,
                              Math.floor(10000 / (fields.length + 1))
                            ),
                            label: ''
                          })
                        }
                      >
                        Add recipient
                      </Button>
                    </div>

                    <div className='space-y-4'>
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className='rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm'
                        >
                          <div className='grid grid-cols-1 gap-3 md:grid-cols-3'>
                            <FormField
                              control={form.control}
                              name={`recipients.${index}.address`}
                              render={({ field: fieldItem }) => (
                                <FormItem className='md:col-span-2'>
                                  <FormLabel>Wallet address</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='0x...'
                                      className='font-mono'
                                      {...fieldItem}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`recipients.${index}.shareBps`}
                              render={({ field: fieldItem }) => {
                                const { value, onChange, onBlur, name, ref, ...rest } =
                                  fieldItem

                                const displayValue =
                                  typeof value === 'number'
                                    ? (value / 100).toString()
                                    : ''

                                return (
                                  <FormItem>
                                    <FormLabel>Share (%)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type='number'
                                        inputMode='decimal'
                                        min={0}
                                        max={100}
                                        step='0.01'
                                        name={name}
                                        ref={ref}
                                        {...rest}
                                        value={displayValue}
                                        onChange={event => {
                                          const inputValue = event.target.value
                                          const numeric = Number(inputValue)
                                          if (Number.isNaN(numeric)) return
                                          const clamped = Math.min(
                                            100,
                                            Math.max(0, numeric)
                                          )
                                          onChange(Math.round(clamped * 100))
                                        }}
                                        onBlur={event => {
                                          if (event.target.value === '') {
                                            onChange(0)
                                          }
                                          onBlur()
                                        }}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )
                              }}
                            />
                          </div>
                          <div className='mt-3 grid grid-cols-1 gap-3 md:grid-cols-3'>
                            <FormField
                              control={form.control}
                              name={`recipients.${index}.label`}
                              render={({ field: fieldItem }) => (
                                <FormItem className='md:col-span-2'>
                                  <FormLabel>Label</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='Optional note'
                                      {...fieldItem}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <div className='flex items-end justify-end'>
                              {fields.length > 1 ? (
                                <Button
                                  type='button'
                                  variant='ghost'
                                  size='sm'
                                  onClick={() => remove(index)}
                                >
                                  Remove
                                </Button>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className='flex items-center justify-end'>
                    <Button type='submit'>Save schedule</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-foreground'>
          Active schedules
        </h2>
        {!schedules ? (
          <div className='flex items-center justify-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-10 text-sm text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin text-primary' />
            Loading payout schedules…
          </div>
        ) : schedules.length > 0 ? (
          <div className='space-y-4'>
            {schedules.map(schedule => {
              const scheduleId = schedule._id as Id<'payoutSchedules'>
              return (
                <ScheduleCardContainer
                  key={scheduleId}
                  schedule={schedule}
                  runState={
                    runStates[scheduleId] ?? { amount: '', pending: false }
                  }
                  onChangeAmount={value =>
                    changeRunState(scheduleId, { amount: value })
                  }
                  onExecute={() => handleExecute(schedule)}
                  onDelete={() => handleDelete(scheduleId)}
                  isDeleting={deletingId === scheduleId}
                />
              )
            })}
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-center text-sm text-muted-foreground'>
            Use the New payout schedule button above to automate collaborator revenue splits.
          </div>
        )}
      </div>
    </div>
  )
}
