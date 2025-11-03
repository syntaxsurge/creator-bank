'use client'

import { useState } from 'react'

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { InvoicesSection } from './invoices-section'
import { PaylinksSection } from './paylinks-section'
import { PayoutSchedulesSection } from './payout-schedules-section'
import { SaveGoalsSection } from './save-goals-section'
import { StatusOverviewBanner, StatusSection } from './status-section'
import { GetMusdSection } from './get-musd-section'

const TAB_ITEMS = [
  { value: 'paylinks', label: 'SatsPay Links' },
  { value: 'invoices', label: 'Invoices' },
  { value: 'payouts', label: 'Recurring Payouts' },
  { value: 'goals', label: 'Save Goals' },
  { value: 'get-musd', label: 'Get MUSD' },
  { value: 'status', label: 'Status' }
] as const

export function PaymentsDashboard() {
  const [activeTab, setActiveTab] =
    useState<(typeof TAB_ITEMS)[number]['value']>('paylinks')

  return (
    <div className='relative min-h-screen overflow-hidden bg-gradient-to-b from-background via-background to-secondary/10'>
      {/* Background decorative elements */}
      <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
        <div className='absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-teal)/0.08),_transparent_70%)] blur-3xl' />
        <div className='absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-orange)/0.05),_transparent_70%)] blur-3xl' />
      </div>

      <div className='relative mx-auto w-full max-w-7xl px-6 pb-16 pt-12'>
        {/* Header Section */}
        <div className='mb-10 space-y-4'>
          <div className='inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm'>
            <span className='relative flex h-2 w-2'>
              <span className='absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75' />
              <span className='relative inline-flex h-2 w-2 rounded-full bg-primary' />
            </span>
            <span>MEZO Payments Hub</span>
          </div>

          <h1 className='text-5xl font-bold tracking-tight'>
            <span className='text-foreground'>Payments</span>{' '}
            <span className='bg-gradient-to-r from-brand-teal to-accent bg-clip-text text-transparent drop-shadow-sm'>
              Command Center
            </span>
          </h1>
          <p className='max-w-3xl text-lg leading-relaxed text-muted-foreground'>
            Operate your creator bank end-to-end: accept MUSD with Passport
            wallets, reconcile invoices, earmark save goals, spin up recurring
            payouts, and monitor Mezo health from one unified dashboard.
          </p>
        </div>

        <StatusOverviewBanner />

        <Tabs
          value={activeTab}
          onValueChange={value =>
            setActiveTab(value as (typeof TAB_ITEMS)[number]['value'])
          }
          className='mt-8 space-y-8'
        >
          {/* Modern Tab Navigation */}
          <div className='relative overflow-x-auto'>
            <TabsList className='inline-flex h-auto w-full min-w-fit gap-2 rounded-2xl border border-border/50 bg-card/50 p-2 backdrop-blur-xl lg:grid lg:grid-cols-6'>
              {TAB_ITEMS.map(item => (
                <TabsTrigger
                  key={item.value}
                  value={item.value}
                  className='group relative min-w-fit whitespace-nowrap rounded-xl px-6 py-3 text-sm font-medium transition-all data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/15 data-[state=active]:to-accent/10 data-[state=active]:text-foreground data-[state=active]:shadow-lg data-[state=active]:shadow-primary/10'
                >
                  {activeTab === item.value && (
                    <span className='absolute inset-0 rounded-xl ring-2 ring-primary/30' />
                  )}
                  <span className='relative'>{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Content with enhanced styling */}
          <div className='rounded-3xl border border-border/50 bg-card/50 p-8 backdrop-blur-sm'>
            <TabsContent value='paylinks' className='mt-0' forceMount>
              <PaylinksSection />
            </TabsContent>

            <TabsContent value='invoices' className='mt-0' forceMount>
              <InvoicesSection />
            </TabsContent>

            <TabsContent value='payouts' className='mt-0' forceMount>
              <PayoutSchedulesSection />
            </TabsContent>

            <TabsContent value='goals' className='mt-0' forceMount>
              <SaveGoalsSection />
            </TabsContent>

            <TabsContent value='get-musd' className='mt-0' forceMount>
              <GetMusdSection />
            </TabsContent>

            <TabsContent value='status' className='mt-0' forceMount>
              <StatusSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  )
}
