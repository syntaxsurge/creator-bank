'use client'

import type { ReactNode } from 'react'

import type { Id } from '@/convex/_generated/dataModel'

import { GroupNavTabs } from './group-nav-tabs'
import { GroupSidebar } from './group-sidebar'
import { GroupSubscriptionBanner } from './group-subscription-banner'
import { GroupProvider } from '../context/group-context'

type GroupLayoutShellProps = {
  groupId: Id<'groups'>
  children: ReactNode
  hideSidebar?: boolean
}

export function GroupLayoutShell({
  groupId,
  children,
  hideSidebar = false
}: GroupLayoutShellProps) {
  return (
    <GroupProvider groupId={groupId}>
      <div className='flex min-h-screen flex-col'>
        <GroupNavTabs />
        <GroupSubscriptionBanner />
        <div className='mx-auto w-full max-w-7xl px-6 py-8'>
          {hideSidebar ? (
            <section className='w-full'>{children}</section>
          ) : (
            <div className='flex gap-8'>
              <section className='min-w-0 flex-1'>{children}</section>
              <div className='sticky top-24 hidden self-start lg:block'>
                <GroupSidebar />
              </div>
            </div>
          )}
        </div>
      </div>
    </GroupProvider>
  )
}
