'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { GroupSwitcher } from './group-switcher'
import { HeaderUtilityMenu } from './header-utility-menu'
import { ThemeToggle } from './theme-toggle'
import { WalletMenu } from './wallet-menu'

export function AppNavbar() {
  const pathname = usePathname()
  const isMarketplace = pathname?.startsWith('/marketplace')
  const isMemberships = pathname?.startsWith('/memberships')
  const isPayments = pathname?.startsWith('/payments')

  return (
    <header className='sticky top-0 z-50 border-b border-border/40 bg-card/80 backdrop-blur-xl supports-[backdrop-filter]:bg-card/60'>
      {/* Subtle gradient overlay */}
      <div className='pointer-events-none absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-accent/5' />

      <div className='relative mx-auto flex h-20 w-full items-center justify-between gap-6 px-8'>
        <div className='flex items-center gap-8'>
          <Link
            href='/'
            className='group relative hidden items-center transition-transform hover:scale-105 sm:flex'
          >
            <Image
              src='/images/creator-bank-logo.png'
              alt='CreatorBank'
              width={292}
              height={293}
              priority
              className='h-12 w-auto drop-shadow-sm transition-all group-hover:drop-shadow-md'
            />
            <span className='sr-only'>CreatorBank</span>
          </Link>

          <div className='h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent' />

          <GroupSwitcher />

          <nav className='flex items-center gap-1'>
            <Link
              href='/marketplace'
              className={`group relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isMarketplace
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isMarketplace && (
                <span className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 ring-1 ring-primary/20' />
              )}
              <span className='relative'>Marketplace</span>
            </Link>
            <Link
              href='/memberships'
              className={`group relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isMemberships
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isMemberships && (
                <span className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 ring-1 ring-primary/20' />
              )}
              <span className='relative'>My memberships</span>
            </Link>
            <Link
              href='/payments'
              className={`group relative rounded-lg px-4 py-2.5 text-sm font-medium transition-all ${
                isPayments
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {isPayments && (
                <span className='absolute inset-0 rounded-lg bg-gradient-to-r from-primary/10 to-accent/10 ring-1 ring-primary/20' />
              )}
              <span className='relative'>Payments</span>
            </Link>
          </nav>
        </div>

        <div className='flex items-center gap-2'>
          <ThemeToggle />
          <div className='h-8 w-px bg-gradient-to-b from-transparent via-border to-transparent' />
          <HeaderUtilityMenu />
          <WalletMenu />
        </div>
      </div>
    </header>
  )
}
