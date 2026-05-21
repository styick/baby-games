import { useCallback, useRef, useState, type CSSProperties } from 'react'
import { useSound } from '../hooks/useSound'
import styles from './AnimalSounds.module.css'

type AnimalId = 'cat' | 'dog' | 'cow' | 'frog' | 'chicken' | 'lion'

type Animal = {
  id: AnimalId
  emoji: string
  name: string
  cardColor: string
}

const ANIMALS: Animal[] = [
  { id: 'cat', emoji: '🐱', name: '猫', cardColor: '#FFB347' },
  { id: 'dog', emoji: '🐶', name: '狗', cardColor: '#87CEEB' },
  { id: 'cow', emoji: '🐮', name: '牛', cardColor: '#DDA0DD' },
  { id: 'frog', emoji: '🐸', name: '青蛙', cardColor: '#98FB98' },
  { id: 'chicken', emoji: '🐔', name: '鸡', cardColor: '#FFD700' },
  { id: 'lion', emoji: '🦁', name: '狮子', cardColor: '#FFA07A' },
]

export function AnimalSounds() {
  const { playNote } = useSound()
  const [activeId, setActiveId] = useState<AnimalId | null>(null)
  const timeoutRef = useRef<number | null>(null)

  const playAnimalSound = useCallback(
    (id: AnimalId) => {
      switch (id) {
        case 'cat':
          playNote(800, 0.3)
          break
        case 'dog':
          playNote(300, 0.15)
          window.setTimeout(() => playNote(300, 0.15), 200)
          break
        case 'cow':
          playNote(150, 0.8)
          break
        case 'frog':
          playNote(400, 0.1)
          window.setTimeout(() => playNote(400, 0.1), 120)
          window.setTimeout(() => playNote(400, 0.1), 240)
          break
        case 'chicken':
          playNote(600, 0.1)
          window.setTimeout(() => playNote(900, 0.2), 120)
          break
        case 'lion':
          playNote(100, 1.0)
          break
        default: {
          const exhaustiveCheck: never = id
          return exhaustiveCheck
        }
      }
    },
    [playNote],
  )

  const handleTap = useCallback(
    (id: AnimalId) => {
      setActiveId(id)
      playAnimalSound(id)

      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = window.setTimeout(() => {
        setActiveId(null)
        timeoutRef.current = null
      }, 600)
    },
    [playAnimalSound],
  )

  return (
    <div className={styles.container}>
      <div className={styles.grid}>
        {ANIMALS.map((animal) => (
          <button
            key={animal.id}
            type="button"
            className={`${styles.card} ${activeId === animal.id ? styles.active : ''}`}
            style={{ '--card-color': animal.cardColor } as CSSProperties}
            onPointerDown={() => handleTap(animal.id)}
            aria-label={animal.name}
          >
            <span className={styles.emoji} aria-hidden="true">
              {animal.emoji}
            </span>
            <span className={styles.name}>{animal.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
