'use client'

import { useQuery } from 'convex/react'

import { api } from '@/convex/_generated/api'
import { useWalletAccount } from '@/hooks/use-wallet-account'

export function useCurrentUser() {
  const { address } = useWalletAccount()
  const currentUser = useQuery(
    api.users.currentUser,
    address ? { address } : { address: undefined }
  )

  return {
    address,
    currentUser
  }
}
