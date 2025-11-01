'use client'

import { useCallback } from 'react'

import { toast } from 'sonner'
import type { Address } from 'viem'

import { useChainPreference } from '@/hooks/use-chain-preference'
import { useWalletAccount } from '@/hooks/use-wallet-account'

export type UniversalTransactionOptions = {
  showToast?: boolean
  pendingMessage?: string
  successMessage?: string
  errorMessage?: string
}

const DEFAULT_PENDING_MESSAGE = 'Submitting universal transaction…'
const DEFAULT_SUCCESS_MESSAGE = 'Transaction submitted'
const DEFAULT_ERROR_MESSAGE = 'Transaction failed'

export type UniversalSendParams = {
  to: Address
  data?: `0x${string}`
  value?: bigint
  account?: Address
}

function resolveErrorMessage(error: unknown) {
  if (error instanceof Error && error.message) {
    return error.message
  }
  if (typeof error === 'string' && error.length > 0) {
    return error
  }
  return undefined
}

export function useUniversalTransaction() {
  const { walletClient, publicClient, address } = useWalletAccount()
  const { explorerUrl } = useChainPreference()

  const sendTransaction = useCallback(
    async (
      params: UniversalSendParams,
      options?: UniversalTransactionOptions
    ) => {
      if (!walletClient || !publicClient) {
        throw new Error('Connect your wallet to run this transaction.')
      }

      const {
        showToast = true,
        pendingMessage = DEFAULT_PENDING_MESSAGE,
        successMessage = DEFAULT_SUCCESS_MESSAGE,
        errorMessage = DEFAULT_ERROR_MESSAGE
      } = options ?? {}

      const toastId = showToast ? toast.loading(pendingMessage) : undefined
      const account =
        params.account ??
        (walletClient.account?.address as Address | undefined) ??
        (address as Address | null) ??
        null

      if (!account) {
        if (toastId) {
          toast.error('Wallet address unavailable. Reconnect and try again.', {
            id: toastId
          })
        }
        throw new Error('Wallet address unavailable. Reconnect and try again.')
      }

      try {
        const hash = await walletClient.sendTransaction({
          account,
          to: params.to,
          data: params.data,
          value: params.value ?? 0n,
          chain: walletClient.chain
        })

        if (toastId) {
          toast.success(successMessage, { id: toastId })
        }

        return {
          hash,
          wait: () =>
            publicClient.waitForTransactionReceipt({
              hash
            })
        }
      } catch (error) {
        if (toastId) {
          toast.error(errorMessage, {
            id: toastId,
            description: resolveErrorMessage(error)
          })
        }
        throw error
      }
    },
    [address, publicClient, walletClient]
  )

  const getExplorerUrl = useCallback(
    (hash: string) => `${explorerUrl.replace(/\/$/, '')}/tx/${hash}`,
    [explorerUrl]
  )

  return {
    sendTransaction,
    getExplorerUrl
  }
}
