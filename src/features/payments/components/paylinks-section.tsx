'use client'

import { useEffect, useMemo, useState } from 'react'

import { useAction, useMutation, useQuery } from 'convex/react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'

import {
  Copy,
  Loader2,
  Plus,
  RefreshCw,
  Trash2,
  Link2,
  Wallet
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
  onArchive: (paylinkId: Id<'paylinks'>) => Promise<void>
  archiving: boolean
}

function PaylinkCard({
  paylink,
  origin,
  onSync,
  syncing,
  explorerUrl,
  onArchive,
  archiving
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

  const handleArchiveClick = async () => {
    await onArchive(paylink._id)
  }

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
                <Link2 className='h-6 w-6 text-primary' />
              </div>
              <div>
                <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                  Pay Handle
                </p>
                <p className='font-mono text-2xl font-bold text-foreground'>
                  @{paylink.handle}
                </p>
              </div>
            </div>

            {paylink.title ? (
              <h3 className='text-xl font-semibold text-foreground'>
                {paylink.title}
              </h3>
            ) : null}

            {paylink.description ? (
              <p className='max-w-2xl text-sm leading-relaxed text-muted-foreground'>
                {paylink.description}
              </p>
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
                disabled={archiving}
              >
                <Trash2 className='h-4 w-4' />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Remove this pay link?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will remove the pay link "@{paylink.handle}" from your dashboard.
                  Existing payment history will remain intact.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleArchiveClick}
                  className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                >
                  Remove link
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Info Cards */}
        <div className='grid gap-4 sm:grid-cols-2'>
          <div className='rounded-2xl border border-border/40 bg-background/40 p-4 backdrop-blur-sm'>
            <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              <Wallet className='h-3.5 w-3.5' />
              Receiving Address
            </div>
            <p className='mt-2 font-mono text-sm text-foreground'>
              {paylink.receivingAddress}
            </p>
          </div>

          <div className='rounded-2xl border border-border/40 bg-background/40 p-4 backdrop-blur-sm'>
            <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
              <Link2 className='h-3.5 w-3.5' />
              Share Link
            </div>
            <p className='mt-2 break-all font-mono text-sm text-primary'>
              {shareUrl}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className='flex flex-wrap gap-3'>
          <Button
            type='button'
            variant='default'
            size='sm'
            onClick={handleCopy}
            className='gap-2'
          >
            <Copy className='h-4 w-4' />
            Copy link
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={() => onSync(paylink.handle)}
            disabled={syncing}
            className='gap-2'
          >
            <RefreshCw className={cn('h-4 w-4', syncing && 'animate-spin')} />
            {syncing ? 'Syncing...' : 'Sync receipts'}
          </Button>
        </div>

        <Separator className='my-6' />

        {/* Payments List */}
        <div className='space-y-3'>
          <h4 className='text-sm font-semibold text-foreground'>
            Recent Payments
          </h4>
          <PaylinkPaymentsList paylinkId={paylink._id} explorerUrl={explorerUrl} />
        </div>
      </div>
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
  const archivePaylink = useMutation(api.paylinks.archive)
  const syncTransfers = useAction(api.paylinks.syncTransfers)
  const [appOrigin, setAppOrigin] = useState<string | null>(null)
  const [syncingHandle, setSyncingHandle] = useState<string | null>(null)
  const [archivingId, setArchivingId] = useState<Id<'paylinks'> | null>(null)
  const [openCreate, setOpenCreate] = useState(false)

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
      setOpenCreate(false)
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

  const handleArchive = async (paylinkId: Id<'paylinks'>) => {
    if (!address) {
      toast.error('Connect your wallet to manage SatsPay links.')
      return
    }

    try {
      setArchivingId(paylinkId)
      await archivePaylink({ ownerAddress: address, paylinkId })
      toast.success('SatsPay link removed.')
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error ? error.message : 'Unable to remove this link.'
      )
    } finally {
      setArchivingId(null)
    }
  }

  return (
    <div className='space-y-8'>
      <div className='rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <h2 className='text-xl font-semibold text-foreground'>
              SatsPay link studio
            </h2>
            <p className='max-w-2xl text-sm text-muted-foreground'>
              Mint a permanent pay handle for instant MUSD deposits and keep your
              receipts synced as transfers finalize on-chain.
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button type='button' size='sm' className='gap-2'>
                <Plus className='h-4 w-4' />
                Create SatsPay link
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-3xl'>
              <DialogHeader>
                <DialogTitle>Create SatsPay link</DialogTitle>
                <DialogDescription>
                  Reserve a handle and route deposits straight to your connected
                  wallet. All fields are optional except the handle.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className='grid grid-cols-1 gap-4 md:grid-cols-2'
                  autoComplete='off'
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

                  <DialogFooter className='md:col-span-2'>
                    <Button type='submit'>Create link</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className={cn('space-y-6')}>
        {!paylinks ? (
          <div className='flex items-center justify-center gap-3 rounded-2xl border border-border/70 bg-muted/20 p-10 text-sm text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin text-primary' />
            Loading SatsPay links…
          </div>
        ) : paylinks.length > 0 ? (
          paylinks.map(paylink => (
            <PaylinkCard
              key={paylink._id}
              paylink={paylink}
              origin={appOrigin}
              onSync={handleSync}
              syncing={syncingHandle === paylink.handle}
              explorerUrl={explorerUrl}
              onArchive={handleArchive}
              archiving={archivingId === paylink._id}
            />
          ))
        ) : (
          <div className='rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-center text-sm text-muted-foreground'>
            You have not created any SatsPay links yet. Use the Create SatsPay link button to issue your first pay handle.
          </div>
        )}
      </div>
    </div>
  )
}
