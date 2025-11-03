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
    <div className='mx-auto w-full max-w-6xl px-6 pb-12 pt-10'>
      <div className='mb-8 space-y-2'>
        <h1 className='text-3xl font-semibold tracking-tight text-foreground'>
          CreatorBank Payments
        </h1>
        <p className='text-sm text-muted-foreground'>
          Operate your creator bank end-to-end: accept MUSD with Passport
          wallets, reconcile invoices, earmark save goals, spin up recurring
          payouts, and monitor Mezo health from one command center.
        </p>
      </div>

      <StatusOverviewBanner />

      <Tabs
        value={activeTab}
        onValueChange={value =>
          setActiveTab(value as (typeof TAB_ITEMS)[number]['value'])
        }
        className='space-y-6'
      >
        <TabsList className='grid w-full grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6'>
          {TAB_ITEMS.map(item => (
            <TabsTrigger key={item.value} value={item.value}>
              {item.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value='paylinks'>
          <PaylinksSection />
        </TabsContent>

        <TabsContent value='invoices'>
          <InvoicesSection />
        </TabsContent>

        <TabsContent value='payouts'>
          <PayoutSchedulesSection />
        </TabsContent>

        <TabsContent value='goals'>
          <SaveGoalsSection />
        </TabsContent>

        <TabsContent value='get-musd'>
          <GetMusdSection />
        </TabsContent>

        <TabsContent value='status'>
          {activeTab === 'status' ? <StatusSection /> : null}
        </TabsContent>
      </Tabs>
    </div>
  )
}
