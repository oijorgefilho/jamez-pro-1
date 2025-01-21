'use server'

import { log } from '@/utils/logger'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY não está configurada')
}

export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    log.info("Iniciando transcrição do áudio")
    
    const formData = new FormData()
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model', 'whisper-1')
    formData.append('language', 'pt')

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: formData
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error("Erro na API de transcrição", { status: response.status, error: errorText })
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    log.info("Transcrição concluída com sucesso")
    return data.text

  } catch (error) {
    log.error("Erro ao transcrever áudio", error)
    throw new Error('Falha ao transcrever o áudio')
  }
}

