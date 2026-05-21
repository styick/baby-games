import { useCallback, useRef, useState } from 'react'
import { useSound } from '../hooks/useSound'
import { COLORS } from '../utils/colors'
import styles from './BabyPiano.module.css'

const NOTE_SYMBOLS = ['♪', '♫', '♩', '♬'] as const

const PIANO_KEYS = [
  { note: 'C4', frequency: 261.63, color: COLORS.red },
  { note: 'D4', frequency: 293.66, color: COLORS.orange },
  { note: 'E4', frequency: 329.63, color: COLORS.yellow },
  { note: 'F4', frequency: 349.23, color: COLORS.green },
  { note: 'G4', frequency: 392.0, color: COLORS.blue },
  { note: 'A4', frequency: 440.0, color: COLORS.purple },
  { note: 'B4', frequency: 493.88, color: COLORS.pink },
  { note: 'C5', frequency: 523.25, color: COLORS.teal },
] as const

type NoteParticle = {
  id: number
  symbol: string
  drift: number
  rotate: number
}

let particleId = 0

export function BabyPiano() {
  const { playNote } = useSound()
  const [pressedKey, setPressedKey] = useState<number | null>(null)
  const [bouncingKey, setBouncingKey] = useState<number | null>(null)
  const [particles, setParticles] = useState<Record<number, NoteParticle[]>>({})
  const bounceTimerRef = useRef<number | null>(null)

  const spawnParticles = useCallback((keyIndex: number) => {
    const count = 2 + Math.floor(Math.random() * 3)
    const newParticles: NoteParticle[] = Array.from({ length: count }, () => ({
      id: particleId++,
      symbol: NOTE_SYMBOLS[Math.floor(Math.random() * NOTE_SYMBOLS.length)],
      drift: (Math.random() - 0.5) * 60,
      rotate: (Math.random() - 0.5) * 40,
    }))

    setParticles((prev) => ({
      ...prev,
      [keyIndex]: [...(prev[keyIndex] ?? []), ...newParticles],
    }))

    window.setTimeout(() => {
      setParticles((prev) => {
        const current = prev[keyIndex] ?? []
        const remaining = current.filter((p) => !newParticles.some((np) => np.id === p.id))
        if (remaining.length === 0) {
          const { [keyIndex]: _, ...rest } = prev
          return rest
        }
        return { ...prev, [keyIndex]: remaining }
      })
    }, 1300)
  }, [])

  const handlePress = useCallback(
    (index: number) => {
      const key = PIANO_KEYS[index]
      setPressedKey(index)
      setBouncingKey(null)
      playNote(key.frequency, 0.4)
      spawnParticles(index)
    },
    [playNote, spawnParticles],
  )

  const handleRelease = useCallback((index: number) => {
    setPressedKey(null)
    setBouncingKey(index)

    if (bounceTimerRef.current !== null) {
      window.clearTimeout(bounceTimerRef.current)
    }

    bounceTimerRef.current = window.setTimeout(() => {
      setBouncingKey(null)
      bounceTimerRef.current = null
    }, 400)
  }, [])

  return (
    <div className={styles.container}>
      {PIANO_KEYS.map((key, index) => {
        const isPressed = pressedKey === index
        const isBouncing = bouncingKey === index && !isPressed
        const keyParticles = particles[index] ?? []

        return (
          <button
            key={key.note}
            type="button"
            className={`${styles.key} ${isPressed ? styles.keyPressed : ''} ${isBouncing ? styles.keyReleased : ''}`}
            aria-label={`琴键 ${key.note}`}
            style={{
              background: `linear-gradient(180deg, ${key.color} 0%, ${key.color}cc 100%)`,
              ['--glow-color' as string]: `${key.color}88`,
            }}
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId)
              handlePress(index)
            }}
            onPointerUp={() => handleRelease(index)}
            onPointerCancel={() => handleRelease(index)}
            onPointerLeave={(e) => {
              if (e.currentTarget.hasPointerCapture(e.pointerId)) {
                handleRelease(index)
              }
            }}
          >
            <span className={styles.noteLabel}>{key.note.replace('4', '').replace('5', '⁵')}</span>
            <div className={styles.particles}>
              {keyParticles.map((particle) => (
                <span
                  key={particle.id}
                  className={styles.noteParticle}
                  style={
                    {
                      '--drift': `${particle.drift}px`,
                      '--rotate': `${particle.rotate}deg`,
                    } as React.CSSProperties
                  }
                  aria-hidden="true"
                >
                  {particle.symbol}
                </span>
              ))}
            </div>
          </button>
        )
      })}
    </div>
  )
}
