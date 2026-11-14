import { motion } from 'framer-motion'
import { ArrowRight, Footprints, Gem, Receipt, Sparkles, Star, Users, Vote } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Logo } from '@/app/Logo'
import { Button } from '@/design'

/** AI-generated photos of fictional demo venues (public/demo). */
const photo = (name: string) => `${import.meta.env.BASE_URL}demo/${name}.jpg`

const steps = [
  { icon: Sparkles, title: 'Tell us the basics', text: 'Who, when, how long, your budget and the mood you want.' },
  { icon: Vote, title: 'Decide together', text: 'Send a link. Everyone adds a private budget and votes.' },
  { icon: Footprints, title: 'Just go', text: 'A door-to-door plan with travel, times and the all-in cost.' },
]

const promises = [
  { icon: Receipt, text: 'All-in cost with tax, tip and travel' },
  { icon: Users, text: 'Places your friends actually liked' },
  { icon: Gem, text: 'Hidden gems, not just the top results' },
]

const spots = [
  { img: 'kiln-1', name: 'Kiln & Clay Studio', note: 'Pottery date · 4.8' },
  { img: 'vinyl-1', name: 'Groove Room', note: 'Listening bar · 4.4' },
  { img: 'lantern-2', name: 'Paper Lantern', note: 'Tea house · 4.8' },
  { img: 'noodle-1', name: 'Noodle Lab', note: 'Ramen · 4.5' },
]

export default function LandingPage() {
  return (
    <div className="min-h-dvh">
      {/* Night hero: always dark (the "dark" class swaps the color tokens inside it), so the first screen feels like an evening out in both themes. */}
      <div className="dark relative overflow-hidden bg-[#120e24] text-white">
        <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 size-[34rem] rounded-full bg-[#3b2f8f] opacity-60 blur-3xl" />
        <div aria-hidden className="pointer-events-none absolute -right-24 bottom-[-12rem] size-[30rem] rounded-full bg-[#ff6b5a] opacity-30 blur-3xl" />

        <header className="relative mx-auto flex h-16 max-w-5xl items-center justify-between px-4">
          <Logo />
          <div className="flex items-center gap-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link to="/signup">
              <Button size="sm" variant="accent">
                Get started
              </Button>
            </Link>
          </div>
        </header>

        <section className="relative mx-auto grid max-w-5xl items-center gap-12 px-4 pt-8 pb-20 md:grid-cols-[1.05fr_1fr] md:pt-16 md:pb-28">
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="flex flex-col gap-6">
            <span className="inline-flex items-center gap-2 self-start rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-sm font-medium text-white/85">
              <span className="size-2 rounded-full bg-[#ff7e6f]" aria-hidden />
              For dates and nights out with friends
            </span>
            <h1 className="text-5xl leading-[1.02] font-extrabold md:text-7xl">
              Tonight,{' '}
              <span className="bg-gradient-to-r from-[#ff9b8f] to-[#c2b8ff] bg-clip-text text-transparent">planned</span> in under a
              minute.
            </h1>
            <p className="max-w-md text-lg text-white/70">
              Tell us your time, budget and mood. Get a ready plan everyone agrees on, backed by what your friends actually liked.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <Link to="/plan">
                <Button size="lg" variant="accent" icon={<ArrowRight className="size-5" aria-hidden />}>
                  Plan tonight
                </Button>
              </Link>
              <span className="text-sm text-white/60">3 free plans a month. No card needed.</span>
            </div>
            <ul className="flex flex-col gap-2.5 pt-2">
              {promises.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-center gap-3 text-sm text-white/80">
                  <span className="grid size-7 place-items-center rounded-full bg-white/10">
                    <Icon className="size-3.5 text-[#ffb3a9]" aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Product preview: photos behind a plan card, so visitors see the result before signing up. */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="relative mx-auto w-full max-w-md pt-10 pb-6 md:pt-0"
          >
            <img
              src={photo('rooftop-1')}
              alt=""
              className="absolute -top-2 right-0 hidden aspect-[4/3] w-60 rotate-6 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 sm:block md:-top-16 md:-right-8"
            />
            <img
              src={photo('moonbean-1')}
              alt=""
              className="absolute -bottom-6 -left-8 hidden aspect-[4/3] w-44 -rotate-6 rounded-2xl object-cover shadow-2xl ring-1 ring-white/10 sm:block"
            />

            <div className="relative flex flex-col gap-4 rounded-card bg-white p-5 text-[#1c1638] shadow-[0_30px_80px_-20px_rgb(0_0_0/0.6)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-[#6b6680]">Plan 1 · Playful + Cozy</p>
                  <p className="font-display text-2xl font-bold">Bowling, then dinner</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-bold">$108</p>
                  <p className="text-xs text-[#6b6680]">all-in · $54 each</p>
                </div>
              </div>

              <ol className="flex flex-col gap-3 text-sm">
                <li className="pl-[3.75rem] text-[#6b6680]">6:30 PM · 14 min by subway · $5.80</li>
                <Stop img="lanes-1" time="6:44 PM" title="Pin & Pint Lanes">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#ebe8fb] px-2 py-0.5 text-xs font-semibold text-[#3b2f8f]">
                    <Star className="size-3 fill-current" aria-hidden /> Madina · 4/5
                  </span>
                </Stop>
                <li className="pl-[3.75rem] text-[#6b6680]">9 min walk</li>
                <Stop img="saffron-1" time="7:53 PM" title="Little Saffron">
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#e3f4ec] px-2 py-0.5 text-xs font-semibold text-[#1f8a5b]">
                    <Receipt className="size-3" aria-hidden /> $9 under budget
                  </span>
                </Stop>
                <li className="pl-[3.75rem] text-[#6b6680]">9:08 PM · rideshare home · est. $16.92</li>
              </ol>
              <p className="text-xs text-[#6b6680]">Example plan with demo venues and AI photos.</p>
            </div>
          </motion.div>
        </section>
      </div>

      <main className="mx-auto max-w-5xl px-4">
        <section aria-labelledby="how-h" className="flex flex-col gap-8 py-20">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold tracking-wide text-accent uppercase">How it works</p>
            <h2 id="how-h" className="text-4xl font-extrabold">
              From "what do we do?" to out the door.
            </h2>
          </div>
          <ol className="grid gap-4 md:grid-cols-3">
            {steps.map(({ icon: Icon, title, text }, i) => (
              <li key={title} className="relative flex flex-col gap-3 overflow-hidden rounded-card border border-line bg-surface p-6 shadow-card">
                <span aria-hidden className="absolute -top-4 right-3 font-display text-8xl font-extrabold text-brand/10">
                  {i + 1}
                </span>
                <span className="grid size-11 place-items-center rounded-full bg-brand-soft text-brand dark:text-ink">
                  <Icon className="size-5" aria-hidden />
                </span>
                <h3 className="text-xl font-bold">
                  <span className="sr-only">Step {i + 1}: </span>
                  {title}
                </h3>
                <p className="text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section aria-labelledby="spots-h" className="flex flex-col gap-8 pb-20">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-semibold tracking-wide text-accent uppercase">Backed by your friends</p>
            <h2 id="spots-h" className="text-4xl font-extrabold">
              Places people you trust actually went.
            </h2>
            <p className="max-w-xl text-muted">
              Friends post Moments with photos, a rating and what they really spent. Your plans lean on them.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {spots.map((s) => (
              <li key={s.name} className="group relative overflow-hidden rounded-card">
                <img src={photo(s.img)} alt="" className="aspect-[3/4] w-full object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/20 to-transparent" />
                <div className="absolute inset-x-0 top-0 p-3 text-white">
                  <p className="font-display text-lg leading-tight font-bold">{s.name}</p>
                  <p className="text-xs text-white/80">{s.note}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted">Demo venues with AI-generated photos.</p>
        </section>

        <section className="mb-20 flex flex-col items-start gap-5 rounded-[2rem] bg-brand p-8 text-brand-ink md:flex-row md:items-center md:justify-between md:p-12">
          <div className="flex flex-col gap-2">
            <h2 className="text-3xl font-extrabold md:text-4xl">Free tonight?</h2>
            <p className="opacity-80">Five quick answers. Three complete plans.</p>
          </div>
          <Link to="/plan">
            <Button size="lg" variant="accent" icon={<ArrowRight className="size-5" aria-hidden />}>
              Plan tonight
            </Button>
          </Link>
        </section>
      </main>
    </div>
  )
}

function Stop({ img, time, title, children }: { img: string; time: string; title: string; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-3 rounded-xl bg-[#f7f5f2] p-2">
      <img src={photo(img)} alt="" className="size-12 shrink-0 rounded-lg object-cover" />
      <div className="flex min-w-0 flex-col gap-1">
        <p className="font-semibold">
          {time} · {title}
        </p>
        <span>{children}</span>
      </div>
    </li>
  )
}
