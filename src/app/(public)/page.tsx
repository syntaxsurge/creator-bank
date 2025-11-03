'use client'

import Link from 'next/link'
import { useEffect } from 'react'

import { useMutation } from 'convex/react'
import {
  ArrowRight,
  Sparkles,
  Wallet,
  Link2,
  Split,
  ShieldCheck,
  Users,
  BookOpen,
  Coins,
  BarChart3,
  CheckCircle2,
  Rocket,
  Star,
  Play
} from 'lucide-react'

import { AspectRatio } from '@/components/ui/aspect-ratio'
import { Button } from '@/components/ui/button'
import { api } from '@/convex/_generated/api'
import { useWalletAccount } from '@/hooks/use-wallet-account'

const stats = [
  {
    icon: Wallet,
    label: 'Settlement token',
    value: 'MUSD',
    description: 'Every checkout clears to your wallet on Mezo.'
  },
  {
    icon: Link2,
    label: 'Pay handles',
    value: 'Satspay',
    description: 'Share direct support links with live receipt tracking.'
  },
  {
    icon: Split,
    label: 'Recurring payouts',
    value: 'Multi-wallet',
    description: 'Automate collaborator splits in a single transaction.'
  }
]

const features = [
  {
    icon: Coins,
    title: 'Payments toolkit',
    description:
      'Spin up pay handles, invoices, and checkout pages that settle straight to your wallet. Convex keeps receipts and balances in sync in real time.',
    highlight: 'Direct MUSD settlement'
  },
  {
    icon: Users,
    title: 'Memberships & access',
    description:
      'Group dashboards, gated feeds, and pass-aware classrooms keep your community organized. Wallet checks and registrar sync ensure the right people get in.',
    highlight: 'Wallet-native access control'
  },
  {
    icon: BookOpen,
    title: 'Creator operations',
    description:
      'Schedule recurring payouts, reconcile invoices, and tag save goals without touching spreadsheets. Everything routes through the same on-chain primitives.',
    highlight: 'Automated collaborator splits'
  },
  {
    icon: ShieldCheck,
    title: 'Built on Mezo',
    description:
      'CreatorBank runs on Mezo so you get BTC-backed security, predictable fees, and non-custodial control. No bridges, no wrapped assets, no hidden custody.',
    highlight: 'Non-custodial by design'
  }
]

const testimonials = [
  {
    name: 'Jamie Ortiz',
    role: 'Community Lead, Mosaic Club',
    avatar: 'JO',
    quote:
      'Pay handles replaced our manual invoices. Supporters settle in MUSD, receipts update instantly, and we never leave the CreatorBank dashboard.',
    metrics: [
      { label: 'Active pay handles', value: '3' },
      { label: 'Payout cadence', value: 'Weekly splits' }
    ]
  },
  {
    name: 'Riley Chen',
    role: 'Creator, Studio 27',
    avatar: 'RC',
    quote:
      'Memberships, classroom drops, and marketplace listings all live together. Wallet gating keeps premium content exclusive without extra tooling.',
    metrics: [
      { label: 'Members onboarded', value: '140' },
      { label: 'Courses live', value: '6' }
    ]
  },
  {
    name: 'Morgan Patel',
    role: 'Producer, Signal Guild',
    avatar: 'MP',
    quote:
      'Recurring payouts run through the split router in one click. Everyone gets their share in MUSD and the ledger stays aligned with Mezo automatically.',
    metrics: [
      { label: 'Collaborators paid', value: '5 wallets' },
      { label: 'Processing time', value: '< 30 sec' }
    ]
  }
]

const howItWorks = [
  {
    step: '01',
    title: 'Launch your CreatorBank',
    description:
      'Create a group, set pricing, and connect your Mezo wallet. Add courses, modules, resources, and branding in the same flow.',
    details: ['No-code setup', 'Mezo-native by default', 'Custom branding']
  },
  {
    step: '02',
    title: 'Publish pay links & invoices',
    description:
      'Generate Satspay handles, invoices, and storefront checkouts. Share a single URL and CreatorBank watches for MUSD transfers automatically.',
    details: ['Pay handles & QR codes', 'Invoice tracking', 'Live receipt sync']
  },
  {
    step: '03',
    title: 'Manage memberships & payouts',
    description:
      'Gate feeds and classrooms, schedule recurring payouts, and monitor treasury balances. Everything stays synchronized between Convex and Mezo.',
    details: ['Recurring split payouts', 'Membership insights', 'Treasury visibility']
  }
]

const heroHighlights = [
  'Instant MUSD settlement',
  'Recurring payouts without spreadsheets',
  'Memberships, classrooms, and storefronts together'
]

export default function HomePage() {
  const { address } = useWalletAccount()
  const storeUser = useMutation(api.users.store)

  useEffect(() => {
    if (!address) return
    storeUser({ address }).catch(() => {
      /* ignore duplicate upsert errors */
    })
  }, [address, storeUser])

  return (
    <main className='relative overflow-hidden bg-gradient-to-b from-background via-background to-secondary/15'>
      <div className='pointer-events-none absolute inset-0' aria-hidden='true'>
        <div className='absolute inset-x-0 top-0 h-[600px] bg-[radial-gradient(circle_at_top_right,_hsl(var(--brand-teal)/0.12),_transparent_55%)]' />
        <div className='absolute right-0 top-[780px] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-orange)/0.08),_transparent_70%)] blur-3xl' />
        <div className='absolute left-0 top-[1380px] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,_hsl(var(--brand-teal)/0.08),_transparent_70%)] blur-3xl' />
      </div>

      <section className='relative'>
        <div className='mx-auto max-w-7xl px-6 pb-24 pt-20 sm:pb-32 sm:pt-28 lg:px-8'>
          <div className='grid gap-12 lg:grid-cols-2 lg:gap-16'>
            <div className='flex flex-col justify-center space-y-8'>
              <div className='inline-flex w-fit items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm'>
                <Sparkles className='h-4 w-4' />
                <span>CreatorBank on Mezo</span>
              </div>

              <div className='space-y-6'>
                <h1 className='text-5xl font-bold leading-[1.1] tracking-tight sm:text-6xl lg:text-7xl'>
                  <span className='text-foreground'>Own your</span>
                  <br />
                  <span className='bg-gradient-to-r from-brand-teal-dark via-brand-teal to-accent bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(0,0,0,0.3)]'>
                    Payments & Memberships
                  </span>
                </h1>

                <p className='text-xl leading-relaxed text-muted-foreground lg:text-2xl'>
                  CreatorBank settles every checkout in MUSD on Mezo, keeps your
                  community gated, and automates collaborator payouts—all from a
                  single dashboard.
                </p>
              </div>

              <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
                <Button
                  size='lg'
                  className='bg-gradient-to-r from-brand-teal to-brand-teal-light text-base shadow-lg shadow-primary/20 hover:opacity-90'
                  asChild
                >
                  <Link href='/create'>
                    Start Building
                    <Rocket className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-primary/30 text-base hover:bg-primary/5'
                  asChild
                >
                  <Link href='/payments'>
                    Explore Payments
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
              </div>

              <div className='flex flex-wrap gap-4 pt-4'>
                {heroHighlights.map(highlight => (
                  <div
                    key={highlight}
                    className='flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-4 py-2 text-sm font-medium text-foreground'
                  >
                    <CheckCircle2 className='h-4 w-4 text-primary' />
                    <span>{highlight}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className='relative'>
              <div className='absolute inset-0 rounded-3xl bg-gradient-to-br from-primary/10 via-accent/10 to-transparent blur-3xl' />
              <div className='relative space-y-6'>
                <div className='grid gap-4'>
                  <div className='group rounded-2xl border border-primary/20 bg-card/90 p-6 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'>
                    <div className='flex items-center justify-between'>
                      <div>
                        <p className='text-sm font-medium text-muted-foreground'>
                          Demo dashboard
                        </p>
                        <p className='mt-1 bg-gradient-to-r from-brand-teal-dark to-accent-dark bg-clip-text text-3xl font-bold text-transparent drop-shadow-sm'>
                          12.6k MUSD
                        </p>
                      </div>
                      <div className='rounded-xl bg-primary/10 p-3'>
                        <BarChart3 className='h-6 w-6 text-primary' />
                      </div>
                    </div>
                    <p className='mt-3 text-xs text-muted-foreground'>
                      Recent settlements across pay handles and invoices.
                    </p>
                  </div>

                  <div className='grid grid-cols-2 gap-4'>
                    <div className='group space-y-2 rounded-2xl border border-primary/20 bg-card/90 p-4 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40'>
                      <Wallet className='h-5 w-5 text-primary' />
                      <p className='text-sm font-medium text-muted-foreground'>
                        Active pay handle
                      </p>
                      <p className='font-mono text-sm text-foreground'>
                        /pay/i-am-creator
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Watching for inbound MUSD transfers.
                      </p>
                    </div>
                    <div className='group space-y-2 rounded-2xl border border-primary/20 bg-card/90 p-4 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40'>
                      <Split className='h-5 w-5 text-primary' />
                      <p className='text-sm font-medium text-muted-foreground'>
                        Upcoming split run
                      </p>
                      <p className='text-sm font-semibold text-foreground'>
                        4 wallets • 40/30/20/10
                      </p>
                      <p className='text-xs text-muted-foreground'>
                        Executes over Mezo in one transaction.
                      </p>
                    </div>
                  </div>

                  <div className='rounded-2xl border border-primary/20 bg-card/90 p-4 backdrop-blur-xl'>
                    <div className='mb-3 flex items-center gap-2'>
                      <Play className='h-4 w-4 text-primary' />
                      <span className='text-sm font-medium text-foreground'>
                        Lesson draft ready
                      </span>
                    </div>
                    <div className='flex items-center gap-3'>
                      <div className='flex h-10 w-10 items-center justify-center rounded-full border border-primary/30 bg-gradient-to-br from-primary/20 to-accent/20 text-sm font-bold text-primary'>
                        CK
                      </div>
                      <div className='flex-1'>
                        <p className='text-sm font-medium text-foreground'>
                          Camera Basics: Framing
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          Published to the classroom and gated for members.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='relative py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-5xl'>
            <div className='mb-12 text-center'>
              <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm'>
                <Play className='h-4 w-4' />
                <span>See CreatorBank in action</span>
              </div>
              <h2 className='mb-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
                Watch the{' '}
                <span className='bg-gradient-to-r from-brand-teal-dark to-accent-dark bg-clip-text text-transparent drop-shadow-sm'>
                  Platform Demo
                </span>
              </h2>
              <p className='mx-auto max-w-2xl text-lg leading-relaxed text-muted-foreground'>
                Get a complete walkthrough of CreatorBank's payment tools,
                membership management, and automated workflows—all in under 5
                minutes.
              </p>
            </div>

            <div className='group relative'>
              <div className='pointer-events-none absolute -inset-1 rounded-3xl bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 opacity-75 blur-xl transition-all group-hover:opacity-100' />
              <div className='relative overflow-hidden rounded-2xl border border-primary/30 bg-card/95 p-2 backdrop-blur-xl shadow-2xl shadow-primary/10 transition-all group-hover:border-primary/50 group-hover:shadow-primary/20'>
                <AspectRatio ratio={16 / 9} className='overflow-hidden rounded-xl'>
                  <iframe
                    src='https://www.youtube.com/embed/_4w0iCNmg_g'
                    title='CreatorBank Platform Demo'
                    allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                    allowFullScreen
                    className='h-full w-full border-0'
                  />
                </AspectRatio>
              </div>
            </div>

            <div className='mt-10 grid gap-6 sm:grid-cols-3'>
              <div className='rounded-2xl border border-primary/20 bg-card/90 p-6 text-center backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10'>
                <div className='mb-3 inline-flex rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20'>
                  <Wallet className='h-6 w-6 text-primary' />
                </div>
                <h3 className='mb-2 font-semibold text-foreground'>
                  Payment Flows
                </h3>
                <p className='text-sm text-muted-foreground'>
                  See how pay handles, invoices, and MUSD settlement work
                  together.
                </p>
              </div>

              <div className='rounded-2xl border border-primary/20 bg-card/90 p-6 text-center backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10'>
                <div className='mb-3 inline-flex rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20'>
                  <Users className='h-6 w-6 text-primary' />
                </div>
                <h3 className='mb-2 font-semibold text-foreground'>
                  Member Access
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Learn how wallet-based gating protects your content and
                  community.
                </p>
              </div>

              <div className='rounded-2xl border border-primary/20 bg-card/90 p-6 text-center backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-lg hover:shadow-primary/10'>
                <div className='mb-3 inline-flex rounded-xl bg-primary/10 p-3 ring-1 ring-primary/20'>
                  <Split className='h-6 w-6 text-primary' />
                </div>
                <h3 className='mb-2 font-semibold text-foreground'>
                  Automated Splits
                </h3>
                <p className='text-sm text-muted-foreground'>
                  Discover how recurring payouts eliminate manual
                  reconciliation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className='relative py-16'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='grid gap-8 md:grid-cols-3'>
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className='group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 backdrop-blur-xl transition-all hover:scale-105 hover:border-primary/40 hover:shadow-2xl hover:shadow-primary/10'
                >
                  <div className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/10 to-transparent blur-2xl transition-all group-hover:scale-150' />
                  <div className='relative'>
                    <div className='mb-4 inline-flex rounded-2xl bg-primary/10 p-3 ring-1 ring-primary/20'>
                      <Icon className='h-6 w-6 text-primary' />
                    </div>
                    <p className='bg-gradient-to-r from-brand-teal-dark to-accent-dark bg-clip-text text-5xl font-bold text-transparent drop-shadow-sm'>
                      {stat.value}
                    </p>
                    <p className='mt-2 text-lg font-semibold text-foreground'>
                      {stat.label}
                    </p>
                    <p className='mt-3 text-sm leading-relaxed text-muted-foreground'>
                      {stat.description}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className='relative py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto mb-16 max-w-2xl text-center'>
            <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary backdrop-blur-sm'>
              <Sparkles className='h-4 w-4' />
              <span>Everything in one workspace</span>
            </div>
            <h2 className='text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
              Run your creator business without hopping between tools
            </h2>
            <p className='mt-6 text-lg leading-relaxed text-muted-foreground'>
              CreatorBank combines payments, memberships, and creator operations
              into a single Mezo-native stack.
            </p>
          </div>

          <div className='grid gap-8 md:grid-cols-2'>
            {features.map((feature, index) => {
              const Icon = feature.icon
              return (
                <div
                  key={index}
                  className='group relative overflow-hidden rounded-3xl border border-border/50 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 backdrop-blur-sm transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/5'
                >
                  <div className='pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-3xl transition-all group-hover:scale-150' />
                  <div className='relative'>
                    <div className='mb-5 inline-flex rounded-2xl bg-gradient-to-br from-primary/15 to-accent/10 p-4 ring-1 ring-primary/20 transition-all group-hover:scale-110'>
                      <Icon className='h-8 w-8 text-primary' />
                    </div>
                    <h3 className='mb-3 text-2xl font-bold text-foreground transition-colors group-hover:text-primary'>
                      {feature.title}
                    </h3>
                    <p className='mb-4 text-base leading-relaxed text-muted-foreground'>
                      {feature.description}
                    </p>
                    <div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary'>
                      <Sparkles className='h-3 w-3' />
                      <span>{feature.highlight}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      <section className='relative bg-secondary/30 py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto mb-16 max-w-2xl text-center'>
            <h2 className='mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
              Go live in{' '}
              <span className='bg-gradient-to-r from-brand-teal-dark to-accent-dark bg-clip-text text-transparent drop-shadow-sm'>
                Three Steps
              </span>
            </h2>
            <p className='text-lg leading-relaxed text-muted-foreground'>
              From first setup to automated payouts—all inside CreatorBank.
            </p>
          </div>

          <div className='relative mx-auto max-w-5xl'>
            <div className='absolute bottom-12 left-8 top-12 hidden w-0.5 bg-gradient-to-b from-primary via-primary/50 to-primary/20 md:block' />

            <div className='space-y-12'>
              {howItWorks.map((item, index) => (
                <div
                  key={index}
                  className='group relative flex items-start gap-8'
                >
                  <div className='relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-accent text-2xl font-bold text-white shadow-lg shadow-primary/20 ring-4 ring-background transition-all group-hover:scale-110'>
                    {item.step}
                  </div>

                  <div className='flex-1 rounded-3xl border border-primary/20 bg-card/90 p-8 backdrop-blur-xl transition-all group-hover:border-primary/40 group-hover:shadow-xl group-hover:shadow-primary/10'>
                    <h3 className='mb-3 text-2xl font-bold text-foreground'>
                      {item.title}
                    </h3>
                    <p className='mb-4 text-base leading-relaxed text-muted-foreground'>
                      {item.description}
                    </p>
                    <div className='flex flex-wrap gap-2'>
                      {item.details.map((detail, i) => (
                        <div
                          key={i}
                          className='flex items-center gap-2 rounded-full border border-primary/10 bg-primary/5 px-3 py-1 text-xs font-medium text-foreground'
                        >
                          <CheckCircle2 className='h-3 w-3 text-primary' />
                          <span>{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className='relative py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto mb-16 max-w-2xl text-center'>
            <h2 className='mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
              Creators are shipping faster with CreatorBank
            </h2>
            <p className='text-lg leading-relaxed text-muted-foreground'>
              Real teams are using MUSD settlement, pay handles, and recurring
              payouts to run their communities without duct-taped tooling.
            </p>
          </div>

          <div className='grid gap-8 md:grid-cols-3'>
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className='group relative overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-br from-card/95 via-card/90 to-card/85 p-8 backdrop-blur-xl transition-all hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10'
              >
                <div className='pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br from-primary/5 to-transparent blur-2xl' />
                <div className='relative'>
                  <div className='mb-4 flex gap-1'>
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className='h-4 w-4 fill-primary text-primary'
                      />
                    ))}
                  </div>

                  <blockquote className='mb-6 text-base leading-relaxed text-muted-foreground'>
                    {testimonial.quote}
                  </blockquote>

                  <div className='mb-4 flex items-center gap-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-full border border-primary/30 bg-gradient-to-br from-primary/20 to-accent/20 text-base font-bold text-primary'>
                      {testimonial.avatar}
                    </div>
                    <div>
                      <p className='font-semibold text-foreground'>
                        {testimonial.name}
                      </p>
                      <p className='text-sm text-muted-foreground'>
                        {testimonial.role}
                      </p>
                    </div>
                  </div>

                  <div className='flex gap-4 border-t border-border/50 pt-4'>
                    {testimonial.metrics.map(metric => (
                      <div key={metric.label}>
                        <p className='text-lg font-bold text-primary'>
                          {metric.value}
                        </p>
                        <p className='text-xs text-muted-foreground'>
                          {metric.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className='relative py-24'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-12 backdrop-blur-xl md:p-16'>
            <div className='pointer-events-none absolute -right-20 -top-20 h-80 w-80 rounded-full bg-gradient-to-br from-primary/20 to-transparent blur-3xl' />
            <div className='pointer-events-none absolute -bottom-20 -left-20 h-80 w-80 rounded-full bg-gradient-to-br from-accent/15 to-transparent blur-3xl' />

            <div className='relative mx-auto max-w-3xl text-center'>
              <h2 className='mb-6 text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl'>
                Build your creator bank on Mezo today
              </h2>
              <p className='mb-8 text-xl leading-relaxed text-muted-foreground'>
                Settle in MUSD, automate payouts, and keep your memberships
                organized. CreatorBank gives you the infrastructure without the
                busywork.
              </p>

              <div className='mb-8 flex flex-col gap-4 sm:flex-row sm:justify-center'>
                <Button
                  size='lg'
                  className='bg-gradient-to-r from-brand-teal to-accent px-8 text-lg shadow-xl shadow-primary/30 hover:opacity-90'
                  asChild
                >
                  <Link href='/create'>
                    Create Your CreatorBank
                    <Rocket className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
                <Button
                  size='lg'
                  variant='outline'
                  className='border-primary/30 px-8 text-lg hover:bg-primary/5'
                  asChild
                >
                  <Link href='/payments'>
                    Review the payments suite
                    <ArrowRight className='ml-2 h-5 w-5' />
                  </Link>
                </Button>
              </div>

              <div className='flex flex-wrap justify-center gap-6 text-sm text-muted-foreground'>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Mezo-native settlement</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Non-custodial payouts</span>
                </div>
                <div className='flex items-center gap-2'>
                  <CheckCircle2 className='h-4 w-4 text-primary' />
                  <span>Creator tools in one dashboard</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
