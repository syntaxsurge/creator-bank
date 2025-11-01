'use client'

import { useMemo } from 'react'

import { PayPageClient } from '@/features/payments/components/pay-page-client'

type PayPageProps = {
  params: {
    handle: string
  }
  searchParams: {
    invoice?: string
    amount?: string
  }
}

export default function PayHandlePage({ params, searchParams }: PayPageProps) {
  const normalizedHandle = useMemo(() => {
    return decodeURIComponent(params.handle ?? '').replace(/^@/, '')
  }, [params.handle])

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10'>
      <PayPageClient
        handle={normalizedHandle}
        invoiceSlug={searchParams.invoice}
        expectedAmount={searchParams.amount}
      />
    </div>
  )
}
