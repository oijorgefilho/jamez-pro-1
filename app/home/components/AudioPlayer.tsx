'use client'

import { useEffect, useRef } from 'react'

interface AudioPlayerProps {
  src: string | null
  isPlaying: boolean
  onVolumeChange: (volume: number) => void
  onEnded: () => void
}

export function AudioPlayer({ src, isPlaying, onVolumeChange, onEnded }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup na desmontagem
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
      if (sourceNodeRef.current) {
        sourceNodeRef.current.disconnect()
      }
      if (analyserRef.current) {
        analyserRef.current.disconnect()
      }
      if (audioContextRef.current?.state !== 'closed') {
        audioContextRef.current?.close()
      }
    }
  }, [])

  useEffect(() => {
    const setupAudio = async () => {
      if (!src || !isPlaying || !audioRef.current) return

      try {
        // Limpa recursos anteriores
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current)
        }
        if (sourceNodeRef.current) {
          sourceNodeRef.current.disconnect()
        }
        if (analyserRef.current) {
          analyserRef.current.disconnect()
        }
        if (audioContextRef.current?.state !== 'closed') {
          await audioContextRef.current?.close()
        }

        // Cria novo contexto e nós
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyserRef.current = analyser
        analyser.fftSize = 256

        const source = audioContext.createMediaElementSource(audioRef.current)
        sourceNodeRef.current = source

        // Conecta os nós
        source.connect(analyser)
        analyser.connect(audioContext.destination)

        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const animate = () => {
          if (!isPlaying) {
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current)
            }
            return
          }

          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
          const normalizedVolume = average / 255

          onVolumeChange(normalizedVolume)
          animationFrameRef.current = requestAnimationFrame(animate)
        }

        animate()

        // Inicia reprodução
        try {
          await audioRef.current.play()
        } catch (error) {
          console.error('Erro ao reproduzir áudio:', error)
        }
      } catch (error) {
        console.error('Erro ao configurar áudio:', error)
      }
    }

    setupAudio()
  }, [src, isPlaying, onVolumeChange])

  return (
    <audio
      ref={audioRef}
      src={src || undefined}
      onEnded={onEnded}
      style={{ display: 'none' }}
    />
  )
} 