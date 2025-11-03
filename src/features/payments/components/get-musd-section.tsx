'use client'

import Link from 'next/link'

import { ArrowUpRight } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { SETTLEMENT_TOKEN_SYMBOL } from '@/lib/config'

const MEZO_TESTNET_BASE_URL = 'https://testnet.mezo.org/'
const MEZO_TESTNET_SWAP_URL = 'https://testnet.mezo.org/swap'
const MEZO_TESTNET_BORROW_URL = 'https://testnet.mezo.org/borrow'

export function GetMusdSection() {
  return (
    <div className='rounded-2xl border border-border/70 bg-background/70 p-6 shadow-sm'>
      <div className='space-y-4'>
        <div className='space-y-2'>
          <h2 className='text-xl font-semibold text-foreground'>
            Get {SETTLEMENT_TOKEN_SYMBOL}
          </h2>
          <p className='mt-2 max-w-2xl text-sm text-muted-foreground'>
            Use the Mezo testnet hub to swap or borrow {SETTLEMENT_TOKEN_SYMBOL}
            before managing invoices, payouts, and save goals in CreatorBank.
            The hub opens in a new tab so you can follow the on-chain flow with
            your connected wallet.
          </p>
          <p className='max-w-2xl text-sm text-muted-foreground'>
            Start from the{' '}
            <Link
              href={MEZO_TESTNET_BASE_URL}
              target='_blank'
              rel='noreferrer noopener'
              className='font-medium text-primary underline underline-offset-4'
            >
              Mezo testnet hub
            </Link>{' '}
            or jump straight into the dedicated swap and borrow experiences
            below.
          </p>
        </div>

        <div className='flex flex-col items-start gap-3 sm:flex-row'>
          <Button asChild>
            <Link
              href={MEZO_TESTNET_SWAP_URL}
              target='_blank'
              rel='noreferrer noopener'
            >
              Swap for {SETTLEMENT_TOKEN_SYMBOL}
              <ArrowUpRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
          <Button asChild variant='outline'>
            <Link
              href={MEZO_TESTNET_BORROW_URL}
              target='_blank'
              rel='noreferrer noopener'
            >
              Borrow {SETTLEMENT_TOKEN_SYMBOL}
              <ArrowUpRight className='ml-2 h-4 w-4' />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
