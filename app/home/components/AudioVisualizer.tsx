'use client'

import { useRef, useEffect } from 'react'
import Image from 'next/image'
import { useAudio } from '@/contexts/AudioContext'

interface AudioVisualizerProps {
  reactionGifUrl: string
  agentGifUrl: string
  onVolumeChange?: (volume: number) => void
}

export function AudioVisualizer({ reactionGifUrl, agentGifUrl, onVolumeChange }: AudioVisualizerProps) {
  const reactionGifRef = useRef<HTMLImageElement>(null)
  const agentGifRef = useRef<HTMLImageElement>(null)
  const { isPlaying, volume } = useAudio()

  useEffect(() => {
    const animateGif = (gifRef: React.RefObject<HTMLImageElement>, scale: number) => {
      if (gifRef.current) {
        const isReactionGif = gifRef === reactionGifRef
        const baseScale = isReactionGif ? 1.56 : 1
        
        // Aumentando a escala da animação
        const minScale = isReactionGif ? 0.05 : 0.02
        const maxScale = isReactionGif ? 0.15 : 0.1
        
        // Aplicando uma curva de suavização mais responsiva
        const smoothedScale = Math.pow(scale, 0.8)
        const animationScale = minScale + (smoothedScale * (maxScale - minScale))
        
        gifRef.current.style.transition = 'transform 0.05s ease-out'
        gifRef.current.style.transform = `scale(${baseScale + animationScale})`
      }
    }

    if (isPlaying) {
      animateGif(agentGifRef, volume)
    } else if (onVolumeChange) {
      animateGif(reactionGifRef, volume)
    }
  }, [isPlaying, volume, onVolumeChange])

  return (
    <div className="relative w-full aspect-video">
      <Image
        priority
        ref={reactionGifRef}
        src={reactionGifUrl}
        alt="User Reaction"
        fill
        style={{ objectFit: "contain" }}
        className={`transition-opacity duration-300 ${isPlaying ? 'opacity-0' : 'opacity-100'} scale-[1.56] w-full h-full object-contain`}
      />
      <Image
        ref={agentGifRef}
        src={agentGifUrl}
        alt="Agent Speaking"
        fill
        style={{ objectFit: "contain" }}
        className={`transition-opacity duration-300 ${isPlaying ? 'opacity-100' : 'opacity-0'} w-full h-full object-contain`}
      />
    </div>
  )
}

