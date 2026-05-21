import { useCallback, useEffect, useRef, useState } from 'react'
import { useSound } from '../hooks/useSound'
import styles from './StarCollect.module.css'

const JAR_CAPACITY = 10
const STAR_TIMEOUT_MS = 3000
const STAR_SIZE = 90
const JAR_MARGIN_BOTTOM = 100

type ActiveStar = {
  id: number
  x: number
  y: number
}

type FlyingStar = {
  id: number
  fromX: number
  fromY: number
  toX: number
  toY: number
}

type SparkleBurst = {
  id: number
  x: number
  y: number
  particles: Array<{ sx: number; sy: number }>
}

type FireworkStar = {
  id: number
  x: number
  y: number
  fx: number
  fy: number
}

type BgStar = {
  id: number
  x: number
  y: number
  delay: number
  size: number
}

let nextStarId = 0
let nextBurstId = 0
let nextFireworkId = 0
let nextFlyingId = 0

function randomBetween(min: number, max: number): number {
  return min + Math.random() * (max - min)
}

function createBgStars(count: number): BgStar[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: randomBetween(2, 98),
    y: randomBetween(5, 75),
    delay: randomBetween(0, 3),
    size: randomBetween(2, 4),
  }))
}

function randomStarPosition(width: number, height: number): { x: number; y: number } {
  const padding = STAR_SIZE / 2 + 20
  const topPadding = padding + 60
  const bottomPadding = padding + JAR_MARGIN_BOTTOM + 80

  return {
    x: randomBetween(padding, Math.max(padding + 1, width - padding)),
    y: randomBetween(topPadding, Math.max(topPadding + 1, height - bottomPadding)),
  }
}

export function StarCollect() {
  const { playSynth } = useSound()
  const containerRef = useRef<HTMLDivElement>(null)
  const jarRef = useRef<HTMLDivElement>(null)

  const [bgStars] = useState(() => createBgStars(30))
  const [jarCount, setJarCount] = useState(0)
  const [activeStar, setActiveStar] = useState<ActiveStar | null>(null)
  const [flyingStars, setFlyingStars] = useState<FlyingStar[]>([])
  const [sparkles, setSparkles] = useState<SparkleBurst[]>([])
  const [fireworks, setFireworks] = useState<FireworkStar[]>([])
  const [moonHappy, setMoonHappy] = useState(false)
  const [jarState, setJarState] = useState<'idle' | 'shaking' | 'opening'>('idle')

  const jarCountRef = useRef(0)
  const celebratingRef = useRef(false)
  const starTimeoutRef = useRef<number | null>(null)
  const spawnDelayRef = useRef<number | null>(null)
  const dimensionsRef = useRef({ width: 0, height: 0 })

  const clearStarTimeout = useCallback(() => {
    if (starTimeoutRef.current !== null) {
      window.clearTimeout(starTimeoutRef.current)
      starTimeoutRef.current = null
    }
  }, [])

  const clearSpawnDelay = useCallback(() => {
    if (spawnDelayRef.current !== null) {
      window.clearTimeout(spawnDelayRef.current)
      spawnDelayRef.current = null
    }
  }, [])

  const getJarPosition = useCallback((): { x: number; y: number } => {
    const container = containerRef.current
    const jar = jarRef.current
    if (!container || !jar) {
      return { x: dimensionsRef.current.width / 2, y: dimensionsRef.current.height - 80 }
    }

    const containerRect = container.getBoundingClientRect()
    const jarRect = jar.getBoundingClientRect()

    return {
      x: jarRect.left - containerRect.left + jarRect.width / 2,
      y: jarRect.top - containerRect.top + jarRect.height * 0.4,
    }
  }, [])

  const spawnStar = useCallback(() => {
    if (celebratingRef.current) return

    const { width, height } = dimensionsRef.current
    if (width === 0 || height === 0) return

    clearStarTimeout()

    const pos = randomStarPosition(width, height)
    const star: ActiveStar = {
      id: nextStarId++,
      x: pos.x,
      y: pos.y,
    }

    setActiveStar(star)

    starTimeoutRef.current = window.setTimeout(() => {
      setActiveStar(null)
      spawnDelayRef.current = window.setTimeout(() => {
        spawnStar()
      }, 400)
    }, STAR_TIMEOUT_MS)
  }, [clearStarTimeout])

  const triggerJarFullCelebration = useCallback(() => {
    celebratingRef.current = true
    setJarState('shaking')
    setMoonHappy(true)

    playSynth('chime')
    window.setTimeout(() => playSynth('chime'), 150)
    window.setTimeout(() => playSynth('chime'), 300)
    window.setTimeout(() => playSynth('chime'), 450)
    window.setTimeout(() => playSynth('ding'), 600)

    window.setTimeout(() => {
      setJarState('opening')

      const container = containerRef.current
      const jarPos = getJarPosition()
      const width = dimensionsRef.current.width

      const burstStars: FireworkStar[] = Array.from({ length: 20 }, () => {
        const angle = randomBetween(-Math.PI * 0.9, -Math.PI * 0.1)
        const distance = randomBetween(80, 280)
        return {
          id: nextFireworkId++,
          x: jarPos.x,
          y: jarPos.y,
          fx: Math.cos(angle) * distance,
          fy: Math.sin(angle) * distance,
        }
      })

      if (container) {
        for (let i = 0; i < 10; i++) {
          burstStars.push({
            id: nextFireworkId++,
            x: randomBetween(width * 0.2, width * 0.8),
            y: jarPos.y,
            fx: randomBetween(-60, 60),
            fy: randomBetween(-200, -80),
          })
        }
      }

      setFireworks(burstStars)
    }, 600)

    window.setTimeout(() => {
      jarCountRef.current = 0
      setJarCount(0)
      setJarState('idle')
      setMoonHappy(false)
      setFireworks([])
      celebratingRef.current = false
      spawnStar()
    }, 2800)
  }, [getJarPosition, playSynth, spawnStar])

  const handleCollectStar = useCallback(
    (star: ActiveStar) => {
      if (celebratingRef.current) return

      clearStarTimeout()
      setActiveStar(null)
      playSynth('chime')

      const jarPos = getJarPosition()
      const flying: FlyingStar = {
        id: nextFlyingId++,
        fromX: star.x,
        fromY: star.y,
        toX: jarPos.x,
        toY: jarPos.y,
      }
      setFlyingStars((prev) => [...prev, flying])

      const particleCount = 8 + Math.floor(Math.random() * 4)
      const burst: SparkleBurst = {
        id: nextBurstId++,
        x: star.x,
        y: star.y,
        particles: Array.from({ length: particleCount }, () => {
          const angle = Math.random() * Math.PI * 2
          const dist = randomBetween(30, 70)
          return {
            sx: Math.cos(angle) * dist,
            sy: Math.sin(angle) * dist,
          }
        }),
      }
      setSparkles((prev) => [...prev, burst])

      window.setTimeout(() => {
        const newCount = jarCountRef.current + 1
        jarCountRef.current = newCount
        setJarCount(newCount)

        if (newCount >= JAR_CAPACITY) {
          window.setTimeout(() => triggerJarFullCelebration(), 300)
        } else {
          spawnDelayRef.current = window.setTimeout(() => {
            spawnStar()
          }, 500)
        }
      }, 700)
    },
    [clearStarTimeout, getJarPosition, playSynth, spawnStar, triggerJarFullCelebration],
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const updateDimensions = () => {
      const { width, height } = container.getBoundingClientRect()
      dimensionsRef.current = { width, height }
    }

    updateDimensions()
    spawnStar()

    window.addEventListener('resize', updateDimensions)
    return () => {
      window.removeEventListener('resize', updateDimensions)
      clearStarTimeout()
      clearSpawnDelay()
    }
  }, [clearSpawnDelay, clearStarTimeout, spawnStar])

  useEffect(() => {
    if (flyingStars.length === 0) return
    const timer = window.setTimeout(() => {
      setFlyingStars((prev) => prev.slice(1))
    }, 700)
    return () => window.clearTimeout(timer)
  }, [flyingStars])

  useEffect(() => {
    if (sparkles.length === 0) return
    const timer = window.setTimeout(() => {
      setSparkles((prev) => prev.slice(1))
    }, 600)
    return () => window.clearTimeout(timer)
  }, [sparkles])

  useEffect(() => {
    if (fireworks.length === 0) return
    const timer = window.setTimeout(() => {
      setFireworks([])
    }, 1600)
    return () => window.clearTimeout(timer)
  }, [fireworks])

  const fillPercent = (jarCount / JAR_CAPACITY) * 100

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.bgStars} aria-hidden="true">
        {bgStars.map((star) => (
          <span
            key={star.id}
            className={styles.bgStar}
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: star.size,
              height: star.size,
              animationDelay: `${star.delay}s`,
            }}
          />
        ))}
      </div>

      <div className={`${styles.moon} ${moonHappy ? styles.happy : ''}`} aria-hidden="true">
        🌙
        <span className={styles.moonSmile}>😊</span>
      </div>

      {activeStar && (
        <button
          type="button"
          className={styles.activeStar}
          aria-label="收集星星"
          style={{ left: activeStar.x, top: activeStar.y }}
          onPointerDown={(e) => {
            e.stopPropagation()
            handleCollectStar(activeStar)
          }}
        >
          ⭐
        </button>
      )}

      {flyingStars.map((fs) => (
        <span
          key={fs.id}
          className={styles.flyingStar}
          style={
            {
              '--from-x': `${fs.fromX}px`,
              '--from-y': `${fs.fromY}px`,
              '--to-x': `${fs.toX}px`,
              '--to-y': `${fs.toY}px`,
            } as React.CSSProperties
          }
          aria-hidden="true"
        >
          ⭐
        </span>
      ))}

      {sparkles.map((burst) => (
        <div
          key={burst.id}
          className={styles.sparkleBurst}
          style={{ left: burst.x, top: burst.y }}
          aria-hidden="true"
        >
          {burst.particles.map((p, i) => (
            <span
              key={i}
              className={styles.sparkle}
              style={
                {
                  '--sx': `${p.sx}px`,
                  '--sy': `${p.sy}px`,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}

      <div className={styles.jarArea}>
        <div
          ref={jarRef}
          className={`${styles.jar} ${jarState === 'shaking' ? styles.shaking : ''} ${jarState === 'shaking' || jarState === 'opening' ? styles.glowing : ''} ${jarState === 'opening' ? styles.opening : ''}`}
          aria-label={`星星罐 ${jarCount} / ${JAR_CAPACITY}`}
        >
          <div className={styles.jarLid} />
          <div className={styles.jarBody}>
            <div className={styles.jarFill} style={{ height: `${fillPercent}%` }} />
            <span className={styles.jarCount} aria-hidden="true">
              {jarCount > 0 ? jarCount : ''}
            </span>
          </div>
        </div>
      </div>

      {fireworks.length > 0 && (
        <div className={styles.fireworkLayer} aria-hidden="true">
          {fireworks.map((fw) => (
            <span
              key={fw.id}
              className={styles.fireworkStar}
              style={
                {
                  left: fw.x,
                  top: fw.y,
                  '--fx': `${fw.fx}px`,
                  '--fy': `${fw.fy}px`,
                } as React.CSSProperties
              }
            >
              ⭐
            </span>
          ))}
        </div>
      )}
    </div>
  )
}
