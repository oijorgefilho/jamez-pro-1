import { useRef, useEffect } from 'react'

export function useShinyEffect(isProcessing: boolean) {
  const buttonRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!buttonRef.current) return

    const button = buttonRef.current
    let animationFrameId: number

    const animate = () => {
      if (!isProcessing) {
        button.style.background = ''
        return
      }

      const time = Date.now() * 0.001
      const x = Math.sin(time) * 0.5 + 0.5
      const hue = x * 360

      button.style.background = `linear-gradient(45deg, hsl(${hue}, 100%, 50%), hsl(${hue + 60}, 100%, 50%))`
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId)
      }
      button.style.background = ''
    }
  }, [isProcessing])

  return { buttonRef }
} 