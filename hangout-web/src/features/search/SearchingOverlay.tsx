import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const STEPS = ['Finding places near you…', 'Checking opening hours…', 'Working out travel times…', 'Adding up the real cost…', 'Building your night…']

/** Full-screen loading state while the engine runs (SRS 8.4: step messages, not a spinner). */
export function SearchingOverlay({ open }: { open: boolean }) {
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (!open) return
    setStep(0)
    const id = setInterval(() => setStep((s) => Math.min(s + 1, STEPS.length - 1)), 900)
    return () => clearInterval(id)
  }, [open])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-bg/90 px-6 backdrop-blur"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="relative size-20">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/30" />
              <span className="absolute inset-3 rounded-full bg-accent" />
            </div>
            <AnimatePresence mode="wait">
              <motion.p
                key={step}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="font-display text-2xl font-bold"
              >
                {STEPS[step]}
              </motion.p>
            </AnimatePresence>
            <div className="flex gap-1.5" aria-hidden>
              {STEPS.map((_, i) => (
                <span key={i} className={`h-1.5 w-6 rounded-full ${i <= step ? 'bg-accent' : 'bg-line'}`} />
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
