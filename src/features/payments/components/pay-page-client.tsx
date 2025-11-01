'use client'

import { useEffect, useMemo } from 'react'

import { useAction, useQuery } from 'convex/react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { formatSettlementToken } from '@/lib/settlement-token'

type PayPageClientProps = {
  handle: string
  invoiceSlug?: string
  expectedAmount?: string
}

function formatInvoiceStatus(invoice: Doc<'invoices'> | null | undefined) {
  if (!invoice) return null
  switch (invoice.status) {
    case 'paid':
      return <Badge variant='secondary'>Paid</Badge>
    case 'issued':
      return <Badge variant='outline'>Awaiting payment</Badge>
    default:
      return <Badge variant='outline'>Draft</Badge>
  }
}

function describeExpectedAmount(
  invoice: Doc<'invoices'> | null | undefined,
  expectedAmount?: string
) {
  if (invoice) {
    return formatSettlementToken(BigInt(invoice.totalAmount))
  }
  if (expectedAmount) {
    return formatSettlementToken(BigInt(expectedAmount))
  }
  return null
}

export function PayPageClient({
  handle,
  invoiceSlug,
  expectedAmount
}: PayPageClientProps) {
  const paylink = useQuery(api.paylinks.getByHandle, { handle })
  const invoice = useQuery(
    api.invoices.getBySlug,
    invoiceSlug ? { slug: invoiceSlug } : 'skip'
  )
  const payments = useQuery(
    api.paylinks.paymentsForPaylink,
    paylink ? { paylinkId: paylink._id } : 'skip'
  )

  const syncTransfers = useAction(api.paylinks.syncTransfers)

  useEffect(() => {
    if (!paylink) return

    const runSync = async () => {
      try {
        await syncTransfers({
          handle,
          invoiceSlug: invoiceSlug ?? undefined,
          expectedAmount: invoice?.totalAmount ?? expectedAmount ?? undefined
        })
      } catch (error) {
        console.error('Unable to sync payments', error)
      }
    }

    runSync()
    const interval = setInterval(runSync, 20000)
    return () => clearInterval(interval)
  }, [
    expectedAmount,
    handle,
    invoice?.totalAmount,
    invoiceSlug,
    paylink,
    syncTransfers
  ])

  const expectedAmountDescription = useMemo(
    () => describeExpectedAmount(invoice, expectedAmount),
    [expectedAmount, invoice]
  )

  const paymentDetected = useMemo(() => {
    if (!payments || payments.length === 0) return false
    if (invoiceSlug) {
      return payments.some(payment => payment.invoiceSlug === invoiceSlug)
    }
    if (expectedAmount) {
      return payments.some(payment => payment.amount === expectedAmount)
    }
    return payments.length > 0
  }, [expectedAmount, invoiceSlug, payments])

  const handleCopyAddress = async () => {
    if (!paylink) return
    try {
      await navigator.clipboard.writeText(paylink.receivingAddress)
      toast.success('Address copied to clipboard.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to copy address right now.')
    }
  }

  if (!paylink) {
    return (
      <div className='rounded-2xl border border-dashed border-border/70 bg-muted/20 p-10 text-center text-sm text-muted-foreground'>
        This pay handle is not available. Confirm the URL with the recipient.
      </div>
    )
  }

  return (
    <div className='space-y-6 rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-foreground'>
            Pay @{paylink.handle}
          </h1>
          {paylink.title ? (
            <p className='text-sm text-muted-foreground'>{paylink.title}</p>
          ) : null}
        </div>
        {invoice ? formatInvoiceStatus(invoice) : null}
      </div>

      {paylink.description ? (
        <p className='text-sm text-muted-foreground'>{paylink.description}</p>
      ) : null}

      <div className='rounded-xl border border-border/70 bg-background/70 p-5'>
        <p className='text-xs uppercase tracking-wide text-muted-foreground'>
          Send {expectedAmountDescription ?? 'your chosen amount'}
        </p>
        <p className='mt-3 text-base text-foreground'>
          Transfer MUSD on Mezo to the address below. Once the transaction
          finalizes this page will recognize the payment automatically.
        </p>
        <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
          <div>
            <p className='text-xs text-muted-foreground'>Receiving address</p>
            <p className='font-mono text-sm text-foreground'>
              {paylink.receivingAddress}
            </p>
          </div>
          <Button
            type='button'
            variant='outline'
            onClick={handleCopyAddress}
            className='self-start sm:self-auto'
          >
            Copy address
          </Button>
        </div>
      </div>

      <Separator />

      <div className='space-y-3'>
        <h2 className='text-sm font-medium text-foreground'>Payment status</h2>
        {invoice ? (
          <div className='rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground'>
            <p>
              Invoice {invoice.number}{' '}
              {invoice.status === 'paid'
                ? 'has been settled. Thank you!'
                : 'is pending payment.'}
            </p>
            {invoice.status !== 'paid' && expectedAmountDescription ? (
              <p className='mt-1'>
                Amount due:{' '}
                <span className='font-semibold text-foreground'>
                  {expectedAmountDescription}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
        <div className='rounded-xl border border-border/60 bg-background/70 p-4 text-sm'>
          {paymentDetected ? (
            <p className='font-medium text-foreground'>
              Payment detected. You can close this tab once the recipient
              confirms receipt.
            </p>
          ) : (
            <p className='text-muted-foreground'>
              Waiting for an on-chain transfer to arrive. Keep this page open or
              refresh after submitting your transaction.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
