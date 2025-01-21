'use client'

import { useEffect, useRef, useCallback } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface AudioManagerProps {
  src: string | null
  isPlaying: boolean
  onVolumeChange: (volume: number) => void
  onEnded: () => void
}

export function AudioManager({ src, isPlaying, onVolumeChange, onEnded }: AudioManagerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const { toast } = useToast()

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }

    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.disconnect()
      } catch (error) {
        console.error('Erro ao desconectar source node:', error)
      }
      sourceNodeRef.current = null
    }

    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect()
      } catch (error) {
        console.error('Erro ao desconectar analyser:', error)
      }
      analyserRef.current = null
    }

    if (audioContextRef.current?.state !== 'closed') {
      try {
        audioContextRef.current?.close()
      } catch (error) {
        console.error('Erro ao fechar contexto de áudio:', error)
      }
      audioContextRef.current = null
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }
  }, [])

  useEffect(() => {
    return cleanup
  }, [cleanup])

  useEffect(() => {
    const setupAudio = async () => {
      if (!src || !isPlaying || !audioRef.current) return

      try {
        cleanup()

        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
        audioContextRef.current = audioContext

        const analyser = audioContext.createAnalyser()
        analyserRef.current = analyser
        analyser.fftSize = 256

        const source = audioContext.createMediaElementSource(audioRef.current)
        sourceNodeRef.current = source

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

        try {
          await audioRef.current.play()
        } catch (error) {
          console.error('Erro ao reproduzir áudio:', error)
          toast({
            variant: "destructive",
            title: "Erro",
            description: "Não foi possível reproduzir o áudio. Tente novamente."
          })
          cleanup()
        }
      } catch (error) {
        console.error('Erro ao configurar áudio:', error)
        toast({
          variant: "destructive",
          title: "Erro",
          description: "Ocorreu um erro ao configurar o áudio. Tente novamente."
        })
        cleanup()
      }
    }

    setupAudio()
  }, [src, isPlaying, onVolumeChange, cleanup, toast])

  return (
    <audio
      ref={audioRef}
      src={src || undefined}
      onEnded={onEnded}
      style={{ display: 'none' }}
    />
  )
} 