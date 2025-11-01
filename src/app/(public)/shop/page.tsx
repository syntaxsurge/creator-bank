import Link from 'next/link'

export default function ShopLandingPage() {
  return (
    <div className='mx-auto flex min-h-[60vh] w-full max-w-3xl flex-col items-center justify-center gap-6 px-6 text-center'>
      <div className='space-y-3'>
        <h1 className='text-3xl font-semibold text-foreground'>
          CreatorBank Shop Demo
        </h1>
        <p className='text-sm text-muted-foreground'>
          Share{' '}
          <code className='rounded bg-muted px-2 py-1'>
            /shop/&lt;your-handle&gt;
          </code>{' '}
          with customers or judges to simulate a live checkout financed with
          MUSD. We use your active SatsPay link to watch the Mezo chain for
          settlement in real-time.
        </p>
      </div>
      <div className='space-y-2 text-sm text-muted-foreground'>
        <p>
          Example: if your handle is{' '}
          <span className='font-semibold text-foreground'>@creatorbank</span>,
          visit{' '}
          <Link
            href='/shop/creatorbank'
            className='font-medium text-primary underline-offset-4 hover:underline'
          >
            /shop/creatorbank
          </Link>
          .
        </p>
        <p>
          Need to set one up? Head to{' '}
          <Link
            href='/payments'
            className='font-medium text-primary underline-offset-4 hover:underline'
          >
            Payments &rarr; SatsPay Links
          </Link>{' '}
          and create a handle first.
        </p>
      </div>
    </div>
  )
}
