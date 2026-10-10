import React, { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Check, ChevronLeft, ChevronRight, Pause, Play, Timer, X } from 'lucide-react'

/**
 * CookMode — a fullscreen, step-by-step cooking view.
 * Big current step, checkable progress, and a built-in timer.
 */
export default function CookMode({ recipe, onClose }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [done, setDone] = useState(() => new Set())
  const [secondsLeft, setSecondsLeft] = useState(null) // null = timer idle
  const [running, setRunning] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')

  const steps = recipe.steps || []
  const total = steps.length
  const finished = stepIndex >= total

  // Timer tick
  useEffect(() => {
    if (!running || secondsLeft == null) return
    const t = setInterval(() => {
      setSecondsLeft(s => (s <= 1 ? 0 : s - 1))
    }, 1000)
    return () => clearInterval(t)
  }, [running, secondsLeft])

  // Chime when the timer hits zero
  const chimedRef = useRef(false)
  useEffect(() => {
    if (secondsLeft === 0 && !chimedRef.current) {
      chimedRef.current = true
      setRunning(false)
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.1, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.5)
        osc.connect(gain).connect(ctx.destination)
        osc.start(); osc.stop(ctx.currentTime + 1.6)
      } catch { /* silent */ }
    }
  }, [secondsLeft])

  function startTimer(mins) {
    chimedRef.current = false
    setSecondsLeft(Math.round(mins * 60))
    setRunning(true)
  }

  function fmt(s) {
    const m = Math.floor(s / 60), sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  function toggleDone(i) {
    setDone(prev => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const progress = total ? done.size / total : 0

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] bg-bark text-cream flex flex-col"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-cream/10">
        <div className="flex items-center gap-3">
          <span className="text-xl">🍳</span>
          <div>
            <div className="font-display font-bold leading-tight">Cook Mode</div>
            <div className="text-cream/50 text-xs">{recipe.title}</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-cream/50">{done.size}/{total} done</span>
          <button onClick={onClose}
            className="p-2 rounded-full hover:bg-cream/10 transition-all"
            aria-label="Exit cook mode">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-cream/10">
        <div className="h-full bg-spice transition-all duration-500" style={{ width: `${progress * 100}%` }} />
      </div>

      {/* Main */}
      <div className="flex-1 overflow-y-auto flex items-center justify-center px-6 py-10">
        {finished ? (
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="text-center max-w-lg">
            <div className="text-7xl mb-6">🥂</div>
            <h2 className="font-display text-4xl font-bold mb-3">Enjoy!</h2>
            <p className="text-cream/60">
              You finished <strong>{recipe.title}</strong>. Take a photo before the first bite — future you will thank you.
            </p>
            <button onClick={onClose}
              className="mt-8 px-6 py-3 bg-spice text-white rounded-xl font-semibold hover:bg-spice/90 active:scale-95 transition-all">
              Back to RecipeVault
            </button>
          </motion.div>
        ) : (
          <div className="max-w-2xl w-full text-center">
            <div className="text-cream/40 text-sm mb-4 tracking-wide uppercase">Step {stepIndex + 1} of {total}</div>
            <motion.p
              key={stepIndex}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-display text-3xl md:text-5xl font-bold leading-snug"
            >
              {steps[stepIndex]}
            </motion.p>

            {/* Timer */}
            <div className="mt-12 flex flex-col items-center gap-3">
              {secondsLeft == null ? (
                <div className="flex items-center gap-2 text-cream/60">
                  <Timer size={16} />
                  <button onClick={() => startTimer(recipe.cook_time || 15)}
                    className="px-3 py-1.5 rounded-full bg-cream/10 hover:bg-cream/20 text-sm transition-all">
                    Start {recipe.cook_time || 15} min timer
                  </button>
                  <span className="text-cream/30">or</span>
                  <div className="flex items-center gap-1 bg-cream/10 rounded-full px-1">
                    <input
                      type="number" min="1" max="180"
                      value={customMinutes}
                      onChange={e => setCustomMinutes(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter' && Number(customMinutes) > 0) startTimer(Number(customMinutes)) }}
                      placeholder="min"
                      className="w-16 bg-transparent text-center text-sm py-1.5 focus:outline-none placeholder-cream/30"
                      aria-label="Custom timer minutes" />
                    <button onClick={() => Number(customMinutes) > 0 && startTimer(Number(customMinutes))}
                      className="p-1.5 rounded-full hover:bg-cream/20 transition-all" aria-label="Start custom timer">
                      <Play size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <span className="font-display text-4xl font-bold tabular-nums" style={{ color: secondsLeft === 0 ? '#f4a15d' : undefined }}>
                    {secondsLeft === 0 ? "Time's up!" : fmt(secondsLeft)}
                  </span>
                  <button onClick={() => { setRunning(r => !r); if (secondsLeft === 0) { chimedRef.current = false; startTimer(recipe.cook_time || 15) } }}
                    className="p-3 rounded-full bg-spice text-white hover:bg-spice/90 active:scale-95 transition-all"
                    aria-label={running ? 'Pause timer' : 'Resume timer'}>
                    {running ? <Pause size={16} /> : <Play size={16} />}
                  </button>
                  <button onClick={() => { setSecondsLeft(null); setRunning(false) }}
                    className="p-3 rounded-full bg-cream/10 hover:bg-cream/20 transition-all" aria-label="Clear timer">
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom navigation */}
      <div className="border-t border-cream/10 px-5 py-4 flex items-center justify-between gap-3">
        <button onClick={() => setStepIndex(i => Math.max(0, i - 1))} disabled={stepIndex === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cream/10 hover:bg-cream/20 disabled:opacity-30 transition-all">
          <ChevronLeft size={16} /> Back
        </button>

        {!finished && (
          <button onClick={() => toggleDone(stepIndex)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
              done.has(stepIndex) ? 'bg-sage text-bark' : 'bg-cream/10 hover:bg-cream/20'}`}>
            <Check size={16} /> {done.has(stepIndex) ? 'Done' : 'Mark step done'}
          </button>
        )}

        <button onClick={() => setStepIndex(i => i + 1)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-spice text-white hover:bg-spice/90 active:scale-95 transition-all">
          {stepIndex === total - 1 ? 'Finish' : 'Next'} <ChevronRight size={16} />
        </button>
      </div>
    </motion.div>
  )
}
