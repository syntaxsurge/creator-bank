import { notFound } from 'next/navigation'

import { ShopDemo } from '@/features/payments/components/shop-demo'

type ShopPageProps = {
  params: {
    handle?: string
  }
}

export default function ShopPage({ params }: ShopPageProps) {
  const handle = params.handle?.toLowerCase()

  if (!handle) {
    notFound()
  }

  return (
    <div className='mx-auto w-full max-w-6xl px-6 pb-12 pt-10'>
      <ShopDemo handle={handle} />
    </div>
  )
}
