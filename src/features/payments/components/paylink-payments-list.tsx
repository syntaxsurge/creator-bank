'use client'

import { useMemo } from 'react'

import { useQuery } from 'convex/react'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Id } from '@/convex/_generated/dataModel'
import { formatSettlementToken } from '@/lib/settlement-token'

type PaylinkPaymentsListProps = {
  paylinkId: Id<'paylinks'>
  explorerUrl?: string
}

function formatTimestamp(timestamp: number) {
  const date = new Date(timestamp)
  return date.toLocaleString()
}

export function PaylinkPaymentsList({
  paylinkId,
  explorerUrl
}: PaylinkPaymentsListProps) {
  const payments = useQuery(api.paylinks.paymentsForPaylink, { paylinkId })

  const emptyState = useMemo(
    () => !payments || payments.length === 0,
    [payments]
  )

  if (emptyState) {
    return (
      <div className='rounded-xl border border-dashed border-border/60 bg-muted/40 p-6 text-sm text-muted-foreground'>
        No MUSD receipts have been detected for this link yet.
      </div>
    )
  }

  return (
    <div className='space-y-4'>
      {payments?.map(payment => {
        const amount = formatSettlementToken(BigInt(payment.amount))
        const timestamp = formatTimestamp(payment.detectedAt)
        const txUrl =
          explorerUrl && payment.txHash
            ? `${explorerUrl.replace(/\/$/, '')}/tx/${payment.txHash}`
            : null

        return (
          <div
            key={payment.txHash}
            className='rounded-xl border border-border bg-card/40 p-5 shadow-sm'
          >
            <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
              <div className='space-y-1.5'>
                <p className='text-sm font-medium text-muted-foreground'>
                  Received from
                </p>
                <p className='font-mono text-sm text-foreground'>
                  {payment.sender}
                </p>
              </div>
              <div className='text-right'>
                <p className='text-lg font-semibold text-foreground'>
                  {amount}
                </p>
                <p className='text-xs text-muted-foreground'>{timestamp}</p>
              </div>
            </div>

            <Separator className='my-4' />

            <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div className='flex flex-wrap items-center gap-2'>
                <Badge variant='outline'>
                  Block #{payment.blockNumber.toLocaleString()}
                </Badge>
                {payment.invoiceSlug ? (
                  <Badge variant='secondary'>
                    Invoice {payment.invoiceSlug.split('-').at(-1)}
                  </Badge>
                ) : null}
              </div>
              {txUrl ? (
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    window.open(txUrl, '_blank', 'noopener,noreferrer')
                  }}
                >
                  View transaction
                </Button>
              ) : null}
            </div>
          </div>
        )
      })}
    </div>
  )
}
