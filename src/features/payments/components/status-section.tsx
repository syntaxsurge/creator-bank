'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { RefreshCw } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

type RpcStatus = {
  chainId: number
  name: string
  explorerUrl: string
  status: 'ok' | 'error'
  blockNumber?: string
  latencyMs?: number
  error?: string
}

type OracleStatus = {
  id: string
  label: string
  status: 'ok' | 'stale' | 'error'
  price?: number
  conf?: number
  expo?: number
  publishTime?: number
  ageSeconds?: number
  error?: string
}

type StatusResponse = {
  generatedAt: string
  rpc: RpcStatus[]
  oracle: OracleStatus[]
}

type StatusState = {
  loading: boolean
  data: StatusResponse | null
  error: string | null
}

async function fetchStatus(): Promise<StatusResponse> {
  const response = await fetch('/api/status')
  if (!response.ok) {
    throw new Error(`Status endpoint returned ${response.status}`)
  }
  return (await response.json()) as StatusResponse
}

export function useStatusPoll(pollIntervalMs = 30000) {
  const [state, setState] = useState<StatusState>({
    loading: true,
    data: null,
    error: null
  })

  const refresh = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }))
      const data = await fetchStatus()
      setState({ loading: false, data, error: null })
    } catch (error) {
      setState({
        loading: false,
        data: null,
        error: error instanceof Error ? error.message : 'Failed to read status.'
      })
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      try {
        const data = await fetchStatus()
        if (!cancelled) {
          setState({ loading: false, data, error: null })
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            data: null,
            error:
              error instanceof Error ? error.message : 'Failed to read status.'
          })
        }
      }
    }

    run()
    const interval = window.setInterval(run, pollIntervalMs)

    return () => {
      cancelled = true
      window.clearInterval(interval)
    }
  }, [pollIntervalMs])

  return {
    ...state,
    refresh
  }
}

function StatusPill({
  status,
  children
}: {
  status: 'ok' | 'stale' | 'error'
  children: React.ReactNode
}) {
  const variant =
    status === 'ok'
      ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-300'
      : status === 'stale'
        ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
        : 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-300'

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide',
        variant
      )}
    >
      {children}
    </span>
  )
}

function describeLatency(latencyMs?: number) {
  if (typeof latencyMs !== 'number') return null
  if (latencyMs < 100) return '<100ms'
  if (latencyMs < 250) return '<250ms'
  if (latencyMs < 1000) return `${Math.round(latencyMs)}ms`
  return `${(latencyMs / 1000).toFixed(1)}s`
}

function describeAge(ageSeconds?: number) {
  if (typeof ageSeconds !== 'number') return null
  if (ageSeconds < 90) return '< 2 min'
  if (ageSeconds < 3600) return `${Math.round(ageSeconds / 60)} min`
  return `${(ageSeconds / 3600).toFixed(1)} h`
}

function OracleCard({ oracle }: { oracle: OracleStatus }) {
  const age = describeAge(oracle.ageSeconds)
  const price =
    typeof oracle.price === 'number' ? oracle.price.toFixed(2) : null

  return (
    <div className='flex flex-col gap-2 rounded-xl border border-border/70 bg-background/70 p-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-foreground'>{oracle.label}</p>
        <StatusPill status={oracle.status}>
          {oracle.status === 'ok'
            ? 'Fresh'
            : oracle.status === 'stale'
              ? 'Stale'
              : 'Error'}
        </StatusPill>
      </div>
      {price ? (
        <p className='text-lg font-semibold text-foreground'>${price}</p>
      ) : null}
      <p className='text-xs text-muted-foreground'>
        {oracle.status === 'ok'
          ? `Updated ${age ?? 'recently'}`
          : (oracle.error ?? 'Data unavailable')}
      </p>
    </div>
  )
}

function RpcCard({ rpc }: { rpc: RpcStatus }) {
  return (
    <div className='flex flex-col gap-2 rounded-xl border border-border/70 bg-background/70 p-4'>
      <div className='flex items-center justify-between'>
        <p className='text-sm font-medium text-foreground'>{rpc.name}</p>
        <StatusPill status={rpc.status}>
          {rpc.status === 'ok' ? 'Online' : 'Offline'}
        </StatusPill>
      </div>
      <p className='text-xs text-muted-foreground'>
        {rpc.status === 'ok'
          ? `Latest block #${rpc.blockNumber} · Latency ${describeLatency(rpc.latencyMs) ?? 'n/a'}`
          : (rpc.error ?? 'No response from RPC')}
      </p>
      <a
        href={rpc.explorerUrl}
        target='_blank'
        rel='noreferrer'
        className='text-xs font-medium text-primary underline-offset-4 hover:underline'
      >
        Open explorer
      </a>
    </div>
  )
}

export function StatusOverviewBanner() {
  const { data, error, refresh, loading } = useStatusPoll(60000)

  const worstStatus = useMemo(() => {
    if (!data) {
      return error ? 'error' : 'ok'
    }
    const oracleIssue = data.oracle.some(entry => entry.status !== 'ok')
    const rpcIssue = data.rpc.some(entry => entry.status !== 'ok')
    if (oracleIssue || rpcIssue) return 'error'
    return 'ok'
  }, [data, error])

  return (
    <div className='rounded-2xl border border-border bg-card/60 p-4 shadow-sm'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <p className='text-sm font-medium text-foreground'>Platform status</p>
          <p className='text-xs text-muted-foreground'>
            {data
              ? `Updated ${new Date(data.generatedAt).toLocaleTimeString()}`
              : error
                ? 'Unable to load status.'
                : 'Loading platform health…'}
          </p>
        </div>
        <div className='flex items-center gap-2'>
          <StatusPill status={worstStatus === 'ok' ? 'ok' : 'error'}>
            {worstStatus === 'ok' ? 'Operational' : 'Attention needed'}
          </StatusPill>
          <Button
            type='button'
            variant='outline'
            size='sm'
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className='mr-2 h-3.5 w-3.5' />
            Refresh
          </Button>
        </div>
      </div>
    </div>
  )
}

export function StatusSection() {
  const { data, error, refresh, loading } = useStatusPoll(30000)

  return (
    <div className='space-y-8'>
      <div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
        <div>
          <h2 className='text-xl font-semibold text-foreground'>
            CreatorBank status
          </h2>
          <p className='text-sm text-muted-foreground'>
            Monitor the health of Mezo RPCs and the Pyth price feeds that power
            settlement and UX conversions.
          </p>
        </div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={refresh}
          disabled={loading}
        >
          <RefreshCw className='mr-2 h-3.5 w-3.5' />
          Refresh
        </Button>
      </div>

      {error ? (
        <div className='rounded-2xl border border-rose-500/40 bg-rose-500/10 p-6 text-sm text-rose-200'>
          Unable to load status data: {error}. Try refreshing shortly.
        </div>
      ) : null}

      {!data && !error ? (
        <div className='rounded-2xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground'>
          Loading status&hellip;
        </div>
      ) : null}

      {data ? (
        <div className='space-y-8'>
          <div className='space-y-3'>
            <h3 className='text-sm font-medium text-foreground'>
              RPC endpoints
            </h3>
            <div className='grid gap-4 md:grid-cols-2'>
              {data.rpc.map(entry => (
                <RpcCard key={entry.chainId} rpc={entry} />
              ))}
            </div>
          </div>

          <div className='space-y-3'>
            <h3 className='text-sm font-medium text-foreground'>
              Oracle feeds
            </h3>
            <div className='grid gap-4 md:grid-cols-2'>
              {data.oracle.map(entry => (
                <OracleCard key={entry.id} oracle={entry} />
              ))}
            </div>
          </div>

          <Separator />

          <p className='text-xs text-muted-foreground'>
            We treat oracle data as stale if it is older than one hour.
            Investigate quickly when you see stale or failing feeds so
            subscription pricing stays accurate.
          </p>
        </div>
      ) : null}
    </div>
  )
}
