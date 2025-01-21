'use client'

import { useEffect, useRef } from 'react'

interface AudioAnalyzerProps {
  audioStream: MediaStream | null
  onVolumeChange: (volume: number) => void
  isActive: boolean
}

const AudioAnalyzer: React.FC<AudioAnalyzerProps> = ({ 
  audioStream, 
  onVolumeChange,
  isActive 
}) => {
  const analyzerRef = useRef<AnalyserNode | null>(null)
  const animationRef = useRef<number | null>(null)

  useEffect(() => {
    if (!audioStream || !isActive) return

    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    const analyser = audioContext.createAnalyser()
    const source = audioContext.createMediaStreamSource(audioStream)
    source.connect(analyser)
    // Remova qualquer conexão ao audioContext.destination
    analyzerRef.current = analyser

    const bufferLength = analyser.frequencyBinCount
    const dataArray = new Uint8Array(bufferLength)

    const analyze = () => {
      analyser.getByteFrequencyData(dataArray)
      
      // Aumentando a faixa de frequências analisadas para melhor captação
      const relevantFrequencies = dataArray.slice(0, 20) // Aumentando a faixa de frequências
      const average = relevantFrequencies.reduce((acc, val) => acc + val, 0) / relevantFrequencies.length
      
      // Aumentando a sensibilidade da curva de resposta
      const volume = Math.pow(average / 255, 0.7) * 2 // Aumentando a sensibilidade e multiplicando por 2
      
      // Limitando o volume máximo a 1
      const normalizedVolume = Math.min(volume, 1)
      
      onVolumeChange(normalizedVolume)
      animationRef.current = requestAnimationFrame(analyze)
    }

    analyze()

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      source.disconnect()
      analyser.disconnect()
      audioContext.close()
    }
  }, [audioStream, onVolumeChange, isActive])

  return null
}

export default AudioAnalyzer

