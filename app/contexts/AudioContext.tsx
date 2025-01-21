'use client'

import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react'
import { useToast } from '@/components/ui/use-toast'

interface AudioContextType {
  isPlaying: boolean
  audioUrl: string | null
  volume: number
  setAudioUrl: (url: string | null) => void
  playAudio: () => Promise<void>
  stopAudio: () => void
  cleanup: () => void
  setupAudioAnalysis: () => Promise<void>
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [volume, setVolume] = useState(0)

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

    setIsPlaying(false)
    setVolume(0)
  }, [])

  const setupAudioAnalysis = useCallback(async () => {
    if (!audioRef.current || !audioUrl) return

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
        setVolume(normalizedVolume)

        animationFrameRef.current = requestAnimationFrame(animate)
      }

      animate()
    } catch (error) {
      console.error('Erro ao configurar análise de áudio:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao configurar o áudio. Tente novamente."
      })
      cleanup()
    }
  }, [audioUrl, isPlaying, cleanup, toast])

  const playAudio = useCallback(async () => {
    if (!audioRef.current || !audioUrl) return

    try {
      await setupAudioAnalysis()
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (error) {
      console.error('Erro ao reproduzir áudio:', error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível reproduzir o áudio. Tente novamente."
      })
      cleanup()
    }
  }, [audioUrl, setupAudioAnalysis, cleanup, toast])

  const stopAudio = useCallback(() => {
    cleanup()
  }, [cleanup])

  return (
    <AudioContext.Provider
      value={{
        isPlaying,
        audioUrl,
        volume,
        setAudioUrl,
        playAudio,
        stopAudio,
        cleanup,
        setupAudioAnalysis
      }}
    >
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onEnded={cleanup}
        style={{ display: 'none' }}
      />
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) {
    throw new Error('useAudio deve ser usado dentro de um AudioProvider')
  }
  return context
} 