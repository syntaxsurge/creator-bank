'use client'

import { useMemo, useState } from 'react'

import { useAction, useQuery } from 'convex/react'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import {
  formatSettlementToken,
  parseSettlementTokenAmount
} from '@/lib/settlement-token'

import { PayPageClient } from './pay-page-client'

const CATALOG = [
  {
    id: 'creator-pass',
    name: 'Creator Strategy Session',
    description:
      'One-hour consultation plus accountability notes delivered post-call.',
    price: parseSettlementTokenAmount('149.00')
  },
  {
    id: 'content-pack',
    name: 'Content Kickstart Pack',
    description:
      'Ten ready-to-post scripts and thumbnails tailored to your audience.',
    price: parseSettlementTokenAmount('89.00')
  },
  {
    id: 'memberships-bundle',
    name: 'Community Welcome Bundle',
    description:
      'First-month membership bundle with exclusive merch and onboarding call.',
    price: parseSettlementTokenAmount('129.00')
  }
] as const

type CatalogItem = (typeof CATALOG)[number]

function describePrice(raw: bigint) {
  return formatSettlementToken(raw, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function createInvoiceSlug() {
  const segment = Math.random().toString(36).slice(2, 8)
  return `shop-${Date.now().toString(36)}-${segment}`
}

type CheckoutSession = {
  expectedAmount: string
  invoiceSlug: string
}

export function ShopDemo({ handle }: { handle: string }) {
  const paylink = useQuery(api.paylinks.getByHandle, { handle })
  const syncTransfers = useAction(api.paylinks.syncTransfers)
  const [cart, setCart] = useState<Record<string, number>>({})
  const [session, setSession] = useState<CheckoutSession | null>(null)

  const itemsInCart = useMemo(() => {
    return CATALOG.filter(item => (cart[item.id] ?? 0) > 0)
  }, [cart])

  const subtotalRaw = useMemo(() => {
    return itemsInCart.reduce((total, item) => {
      const quantity = cart[item.id] ?? 0
      return total + item.price * BigInt(quantity)
    }, 0n)
  }, [cart, itemsInCart])

  const subtotalLabel = useMemo(() => describePrice(subtotalRaw), [subtotalRaw])

  const handleAdd = (item: CatalogItem) => {
    setCart(prev => ({
      ...prev,
      [item.id]: (prev[item.id] ?? 0) + 1
    }))
  }

  const handleRemove = (item: CatalogItem) => {
    setCart(prev => {
      const current = prev[item.id] ?? 0
      if (current <= 1) {
        const { [item.id]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [item.id]: current - 1 }
    })
  }

  const beginCheckout = async () => {
    if (!paylink) {
      toast.error('This SatsPay handle is offline.')
      return
    }

    if (subtotalRaw === 0n) {
      toast.error('Add at least one item to your cart.')
      return
    }

    const invoiceSlug = createInvoiceSlug()
    const expectedAmount = subtotalRaw.toString()

    setSession({ invoiceSlug, expectedAmount })

    try {
      await syncTransfers({
        handle,
        invoiceSlug,
        expectedAmount
      })
    } catch (error) {
      console.error('Unable to trigger sync', error)
    }
  }

  const resetSession = () => {
    setSession(null)
  }

  return (
    <div className='space-y-10'>
      <div className='space-y-2'>
        <h1 className='text-3xl font-semibold text-foreground'>
          CreatorBank Shop
        </h1>
        <p className='text-sm text-muted-foreground'>
          Showcase how your community can check out with MUSD. This demo uses
          your SatsPay link to watch the chain for settlement and confirm orders
          live.
        </p>
        <Badge variant='outline'>Handle: @{handle}</Badge>
      </div>

      <div className='grid gap-10 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]'>
        <div className='space-y-6'>
          <div className='rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-foreground'>Catalog</h2>
            <p className='text-xs text-muted-foreground'>
              Add products to stage a live checkout experience for investors or
              judges.
            </p>
            <Separator className='my-5' />
            <div className='space-y-4'>
              {CATALOG.map(item => {
                const quantity = cart[item.id] ?? 0
                return (
                  <div
                    key={item.id}
                    className='flex flex-col gap-3 rounded-xl border border-border/70 bg-background/70 p-4 sm:flex-row sm:items-start sm:justify-between'
                  >
                    <div className='space-y-2'>
                      <p className='text-base font-medium text-foreground'>
                        {item.name}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {item.description}
                      </p>
                      <p className='text-sm font-semibold text-foreground'>
                        {describePrice(item.price)}
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        onClick={() => handleRemove(item)}
                        disabled={quantity === 0}
                      >
                        -
                      </Button>
                      <span className='min-w-[2ch] text-center text-sm font-medium'>
                        {quantity}
                      </span>
                      <Button
                        type='button'
                        variant='secondary'
                        size='sm'
                        onClick={() => handleAdd(item)}
                      >
                        +
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className='rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
            <h2 className='text-lg font-semibold text-foreground'>
              Cart summary
            </h2>
            {itemsInCart.length === 0 ? (
              <p className='mt-3 text-sm text-muted-foreground'>
                Add items to simulate a customer order. Use this in demos to
                showcase how MUSD powers everyday purchases.
              </p>
            ) : (
              <div className='mt-4 space-y-3 text-sm'>
                {itemsInCart.map(item => {
                  const quantity = cart[item.id] ?? 0
                  return (
                    <div
                      key={item.id}
                      className='flex items-center justify-between rounded-lg border border-border/60 bg-background/70 px-3 py-2'
                    >
                      <span>
                        {item.name}{' '}
                        <span className='text-xs text-muted-foreground'>
                          × {quantity}
                        </span>
                      </span>
                      <span className='font-mono text-xs text-foreground'>
                        {describePrice(item.price * BigInt(quantity))}
                      </span>
                    </div>
                  )
                })}
                <Separator className='my-3' />
                <div className='flex items-center justify-between text-sm font-medium text-foreground'>
                  <span>Total</span>
                  <span>{subtotalLabel}</span>
                </div>
                <Button
                  type='button'
                  className='w-full'
                  onClick={beginCheckout}
                >
                  Checkout with MUSD
                </Button>
                {session ? (
                  <Button
                    type='button'
                    variant='ghost'
                    className='w-full'
                    onClick={resetSession}
                  >
                    Reset checkout
                  </Button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className='space-y-6'>
          {!paylink ? (
            <div className='rounded-2xl border border-dashed border-border/70 bg-muted/20 p-10 text-center text-sm text-muted-foreground'>
              This SatsPay handle is not active yet. Create it from your
              Payments dashboard before sharing the shop demo.
            </div>
          ) : null}

          {session && paylink ? (
            <div className='rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
              <h2 className='text-lg font-semibold text-foreground'>
                Payment status
              </h2>
              <p className='text-sm text-muted-foreground'>
                Keep this panel visible during your pitch. Once the chain
                confirms the transfer for{' '}
                {describePrice(BigInt(session.expectedAmount))}, the UI will
                flip to paid automatically.
              </p>
              <Separator className='my-5' />
              <PayPageClient
                handle={handle}
                invoiceSlug={session.invoiceSlug}
                expectedAmount={session.expectedAmount}
              />
            </div>
          ) : (
            <div className='rounded-2xl border border-border bg-card/60 p-6 text-sm text-muted-foreground shadow-sm'>
              <p className='font-medium text-foreground'>
                Live demo instructions
              </p>
              <ul className='mt-3 list-disc space-y-2 pl-5'>
                <li>Connect with Mezo Passport in a second browser tab.</li>
                <li>Bridge BTC and mint MUSD via the Mezo hub.</li>
                <li>Return here, add products, and click checkout.</li>
                <li>
                  Submit the MUSD transfer in your wallet to watch the
                  confirmation flow.
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
