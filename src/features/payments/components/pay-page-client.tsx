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
import type { LucideIcon } from 'lucide-react'
import {
  ArrowUpRight,
  AtSign,
  Calendar,
  CheckCircle2,
  FileText,
  User,
  Wallet as WalletIcon
} from 'lucide-react'

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

function formatDateTime(timestamp?: number | null) {
  if (!timestamp) return null
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(timestamp))
}

function formatDateOnly(timestamp?: number | null) {
  if (!timestamp) return null
  return new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium'
  }).format(new Date(timestamp))
}

function truncateHash(hash: string, front = 8, back = 6) {
  if (hash.length <= front + back + 1) return hash
  return `${hash.slice(0, front)}…${hash.slice(-back)}`
}

function truncateAddress(address: string, front = 6, back = 4) {
  if (address.length <= front + back + 1) return address
  return `${address.slice(0, front)}…${address.slice(-back)}`
}

type DetailItem = {
  label: string
  value: string
  icon: LucideIcon
  title?: string
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

  const explorerBaseNormalized = useMemo(() => {
    return explorerBase.replace(/\/$/, '')
  }, [explorerBase])

  const paymentExplorerUrl = useMemo(() => {
    if (invoice?.paymentTxHash) {
      return `${explorerBaseNormalized}/tx/${invoice.paymentTxHash}`
    }
    return null
  }, [explorerBaseNormalized, invoice?.paymentTxHash])

  const paidAtFormatted = useMemo(
    () => formatDateTime(invoice?.paidAt),
    [invoice?.paidAt]
  )

  const dueDateFormatted = useMemo(
    () => formatDateOnly(invoice?.dueAt),
    [invoice?.dueAt]
  )

  const expectedAmountDescription = useMemo(
    () => describeExpectedAmount(invoice, expectedAmount),
    [expectedAmount, invoice]
  )

  const amountPaidDisplay = useMemo(() => {
    if (invoice) {
      try {
        return formatSettlementToken(BigInt(invoice.totalAmount))
      } catch {
        return expectedAmountDescription ?? null
      }
    }
    return expectedAmountDescription ?? null
  }, [expectedAmountDescription, invoice])

  const paidDetailItems = useMemo<DetailItem[]>(() => {
    const items: DetailItem[] = []
    if (invoice?.number) {
      items.push({
        label: 'Invoice number',
        value: invoice.number,
        icon: FileText
      })
    }
    if (paidAtFormatted) {
      items.push({
        label: 'Paid on',
        value: paidAtFormatted,
        icon: Calendar
      })
    }
    if (dueDateFormatted) {
      items.push({
        label: 'Due date',
        value: dueDateFormatted,
        icon: Calendar
      })
    }
    if (paylink) {
      items.push({
        label: 'Pay handle',
        value: `@${paylink.handle}`,
        icon: AtSign
      })
    }
    if (invoice?.customerName) {
      items.push({
        label: 'Billed to',
        value: invoice.customerName,
        icon: User
      })
    }
    if (invoice?.payerAddress) {
      items.push({
        label: 'Payer wallet',
        value: truncateAddress(invoice.payerAddress),
        title: invoice.payerAddress,
        icon: WalletIcon
      })
    }
    return items
  }, [dueDateFormatted, invoice, paidAtFormatted, paylink])

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

  const showPaidReceipt = paymentDetected
  const paidHeroTitle =
    invoice?.title ?? paylink?.title ?? 'Invoice payment confirmed'

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
        {showPaidReceipt ? (
          <div className='space-y-6'>
            <div className='relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/12 via-primary/5 to-accent/10 p-6'>
              <div className='pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-accent/20 opacity-70 blur-3xl' />
              <div className='relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <span className='flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary'>
                    <CheckCircle2 className='h-6 w-6' />
                  </span>
                  <div>
                    <p className='text-xs font-semibold uppercase tracking-wider text-primary'>
                      Payment complete
                    </p>
                    <h2 className='text-xl font-semibold text-foreground'>
                      {paidHeroTitle}
                    </h2>
                  </div>
                </div>
                {invoice?.number ? (
                  <Badge variant='secondary' className='self-start'>
                    #{invoice.number}
                  </Badge>
                ) : null}
              </div>
              {amountPaidDisplay ? (
                <div className='relative mt-6'>
                  <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                    Amount paid
                  </p>
                  <p className='mt-2 text-3xl font-bold text-foreground'>
                    {amountPaidDisplay}
                  </p>
                </div>
              ) : null}
            </div>

            {paidDetailItems.length > 0 ? (
              <div className='grid gap-4 sm:grid-cols-2'>
                {paidDetailItems.map(item => {
                  const Icon = item.icon
                  return (
                    <div
                      key={item.label}
                      className='flex items-start gap-3 rounded-xl border border-border/60 bg-background/80 p-4'
                    >
                      <span className='mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary'>
                        <Icon className='h-4 w-4' />
                      </span>
                      <div>
                        <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                          {item.label}
                        </p>
                        <p
                          className='mt-1 text-sm font-medium text-foreground'
                          title={item.title ?? item.value}
                        >
                          {item.value}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : null}

            {invoice?.notes ? (
              <div className='rounded-xl border border-border/60 bg-background/80 p-4'>
                <p className='text-xs uppercase tracking-wide text-muted-foreground'>
                  Notes
                </p>
                <p className='mt-2 text-sm leading-relaxed text-foreground'>
                  {invoice.notes}
                </p>
              </div>
            ) : null}

            {paymentExplorerUrl ? (
              <a
                className='inline-flex items-center gap-2 text-sm font-semibold text-primary underline-offset-4 hover:underline'
                href={paymentExplorerUrl}
                target='_blank'
                rel='noreferrer'
              >
                View transaction on Mezo Explorer
                <ArrowUpRight className='h-4 w-4' />
              </a>
            ) : null}
          </div>
        ) : supportsRegistry && requiredAmount !== null ? (
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
        <div className='rounded-xl border border-border/70 bg-background/70 p-4 text-sm text-muted-foreground'>
          {showPaidReceipt ? (
            <p className='text-foreground'>
              {invoice ? (
                <>
                  Invoice {invoice.number}{' '}
                  {paidAtFormatted
                    ? `was settled on ${paidAtFormatted}.`
                    : 'has been settled.'}{' '}
                  Thank you for your payment!
                </>
              ) : (
                'Payment received and recorded. Thank you!'
              )}
            </p>
          ) : invoice ? (
            <>
              <p className='text-foreground'>
                Invoice {invoice.number} is pending payment.
              </p>
              {expectedAmountDescription ? (
                <p className='mt-1'>
                  Amount due:{' '}
                  <span className='font-semibold text-foreground'>
                    {expectedAmountDescription}
                  </span>
                </p>
              ) : null}
            </>
          ) : (
            <p>
              Awaiting a transfer to @{paylink.handle}. This page refreshes as
              soon as funds are detected.
            </p>
          )}
        </div>
        <div className='rounded-xl border border-border/60 bg-background/70 p-4 text-sm'>
          {showPaidReceipt ? (
            <p className='font-medium text-foreground'>
              Payment confirmed. You can safely close this tab or return to the
              dashboard.
            </p>
          ) : supportsRegistry ? (
            <p className='text-muted-foreground'>
              Approve MUSD and submit the pay transaction above to settle this
              invoice.
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
