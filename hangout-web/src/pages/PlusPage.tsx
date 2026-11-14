import { Check, Crown, FlaskConical, Infinity as InfinityIcon, Lock, SlidersHorizontal, Users, Bookmark } from 'lucide-react'
import { useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { ApiError } from '@/api/client'
import { useMe } from '@/api/hooks'
import { useCheckout, useDemoUpgrade } from '@/api/social'
import { Badge, Button, Card, Skeleton } from '@/design'
import { config } from '@/lib/config'

/** What Plus adds, from SRS 2.2 (user classes). */
const BENEFITS = [
  { icon: InfinityIcon, title: 'Unlimited plans', free: `${config.freeSearchesPerMonth} a month`, plus: 'No limit' },
  { icon: SlidersHorizontal, title: 'All advanced filters', free: 'Basic filters', plus: 'Max travel per leg, food needs, hidden gems, skip places you have been' },
  { icon: Users, title: 'Group plans for 3–8 people', free: 'Up to 2', plus: 'Up to 8' },
  { icon: Bookmark, title: 'Saved plans', free: '—', plus: 'Keep plans on your profile' },
]

const price = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(config.plusPriceUsd)

/** Benefits, $4.99/month, Upgrade via Stripe Checkout (test mode) or a demo fallback (FR-PAY-1 to 3). */
export default function PlusPage() {
  const { data: me, isLoading, refetch } = useMe()
  const [params, setParams] = useSearchParams()
  const checkout = useCheckout()
  const demo = useDemoUpgrade()

  // Back from Stripe Checkout.
  useEffect(() => {
    const result = params.get('checkout')
    if (!result) return
    if (result === 'success') {
      refetch()
      toast.success('Welcome to Plus', { id: 'plus-welcome' })
    } else toast('Checkout canceled. Nothing was charged.', { id: 'plus-cancel' })
    setParams({}, { replace: true })
  }, [params, setParams, refetch])

  const upgrade = async () => {
    try {
      const { url } = await checkout.mutateAsync()
      window.location.assign(url)
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not open checkout. Try again.')
    }
  }

  const simulate = async () => {
    try {
      await demo.mutateAsync()
      toast.success('Plus is on (demo upgrade, no payment)')
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : 'Could not upgrade.')
    }
  }

  if (isLoading) return <Skeleton className="mx-auto h-[32rem] max-w-3xl" />
  const isPlus = me?.tier === 'PLUS'
  const left = me?.searchesLeft ?? 0

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-8">
      <Card className="relative flex flex-col gap-4 overflow-hidden bg-ink p-8 text-bg">
        <Crown className="size-10 text-accent" aria-hidden />
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">{isPlus ? "You're on Plus" : 'Plan every night out'}</h1>
        <p className="max-w-lg opacity-80">
          {isPlus
            ? 'Unlimited plans, every filter, bigger groups and saved plans. Thanks for supporting Hangout.'
            : left > 0
              ? `You have ${left} free plan${left === 1 ? '' : 's'} left this month. Plus removes the limit.`
              : `You've used your ${config.freeSearchesPerMonth} free plans this month. Plus removes the limit.`}
        </p>
        {!isPlus && (
          <div className="flex flex-col gap-3">
            <p>
              <span className="font-display text-4xl font-extrabold">{price}</span>
              <span className="opacity-80"> / month · cancel anytime</span>
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="lg" variant="accent" loading={checkout.isPending} onClick={upgrade}>
                Upgrade to Plus
              </Button>
              {config.demoUpgrade && (
                <Button size="lg" variant="ghost" className="text-bg hover:bg-white/10" loading={demo.isPending} onClick={simulate} icon={<FlaskConical className="size-4" aria-hidden />}>
                  Simulate upgrade (demo)
                </Button>
              )}
            </div>
            <p className="text-xs opacity-70">Payments run through Stripe in test mode for this MVP. No real card is charged.</p>
          </div>
        )}
      </Card>

      <section aria-labelledby="compare-h" className="flex flex-col gap-3">
        <h2 id="compare-h" className="font-display text-2xl font-bold">
          Free vs Plus
        </h2>
        <ul className="flex flex-col gap-3">
          {BENEFITS.map(({ icon: Icon, title, free, plus }) => (
            <li key={title}>
              <Card className="grid gap-3 p-4 sm:grid-cols-[minmax(0,1.2fr)_1fr_1fr] sm:items-center">
                <p className="flex items-center gap-3 font-semibold">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-brand-soft text-brand dark:text-ink">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  {title}
                </p>
                <p className="flex items-center gap-2 text-sm text-muted">
                  <Lock className="size-3.5 shrink-0" aria-hidden />
                  <span>
                    <span className="sr-only">Free: </span>
                    {free}
                  </span>
                </p>
                <p className="flex items-center gap-2 text-sm">
                  <Check className="size-4 shrink-0 text-good" aria-hidden />
                  <span>
                    <span className="sr-only">Plus: </span>
                    {plus}
                  </span>
                </p>
              </Card>
            </li>
          ))}
        </ul>
        <p className="text-sm text-muted">
          Free always includes invites and voting, friends, Moments and the map.{' '}
          {isPlus && <Badge tone="brand">Active</Badge>}
        </p>
      </section>

      <Link to="/plan" className="self-center">
        <Button variant="secondary">Back to planning</Button>
      </Link>
    </div>
  )
}
