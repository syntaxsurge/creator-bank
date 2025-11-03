'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { useFieldArray, useForm } from 'react-hook-form'
import { isAddress, keccak256, stringToBytes } from 'viem'
import type { Address } from 'viem'
import { toast } from 'sonner'

import {
  Copy,
  FileText,
  Loader2,
  Plus,
  Send,
  Trash2,
  Calendar,
  User,
  Wallet,
  ExternalLink
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useChainPreference } from '@/hooks/use-chain-preference'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import type { MezoChainId } from '@/lib/config'
import {
  SETTLEMENT_TOKEN_SYMBOL,
  getBlockExplorerUrl,
  getInvoiceRegistryAddress,
  getMusdContractAddress
} from '@/lib/config'
import { InvoiceRegistryService } from '@/lib/onchain/services'
import {
  formatSettlementToken,
  parseSettlementTokenAmount
} from '@/lib/settlement-token'

type InvoiceLineItemFormValues = {
  description: string
  quantity: number
  unitAmount: string
}

type InvoiceFormValues = {
  title?: string
  customerName?: string
  customerEmail?: string
  dueDate?: string
  notes?: string
  paylinkHandle?: string
  payerAddress?: string
  lineItems: InvoiceLineItemFormValues[]
}

function formatDueDate(invoice: Doc<'invoices'>) {
  if (!invoice.dueAt) return 'No due date'
  return new Date(invoice.dueAt).toLocaleDateString()
}

function formatStatus(status: Doc<'invoices'>['status']) {
  switch (status) {
    case 'issued':
      return <Badge variant='outline'>Issued</Badge>
    case 'paid':
      return <Badge variant='secondary'>Paid</Badge>
    default:
      return <Badge variant='outline'>Draft</Badge>
  }
}

function truncateHash(hash: string, front = 8, back = 6) {
  if (hash.length <= front + back + 1) {
    return hash
  }
  return `${hash.slice(0, front)}…${hash.slice(-back)}`
}

function normalizeChainId(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'bigint') {
    return Number(value)
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()
    if (!trimmed) {
      return null
    }
    const parsed = trimmed.startsWith('0x')
      ? Number.parseInt(trimmed, 16)
      : Number(trimmed)
    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

export function InvoicesSection() {
  const { address, publicClient, walletClient } = useWalletAccount()
  const { chainId } = useChainPreference()
  const [origin, setOrigin] = useState<string | null>(null)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOrigin(window.location.origin)
    }
  }, [])

  const invoices = useQuery(
    api.invoices.listForOwner,
    address ? { ownerAddress: address } : 'skip'
  )

  const paylinks = useQuery(
    api.paylinks.listForOwner,
    address ? { ownerAddress: address } : 'skip'
  )

  const createInvoice = useMutation(api.invoices.create)
  const archiveInvoice = useMutation(api.invoices.archive)
  const registerOnchain = useMutation(api.invoices.registerOnchain)
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      title: '',
      customerName: '',
      customerEmail: '',
      dueDate: '',
      notes: '',
      payerAddress: '',
      paylinkHandle: '',
      lineItems: [
        {
          description: '',
          quantity: 1,
          unitAmount: ''
        }
      ]
    }
  })
  const [isSubmitting, setSubmitting] = useState(false)
  const [issuingSlug, setIssuingSlug] = useState<string | null>(null)
  const [archivingSlug, setArchivingSlug] = useState<string | null>(null)
  const [openCreate, setOpenCreate] = useState(false)

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems'
  })

  const musdAddress = useMemo(
    () => getMusdContractAddress(chainId) || '',
    [chainId]
  )
  const registryAddress = useMemo(
    () => getInvoiceRegistryAddress(chainId) || '',
    [chainId]
  )

  const publishInvoiceOnchain = useCallback(
    async (params: {
      slug: string
      number: string
      totalAmount: string
      tokenAddress: string
      payerAddress?: string | null
      chainId: number
    }) => {
      if (!address) {
        throw new Error('Connect your wallet to issue invoices.')
      }

      if (!publicClient || !walletClient) {
        throw new Error('Wallet client unavailable. Reconnect your wallet.')
      }

      const targetChainId = normalizeChainId(params.chainId) as
        | MezoChainId
        | null

      const describeChain = (id: number | null) => {
        if (id === 31611) {
          return 'Mezo Testnet (chain 31611)'
        }
        if (id === null) {
          return 'an unknown network'
        }
        return `chain ${id}`
      }

      const readWalletChainId = async () => {
        if (typeof walletClient.getChainId === 'function') {
          try {
            const detected = await walletClient.getChainId()
            const normalized = normalizeChainId(detected)
            if (normalized !== null) {
              return normalized
            }
          } catch (error) {
            console.warn('[CreatorBank] Unable to read wallet chain id', error)
          }
        }

        return normalizeChainId(walletClient.chain?.id)
      }

      const walletChainId = await readWalletChainId()

      if (
        targetChainId !== null &&
        walletChainId !== null &&
        walletChainId !== targetChainId
      ) {
        throw new Error(
          `Switch your wallet to ${describeChain(
            targetChainId
          )} before issuing. Detected ${describeChain(walletChainId)} instead.`
        )
      }

      const resolvedTargetChainId =
        targetChainId ?? (params.chainId as MezoChainId)
      const resolvedRegistryAddress =
        getInvoiceRegistryAddress(resolvedTargetChainId) || registryAddress

      if (!resolvedRegistryAddress) {
        throw new Error('Invoice registry contract address is not configured.')
      }

      setIssuingSlug(params.slug)

      try {
        const registryService = new InvoiceRegistryService({
          publicClient,
          walletClient,
          account: address as `0x${string}`,
          address: resolvedRegistryAddress as `0x${string}`
        })

        const referenceHash = keccak256(stringToBytes(params.slug))
        const payer = params.payerAddress && isAddress(params.payerAddress)
          ? (params.payerAddress as Address)
          : undefined

        const { hash, invoiceId } = await registryService.issueInvoice({
          payer,
          token: params.tokenAddress as `0x${string}`,
          amount: BigInt(params.totalAmount),
          referenceHash
        })

        await registerOnchain({
          ownerAddress: address,
          slug: params.slug,
          registryAddress: resolvedRegistryAddress,
          registryInvoiceId: invoiceId.toString(),
          referenceHash,
          txHash: hash
        })

        return { invoiceId, referenceHash, hash }
      } finally {
        setIssuingSlug(null)
      }
    },
    [
      address,
      publicClient,
      walletClient,
      registryAddress,
      registerOnchain
    ]
  )

  const handleSubmit = async (values: InvoiceFormValues) => {
    if (!address) {
      toast.error('Connect your wallet to issue invoices.')
      return
    }

    if (!musdAddress) {
      toast.error('Settlement token configuration missing. Contact support.')
      return
    }

    const payerAddressInput = values.payerAddress?.trim()
    if (payerAddressInput && !isAddress(payerAddressInput)) {
      toast.error('Enter a valid payer wallet address or leave it blank.')
      return
    }

    const sanitizedLineItems = values.lineItems
      .map(item => ({
        description: item.description.trim(),
        quantity: Math.max(0, Math.floor(Number(item.quantity) || 0)),
        unitAmount: parseSettlementTokenAmount(
          item.unitAmount ?? '0'
        ).toString()
      }))
      .filter(item => item.description && item.quantity > 0)

    if (sanitizedLineItems.length === 0) {
      toast.error(
        'Add at least one line item with a quantity greater than zero.'
      )
      return
    }

    const dueAt =
      values.dueDate && values.dueDate.length > 0
        ? new Date(values.dueDate).getTime()
        : undefined

    let created:
      | {
          slug: string
          number: string
          totalAmount: string
        }
      | null = null

    try {
      setSubmitting(true)
      created = await createInvoice({
        ownerAddress: address,
        title: values.title?.trim(),
        customerName: values.customerName?.trim(),
        customerEmail: values.customerEmail?.trim(),
        dueAt,
        notes: values.notes?.trim(),
        paylinkHandle: values.paylinkHandle
          ? values.paylinkHandle.trim().replace(/^@/, '')
          : undefined,
        payerAddress: payerAddressInput,
        lineItems: sanitizedLineItems,
        tokenAddress: musdAddress,
        chainId
      })

      form.reset({
        title: '',
        customerName: '',
        customerEmail: '',
        dueDate: '',
        notes: '',
        payerAddress: '',
        paylinkHandle: '',
        lineItems: [
          {
            description: '',
            quantity: 1,
            unitAmount: ''
          }
        ]
      })
      setOpenCreate(false)

      const publishResult = await publishInvoiceOnchain({
        slug: created.slug,
        number: created.number,
        totalAmount: created.totalAmount,
        tokenAddress: musdAddress,
        payerAddress: payerAddressInput,
        chainId
      })

      toast.success(`Invoice ${created.number} issued on-chain.`, {
        description: publishResult.hash
      })
    } catch (error) {
      console.error(error)
      if (!created) {
        toast.error(
          error instanceof Error
            ? error.message
            : 'Unable to create invoice. Please try again.'
        )
      } else {
        toast.warning(
          'Invoice saved as draft. Issue it on-chain from the list once your wallet is ready.',
          {
            description:
              error instanceof Error ? error.message : undefined
          }
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  const invoiceShareUrl = (invoice: Doc<'invoices'>) => {
    if (!invoice.paylinkHandle) return null
    const base = origin ?? ''
    const relative = `/pay/${invoice.paylinkHandle}?invoice=${invoice.slug}&amount=${invoice.totalAmount}`
    return base ? `${base}${relative}` : relative
  }

  const handleCopyShare = async (invoice: Doc<'invoices'>) => {
    const url = invoiceShareUrl(invoice)
    if (!url) {
      toast.info('Attach a SatsPay link to share this invoice.')
      return
    }

    try {
      await navigator.clipboard.writeText(url)
      toast.success('Invoice payment link copied.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to copy link right now.')
    }
  }

  const handleIssueDraft = useCallback(
    async (invoice: Doc<'invoices'>) => {
      try {
        const publishResult = await publishInvoiceOnchain({
          slug: invoice.slug,
          number: invoice.number,
          totalAmount: invoice.totalAmount,
          tokenAddress: invoice.tokenAddress,
          payerAddress: invoice.payerAddress ?? undefined,
          chainId: invoice.chainId
        })

        toast.success(`Invoice ${invoice.number} issued on-chain.`, {
          description: publishResult.hash
        })
      } catch (error) {
        console.error(error)
        toast.error('Unable to publish invoice on-chain.', {
          description: error instanceof Error ? error.message : undefined
        })
      }
    },
    [publishInvoiceOnchain]
  )

  const handleArchiveInvoice = useCallback(
    async (invoice: Doc<'invoices'>) => {
      if (!address) {
        toast.error('Connect your wallet to manage invoices.')
        return
      }

      if (invoice.status === 'paid') {
        toast.error('Paid invoices cannot be archived.')
        return
      }

      try {
        setArchivingSlug(invoice.slug)
        await archiveInvoice({ ownerAddress: address, slug: invoice.slug })
        toast.success('Invoice archived.')
      } catch (error) {
        console.error(error)
        toast.error(
          error instanceof Error
            ? error.message
            : 'Unable to archive this invoice. Please try again.'
        )
      } finally {
        setArchivingSlug(null)
      }
    },
    [address, archiveInvoice]
  )

  return (
    <div className='space-y-8'>
      <div className='rounded-2xl border border-border/80 bg-card/80 p-6 shadow-sm'>
        <div className='flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between'>
          <div className='space-y-2'>
            <h2 className='text-xl font-semibold text-foreground'>
              Invoice studio
            </h2>
            <p className='max-w-2xl text-sm text-muted-foreground'>
              Price work in {SETTLEMENT_TOKEN_SYMBOL}, link client payments to SatsPay,
              and push invoices on-chain with a single flow.
            </p>
          </div>
          <Dialog open={openCreate} onOpenChange={setOpenCreate}>
            <DialogTrigger asChild>
              <Button type='button' size='sm' className='gap-2'>
                <Plus className='h-4 w-4' />
                Issue invoice
              </Button>
            </DialogTrigger>
            <DialogContent className='max-w-4xl'>
              <DialogHeader>
                <DialogTitle>Issue invoice</DialogTitle>
                <DialogDescription>
                  Configure line items, link a SatsPay handle, and optionally lock a
                  payer wallet before publishing on-chain.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className='grid grid-cols-1 gap-4 md:grid-cols-2'
                  autoComplete='off'
                >
                  <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Invoice title</FormLabel>
                        <FormControl>
                          <Input placeholder='Monthly retainer' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='paylinkHandle'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paylink handle</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Use an existing @handle'
                            list='paylink-options'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          SatsPay handle that will receive payment. Leave blank to
                          attach later.
                        </FormDescription>
                        <FormMessage />
                        <datalist id='paylink-options'>
                          {(paylinks ?? []).map(link => (
                            <option key={link._id} value={`@${link.handle}`}>
                              {link.title ?? `@${link.handle}`}
                            </option>
                          ))}
                        </datalist>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='customerName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer name</FormLabel>
                        <FormControl>
                          <Input placeholder='Client or organization' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='customerEmail'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer email</FormLabel>
                        <FormControl>
                          <Input placeholder='Optional contact email' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='payerAddress'
                    rules={{
                      validate: value =>
                        !value || value.trim() === '' || isAddress(value.trim())
                          ? true
                          : 'Enter a valid EVM address'
                    }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Payer wallet (optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder='Restrict payment to a wallet address'
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Leave blank to accept payment from any wallet. The
                          registry enforces this address when provided.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='dueDate'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Due date</FormLabel>
                        <FormControl>
                          <Input type='date' {...field} />
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
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder='Optional footer or memo'
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className='space-y-4 md:col-span-2'>
                    <div className='flex items-center justify-between'>
                      <h3 className='text-sm font-medium text-foreground'>
                        Line items
                      </h3>
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={() =>
                          append({ description: '', quantity: 1, unitAmount: '' })
                        }
                      >
                        Add line item
                      </Button>
                    </div>

                    <div className='space-y-4'>
                      {fields.map((field, index) => (
                        <div
                          key={field.id}
                          className='rounded-xl border border-border/70 bg-background/80 p-4 shadow-sm'
                        >
                          <div className='grid grid-cols-1 gap-3 md:grid-cols-6'>
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.description`}
                              render={({ field: fieldItem }) => (
                                <FormItem className='md:col-span-3'>
                                  <FormLabel>Description</FormLabel>
                                  <FormControl>
                                    <Input
                                      placeholder='Describe the service'
                                      {...fieldItem}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.quantity`}
                              render={({ field: fieldItem }) => (
                                <FormItem className='md:col-span-1'>
                                  <FormLabel>Qty</FormLabel>
                                  <FormControl>
                                    <Input
                                      type='number'
                                      min={1}
                                      step={1}
                                      {...fieldItem}
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`lineItems.${index}.unitAmount`}
                              render={({ field: fieldItem }) => (
                                <FormItem className='md:col-span-2'>
                                  <FormLabel>
                                    Unit price ({SETTLEMENT_TOKEN_SYMBOL})
                                  </FormLabel>
                                  <FormControl>
                                    <Input placeholder='0.00' {...fieldItem} />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                          <div className='mt-3 flex justify-end'>
                            {fields.length > 1 ? (
                              <Button
                                type='button'
                                variant='ghost'
                                size='sm'
                                onClick={() => remove(index)}
                              >
                                Remove item
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <DialogFooter className='md:col-span-2'>
                    <Button type='submit' disabled={isSubmitting}>
                      {isSubmitting ? 'Issuing invoice…' : 'Issue invoice'}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className='space-y-6'>
        <h2 className='text-2xl font-bold text-foreground'>
          Recent Invoices
        </h2>
        {!invoices ? (
          <div className='flex items-center justify-center gap-3 rounded-3xl border border-border/70 bg-muted/20 p-12 text-sm text-muted-foreground'>
            <Loader2 className='h-5 w-5 animate-spin text-primary' />
            Loading invoices…
          </div>
        ) : invoices.length > 0 ? (
          <div className='space-y-6'>
            {invoices.map(invoice => {
              const total = formatSettlementToken(BigInt(invoice.totalAmount))
              const shareUrl = invoiceShareUrl(invoice)
              const isDraft = invoice.status === 'draft'
              const issuingThis = issuingSlug === invoice.slug
              const archivingThis = archivingSlug === invoice.slug
              const explorerBaseUrl = getBlockExplorerUrl(
                invoice.chainId as MezoChainId
              )
              const issuanceExplorerUrl =
                invoice.issuanceTxHash && explorerBaseUrl
                  ? `${explorerBaseUrl}/tx/${invoice.issuanceTxHash}`
                  : null

              return (
                <div
                  key={invoice._id}
                  className='group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 shadow-lg backdrop-blur-sm transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5'
                >
                  {/* Decorative gradient orb */}
                  <div className='pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-gradient-to-br from-primary/10 to-accent/5 blur-3xl transition-all group-hover:scale-125' />

                  <div className='relative space-y-6'>
                    {/* Header Section */}
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex-1 space-y-3'>
                        <div className='flex items-center gap-3'>
                          <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary/20 to-accent/10 ring-1 ring-primary/20'>
                            <FileText className='h-6 w-6 text-primary' />
                          </div>
                          <div>
                            <div className='flex items-center gap-2'>
                              <p className='font-mono text-xl font-bold text-foreground'>
                                {invoice.number}
                              </p>
                              {formatStatus(invoice.status)}
                            </div>
                            {invoice.title ? (
                              <p className='text-sm text-muted-foreground'>
                                {invoice.title}
                              </p>
                            ) : null}
                          </div>
                        </div>
                      </div>

                      {/* Amount Badge */}
                      <div className='rounded-2xl border border-primary/20 bg-primary/10 px-6 py-3 text-center backdrop-blur-sm'>
                        <p className='text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                          Total Amount
                        </p>
                        <p className='mt-1 bg-gradient-to-r from-primary to-accent bg-clip-text text-3xl font-bold text-transparent'>
                          {total}
                        </p>
                      </div>
                    </div>

                    {/* Info Grid */}
                    <div className='grid gap-4 sm:grid-cols-3'>
                      <div className='rounded-2xl border border-border/40 bg-background/40 p-4 backdrop-blur-sm'>
                        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                          <User className='h-3.5 w-3.5' />
                          Customer
                        </div>
                        <p className='mt-2 text-sm font-medium text-foreground'>
                          {invoice.customerName ?? 'No customer name'}
                        </p>
                      </div>

                      <div className='rounded-2xl border border-border/40 bg-background/40 p-4 backdrop-blur-sm'>
                        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                          <Calendar className='h-3.5 w-3.5' />
                          Due Date
                        </div>
                        <p className='mt-2 text-sm font-medium text-foreground'>
                          {formatDueDate(invoice)}
                        </p>
                      </div>

                      <div className='rounded-2xl border border-border/40 bg-background/40 p-4 backdrop-blur-sm'>
                        <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                          <Wallet className='h-3.5 w-3.5' />
                          Pay Handle
                        </div>
                        <p className='mt-2 font-mono text-sm font-medium text-primary'>
                          {invoice.paylinkHandle
                            ? `@${invoice.paylinkHandle}`
                            : 'Not attached'}
                        </p>
                      </div>

                      {invoice.issuanceTxHash ? (
                        <div className='rounded-2xl border border-border/40 bg-background/40 p-4 backdrop-blur-sm'>
                          <div className='flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground'>
                            <ExternalLink className='h-3.5 w-3.5' />
                            On-chain proof
                          </div>
                          <p
                            className='mt-2 break-all font-mono text-xs font-medium text-foreground'
                            title={invoice.issuanceTxHash}
                          >
                            {truncateHash(invoice.issuanceTxHash)}
                          </p>
                          {issuanceExplorerUrl ? (
                            <a
                              href={issuanceExplorerUrl}
                              target='_blank'
                              rel='noreferrer'
                              className='mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary underline-offset-4 hover:underline'
                            >
                              View on explorer
                              <ExternalLink className='h-3 w-3' />
                            </a>
                          ) : null}
                        </div>
                      ) : null}
                    </div>

                    {/* Action Buttons */}
                    <div className='flex flex-wrap items-center gap-3'>
                      {isDraft ? (
                        <Button
                          type='button'
                          size='sm'
                          onClick={() => handleIssueDraft(invoice)}
                          disabled={issuingThis || isSubmitting}
                          className='gap-2'
                        >
                          <Send className='h-4 w-4' />
                          {issuingThis ? 'Publishing…' : 'Issue on-chain'}
                        </Button>
                      ) : null}
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        disabled={!shareUrl}
                        onClick={() => handleCopyShare(invoice)}
                        className='gap-2'
                      >
                        <Copy className='h-4 w-4' />
                        Copy payment link
                      </Button>

                      {/* Delete Button with AlertDialog */}
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            className='gap-2 text-muted-foreground hover:text-destructive'
                            disabled={invoice.status === 'paid' || archivingThis}
                          >
                            <Trash2 className='h-4 w-4' />
                            Archive
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Archive this invoice?</AlertDialogTitle>
                            <AlertDialogDescription>
                              This will archive invoice "{invoice.number}" and hide it from your
                              dashboard. On-chain records will remain intact.
                              {invoice.status === 'paid' && (
                                <span className='mt-2 block font-semibold text-destructive'>
                                  Paid invoices cannot be archived.
                                </span>
                              )}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleArchiveInvoice(invoice)}
                              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
                            >
                              Archive invoice
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='rounded-3xl border border-dashed border-border/70 bg-muted/30 p-12 text-center'>
            <p className='text-base text-muted-foreground'>
              Use the Issue invoice button above to populate this list with your first record.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
