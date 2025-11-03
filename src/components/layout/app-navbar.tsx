'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Button } from '@/components/ui/button'
import { MEZO_TESTNET_HUB_URL } from '@/lib/config'

import { GroupSwitcher } from './group-switcher'
import { ThemeToggle } from './theme-toggle'
import { WalletMenu } from './wallet-menu'

export function AppNavbar() {
  const pathname = usePathname()
  const isMarketplace = pathname?.startsWith('/marketplace')
  const isMemberships = pathname?.startsWith('/memberships')
  const isPayments = pathname?.startsWith('/payments')

  return (
    <header className='sticky top-0 z-40 border-b border-border bg-card'>
      <div className='mx-auto flex h-16 w-full items-center justify-between gap-6 px-6'>
        <div className='flex items-center gap-6'>
          <Link href='/' className='hidden items-center sm:flex'>
            <Image
              src='/images/creator-bank-logo.png'
              alt='CreatorBank'
              width={292}
              height={293}
              priority
              className='h-10 w-auto'
            />
            <span className='sr-only'>CreatorBank</span>
          </Link>
          <GroupSwitcher />
          <nav className='flex items-center gap-2'>
            <Link
              href='/marketplace'
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isMarketplace
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Marketplace
            </Link>
            <Link
              href='/memberships'
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isMemberships
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              My memberships
            </Link>
            <Link
              href='/payments'
              className={`px-3 py-2 text-sm font-medium transition-colors ${
                isPayments
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Payments
            </Link>
          </nav>
        </div>
        <div className='flex items-center gap-3'>
          <Button asChild size='sm' variant='outline'>
            <Link
              href={MEZO_TESTNET_HUB_URL}
              target='_blank'
              rel='noreferrer noopener'
            >
              Get MUSD
            </Link>
          </Button>
          <ThemeToggle />
          <WalletMenu />
        </div>
      </div>
    </header>
  )
}
