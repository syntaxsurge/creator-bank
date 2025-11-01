'use client'

import { useEffect, useMemo, useState } from 'react'

import { useMutation, useQuery } from 'convex/react'
import { useFieldArray, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
import { SETTLEMENT_TOKEN_SYMBOL, getMusdContractAddress } from '@/lib/config'
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

export function InvoicesSection() {
  const { address } = useWalletAccount()
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
  const form = useForm<InvoiceFormValues>({
    defaultValues: {
      title: '',
      customerName: '',
      customerEmail: '',
      dueDate: '',
      notes: '',
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

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lineItems'
  })

  const musdAddress = useMemo(
    () => getMusdContractAddress(chainId) || '',
    [chainId]
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

    try {
      const result = await createInvoice({
        ownerAddress: address,
        title: values.title?.trim(),
        customerName: values.customerName?.trim(),
        customerEmail: values.customerEmail?.trim(),
        dueAt,
        notes: values.notes?.trim(),
        paylinkHandle: values.paylinkHandle
          ? values.paylinkHandle.trim().replace(/^@/, '')
          : undefined,
        lineItems: sanitizedLineItems,
        tokenAddress: musdAddress,
        chainId
      })

      toast.success(`Invoice ${result.number} issued.`)
      form.reset({
        title: '',
        customerName: '',
        customerEmail: '',
        dueDate: '',
        notes: '',
        paylinkHandle: '',
        lineItems: [
          {
            description: '',
            quantity: 1,
            unitAmount: ''
          }
        ]
      })
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to create invoice. Please try again.'
      )
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

  return (
    <div className='space-y-8'>
      <div className='rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
        <div className='mb-5 space-y-1'>
          <h2 className='text-lg font-semibold text-foreground'>
            Generate an on-chain invoice
          </h2>
          <p className='text-sm text-muted-foreground'>
            Each invoice is priced in {SETTLEMENT_TOKEN_SYMBOL} and links
            directly to your selected SatsPay handle.
          </p>
        </div>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='grid grid-cols-1 gap-4 md:grid-cols-2'
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

            <div className='flex items-center justify-end md:col-span-2'>
              <Button type='submit'>Issue invoice</Button>
            </div>
          </form>
        </Form>
      </div>

      <div className='space-y-4'>
        <h2 className='text-lg font-semibold text-foreground'>
          Recent invoices
        </h2>
        {invoices && invoices.length > 0 ? (
          <div className='space-y-4'>
            {invoices.map(invoice => {
              const total = formatSettlementToken(BigInt(invoice.totalAmount))
              const shareUrl = invoiceShareUrl(invoice)

              return (
                <div
                  key={invoice._id}
                  className='rounded-2xl border border-border bg-card/60 p-5 shadow-sm'
                >
                  <div className='flex flex-col gap-4 md:flex-row md:items-start md:justify-between'>
                    <div className='space-y-1.5'>
                      <div className='flex items-center gap-2'>
                        <p className='text-sm font-medium text-foreground'>
                          {invoice.number}
                        </p>
                        {formatStatus(invoice.status)}
                      </div>
                      {invoice.title ? (
                        <p className='text-base font-semibold text-foreground'>
                          {invoice.title}
                        </p>
                      ) : null}
                      <p className='text-sm text-muted-foreground'>
                        {invoice.customerName ?? 'No customer name provided'}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Due {formatDueDate(invoice)}
                      </p>
                    </div>
                    <div className='text-right'>
                      <p className='text-lg font-semibold text-foreground'>
                        {total}
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        {invoice.paylinkHandle
                          ? `@${invoice.paylinkHandle}`
                          : 'No paylink attached'}
                      </p>
                    </div>
                  </div>
                  <Separator className='my-4' />
                  <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
                    <div className='text-xs text-muted-foreground'>
                      {shareUrl
                        ? shareUrl
                        : 'Attach a SatsPay handle to generate a link.'}
                    </div>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={() => handleCopyShare(invoice)}
                    >
                      Copy payment link
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className='rounded-2xl border border-dashed border-border/70 bg-muted/30 p-10 text-center text-sm text-muted-foreground'>
            Issue your first invoice to populate this list.
          </div>
        )}
      </div>
    </div>
  )
}
