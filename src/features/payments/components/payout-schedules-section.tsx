'use client'

import { useMemo, useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { Address } from 'viem'

import { Trash2 } from 'lucide-react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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

  return (
    <div className='rounded-2xl border border-border bg-card/70 p-6 shadow-sm'>
      <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
        <div className='space-y-2'>
          <div className='flex items-center gap-2'>
            <h3 className='text-lg font-semibold text-foreground'>
              {schedule.name}
            </h3>
            <Badge variant={totalShare === 10000 ? 'secondary' : 'destructive'}>
              {(totalShare / 100).toFixed(2)}%
            </Badge>
          </div>
          <p className='text-sm text-muted-foreground'>
            Distribute {SETTLEMENT_TOKEN_SYMBOL} according to collaborator
            splits.
          </p>
        </div>
        <div className='flex items-center gap-3'>
          <Input
            placeholder={`Amount in ${SETTLEMENT_TOKEN_SYMBOL}`}
            value={runState.amount}
            onChange={event => onChangeAmount(event.target.value)}
            className='w-40'
          />
          <Button
            type='button'
            onClick={onExecute}
            disabled={runState.pending || totalShare !== 10000}
          >
            {runState.pending ? 'Executing...' : 'Execute payout'}
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-destructive hover:text-destructive'
            onClick={onDelete}
            disabled={isDeleting}
          >
            <Trash2 className='mr-2 h-4 w-4' /> Remove
          </Button>
        </div>
      </div>

      <Separator className='my-5' />

      <div className='space-y-4'>
        <div className='grid gap-3 md:grid-cols-2'>
          {schedule.recipients.map(recipient => (
            <div
              key={`${recipient.address}-${recipient.shareBps}`}
              className='rounded-lg border border-border/50 bg-background/60 p-4'
            >
              <p className='font-mono text-sm text-foreground'>
                {recipient.address}
              </p>
              <p className='text-xs text-muted-foreground'>
                Allocation: {(recipient.shareBps / 100).toFixed(2)}%
              </p>
              {recipient.label ? (
                <p className='text-xs text-muted-foreground'>
                  Label: {recipient.label}
                </p>
              ) : null}
            </div>
          ))}
        </div>

        <div>
          <h4 className='mb-2 text-sm font-medium text-foreground'>
            Execution history
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
      <div className='rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
        <div className='mb-5 space-y-1'>
          <h2 className='text-lg font-semibold text-foreground'>
            Configure recurring payouts
          </h2>
          <p className='text-sm text-muted-foreground'>
            Define collaborator splits, then trigger on-chain transfers in one
            click.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-5'
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

            <div className='flex items-center justify-end'>
              <Button type='submit'>Save schedule</Button>
            </div>
          </form>
        </Form>
      </div>

      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-foreground'>
          Active schedules
        </h2>
        {schedules && schedules.length > 0 ? (
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
            Define payout schedules to automate collaborator revenue splits.
          </div>
        )}
      </div>
    </div>
  )
}
