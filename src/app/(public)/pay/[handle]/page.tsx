import { PayPageClient } from '@/features/payments/components/pay-page-client'

type PayPageProps = {
  params?: Promise<{
    handle?: string
  }>
  searchParams?: Promise<{
    invoice?: string
    amount?: string
  }>
}

export default async function PayHandlePage({
  params,
  searchParams
}: PayPageProps) {
  const resolvedParams = await (
    params ?? Promise.resolve<{ handle?: string }>({})
  )
  const resolvedSearchParams = await (
    searchParams ?? Promise.resolve<{ invoice?: string; amount?: string }>({})
  )

  const normalizedHandle = decodeURIComponent(
    resolvedParams.handle ?? ''
  ).replace(/^@/, '')

  return (
    <div className='mx-auto flex w-full max-w-3xl flex-col gap-6 px-6 py-10'>
      <PayPageClient
        handle={normalizedHandle}
        invoiceSlug={resolvedSearchParams.invoice}
        expectedAmount={resolvedSearchParams.amount}
      />
    </div>
  )
}
