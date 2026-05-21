import { useCallback, useMemo, useState } from 'react'
import { useSound } from '../hooks/useSound'
import { COLORS } from '../utils/colors'
import styles from './Fireworks.module.css'

const FIREWORK_COLORS = Object.values(COLORS)
const STAR_COUNT = 40

type Rocket = {
  id: number
  startX: number
  startY: number
  targetX: number
  targetY: number
  color: string
  duration: number
}

type Explosion = {
  id: number
  x: number
  y: number
  color: string
  particles: Array<{
    tx: number
    ty: number
    size: number
    duration: number
    delay: number
    color: string
  }>
}

let nextId = 0

function randomColor(): string {
  return FIREWORK_COLORS[Math.floor(Math.random() * FIREWORK_COLORS.length)]
}

function createExplosion(x: number, y: number, baseColor: string): Explosion {
  const count = 20 + Math.floor(Math.random() * 11)
  const particles = Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2
    const speed = 60 + Math.random() * 120
    const gravity = 40 + Math.random() * 80
    const tx = Math.cos(angle) * speed
    const ty = Math.sin(angle) * speed + gravity
    const hueShift = Math.random() > 0.5 ? baseColor : randomColor()

    return {
      tx,
      ty,
      size: 4 + Math.random() * 4,
      duration: 900 + Math.random() * 600,
      delay: Math.random() * 80,
      color: hueShift,
    }
  })

  return { id: nextId++, x, y, color: baseColor, particles }
}

function generateStars() {
  return Array.from({ length: STAR_COUNT }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 70}%`,
    duration: `${2 + Math.random() * 4}s`,
    delay: `${Math.random() * 4}s`,
    opacity: 0.3 + Math.random() * 0.7,
    size: 2 + Math.random() * 3,
  }))
}

export function Fireworks() {
  const { playSynth } = useSound()
  const stars = useMemo(() => generateStars(), [])
  const [rockets, setRockets] = useState<Rocket[]>([])
  const [explosions, setExplosions] = useState<Explosion[]>([])

  const handleLaunch = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const targetX = clientX - rect.left
      const targetY = clientY - rect.top
      const startX = targetX + (Math.random() - 0.5) * 40
      const startY = rect.height
      const color = randomColor()
      const distance = Math.hypot(targetX - startX, targetY - startY)
      const duration = Math.max(500, Math.min(1200, distance * 1.2))

      playSynth('whoosh')

      const rocket: Rocket = {
        id: nextId++,
        startX,
        startY,
        targetX,
        targetY,
        color,
        duration,
      }

      setRockets((prev) => [...prev, rocket])

      window.setTimeout(() => {
        setRockets((prev) => prev.filter((r) => r.id !== rocket.id))
        const explosion = createExplosion(targetX, targetY, color)
        setExplosions((prev) => [...prev, explosion])
        playSynth('chime')
        window.setTimeout(() => {
          setExplosions((prev) => prev.filter((e) => e.id !== explosion.id))
        }, 1600)
      }, duration)
    },
    [playSynth],
  )

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect()
      handleLaunch(e.clientX, e.clientY, rect)
    },
    [handleLaunch],
  )

  return (
    <div className={styles.container} onPointerDown={handlePointerDown}>
      <div className={styles.stars} aria-hidden="true">
        {stars.map((star) => (
          <span
            key={star.id}
            className={styles.star}
            style={{
              left: star.left,
              top: star.top,
              width: star.size,
              height: star.size,
              opacity: star.opacity,
              ['--duration' as string]: star.duration,
              ['--delay' as string]: star.delay,
            }}
          />
        ))}
      </div>

      {rockets.map((rocket) => (
        <span
          key={rocket.id}
          className={styles.rocket}
          style={{
            left: rocket.startX,
            top: rocket.startY,
            color: rocket.color,
            backgroundColor: rocket.color,
            ['--dx' as string]: `${rocket.targetX - rocket.startX}px`,
            ['--dy' as string]: `${rocket.targetY - rocket.startY}px`,
            ['--rise-duration' as string]: `${rocket.duration}ms`,
          }}
        />
      ))}

      {explosions.map((explosion) => (
        <div
          key={explosion.id}
          className={styles.explosion}
          style={{ left: explosion.x, top: explosion.y }}
        >
          {explosion.particles.map((particle, i) => (
            <span
              key={i}
              className={styles.particle}
              style={
                {
                  '--tx': `${particle.tx}px`,
                  '--ty': `${particle.ty}px`,
                  '--size': `${particle.size}px`,
                  '--duration': `${particle.duration}ms`,
                  '--delay': `${particle.delay}ms`,
                  '--color': particle.color,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  )
}
