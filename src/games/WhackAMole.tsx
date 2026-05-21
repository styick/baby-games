import { useCallback, useEffect, useRef, useState } from 'react'
import { useSound } from '../hooks/useSound'
import { COLORS } from '../utils/colors'
import styles from './WhackAMole.module.css'

const ANIMALS = ['🐹', '🐰', '🐻', '🐨'] as const
const HOLE_COUNT = 9
const MAX_VISIBLE = 2
const MAX_SCORE = 10
const MIN_VISIBLE_MS = 2000
const MAX_VISIBLE_MS = 3000
const SPAWN_INTERVAL_MS = 1200

const FLOWERS = ['🌸', '🌼', '🌺', '🌻', '🌷', '💐']
const CONFETTI_COLORS = Object.values(COLORS)
const FLOAT_PARTICLES = ['❤️', '⭐'] as const

type MoleState = 'hidden' | 'rising' | 'visible' | 'hiding' | 'wiggling'

type Mole = {
  animal: string
  state: MoleState
  hideAt: number
}

type FloatParticle = {
  id: number
  x: number
  y: number
  emoji: string
}

type ConfettiPiece = {
  id: number
  x: number
  y: number
  color: string
  cx: number
  cy: number
  rotation: number
}

let nextParticleId = 0
let nextConfettiId = 0

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function pickAnimal(): string {
  return ANIMALS[Math.floor(Math.random() * ANIMALS.length)]
}

function pickFloatParticle(): string {
  return FLOAT_PARTICLES[Math.floor(Math.random() * FLOAT_PARTICLES.length)]
}

function createEmptyMoles(): Mole[] {
  return Array.from({ length: HOLE_COUNT }, () => ({
    animal: '',
    state: 'hidden' as MoleState,
    hideAt: 0,
  }))
}

function countActiveMoles(moles: Mole[]): number {
  return moles.filter((m) => m.state === 'rising' || m.state === 'visible').length
}

function getAvailableHoles(moles: Mole[]): number[] {
  return moles
    .map((m, i) => (m.state === 'hidden' ? i : -1))
    .filter((i) => i >= 0)
}

export function WhackAMole() {
  const { playSynth } = useSound()
  const containerRef = useRef<HTMLDivElement>(null)
  const [moles, setMoles] = useState<Mole[]>(createEmptyMoles)
  const [score, setScore] = useState(0)
  const [particles, setParticles] = useState<FloatParticle[]>([])
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])
  const [celebrating, setCelebrating] = useState(false)

  const molesRef = useRef<Mole[]>(createEmptyMoles())
  const scoreRef = useRef(0)
  const celebratingRef = useRef(false)
  const spawnTimerRef = useRef<number | null>(null)
  const tickRafRef = useRef<number | null>(null)

  const updateMoles = useCallback((updater: (prev: Mole[]) => Mole[], force = false) => {
    const next = updater(molesRef.current)
    if (!force && next === molesRef.current) return
    molesRef.current = next
    setMoles([...next])
  }, [])

  const spawnMole = useCallback(() => {
    if (celebratingRef.current) return

    const active = countActiveMoles(molesRef.current)
    if (active >= MAX_VISIBLE) return

    const available = getAvailableHoles(molesRef.current)
    if (available.length === 0) return

    const holeIndex = available[Math.floor(Math.random() * available.length)]
    const visibleMs = randomBetween(MIN_VISIBLE_MS, MAX_VISIBLE_MS)

    updateMoles((prev) => {
      const next = [...prev]
      next[holeIndex] = {
        animal: pickAnimal(),
        state: 'rising',
        hideAt: performance.now() + visibleMs + 450,
      }
      return next
    })

    window.setTimeout(() => {
      updateMoles((prev) => {
        if (prev[holeIndex]?.state !== 'rising') return prev
        const next = [...prev]
        next[holeIndex] = { ...next[holeIndex], state: 'visible' }
        return next
      })
    }, 450)
  }, [updateMoles])

  const triggerCelebration = useCallback(() => {
    celebratingRef.current = true
    setCelebrating(true)

    playSynth('chime')
    window.setTimeout(() => playSynth('chime'), 200)
    window.setTimeout(() => playSynth('chime'), 400)
    window.setTimeout(() => playSynth('ding'), 600)

    const pieces: ConfettiPiece[] = Array.from({ length: 40 }, () => {
      const x = randomBetween(5, 95)
      const y = randomBetween(10, 40)
      return {
        id: nextConfettiId++,
        x,
        y,
        color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
        cx: randomBetween(-120, 120),
        cy: randomBetween(80, 220),
        rotation: randomBetween(-720, 720),
      }
    })
    setConfetti(pieces)

    window.setTimeout(() => {
      scoreRef.current = 0
      setScore(0)
      setConfetti([])
      setCelebrating(false)
      celebratingRef.current = false
    }, 2500)
  }, [playSynth])

  const handleWhack = useCallback(
    (holeIndex: number, event: React.PointerEvent<HTMLButtonElement>) => {
      const mole = molesRef.current[holeIndex]
      if (!mole || mole.state === 'hidden' || mole.state === 'hiding' || mole.state === 'wiggling') {
        return
      }

      playSynth('ding')

      const rect = event.currentTarget.getBoundingClientRect()
      const containerRect = containerRef.current?.getBoundingClientRect()
      const x = containerRect ? rect.left - containerRect.left + rect.width / 2 : rect.left
      const y = containerRect ? rect.top - containerRect.top + rect.height / 2 : rect.top

      const particle: FloatParticle = {
        id: nextParticleId++,
        x,
        y,
        emoji: pickFloatParticle(),
      }
      setParticles((prev) => [...prev, particle])

      updateMoles((prev) => {
        const next = [...prev]
        next[holeIndex] = { ...next[holeIndex], state: 'wiggling' }
        return next
      })

      window.setTimeout(() => {
        updateMoles((prev) => {
          const next = [...prev]
          next[holeIndex] = { animal: '', state: 'hidden', hideAt: 0 }
          return next
        })
      }, 600)

      const newScore = scoreRef.current + 1
      scoreRef.current = newScore
      setScore(newScore)

      if (newScore >= MAX_SCORE) {
        window.setTimeout(() => triggerCelebration(), 400)
      }
    },
    [playSynth, triggerCelebration, updateMoles],
  )

  useEffect(() => {
    const tick = () => {
      const now = performance.now()
      let changed = false

      updateMoles((prev) => {
        const next = prev.map((mole) => {
          if (
            (mole.state === 'visible' || mole.state === 'rising') &&
            now >= mole.hideAt
          ) {
            changed = true
            return { ...mole, state: 'hiding' as MoleState }
          }
          return mole
        })
        return changed ? next : prev
      })

      if (changed) {
        window.setTimeout(() => {
          updateMoles((prev) => {
            const next = prev.map((mole) =>
              mole.state === 'hiding'
                ? { animal: '', state: 'hidden' as MoleState, hideAt: 0 }
                : mole,
            )
            return next
          })
        }, 500)
      }

      tickRafRef.current = requestAnimationFrame(tick)
    }

    tickRafRef.current = requestAnimationFrame(tick)

    return () => {
      if (tickRafRef.current !== null) {
        cancelAnimationFrame(tickRafRef.current)
      }
    }
  }, [updateMoles])

  useEffect(() => {
    spawnMole()

    spawnTimerRef.current = window.setInterval(() => {
      const active = countActiveMoles(molesRef.current)
      const target = Math.random() < 0.6 ? 1 : 2
      if (active < target) {
        spawnMole()
      }
    }, SPAWN_INTERVAL_MS)

    return () => {
      if (spawnTimerRef.current !== null) {
        window.clearInterval(spawnTimerRef.current)
      }
    }
  }, [spawnMole])

  useEffect(() => {
    if (particles.length === 0) return
    const timer = window.setTimeout(() => {
      setParticles((prev) => prev.slice(1))
    }, 1000)
    return () => window.clearTimeout(timer)
  }, [particles])

  return (
    <div ref={containerRef} className={styles.container}>
      {FLOWERS.map((flower, i) => (
        <span key={i} className={styles.flower} aria-hidden="true">
          {flower}
        </span>
      ))}

      <div className={styles.scoreBar} aria-label={`收集了 ${score} 颗星星`}>
        {Array.from({ length: MAX_SCORE }, (_, i) => (
          <span
            key={i}
            className={`${styles.scoreStar} ${i < score ? styles.filled : ''}`}
            aria-hidden="true"
          >
            ⭐
          </span>
        ))}
      </div>

      <div className={styles.grid}>
        {moles.map((mole, index) => (
          <div key={index} className={styles.hole}>
            <div className={styles.mound}>
              <div className={styles.moundGrass} />
            </div>
            {mole.state !== 'hidden' && (
              <button
                type="button"
                className={`${styles.animal} ${styles[mole.state]}`}
                aria-label="点击小动物"
                onPointerDown={(e) => {
                  e.stopPropagation()
                  handleWhack(index, e)
                }}
              >
                {mole.animal}
              </button>
            )}
          </div>
        ))}
      </div>

      {particles.map((p) => (
        <span
          key={p.id}
          className={styles.floatParticle}
          style={
            {
              left: p.x,
              top: p.y,
              '--fx': `${randomBetween(-20, 20)}px`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          {p.emoji}
        </span>
      ))}

      {celebrating && (
        <div className={styles.celebrationOverlay} aria-hidden="true">
          <span className={styles.celebrationText}>🎉</span>
        </div>
      )}

      {confetti.length > 0 && (
        <div className={styles.confettiLayer} aria-hidden="true">
          {confetti.map((piece) => (
            <span
              key={piece.id}
              className={styles.confetti}
              style={
                {
                  left: `${piece.x}%`,
                  top: `${piece.y}%`,
                  backgroundColor: piece.color,
                  '--cx': `${piece.cx}px`,
                  '--cy': `${piece.cy}px`,
                  '--cr': `${piece.rotation}deg`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
