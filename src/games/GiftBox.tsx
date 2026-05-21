import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { useSound } from '../hooks/useSound'
import styles from './GiftBox.module.css'

const SURPRISES = ['🧸', '🎈', '⭐', '🌈', '🦋', '🎀', '🍭', '🌸'] as const

const BOX_LAYOUT = [
  { id: 0, top: '12%', left: '8%', color: '#FF6B9D', ribbon: '#FFD93D' },
  { id: 1, top: '18%', left: '55%', color: '#4D96FF', ribbon: '#FF6B6B' },
  { id: 2, top: '48%', left: '20%', color: '#6BCB77', ribbon: '#9B59B6' },
  { id: 3, top: '52%', left: '62%', color: '#FF9F43', ribbon: '#4ECDC4' },
  { id: 4, top: '72%', left: '10%', color: '#9B59B6', ribbon: '#FFD93D' },
  { id: 5, top: '68%', left: '58%', color: '#FF6B6B', ribbon: '#6BCB77' },
] as const

type BoxPhase = 'idle' | 'shaking' | 'open' | 'rewrapping'

type ConfettiParticle = {
  id: number
  x: number
  y: number
  color: string
  angle: number
}

type BoxState = {
  phase: BoxPhase
  surprise: string
  confetti: ConfettiParticle[]
}

const CONFETTI_COLORS = ['#FF6B9D', '#FFD93D', '#4D96FF', '#6BCB77', '#FF9F43', '#9B59B6']

function pickSurprise(lastSurprise: string | null): string {
  const options = lastSurprise
    ? SURPRISES.filter((s) => s !== lastSurprise)
    : [...SURPRISES]
  return options[Math.floor(Math.random() * options.length)]
}

function createConfetti(count: number): ConfettiParticle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 50 + (Math.random() - 0.5) * 20,
    y: 40 + (Math.random() - 0.5) * 10,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    angle: Math.random() * 360,
  }))
}

function GiftBoxItem({
  layout,
  state,
  onOpen,
}: {
  layout: (typeof BOX_LAYOUT)[number]
  state: BoxState
  onOpen: () => void
}) {
  const { phase, surprise, confetti } = state
  const isInteractive = phase === 'idle'

  return (
    <button
      type="button"
      className={`${styles.giftBox} ${styles[`phase${phase.charAt(0).toUpperCase()}${phase.slice(1)}`]}`}
      style={{
        top: layout.top,
        left: layout.left,
        '--box-color': layout.color,
        '--ribbon-color': layout.ribbon,
      } as CSSProperties}
      onPointerDown={isInteractive ? onOpen : undefined}
      disabled={!isInteractive}
      aria-label="打开礼物"
    >
      <div className={styles.boxBody}>
        <div className={styles.ribbonVertical} />
        <div className={styles.ribbonHorizontal} />
        <div className={styles.bow}>🎀</div>
      </div>
      <div className={styles.lid}>
        <div className={styles.lidRibbon} />
      </div>

      {phase === 'open' || phase === 'rewrapping' ? (
        <>
          <div
            className={`${styles.surprise} ${phase === 'rewrapping' ? styles.surpriseFade : ''}`}
            aria-hidden="true"
          >
            {surprise}
          </div>
          <div className={styles.confettiBurst} aria-hidden="true">
            {confetti.map((p) => (
              <span
                key={p.id}
                className={styles.confettiParticle}
                style={{
                  left: `${p.x}%`,
                  top: `${p.y}%`,
                  backgroundColor: p.color,
                  '--angle': `${p.angle}deg`,
                } as CSSProperties}
              />
            ))}
          </div>
        </>
      ) : null}
    </button>
  )
}

export function GiftBox() {
  const { playSynth } = useSound()
  const timerRefs = useRef<Map<number, number>>(new Map())
  const lastSurpriseRefs = useRef<Map<number, string>>(new Map())

  const [boxStates, setBoxStates] = useState<Record<number, BoxState>>(() =>
    Object.fromEntries(
      BOX_LAYOUT.map((b) => [b.id, { phase: 'idle' as BoxPhase, surprise: '', confetti: [] }]),
    ),
  )

  const clearBoxTimers = useCallback((boxId: number) => {
    const existing = timerRefs.current.get(boxId)
    if (existing !== undefined) {
      window.clearTimeout(existing)
      timerRefs.current.delete(boxId)
    }
  }, [])

  const handleOpen = useCallback(
    (boxId: number) => {
      let surprise = ''
      let shouldOpen = false

      setBoxStates((prev) => {
        const current = prev[boxId]
        if (!current || current.phase !== 'idle') {
          return prev
        }

        shouldOpen = true
        const lastSurprise = lastSurpriseRefs.current.get(boxId) ?? null
        surprise = pickSurprise(lastSurprise)
        lastSurpriseRefs.current.set(boxId, surprise)

        return {
          ...prev,
          [boxId]: { phase: 'shaking', surprise, confetti: [] },
        }
      })

      if (!shouldOpen) {
        return
      }

      clearBoxTimers(boxId)

      const openTimer = window.setTimeout(() => {
        playSynth('chime')
        setBoxStates((prev) => ({
          ...prev,
          [boxId]: {
            phase: 'open',
            surprise,
            confetti: createConfetti(12),
          },
        }))

        const rewrapTimer = window.setTimeout(() => {
          setBoxStates((prev) => ({
            ...prev,
            [boxId]: { ...prev[boxId], phase: 'rewrapping' },
          }))

          const resetTimer = window.setTimeout(() => {
            setBoxStates((prev) => ({
              ...prev,
              [boxId]: { phase: 'idle', surprise: '', confetti: [] },
            }))
            timerRefs.current.delete(boxId)
          }, 600)

          timerRefs.current.set(boxId, resetTimer)
        }, 2000)

        timerRefs.current.set(boxId, rewrapTimer)
      }, 300)

      timerRefs.current.set(boxId, openTimer)
    },
    [clearBoxTimers, playSynth],
  )

  useEffect(() => {
    const timers = timerRefs.current
    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      timers.clear()
    }
  }, [])

  return (
    <div className={styles.container}>
      <div className={styles.sparkles} aria-hidden="true">
        {Array.from({ length: 20 }, (_, i) => (
          <span
            key={i}
            className={styles.sparkle}
            style={{
              left: `${(i * 17 + 5) % 95}%`,
              top: `${(i * 23 + 3) % 90}%`,
              animationDelay: `${(i * 0.4) % 3}s`,
            }}
          />
        ))}
      </div>

      <div className={styles.playArea}>
        {BOX_LAYOUT.map((layout) => (
          <GiftBoxItem
            key={layout.id}
            layout={layout}
            state={boxStates[layout.id]}
            onOpen={() => handleOpen(layout.id)}
          />
        ))}
      </div>
    </div>
  )
}
