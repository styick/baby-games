import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent } from 'react'
import { useSound } from '../hooks/useSound'
import { COLORS } from '../utils/colors'
import styles from './ColorDoodle.module.css'

const RAINBOW_COLORS = [
  COLORS.red,
  COLORS.orange,
  COLORS.yellow,
  COLORS.green,
  COLORS.blue,
  COLORS.purple,
] as const

const PALETTE_COLORS = [
  COLORS.red,
  COLORS.orange,
  COLORS.yellow,
  COLORS.green,
  COLORS.blue,
  COLORS.purple,
] as const

type Sparkle = {
  id: number
  x: number
  y: number
}

let sparkleId = 0

export function ColorDoodle() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const { playSynth } = useSound()

  const isDrawingRef = useRef(false)
  const colorIndexRef = useRef(0)
  const selectedColorRef = useRef<string | null>(null)
  const lastPointRef = useRef<{ x: number; y: number } | null>(null)
  const canvasSizeRef = useRef({ width: 0, height: 0 })
  const fadeFrameRef = useRef<number | null>(null)

  const [selectedPalette, setSelectedPalette] = useState<number | null>(null)
  const [sparkles, setSparkles] = useState<Sparkle[]>([])
  const [isClearing, setIsClearing] = useState(false)

  const getNextColor = useCallback(() => {
    if (selectedColorRef.current) {
      return selectedColorRef.current
    }
    const color = RAINBOW_COLORS[colorIndexRef.current % RAINBOW_COLORS.length]
    colorIndexRef.current += 1
    return color
  }, [])

  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) {
      return
    }

    const rect = container.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
    canvasSizeRef.current = { width: rect.width, height: rect.height }

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
  }, [])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)
    return () => window.removeEventListener('resize', resizeCanvas)
  }, [resizeCanvas])

  const drawStamp = useCallback((x: number, y: number, color: string) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return
    }

    const radius = 15 + Math.random() * 10

    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fillStyle = color
    ctx.globalAlpha = 0.85
    ctx.fill()
    ctx.globalAlpha = 1
  }, [])

  const addSparkle = useCallback((x: number, y: number) => {
    const id = sparkleId++
    setSparkles((prev) => [...prev.slice(-20), { id, x, y }])
    window.setTimeout(() => {
      setSparkles((prev) => prev.filter((s) => s.id !== id))
    }, 600)
  }, [])

  const getCanvasPoint = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current
    if (!canvas) {
      return null
    }

    const rect = canvas.getBoundingClientRect()
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }, [])

  const drawLine = useCallback(
    (from: { x: number; y: number }, to: { x: number; y: number }, color: string) => {
      const dx = to.x - from.x
      const dy = to.y - from.y
      const distance = Math.hypot(dx, dy)
      const step = 12

      for (let i = 0; i <= distance; i += step) {
        const t = distance === 0 ? 0 : i / distance
        drawStamp(from.x + dx * t, from.y + dy * t, color)
      }
    },
    [drawStamp],
  )

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      event.preventDefault()
      const point = getCanvasPoint(event.clientX, event.clientY)
      if (!point) {
        return
      }

      event.currentTarget.setPointerCapture(event.pointerId)
      isDrawingRef.current = true
      lastPointRef.current = point

      const color = getNextColor()
      drawStamp(point.x, point.y, color)
      addSparkle(point.x, point.y)
      playSynth('ding')
    },
    [addSparkle, drawStamp, getCanvasPoint, getNextColor, playSynth],
  )

  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      if (!isDrawingRef.current) {
        return
      }

      const point = getCanvasPoint(event.clientX, event.clientY)
      if (!point || !lastPointRef.current) {
        return
      }

      const color =
        selectedColorRef.current ??
        RAINBOW_COLORS[(colorIndexRef.current - 1 + RAINBOW_COLORS.length) % RAINBOW_COLORS.length]

      drawLine(lastPointRef.current, point, color)
      lastPointRef.current = point
    },
    [drawLine, getCanvasPoint],
  )

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false
    lastPointRef.current = null
  }, [])

  const handlePaletteSelect = useCallback((index: number) => {
    setSelectedPalette(index)
    selectedColorRef.current = PALETTE_COLORS[index]
  }, [])

  const handleClear = useCallback(() => {
    if (isClearing) {
      return
    }

    setIsClearing(true)
    playSynth('ding')

    const canvas = canvasRef.current
    if (!canvas) {
      setIsClearing(false)
      return
    }

    const ctx = canvas.getContext('2d')
    if (!ctx) {
      setIsClearing(false)
      return
    }

    const { width, height } = canvasSizeRef.current

    let alpha = 1
    const fade = () => {
      alpha -= 0.08
      if (alpha <= 0) {
        ctx.clearRect(0, 0, width, height)
        setSparkles([])
        setIsClearing(false)
        fadeFrameRef.current = null
        return
      }

      ctx.save()
      ctx.globalCompositeOperation = 'destination-out'
      ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
      ctx.fillRect(0, 0, width, height)
      ctx.restore()
      fadeFrameRef.current = requestAnimationFrame(fade)
    }

    fadeFrameRef.current = requestAnimationFrame(fade)
  }, [isClearing, playSynth])

  useEffect(() => {
    return () => {
      if (fadeFrameRef.current !== null) {
        cancelAnimationFrame(fadeFrameRef.current)
      }
    }
  }, [])

  return (
    <div className={styles.container}>
      <div
        ref={containerRef}
        className={`${styles.canvasArea} ${isClearing ? styles.shaking : ''}`}
      >
        <canvas
          ref={canvasRef}
          className={styles.canvas}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerCancel={handlePointerUp}
        />

        <div className={styles.sparkleLayer} aria-hidden="true">
          {sparkles.map((sparkle) => (
            <span
              key={sparkle.id}
              className={styles.sparkle}
              style={{ left: sparkle.x, top: sparkle.y }}
            >
              ✨
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        className={styles.clearButton}
        onPointerDown={handleClear}
        aria-label="清除画板"
      >
        🗑️
      </button>

      <div className={styles.palette}>
        {PALETTE_COLORS.map((color, index) => (
          <button
            key={color}
            type="button"
            className={`${styles.paletteSwatch} ${selectedPalette === index ? styles.paletteActive : ''}`}
            style={{ '--swatch-color': color } as CSSProperties}
            onPointerDown={() => handlePaletteSelect(index)}
            aria-label={`选择颜色 ${index + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
