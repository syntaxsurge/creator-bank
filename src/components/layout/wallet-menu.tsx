'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

import { Button } from '@/components/ui/button'

export function WalletMenu() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        mounted,
        authenticationStatus,
        openAccountModal,
        openChainModal,
        openConnectModal
      }) => {
        const ready = mounted && authenticationStatus !== 'loading'
        const connected =
          ready &&
          account &&
          chain &&
          (!authenticationStatus || authenticationStatus === 'authenticated')

        return (
          <div
            className='flex items-center gap-2'
            aria-hidden={!ready ? true : undefined}
            style={
              !ready
                ? {
                    opacity: 0,
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }
                : undefined
            }
          >
            {!connected ? (
              <Button type='button' size='sm' onClick={openConnectModal}>
                Connect wallet
              </Button>
            ) : (
              <>
                <Button
                  type='button'
                  variant={chain.unsupported ? 'destructive' : 'outline'}
                  size='sm'
                  onClick={openChainModal}
                  className='flex items-center gap-2'
                >
                  {chain.hasIcon && chain.iconUrl ? (
                    <span
                      className='flex h-4 w-4 items-center justify-center overflow-hidden rounded-full'
                      style={
                        chain.iconBackground
                          ? { background: chain.iconBackground }
                          : undefined
                      }
                    >
                      <img
                        alt={chain.name ?? 'Chain icon'}
                        src={chain.iconUrl}
                        className='h-3 w-3'
                      />
                    </span>
                  ) : (
                    <span className='h-2 w-2 rounded-full bg-primary' />
                  )}
                  <span className='text-xs font-medium'>
                    {chain.name ?? 'Unknown network'}
                  </span>
                </Button>
                <Button
                  type='button'
                  size='sm'
                  onClick={openAccountModal}
                  className='flex items-center gap-2'
                >
                  <span>{account.displayName}</span>
                  {account.displayBalance ? (
                    <span className='text-xs text-muted-foreground'>
                      {account.displayBalance}
                    </span>
                  ) : null}
                </Button>
              </>
            )}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
