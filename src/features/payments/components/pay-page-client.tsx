'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { useAction, useQuery } from 'convex/react'
import { toast } from 'sonner'
import type { Address } from 'viem'

import { LoadingIndicator } from '@/components/feedback/loading-indicator'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { api } from '@/convex/_generated/api'
import type { Doc } from '@/convex/_generated/dataModel'
import { useWalletAccount } from '@/hooks/use-wallet-account'
import { getBlockExplorerUrl } from '@/lib/config'
import { formatSettlementToken } from '@/lib/settlement-token'
import { Erc20Service, InvoiceRegistryService } from '@/lib/onchain/services'

type PayPageClientProps = {
  handle: string
  invoiceSlug?: string
  expectedAmount?: string
}

function formatInvoiceStatus(invoice: Doc<'invoices'> | null | undefined) {
  if (!invoice) return null
  switch (invoice.status) {
    case 'paid':
      return <Badge variant='secondary'>Paid</Badge>
    case 'issued':
      return <Badge variant='outline'>Awaiting payment</Badge>
    default:
      return <Badge variant='outline'>Draft</Badge>
  }
}

function describeExpectedAmount(
  invoice: Doc<'invoices'> | null | undefined,
  expectedAmount?: string
) {
  if (invoice) {
    return formatSettlementToken(BigInt(invoice.totalAmount))
  }
  if (expectedAmount) {
    return formatSettlementToken(BigInt(expectedAmount))
  }
  return null
}

export function PayPageClient({
  handle,
  invoiceSlug,
  expectedAmount
}: PayPageClientProps) {
  const paylink = useQuery(api.paylinks.getByHandle, { handle })
  const invoice = useQuery(
    api.invoices.getBySlug,
    invoiceSlug ? { slug: invoiceSlug } : 'skip'
  )
  const payments = useQuery(
    api.paylinks.paymentsForPaylink,
    paylink ? { paylinkId: paylink._id } : 'skip'
  )

  const syncTransfers = useAction(api.paylinks.syncTransfers)
  const recordSettlement = useAction(api.invoices.recordSettlement)
  const { address, publicClient, walletClient } = useWalletAccount()
  const [allowance, setAllowance] = useState<bigint | null>(null)
  const [balance, setBalance] = useState<bigint | null>(null)
  const [checkingAllowance, setCheckingAllowance] = useState(false)
  const [approvalPending, setApprovalPending] = useState(false)
  const [settling, setSettling] = useState(false)

  useEffect(() => {
    if (!paylink || (invoice && invoice.registryAddress && invoice.registryInvoiceId)) {
      return
    }

    const runSync = async () => {
      try {
        await syncTransfers({
          handle,
          invoiceSlug: invoiceSlug ?? undefined,
          expectedAmount: invoice?.totalAmount ?? expectedAmount ?? undefined
        })
      } catch (error) {
        console.error('Unable to sync payments', error)
      }
    }

    runSync()
    const interval = setInterval(runSync, 20000)
    return () => clearInterval(interval)
  }, [
    expectedAmount,
    handle,
    invoice?.registryAddress,
    invoice?.registryInvoiceId,
    invoice?.totalAmount,
    invoiceSlug,
    paylink,
    syncTransfers
  ])

  const supportsRegistry = Boolean(
    invoice && invoice.registryAddress && invoice.registryInvoiceId
  )

  const requiredAmount = useMemo(
    () => (invoice ? BigInt(invoice.totalAmount) : null),
    [invoice]
  )

  const explorerBase = useMemo(() => {
    return getBlockExplorerUrl(
      invoice?.chainId ? (invoice.chainId as any) : undefined
    )
  }, [invoice?.chainId])

  useEffect(() => {
    if (!supportsRegistry || !invoice) {
      setAllowance(null)
      setBalance(null)
      return
    }

    if (!address || !publicClient) {
      setAllowance(null)
      setBalance(null)
      return
    }

    let cancelled = false
    const ownerAddress = address as Address
    const erc20 = new Erc20Service({
      publicClient,
      walletClient: walletClient ?? null,
      account: ownerAddress,
      address: invoice.tokenAddress as `0x${string}`
    })

    const fetchAllowance = async () => {
      setCheckingAllowance(true)
      try {
        const [nextAllowance, nextBalance] = await Promise.all([
          erc20.allowance(ownerAddress, invoice.registryAddress as Address),
          erc20.balanceOf(ownerAddress)
        ])

        if (!cancelled) {
          setAllowance(nextAllowance)
          setBalance(nextBalance)
        }
      } catch (error) {
        console.error('Failed to refresh invoice allowance', error)
        if (!cancelled) {
          setAllowance(null)
          setBalance(null)
        }
      } finally {
        if (!cancelled) {
          setCheckingAllowance(false)
        }
      }
    }

    fetchAllowance()

    return () => {
      cancelled = true
    }
  }, [
    address,
    invoice,
    publicClient,
    supportsRegistry,
    walletClient,
    approvalPending,
    settling
  ])

  const needsApproval = useMemo(() => {
    if (!supportsRegistry || requiredAmount === null) return false
    if (allowance === null) return true
    return allowance < requiredAmount
  }, [allowance, requiredAmount, supportsRegistry])

  const insufficientBalance = useMemo(() => {
    if (!supportsRegistry || requiredAmount === null) return false
    if (balance === null) return false
    return balance < requiredAmount
  }, [balance, requiredAmount, supportsRegistry])

  const formattedBalance = useMemo(() => {
    if (balance === null) return null
    return formatSettlementToken(balance)
  }, [balance])

  const expectedAmountDescription = useMemo(
    () => describeExpectedAmount(invoice, expectedAmount),
    [expectedAmount, invoice]
  )

  const paymentDetected = useMemo(() => {
    if (supportsRegistry) {
      return invoice?.status === 'paid'
    }
    if (!payments || payments.length === 0) return false
    if (invoiceSlug) {
      return payments.some(payment => payment.invoiceSlug === invoiceSlug)
    }
    if (expectedAmount) {
      return payments.some(payment => payment.amount === expectedAmount)
    }
    return payments.length > 0
  }, [expectedAmount, invoice?.status, invoiceSlug, payments, supportsRegistry])

  const handleCopyAddress = async () => {
    if (!paylink) return
    try {
      await navigator.clipboard.writeText(paylink.receivingAddress)
      toast.success('Address copied to clipboard.')
    } catch (error) {
      console.error(error)
      toast.error('Unable to copy address right now.')
    }
  }

  const handleApprove = useCallback(async () => {
    if (!invoice || !supportsRegistry || requiredAmount === null) {
      return
    }

    if (!address) {
      toast.error('Connect your wallet to approve this invoice.')
      return
    }

    if (!walletClient || !publicClient) {
      toast.error('Wallet client unavailable. Reconnect your wallet.')
      return
    }

    try {
      setApprovalPending(true)
      const erc20 = new Erc20Service({
        publicClient,
        walletClient,
        account: address as `0x${string}`,
        address: invoice.tokenAddress as `0x${string}`
      })

      const tx = await erc20.approve(
        invoice.registryAddress as Address,
        requiredAmount
      )
      const toastId = toast.loading('Submitting MUSD approval…')
      await tx.wait()
      toast.success('MUSD approval confirmed.', {
        id: toastId,
        description: tx.hash
      })
      setAllowance(requiredAmount)
    } catch (error) {
      console.error(error)
      toast.error('Unable to approve this invoice.', {
        description: error instanceof Error ? error.message : undefined
      })
    } finally {
      setApprovalPending(false)
    }
  }, [
    address,
    invoice,
    publicClient,
    requiredAmount,
    supportsRegistry,
    walletClient
  ])

  const handlePayInvoice = useCallback(async () => {
    if (!invoice || !supportsRegistry || requiredAmount === null) {
      return
    }

    if (!address) {
      toast.error('Connect your wallet to settle this invoice.')
      return
    }

    if (!walletClient || !publicClient) {
      toast.error('Wallet client unavailable. Reconnect your wallet.')
      return
    }

    if (needsApproval) {
      toast.error('Approve MUSD to the invoice registry before paying.')
      return
    }

    if (insufficientBalance) {
      toast.error('Insufficient MUSD balance for this invoice.')
      return
    }

    try {
      setSettling(true)
      const registryService = new InvoiceRegistryService({
        publicClient,
        walletClient,
        account: address as `0x${string}`,
        address: invoice.registryAddress as `0x${string}`
      })

      const invoiceId = BigInt(invoice.registryInvoiceId ?? '0')
      const { hash } = await registryService.settleInvoice({
        invoiceId
      })

      const toastId = toast.loading('Submitting invoice payment…')
      const result = await recordSettlement({
        slug: invoice.slug,
        txHash: hash
      })

      if (!result?.ok) {
        toast.warning('Payment submitted but ledger sync failed.', {
          id: toastId,
          description:
            (result && 'reason' in result && typeof result.reason === 'string'
              ? result.reason
              : undefined) ?? 'Retry in a few seconds.'
        })
      } else {
        toast.success('Invoice payment confirmed on-chain.', {
          id: toastId,
          description: hash
        })
        setAllowance(prev => (prev !== null ? prev : requiredAmount))
        setBalance(prev =>
          prev !== null && requiredAmount !== null ? prev - requiredAmount : prev
        )
      }
    } catch (error) {
      console.error(error)
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to settle this invoice right now.'
      )
    } finally {
      setSettling(false)
    }
  }, [
    address,
    insufficientBalance,
    invoice,
    needsApproval,
    publicClient,
    recordSettlement,
    requiredAmount,
    supportsRegistry,
    walletClient
  ])

  if (paylink === undefined) {
    return <LoadingIndicator fullScreen />
  }

  if (!paylink) {
    return (
      <div className='rounded-2xl border border-dashed border-border/70 bg-muted/20 p-10 text-center text-sm text-muted-foreground'>
        This pay handle is not available. Confirm the URL with the recipient.
      </div>
    )
  }

  return (
    <div className='space-y-6 rounded-2xl border border-border bg-card/80 p-6 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h1 className='text-2xl font-semibold text-foreground'>
            Pay @{paylink.handle}
          </h1>
          {paylink.title ? (
            <p className='text-sm text-muted-foreground'>{paylink.title}</p>
          ) : null}
        </div>
        {invoice ? formatInvoiceStatus(invoice) : null}
      </div>

      {paylink.description ? (
        <p className='text-sm text-muted-foreground'>{paylink.description}</p>
      ) : null}

      <div className='rounded-xl border border-border/70 bg-background/70 p-5'>
        {supportsRegistry && requiredAmount !== null ? (
          <div className='space-y-4'>
            <div>
              <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                Settle with Invoice Registry
              </p>
              <p className='mt-3 text-base text-foreground'>
                Approve MUSD once, then submit the payment transaction. The
                registry moves funds directly to the creator and updates the
                ledger automatically.
              </p>
            </div>

            <div className='rounded-lg border border-border/60 bg-background/80 p-4 text-sm text-muted-foreground'>
              <p>
                Amount due:{' '}
                <span className='font-semibold text-foreground'>
                  {expectedAmountDescription ?? formatSettlementToken(requiredAmount)}
                </span>
              </p>
              {formattedBalance ? (
                <p className='mt-1'>Wallet balance: {formattedBalance}</p>
              ) : null}
            </div>

            <div className='flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-start sm:gap-3'>
              <Button
                type='button'
                variant='outline'
                disabled={
                  !needsApproval || approvalPending || checkingAllowance || !address
                }
                onClick={handleApprove}
              >
                {approvalPending ? 'Approving…' : 'Approve MUSD'}
              </Button>
              <Button
                type='button'
                disabled={
                  settling || needsApproval || insufficientBalance || !address
                }
                onClick={handlePayInvoice}
              >
                {settling ? 'Paying invoice…' : 'Pay invoice'}
              </Button>
            </div>

            {needsApproval ? (
              <p className='text-xs text-muted-foreground'>
                Approve the registry before submitting payment.
              </p>
            ) : null}
            {insufficientBalance ? (
              <p className='text-xs text-destructive'>
                Insufficient MUSD balance for this invoice.
              </p>
            ) : null}

            <p className='text-xs text-muted-foreground'>
              Transactions post to{' '}
              <a
                href={explorerBase}
                className='underline'
                target='_blank'
                rel='noreferrer'
              >
                Mezo Explorer
              </a>
              ; your wallet will prompt for each step.
            </p>
          </div>
        ) : (
          <>
            <p className='text-xs uppercase tracking-wide text-muted-foreground'>
              Send {expectedAmountDescription ?? 'your chosen amount'}
            </p>
            <p className='mt-3 text-base text-foreground'>
              Transfer MUSD on Mezo to the address below. Once the transaction
              finalizes this page will recognize the payment automatically.
            </p>
            <div className='mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
              <div>
                <p className='text-xs text-muted-foreground'>Receiving address</p>
                <p className='font-mono text-sm text-foreground'>
                  {paylink.receivingAddress}
                </p>
              </div>
              <Button
                type='button'
                variant='outline'
                onClick={handleCopyAddress}
                className='self-start sm:self-auto'
              >
                Copy address
              </Button>
            </div>
          </>
        )}
      </div>

      <Separator />

      <div className='space-y-3'>
        <h2 className='text-sm font-medium text-foreground'>Payment status</h2>
        {invoice ? (
          <div className='rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground'>
            <p>
              Invoice {invoice.number}{' '}
              {invoice.status === 'paid'
                ? 'has been settled. Thank you!'
                : 'is pending payment.'}
            </p>
            {invoice.status !== 'paid' && expectedAmountDescription ? (
              <p className='mt-1'>
                Amount due:{' '}
                <span className='font-semibold text-foreground'>
                  {expectedAmountDescription}
                </span>
              </p>
            ) : null}
          </div>
        ) : null}
        <div className='rounded-xl border border-border/60 bg-background/70 p-4 text-sm'>
          {supportsRegistry ? (
            paymentDetected ? (
              <p className='font-medium text-foreground'>
                Payment confirmed on-chain. The creator ledger is now up to date.
              </p>
            ) : (
              <p className='text-muted-foreground'>
                Approve MUSD and submit the pay transaction above to settle this invoice.
              </p>
            )
          ) : paymentDetected ? (
            <p className='font-medium text-foreground'>
              Payment detected. You can close this tab once the recipient
              confirms receipt.
            </p>
          ) : (
            <p className='text-muted-foreground'>
              Waiting for an on-chain transfer to arrive. Keep this page open or
              refresh after submitting your transaction.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
