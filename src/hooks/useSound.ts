import { useCallback, useEffect, useRef } from 'react'

export type SynthType = 'pop' | 'ding' | 'whoosh' | 'chime'

let sharedContext: AudioContext | null = null

function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext()
  }
  return sharedContext
}

async function unlockAudioContext(): Promise<void> {
  const context = getAudioContext()
  if (context.state === 'suspended') {
    await context.resume()
  }
}

function playNote(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
  const context = getAudioContext()
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = type
  oscillator.frequency.setValueAtTime(frequency, context.currentTime)
  gain.gain.setValueAtTime(0.0001, context.currentTime)
  gain.gain.exponentialRampToValueAtTime(0.35, context.currentTime + 0.01)
  gain.gain.exponentialRampToValueAtTime(0.0001, context.currentTime + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)
  oscillator.start(context.currentTime)
  oscillator.stop(context.currentTime + duration + 0.05)
}

function playSynth(type: SynthType): void {
  switch (type) {
    case 'pop':
      playNote(520, 0.08, 'sine')
      break
    case 'ding':
      playNote(880, 0.25, 'triangle')
      break
    case 'whoosh':
      playNote(220, 0.35, 'sawtooth')
      break
    case 'chime':
      playNote(660, 0.18, 'sine')
      window.setTimeout(() => playNote(880, 0.22, 'sine'), 90)
      break
    default: {
      const exhaustiveCheck: never = type
      return exhaustiveCheck
    }
  }
}

export function useSound() {
  const unlockedRef = useRef(false)

  useEffect(() => {
    const unlock = () => {
      if (unlockedRef.current) {
        return
      }

      unlockedRef.current = true
      void unlockAudioContext()
    }

    window.addEventListener('pointerdown', unlock, { once: true })
    window.addEventListener('touchstart', unlock, { once: true })

    return () => {
      window.removeEventListener('pointerdown', unlock)
      window.removeEventListener('touchstart', unlock)
    }
  }, [])

  const unlock = useCallback(async () => {
    unlockedRef.current = true
    await unlockAudioContext()
  }, [])

  const playNoteSound = useCallback((frequency: number, duration: number) => {
    void unlockAudioContext()
    playNote(frequency, duration)
  }, [])

  const playSynthSound = useCallback((type: SynthType) => {
    void unlockAudioContext()
    playSynth(type)
  }, [])

  return {
    unlock,
    playNote: playNoteSound,
    playSynth: playSynthSound,
  }
}
