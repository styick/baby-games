import { useCallback, useEffect, useState } from 'react'

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void>
}

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void>
  webkitFullscreenElement?: Element | null
}

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    const handleChange = () => {
      const doc = document as FullscreenDocument
      setIsFullscreen(Boolean(doc.fullscreenElement ?? doc.webkitFullscreenElement))
    }

    document.addEventListener('fullscreenchange', handleChange)
    document.addEventListener('webkitfullscreenchange', handleChange)
    handleChange()

    return () => {
      document.removeEventListener('fullscreenchange', handleChange)
      document.removeEventListener('webkitfullscreenchange', handleChange)
    }
  }, [])

  const enterFullscreen = useCallback(async () => {
    const element = document.documentElement as FullscreenElement
    if (document.fullscreenElement ?? (document as FullscreenDocument).webkitFullscreenElement) {
      return
    }

    if (element.requestFullscreen) {
      await element.requestFullscreen()
      return
    }

    await element.webkitRequestFullscreen?.()
  }, [])

  const exitFullscreen = useCallback(async () => {
    const doc = document as FullscreenDocument
    if (doc.exitFullscreen) {
      await doc.exitFullscreen()
      return
    }

    await doc.webkitExitFullscreen?.()
  }, [])

  const requestFullscreenOnInteraction = useCallback(() => {
    void enterFullscreen()
  }, [enterFullscreen])

  return {
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    requestFullscreenOnInteraction,
  }
}
