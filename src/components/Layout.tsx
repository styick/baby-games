import { useCallback, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useFullscreen } from '../hooks/useFullscreen'
import { useTouchOptimize } from '../hooks/useTouchOptimize'
import styles from './Layout.module.css'

const LONG_PRESS_MS = 2000

export function Layout() {
  const navigate = useNavigate()
  const location = useLocation()
  const isHome = location.pathname === '/'
  const { requestFullscreenOnInteraction } = useFullscreen()
  useTouchOptimize()

  const [pressProgress, setPressProgress] = useState(0)
  const pressTimerRef = useRef<number | null>(null)
  const progressTimerRef = useRef<number | null>(null)
  const pressStartRef = useRef(0)

  const clearPressTimers = useCallback(() => {
    if (pressTimerRef.current !== null) {
      window.clearTimeout(pressTimerRef.current)
      pressTimerRef.current = null
    }
    if (progressTimerRef.current !== null) {
      window.clearInterval(progressTimerRef.current)
      progressTimerRef.current = null
    }
    setPressProgress(0)
  }, [])

  const handleInteraction = useCallback(() => {
    requestFullscreenOnInteraction()
  }, [requestFullscreenOnInteraction])

  const handleBackPressStart = useCallback(() => {
    clearPressTimers()
    pressStartRef.current = Date.now()

    progressTimerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - pressStartRef.current
      setPressProgress(Math.min(elapsed / LONG_PRESS_MS, 1))
    }, 50)

    pressTimerRef.current = window.setTimeout(() => {
      clearPressTimers()
      navigate('/')
    }, LONG_PRESS_MS)
  }, [clearPressTimers, navigate])

  const handleBackPressEnd = useCallback(() => {
    clearPressTimers()
  }, [clearPressTimers])

  return (
    <div className={styles.layout} onPointerDown={handleInteraction}>
      {!isHome && (
        <button
          type="button"
          className={styles.backButton}
          aria-label="长按返回主菜单"
          onPointerDown={handleBackPressStart}
          onPointerUp={handleBackPressEnd}
          onPointerLeave={handleBackPressEnd}
          onPointerCancel={handleBackPressEnd}
        >
          <span className={styles.backIcon} aria-hidden="true">
            🏠
          </span>
          <span className={styles.backLabel}>长按回家</span>
          {pressProgress > 0 && (
            <span
              className={styles.backProgress}
              style={{ transform: `scaleX(${pressProgress})` }}
            />
          )}
        </button>
      )}
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}
