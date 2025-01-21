'use server'

import { log } from '@/utils/logger'

if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY não está configurada')
}

export async function generateSpeech(text: string): Promise<Blob> {
  try {
    log.info("Iniciando geração de áudio", { text })
    
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice: "echo",
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error("Erro na API de text-to-speech", { status: response.status, error: errorText })
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const audioBlob = await response.blob()
    log.info("Áudio gerado com sucesso")
    return audioBlob

  } catch (error) {
    log.error("Erro ao gerar áudio", error)
    throw new Error('Falha ao gerar áudio')
  }
}

