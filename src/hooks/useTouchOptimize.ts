import { useEffect } from 'react'

export function useTouchOptimize() {
  useEffect(() => {
    const root = document.documentElement
    const body = document.body

    root.style.touchAction = 'manipulation'
    body.style.touchAction = 'manipulation'
    body.style.overscrollBehavior = 'none'

    const preventScroll = (event: TouchEvent) => {
      event.preventDefault()
    }

    const preventPinchZoom = (event: TouchEvent) => {
      if (event.touches.length > 1) {
        event.preventDefault()
      }
    }

    const preventContextMenu = (event: Event) => {
      event.preventDefault()
    }

    const preventGesture = (event: Event) => {
      event.preventDefault()
    }

    document.addEventListener('touchmove', preventScroll, { passive: false })
    document.addEventListener('touchstart', preventPinchZoom, { passive: false })
    document.addEventListener('contextmenu', preventContextMenu)
    document.addEventListener('gesturestart', preventGesture)
    document.addEventListener('gesturechange', preventGesture)
    document.addEventListener('gestureend', preventGesture)

    return () => {
      document.removeEventListener('touchmove', preventScroll)
      document.removeEventListener('touchstart', preventPinchZoom)
      document.removeEventListener('contextmenu', preventContextMenu)
      document.removeEventListener('gesturestart', preventGesture)
      document.removeEventListener('gesturechange', preventGesture)
      document.removeEventListener('gestureend', preventGesture)
    }
  }, [])
}
