'use client'

import { Button } from '@/components/ui/button'
import { Mic, Square } from 'lucide-react'
import { Progress } from '@/components/ui/progress'

interface VoiceRecorderProps {
  isRecording: boolean
  isProcessing: boolean
  volume: number
  onStartRecording: () => void
  onStopRecording: () => void
}

export function VoiceRecorder({
  isRecording,
  isProcessing,
  volume,
  onStartRecording,
  onStopRecording
}: VoiceRecorderProps) {
  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex items-center gap-4">
        <Button
          variant={isRecording ? "destructive" : "default"}
          size="lg"
          onClick={isRecording ? onStopRecording : onStartRecording}
          disabled={isProcessing}
        >
          {isRecording ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Parar Gravação
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 mr-2" />
              Iniciar Gravação
            </>
          )}
        </Button>
      </div>

      {isRecording && (
        <div className="w-full max-w-md">
          <Progress value={volume * 100} className="h-2" />
        </div>
      )}
    </div>
  )
}

