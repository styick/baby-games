import { useCallback, useEffect, useRef, useState } from 'react'
import { useSound } from '../hooks/useSound'
import { COLORS } from '../utils/colors'
import styles from './BubblePop.module.css'

const BUBBLE_COLORS = Object.values(COLORS)
const MIN_BUBBLES = 8
const MAX_BUBBLES = 12
const MIN_SIZE = 60
const MAX_SIZE = 120

type Bubble = {
  id: number
  x: number
  y: number
  size: number
  color: string
  speed: number
  wobblePhase: number
  wobbleAmplitude: number
}

type Burst = {
  id: number
  x: number
  y: number
  color: string
  particles: Array<{ tx: number; ty: number; color: string }>
}

let nextBubbleId = 0
let nextBurstId = 0

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function createBubble(width: number, height: number): Bubble {
  const size = randomBetween(MIN_SIZE, MAX_SIZE)
  const maxX = Math.max(size, width - size)

  return {
    id: nextBubbleId++,
    x: randomBetween(size / 2, maxX),
    y: height + size,
    size,
    color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)],
    speed: randomBetween(0.4, 1.2),
    wobblePhase: randomBetween(0, Math.PI * 2),
    wobbleAmplitude: randomBetween(0.3, 1),
  }
}

function createBurst(x: number, y: number, color: string): Burst {
  const particleCount = 10 + Math.floor(Math.random() * 6)
  const particles = Array.from({ length: particleCount }, () => {
    const angle = Math.random() * Math.PI * 2
    const distance = randomBetween(40, 100)
    return {
      tx: Math.cos(angle) * distance,
      ty: Math.sin(angle) * distance,
      color: BUBBLE_COLORS[Math.floor(Math.random() * BUBBLE_COLORS.length)] ?? color,
    }
  })

  return { id: nextBurstId++, x, y, color, particles }
}

export function BubblePop() {
  const { playSynth } = useSound()
  const containerRef = useRef<HTMLDivElement>(null)
  const [bubbles, setBubbles] = useState<Bubble[]>([])
  const [bursts, setBursts] = useState<Burst[]>([])
  const bubblesRef = useRef<Bubble[]>([])
  const rafRef = useRef<number | null>(null)
  const dimensionsRef = useRef({ width: 0, height: 0 })

  const spawnBubble = useCallback(() => {
    const { width, height } = dimensionsRef.current
    if (width === 0 || height === 0) return

    const bubble = createBubble(width, height)
    bubblesRef.current = [...bubblesRef.current, bubble]
    setBubbles([...bubblesRef.current])
  }, [])

  const initBubbles = useCallback(() => {
    const container = containerRef.current
    if (!container) return

    const { width, height } = container.getBoundingClientRect()
    dimensionsRef.current = { width, height }

    const count = MIN_BUBBLES + Math.floor(Math.random() * (MAX_BUBBLES - MIN_BUBBLES + 1))
    const initial: Bubble[] = []

    for (let i = 0; i < count; i++) {
      const bubble = createBubble(width, height)
      bubble.y = randomBetween(height * 0.1, height * 0.9)
      initial.push(bubble)
    }

    bubblesRef.current = initial
    setBubbles(initial)
  }, [])

  useEffect(() => {
    initBubbles()

    const handleResize = () => {
      const container = containerRef.current
      if (!container) return
      const { width, height } = container.getBoundingClientRect()
      dimensionsRef.current = { width, height }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [initBubbles])

  useEffect(() => {
    let lastTime = performance.now()

    const tick = (now: number) => {
      const delta = (now - lastTime) / 16.67
      lastTime = now

      let changed = false
      const updated: Bubble[] = []

      for (const bubble of bubblesRef.current) {
        const wobble = Math.sin(now * 0.001 + bubble.wobblePhase) * bubble.wobbleAmplitude
        const newY = bubble.y - bubble.speed * delta
        const newX = bubble.x + wobble * 0.3 * delta

        if (newY + bubble.size / 2 < -20) {
          changed = true
          continue
        }

        if (newX !== bubble.x || newY !== bubble.y) {
          changed = true
        }

        updated.push({ ...bubble, x: newX, y: newY })
      }

      if (changed) {
        bubblesRef.current = updated
        setBubbles(updated)
      }

      if (bubblesRef.current.length < MIN_BUBBLES) {
        spawnBubble()
      } else if (bubblesRef.current.length > MAX_BUBBLES) {
        bubblesRef.current = bubblesRef.current.slice(0, MAX_BUBBLES)
        setBubbles([...bubblesRef.current])
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [spawnBubble])


  const handlePop = useCallback(
    (bubble: Bubble) => {
      playSynth('pop')
      bubblesRef.current = bubblesRef.current.filter((b) => b.id !== bubble.id)
      setBubbles([...bubblesRef.current])
      const burst = createBurst(bubble.x, bubble.y, bubble.color)
      setBursts((prev) => [...prev, burst])
      window.setTimeout(() => {
        setBursts((prev) => prev.filter((b) => b.id !== burst.id))
      }, 650)

      while (bubblesRef.current.length < MIN_BUBBLES) {
        spawnBubble()
      }
    },
    [playSynth, spawnBubble],
  )

  return (
    <div ref={containerRef} className={styles.container}>
      {bubbles.map((bubble) => (
        <button
          key={bubble.id}
          type="button"
          className={styles.bubble}
          aria-label="戳泡泡"
          style={{
            width: bubble.size,
            height: bubble.size,
            left: bubble.x - bubble.size / 2,
            top: bubble.y - bubble.size / 2,
            background: `radial-gradient(circle at 35% 30%, rgba(255,255,255,0.5), ${bubble.color})`,
            animationDuration: `${2.5 + bubble.wobbleAmplitude}s`,
          }}
          onPointerDown={(e) => {
            e.stopPropagation()
            handlePop(bubble)
          }}
        />
      ))}

      {bursts.map((burst) => (
        <div
          key={burst.id}
          className={styles.burst}
          style={{ left: burst.x, top: burst.y }}
        >
          {burst.particles.map((particle, i) => (
            <span
              key={i}
              className={styles.burstParticle}
              style={
                {
                  backgroundColor: particle.color,
                  '--tx': `${particle.tx}px`,
                  '--ty': `${particle.ty}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}
