'use client'

import { useEffect } from 'react'

import { useMutation } from 'convex/react'

import { api } from '@/convex/_generated/api'
import { GroupDirectory } from '@/features/groups/components/group-directory'
import { useWalletAccount } from '@/hooks/use-wallet-account'

export default function GroupsPage() {
  const { address } = useWalletAccount()
  const storeUser = useMutation(api.users.store)

  useEffect(() => {
    if (!address) return
    storeUser({ address }).catch(() => {
      /* ignore duplicate upsert errors */
    })
  }, [address, storeUser])

  return (
    <div className='relative min-h-screen overflow-hidden bg-gradient-to-br from-background via-background to-muted/20'>
      {/* Enhanced decorative background with teal and orange */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -left-20 top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-teal)/0.12),_transparent_65%)] blur-3xl' />
        <div className='absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-orange)/0.08),_transparent_65%)] blur-3xl' />
        <div className='absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-teal)/0.08),_transparent_70%)] blur-3xl' />
      </div>

      <main className='relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-12 px-6 pb-24 pt-16 sm:pt-20'>
        {/* Hero Header with teal and orange aesthetic */}
        <div className='relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/95 via-card/90 to-card/85 px-10 py-12 shadow-2xl shadow-primary/5 backdrop-blur-xl md:px-14'>
          <div className='pointer-events-none absolute -right-12 top-12 h-64 w-64 rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-teal-light/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-12 left-16 h-56 w-56 rounded-full bg-gradient-to-br from-brand-orange/15 to-brand-teal/10 blur-3xl' />

          <div className='relative space-y-4'>
            <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 backdrop-blur-sm'>
              <div className='h-2 w-2 animate-pulse rounded-full bg-primary' />
              <p className='text-xs font-semibold uppercase tracking-wider text-primary'>
                CreatorBank Communities
              </p>
            </div>

            <h1 className='text-5xl font-bold leading-tight sm:text-6xl'>
              <span className='text-foreground'>Join CreatorBank</span>
              <br />
              <span className='bg-gradient-to-r from-brand-teal-dark to-accent-dark bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.2)]'>
                Communities on Mezo
              </span>
            </h1>

            <p className='max-w-2xl text-lg leading-relaxed text-muted-foreground'>
              Connect your Mezo wallet to access CreatorBank groups. Join gated
              feeds, classrooms, and marketplace listings backed by MUSD
              settlement and non-custodial memberships.
            </p>
          </div>
        </div>

        {/* Content */}
        <section className='flex flex-1 flex-col'>
          <GroupDirectory />
        </section>
      </main>
    </div>
  )
}
