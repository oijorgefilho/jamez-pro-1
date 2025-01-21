"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { ToastProvider } from "@/components/ui/toast"
import { Toaster } from "@/components/ui/toaster"
import { useToast } from "@/components/ui/use-toast"
import { ErrorBoundary } from "react-error-boundary"
import { SidebarMenu } from "@/components/SidebarMenu"
import { useShinyEffect } from "@/hooks/useShinyEffect"
import { log } from "@/utils/logger"
import Header from "./components/Header"
import { AudioVisualizer } from "./components/AudioVisualizer"
import { StatusIndicator } from "./components/StatusIndicator"
import { ChatContainer } from "./components/ChatContainer"
import { RecordButton } from "./components/RecordButton"
import AudioAnalyzer from "./components/AudioAnalyzer"
import { transcribeAudio } from "./services/transcription"
import { getJamezResponse } from "./services/jamezApi"
import { generateSpeech } from "./services/textToSpeech"
import { splitTextIntoChunks, useAudioQueue } from "@/utils/audioHelpers"
import type { Message, AudioState } from "./types"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import NoCreditsPopup from "@/components/NoCreditsPopup"
import Image from "next/image"

const REACTION_GIF_URL = "https://jamez.pro/wp-content/uploads/2024/12/jamez-1-quieto.gif"
const AGENT_GIF_URL = "https://jamez.pro/wp-content/uploads/2024/12/jarvis.gif"
const SOUND1_URL = "https://jamez.pro/wp-content/uploads/2024/12/james-sound1-1.mp3"
const SOUND2_URL = "https://jamez.pro/wp-content/uploads/2024/12/james-sound2.mp3"

const MAX_RETRY_ATTEMPTS = 3
const RETRY_DELAY = 1000 // 1 segundo entre tentativas

export default function Home() {
  const {
    user,
    userPlan,
    credits,
    startCreditCycle,
    stopCreditCycle,
    isCountingDown,
    checkCreditsAndPlan,
    useCredits,
  } = useAuth()
  
  const [messages, setMessages] = useState<Message[]>([])
  
  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages")
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages))
    }
  }, [])

  const [audioState, setAudioState] = useState<AudioState>({
    isListening: false,
    isProcessing: false,
    isAgentSpeaking: false,
    error: null
  })
  const [inputVolume, setInputVolume] = useState(0)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [showNoCreditsPopup, setShowNoCreditsPopup] = useState(false)
  const [isBlocked, setIsBlocked] = useState(false)
  const [showLowCreditsWarning, setShowLowCreditsWarning] = useState(false)
  const [usageTime, setUsageTime] = useState(0)
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  const { toast } = useToast()
  const router = useRouter()
  const {
    addToQueue,
    isPlaying,
    stopPlayback,
    isAllAudioFinished,
    clearQueue,
    resetGeneration,
    shouldStopGeneration,
    abortControllerRef,
  } = useAudioQueue()

  const reactionGifRef = useRef<HTMLImageElement>(null)
  const agentGifRef = useRef<HTMLImageElement>(null)
  const sound1Ref = useRef<HTMLAudioElement>(null)
  const sound2Ref = useRef<HTMLAudioElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (credits <= 0) {
      log.info("Usuário sem créditos, bloqueando gravação")
      setIsBlocked(true)
      stopCreditCycle()
    } else {
      log.info("Usuário com créditos, desbloqueando gravação", { credits })
      setIsBlocked(false)
    }
  }, [credits, stopCreditCycle])

  const addMessage = useCallback((newMessage: Message) => {
    setMessages((prevMessages) => {
      const updatedMessages = [...prevMessages, newMessage].slice(-50)
      localStorage.setItem("chatMessages", JSON.stringify(updatedMessages))
      return updatedMessages
    })
  }, [])

  const animateGif = (gifRef: React.RefObject<HTMLImageElement>, scale: number) => {
    if (gifRef.current && gifRef !== reactionGifRef) {
      gifRef.current.style.transform = `scale(${1 + scale * 0.1})`
    }
  }

  const generateAndPlayAudioResponse = async (aiResponse: string) => {
    let retryCount = 0
    let lastError = null

    const attemptGeneration = async () => {
      try {
        log.info("Iniciando geração de áudio", { retryCount })
        const chunks = splitTextIntoChunks(aiResponse)
        
        setAudioState((prevState) => ({
          ...prevState,
          isAgentSpeaking: true,
          isProcessing: false,
          error: null
        }))

        const generateAudioChunk = async (chunk: string) => {
          const response = await fetch("https://api.openai.com/v1/audio/speech", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "tts-1",
              input: chunk,
              voice: "echo",
            }),
          })

          if (!response.ok) {
            const errorText = await response.text()
            log.error("OpenAI TTS API Error", { status: response.status, error: errorText })
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
          }

          return await response.blob()
        }

        // Gera e reproduz os dois primeiros chunks imediatamente
        for (let i = 0; i < Math.min(2, chunks.length); i++) {
          const audioBlob = await generateAudioChunk(chunks[i])
          addToQueue(audioBlob)
        }

        // Gera os chunks restantes em background
        ;(async () => {
          for (let i = 2; i < chunks.length; i++) {
            if (shouldStopGeneration) {
              log.info("Geração de áudio interrompida pelo usuário")
              break
            }
            const audioBlob = await generateAudioChunk(chunks[i])
            addToQueue(audioBlob)
          }
        })()

        // Reproduz sound1 quando começar a falar
        if (sound1Ref.current) {
          sound1Ref.current.play()
            .catch(error => log.error("Erro ao reproduzir sound1", error))
        }

        return true // Sucesso
      } catch (error) {
        lastError = error
        log.error("Erro na tentativa de geração de áudio", { retryCount, error })
        return false // Falha
      }
    }

    // Tenta gerar o áudio com retry
    while (retryCount < MAX_RETRY_ATTEMPTS) {
      const success = await attemptGeneration()
      if (success) {
        log.info("Geração de áudio bem-sucedida")
        return
      }

      retryCount++
      if (retryCount < MAX_RETRY_ATTEMPTS) {
        log.info(`Tentando novamente em ${RETRY_DELAY}ms`, { attempt: retryCount + 1 })
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
      }
    }

    // Se chegou aqui, todas as tentativas falharam
    log.error("Todas as tentativas de geração de áudio falharam", { totalAttempts: retryCount })
    setAudioState((prevState) => ({ 
      ...prevState, 
      isAgentSpeaking: false,
      isProcessing: false,
      error: "Não foi possível gerar o áudio da resposta após várias tentativas." 
    }))

    toast({
      variant: "destructive",
      title: "Erro na Geração de Voz",
      description: "Não foi possível gerar o áudio da resposta. A resposta será exibida apenas em texto.",
      duration: 5000,
    })

    // Adiciona a mensagem apenas como texto
    addMessage({
      role: 'assistant',
      content: aiResponse
    })

    throw lastError
  }

  const requestMicrophonePermission = async () => {
    try {
      log.info("Solicitando permissão do microfone")
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      log.info("Permissão do microfone concedida")
      streamRef.current = stream
      return true
    } catch (error) {
      log.error("Erro ao solicitar permissão do microfone", error)
      toast({
        variant: "destructive",
        title: "Erro de Permissão",
        description: "Por favor, permita o acesso ao microfone para usar o Jamez.",
      })
      return false
    }
  }

  const startRecording = async () => {
    try {
      if (!streamRef.current) {
        const hasPermission = await requestMicrophonePermission()
        if (!hasPermission) return false
      }

      audioChunksRef.current = []
      const recorder = new MediaRecorder(streamRef.current!)
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      recorder.onstop = async () => {
        log.info("Gravação finalizada, processando áudio")
        try {
          // Reproduz sound1 para indicar fim da gravação
          if (sound1Ref.current) {
            await sound1Ref.current.play()
          }

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
          
          // Transcreve o áudio
          log.info("Iniciando transcrição do áudio")
          const transcription = await transcribeAudio(audioBlob)
          log.info("Áudio transcrito com sucesso", { transcription })

          // Adiciona mensagem do usuário
          addMessage({
            role: 'user',
            content: transcription
          })

          // Obtém resposta do Jamez
          log.info("Obtendo resposta do Jamez")
          const jamezResponse = await getJamezResponse(transcription, user?.email)
          log.info("Resposta do Jamez recebida", { response: jamezResponse })

          // Adiciona mensagem do assistente
          addMessage({
            role: 'assistant',
            content: jamezResponse
          })

          // Tenta gerar o áudio da resposta com até 3 tentativas
          let audioError = null
          for (let attempt = 1; attempt <= 3; attempt++) {
            try {
              log.info(`Tentativa ${attempt} de gerar áudio`)
              const audioBlob = await generateSpeech(jamezResponse)
              addToQueue(audioBlob)
              audioError = null
              break
            } catch (error) {
              audioError = error
              log.error(`Erro na tentativa ${attempt} de gerar áudio`, error)
              if (attempt < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000))
              }
            }
          }

          if (audioError) {
            log.error("Todas as tentativas de geração de áudio falharam")
            toast({
              variant: "destructive",
              title: "Erro na Geração de Voz",
              description: "Não foi possível gerar o áudio da resposta. A resposta será exibida apenas em texto.",
              duration: 5000,
            })
          }
          
        } catch (error) {
          log.error("Erro ao processar áudio gravado", error)
          setAudioState(prev => ({ 
            ...prev, 
            isProcessing: false, 
            error: "Erro ao processar áudio" 
          }))
          toast({
            variant: "destructive",
            title: "Erro no Processamento",
            description: "Ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.",
          })
        }
      }

      recorder.start()
      setMediaRecorder(recorder)
      return true
    } catch (error) {
      log.error("Erro ao iniciar gravação", error)
      toast({
        variant: "destructive",
        title: "Erro de Gravação",
        description: "Não foi possível iniciar a gravação. Por favor, tente novamente.",
      })
      return false
    }
  }

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop()
    }
  }

  // Cleanup function
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
  }, [])

  const handleToggleRecording = async () => {
    try {
      log.info("Verificando créditos e plano")
      await checkCreditsAndPlan()

      if (credits <= 0) {
        log.info("Sem créditos, exibindo popup")
        setShowNoCreditsPopup(true)
        return
      }

      if (!audioState.isListening && !audioState.isProcessing) {
        log.info("Iniciando gravação")
        const started = await startRecording()
        if (started) {
          setAudioState((prevState) => ({ ...prevState, isListening: true, isProcessing: false }))
          startCreditCycle()
        }
      } else if (audioState.isListening) {
        log.info("Finalizando gravação")
        stopRecording()
        setAudioState((prevState) => ({ ...prevState, isListening: false, isProcessing: true }))
        stopCreditCycle()
      }
    } catch (error) {
      log.error("Erro ao alternar gravação", error)
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Ocorreu um erro ao iniciar/parar a gravação. Por favor, tente novamente.",
      })
    }
  }

  const { buttonRef } = useShinyEffect(audioState.isProcessing)

  const checkLowCredits = useCallback(() => {
    const lowCreditThreshold = userPlan === "pro" ? 600 : 300
    if (credits <= lowCreditThreshold && !showLowCreditsWarning) {
      log.warn("Créditos baixos detectados", { credits, threshold: lowCreditThreshold })
      setShowLowCreditsWarning(true)
      toast({
        title: "Créditos Baixos",
        description: `Você tem menos de ${Math.floor(credits / 60)} minutos restantes. Considere recarregar seus créditos.`,
        duration: 10000,
      })
    } else if (credits > lowCreditThreshold && showLowCreditsWarning) {
      log.info("Créditos normalizados", { credits })
      setShowLowCreditsWarning(false)
    }
  }, [credits, userPlan, showLowCreditsWarning, toast])

  useEffect(() => {
    const interval = setInterval(() => {
      log.info("Verificação periódica de créditos e plano")
      checkCreditsAndPlan()
      checkLowCredits()
    }, 30000)

    return () => {
      log.info("Limpando intervalo de verificação de créditos")
      clearInterval(interval)
    }
  }, [checkCreditsAndPlan, checkLowCredits])

  useEffect(() => {
    const analyzeAudio = () => {
      if (!audioState.isAgentSpeaking) return

      try {
        if (!audioContextRef.current) {
          log.info("Criando novo contexto de áudio")
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
        }

        const audioContext = audioContextRef.current
        const analyser = audioContext.createAnalyser()

        analyser.fftSize = 256
        const bufferLength = analyser.frequencyBinCount
        const dataArray = new Uint8Array(bufferLength)

        const animate = () => {
          if (!audioState.isAgentSpeaking) {
            log.info("Animação interrompida - agente parou de falar")
            return
          }

          analyser.getByteFrequencyData(dataArray)
          const average = dataArray.reduce((sum, value) => sum + value, 0) / bufferLength
          const normalizedVolume = average / 255

          animateGif(agentGifRef, normalizedVolume)
          requestAnimationFrame(animate)
        }

        animate()

        return () => {
          if (audioContextRef.current) {
            log.info("Limpando contexto de áudio")
            audioContextRef.current.close()
            audioContextRef.current = null
          }
        }
      } catch (error) {
        log.error("Erro ao analisar áudio", error)
        toast({
          variant: "destructive",
          title: "Erro de Áudio",
          description: "Ocorreu um erro ao processar o áudio. Por favor, tente novamente.",
        })
      }
    }

    if (audioState.isAgentSpeaking) {
      log.info("Iniciando análise de áudio - agente falando")
      analyzeAudio()
    }
  }, [audioState.isAgentSpeaking, toast])

  useEffect(() => {
    if (isPlaying) {
      log.info("Iniciando reprodução de áudio, alterando para GIF do agente")
      setAudioState(prev => ({ 
        ...prev, 
        isAgentSpeaking: true,
        isProcessing: true 
      }))
    } else if (!isPlaying && isAllAudioFinished) {
      log.info("Reprodução de áudio concluída, executando sequência de finalização")
      // Primeiro toca o efeito sonoro
      if (sound2Ref.current) {
        sound2Ref.current.play()
          .then(() => {
            log.info("Efeito sonoro reproduzido, resetando estados")
            // Após iniciar o som, reseta os estados
            setAudioState(prev => ({ 
              ...prev, 
              isAgentSpeaking: false,
              isProcessing: false,
              isListening: false,
              error: null 
            }))
            // Reseta a geração de áudio
            resetGeneration()
          })
          .catch(error => log.error("Erro ao reproduzir sound2", error))
      }
    }
  }, [isPlaying, isAllAudioFinished, resetGeneration])

  return (
    <ErrorBoundary fallback={<div>Algo deu errado. Por favor, recarregue a página.</div>}>
      <ToastProvider>
        <div className="min-h-screen w-full bg-[#0A0B14] flex flex-col items-center overflow-x-hidden">
          <Header openSidebar={() => setIsSidebarOpen(true)} />

          <div className="w-full max-w-md px-2 sm:px-4 flex-1 flex flex-col gap-4 sm:gap-6">
            <div className="relative w-full aspect-video">
              <Image
                ref={reactionGifRef}
                src={REACTION_GIF_URL || "/placeholder.svg"}
                alt="User Reaction"
                layout="fill"
                objectFit="contain"
                className={`transition-all duration-500 ${audioState.isAgentSpeaking ? "opacity-0" : "opacity-100"} scale-[1.7]`}
              />
              <Image
                ref={agentGifRef}
                src={AGENT_GIF_URL || "/placeholder.svg"}
                alt="Agent Speaking"
                layout="fill"
                objectFit="contain"
                className={`transition-all duration-500 ${audioState.isAgentSpeaking ? "opacity-100" : "opacity-0"}`}
              />
            </div>
            <StatusIndicator />
            <ChatContainer messages={messages} />

            <div className="w-full pb-4 sm:pb-6">
              <RecordButton
                ref={buttonRef}
                isListening={audioState.isListening}
                isProcessing={audioState.isProcessing}
                onClick={handleToggleRecording}
                isBlocked={isBlocked}
              />
            </div>
          </div>

          <AudioAnalyzer audioStream={null} onVolumeChange={setInputVolume} isActive={audioState.isListening} />
          <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
          <Toaster />
          <audio ref={sound1Ref} src={SOUND1_URL} style={{ display: "none" }} />
          <audio ref={sound2Ref} src={SOUND2_URL} style={{ display: "none" }} />
          <NoCreditsPopup isOpen={showNoCreditsPopup} onClose={() => setShowNoCreditsPopup(false)} />
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}

