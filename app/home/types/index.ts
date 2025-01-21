export interface Message {
  role: 'user' | 'assistant'
  content: string
}

export interface AudioState {
  isListening: boolean
  isProcessing: boolean
  isAgentSpeaking: boolean
  error: string | null
}

export interface AudioStreamState {
  stream: MediaStream | null
  isActive: boolean
}

