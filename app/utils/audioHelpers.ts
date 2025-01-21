import { useState, useRef, useCallback, useEffect } from 'react'
import { log } from './logger'

export function splitTextIntoChunks(text: string, maxChunkLength: number = 250): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text]
  const chunks: string[] = []
  let currentChunk = ''

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length <= maxChunkLength) {
      currentChunk += sentence
    } else {
      if (currentChunk) chunks.push(currentChunk.trim())
      currentChunk = sentence
    }
  }

  if (currentChunk) chunks.push(currentChunk.trim())
  return chunks
}

export function useAudioQueue() {
  const [queue, setQueue] = useState<Blob[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)
  const [isAllAudioFinished, setIsAllAudioFinished] = useState(true)
  const [shouldStopGeneration, setShouldStopGeneration] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentAudioUrlRef = useRef<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const playNext = useCallback(() => {
    if (queue.length > currentChunkIndex && !shouldStopGeneration) {
      log.info("Reproduzindo próximo chunk de áudio", { index: currentChunkIndex + 1, total: queue.length })
      setIsPlaying(true)
      setIsAllAudioFinished(false)
      const nextAudio = queue[currentChunkIndex]

      if (currentAudioUrlRef.current) {
        URL.revokeObjectURL(currentAudioUrlRef.current)
      }
      const audioUrl = URL.createObjectURL(nextAudio)
      currentAudioUrlRef.current = audioUrl

      if (!audioRef.current) {
        audioRef.current = new Audio()
      }
      audioRef.current.src = audioUrl
      audioRef.current.play()
        .then(() => {
          audioRef.current!.onended = () => {
            log.info("Chunk de áudio finalizado")
            setIsPlaying(false)
            setCurrentChunkIndex(prevIndex => prevIndex + 1)
            if (currentChunkIndex + 1 >= queue.length) {
              log.info("Todos os chunks de áudio foram reproduzidos")
              setIsAllAudioFinished(true)
              setCurrentChunkIndex(0)
              setQueue([])
            }
          }
        })
        .catch(error => {
          log.error("Erro ao reproduzir áudio", error)
          setIsPlaying(false)
          setCurrentChunkIndex(prevIndex => prevIndex + 1)
          if (currentChunkIndex + 1 >= queue.length) {
            setIsAllAudioFinished(true)
            setCurrentChunkIndex(0)
            setQueue([])
          }
        })
    } else if (currentChunkIndex >= queue.length && queue.length > 0) {
      log.info("Reprodução de todos os chunks concluída")
      setIsPlaying(false)
      setCurrentChunkIndex(0)
      setQueue([])
      setIsAllAudioFinished(true)
    }
  }, [queue, currentChunkIndex, shouldStopGeneration])

  const addToQueue = useCallback((audioBlob: Blob) => {
    if (shouldStopGeneration) {
      log.info("Geração de áudio interrompida, não adicionando à fila")
      return
    }
    log.info("Adicionando áudio à fila")
    setQueue(prevQueue => [...prevQueue, audioBlob])
    setIsAllAudioFinished(false)
  }, [shouldStopGeneration])

  const stopPlayback = useCallback(() => {
    log.info("Interrompendo reprodução de áudio")
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (currentAudioUrlRef.current) {
      URL.revokeObjectURL(currentAudioUrlRef.current)
      currentAudioUrlRef.current = null
    }
    setIsPlaying(false)
    setCurrentChunkIndex(0)
    setQueue([])
    setIsAllAudioFinished(true)
    setShouldStopGeneration(true)
  }, [])

  const clearQueue = useCallback(() => {
    log.info("Limpando fila de áudio")
    stopPlayback()
    setQueue([])
    setCurrentChunkIndex(0)
    setIsAllAudioFinished(true)
    setShouldStopGeneration(true)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
  }, [stopPlayback])

  const resetGeneration = useCallback(() => {
    log.info("Resetando geração de áudio")
    setShouldStopGeneration(false)
    setIsAllAudioFinished(true)
    setQueue([])
    setCurrentChunkIndex(0)
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()
  }, [])

  useEffect(() => {
    if (!isPlaying && queue.length > currentChunkIndex && !shouldStopGeneration) {
      playNext()
    }
  }, [isPlaying, queue, currentChunkIndex, playNext, shouldStopGeneration])

  return {
    addToQueue,
    isPlaying,
    stopPlayback,
    isAllAudioFinished,
    clearQueue,
    resetGeneration,
    shouldStopGeneration,
    abortControllerRef
  }
} 