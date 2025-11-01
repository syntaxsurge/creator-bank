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
      {/* Enhanced decorative background with logo blue */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -left-20 top-20 h-96 w-96 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue)/0.12),_transparent_65%)] blur-3xl' />
        <div className='absolute -right-20 top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue-light)/0.1),_transparent_65%)] blur-3xl' />
        <div className='absolute bottom-0 left-1/2 h-72 w-72 rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-blue)/0.08),_transparent_70%)] blur-3xl' />
      </div>

      <main className='relative mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-7xl flex-col gap-12 px-6 pb-24 pt-16 sm:pt-20'>
        {/* Hero Header with logo blue aesthetic */}
        <div className='relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/95 via-card/90 to-card/85 px-10 py-12 shadow-2xl shadow-primary/5 backdrop-blur-xl md:px-14'>
          <div className='pointer-events-none absolute -right-12 top-12 h-64 w-64 rounded-full bg-gradient-to-br from-brand-blue/20 to-brand-blue-light/15 blur-3xl' />
          <div className='pointer-events-none absolute -bottom-12 left-16 h-56 w-56 rounded-full bg-gradient-to-br from-brand-blue-light/15 to-brand-blue/10 blur-3xl' />

          <div className='relative space-y-4'>
            <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 backdrop-blur-sm'>
              <div className='h-2 w-2 animate-pulse rounded-full bg-primary' />
              <p className='text-xs font-semibold uppercase tracking-wider text-primary'>
                Universal Communities
              </p>
            </div>

            <h1 className='text-5xl font-bold leading-tight sm:text-6xl'>
              <span className='text-foreground'>Your Cross-Chain</span>
              <br />
              <span className='bg-gradient-to-r from-brand-blue to-brand-blue-light bg-clip-text text-transparent'>
                Learning Communities
              </span>
            </h1>

            <p className='max-w-2xl text-lg leading-relaxed text-muted-foreground'>
              Connect any wallet to access communities across{' '}
              <span className='font-semibold text-foreground'>
                Ethereum, Solana, Base, and 15+ chains
              </span>
              . Jump into discussions, courses, and marketplace listings—all
              from one universal hub.
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
