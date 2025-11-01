'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAction, useMutation, useQuery } from 'convex/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

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
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { PaylinkPaymentsList } from '@/features/payments/components/paylink-payments-list'
import { useChainPreference } from '@/hooks/use-chain-preference'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import { SETTLEMENT_TOKEN_SYMBOL, getMusdContractAddress } from '@/lib/config'
import { cn } from '@/lib/utils'

type PaylinkFormValues = {
  handle: string
  title?: string
  description?: string
}

type PaylinkCardProps = {
  paylink: {
    _id: Id<'paylinks'>
    handle: string
    title?: string | null
    description?: string | null
    receivingAddress: string
    tokenAddress: string
    chainId: number
  }
  origin: string | null
  onSync: (handle: string) => Promise<void>
  syncing: boolean
  explorerUrl: string
}

function PaylinkCard({
  paylink,
  origin,
  onSync,
  syncing,
  explorerUrl
}: PaylinkCardProps) {
  const shareUrl = useMemo(() => {
    if (!origin) return `/pay/${paylink.handle}`
    return `${origin}/pay/${paylink.handle}`
  }, [origin, paylink.handle])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      toast.success('Link copied to clipboard')
    } catch (error) {
      console.error(error)
      toast.error('Unable to copy link right now.')
    }
  }

  return (
    <div className='rounded-2xl border border-border bg-card/70 p-6 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
        <div className='space-y-2'>
          <div>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>
              Handle
            </p>
            <p className='font-mono text-lg text-foreground'>
              @{paylink.handle}
            </p>
          </div>
          {paylink.title ? (
            <p className='text-base font-medium text-foreground'>
              {paylink.title}
            </p>
          ) : null}
          {paylink.description ? (
            <p className='max-w-xl text-sm text-muted-foreground'>
              {paylink.description}
            </p>
          ) : null}
          <div>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>
              Receiving address
            </p>
            <p className='font-mono text-sm text-foreground'>
              {paylink.receivingAddress}
            </p>
          </div>
          <div className='flex flex-col gap-2 sm:flex-row sm:items-center'>
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={handleCopy}
            >
              Copy pay link
            </Button>
            <span className='text-xs text-muted-foreground'>
              Share the link above to accept direct {SETTLEMENT_TOKEN_SYMBOL}{' '}
              payments.
            </span>
          </div>
        </div>
        <Button
          type='button'
          variant='secondary'
          size='sm'
          className='self-end sm:self-start'
          onClick={() => onSync(paylink.handle)}
          disabled={syncing}
        >
          {syncing ? 'Syncing...' : 'Sync receipts'}
        </Button>
      </div>

      <Separator className='my-6' />

      <PaylinkPaymentsList paylinkId={paylink._id} explorerUrl={explorerUrl} />
    </div>
  )
}

export function PaylinksSection() {
  const form = useForm<PaylinkFormValues>({
    defaultValues: {
      handle: '',
      title: '',
      description: ''
    }
  })

  const { address } = useWalletAccount()
  const { chainId, explorerUrl } = useChainPreference()
  const paylinks = useQuery(
    api.paylinks.listForOwner,
    address ? { ownerAddress: address } : 'skip'
  )

  const createPaylink = useMutation(api.paylinks.create)
  const syncTransfers = useAction(api.paylinks.syncTransfers)
  const [appOrigin, setAppOrigin] = useState<string | null>(null)
  const [syncingHandle, setSyncingHandle] = useState<string | null>(null)

  const musdAddress = useMemo(
    () => getMusdContractAddress(chainId) || '',
    [chainId]
  )

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setAppOrigin(window.location.origin)
    }
  }, [])

  const onSubmit = async (values: PaylinkFormValues) => {
    if (!address) {
      toast.error('Connect your wallet before creating a SatsPay link.')
      return
    }

    if (!musdAddress) {
      toast.error('Settlement token configuration missing. Contact support.')
      return
    }

    try {
      await createPaylink({
        ownerAddress: address,
        handle: values.handle.trim().replace(/^@/, ''),
        title: values.title?.trim(),
        description: values.description?.trim(),
        chainId,
        tokenAddress: musdAddress
      })

      toast.success('SatsPay link created.')
      form.reset()
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to create SatsPay link. Please try again.'
      )
    }
  }

  const handleSync = async (handle: string) => {
    setSyncingHandle(handle)

    try {
      await syncTransfers({ handle })
      toast.success('Receipts synced')
    } catch (error) {
      console.error(error)
      toast.error('Unable to sync payments. Please retry shortly.')
    } finally {
      setSyncingHandle(null)
    }
  }

  return (
    <div className='space-y-8'>
      <div className='rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
        <div className='mb-5 space-y-1'>
          <h2 className='text-lg font-semibold text-foreground'>
            Create a SatsPay link
          </h2>
          <p className='text-sm text-muted-foreground'>
            Mint a permanent pay handle for instant MUSD deposits. Drop it into{' '}
            <span className='font-medium text-foreground'>
              /pay/&lt;handle&gt;
            </span>{' '}
            and the live{' '}
            <span className='font-medium text-foreground'>
              /shop/&lt;handle&gt;
            </span>{' '}
            demo to showcase daily Bitcoin utility during pitches.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className='grid grid-cols-1 gap-4 md:grid-cols-2'
          >
            <FormField
              control={form.control}
              name='handle'
              rules={{
                required: 'Handle is required',
                minLength: {
                  value: 3,
                  message: 'Minimum length is 3 characters'
                }
              }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Handle</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='creator-name'
                      {...field}
                      className='font-mono'
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Income stream name (optional)'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem className='md:col-span-2'>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Share context for contributors or clients.'
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className='flex items-center justify-end md:col-span-2'>
              <Button type='submit'>Create link</Button>
            </div>
          </form>
        </Form>
      </div>

      <div className={cn('space-y-6')}>
        {paylinks && paylinks.length > 0 ? (
          paylinks.map(paylink => (
            <PaylinkCard
              key={paylink._id}
              paylink={paylink}
              origin={appOrigin}
              onSync={handleSync}
              syncing={syncingHandle === paylink.handle}
              explorerUrl={explorerUrl}
            />
          ))
        ) : (
          <div className='rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-center text-sm text-muted-foreground'>
            You have not created any SatsPay links yet. Use the form above to
            issue your first pay handle.
          </div>
        )}
      </div>
    </div>
  )
}
