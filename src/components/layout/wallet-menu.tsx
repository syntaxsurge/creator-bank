'use client'

import { ConnectButton } from '@rainbow-me/rainbowkit'

export function WalletMenu() {
  return (
    <div className='flex items-center'>
      <ConnectButton
        label='Connect wallet'
        showBalance={false}
      />
    </div>
  )
}
