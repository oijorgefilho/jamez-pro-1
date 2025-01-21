'use server'

import { log } from '@/utils/logger'

if (!process.env.N8N_WEBHOOK_URL) {
  throw new Error('N8N_WEBHOOK_URL não está configurada')
}

export async function getJamezResponse(transcription: string, userEmail?: string): Promise<string> {
  try {
    log.info("Enviando mensagem para webhook do Jamez", { transcription, userEmail })
    
    const response = await fetch(process.env.N8N_WEBHOOK_URL!, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: transcription,
        userEmail
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      log.error("Erro no webhook do Jamez", { status: response.status, error: errorText })
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    // Lê o texto da resposta uma única vez
    const responseText = await response.text()
    
    // Tenta fazer o parse como JSON
    try {
      const data = JSON.parse(responseText)
      log.info("Resposta do Jamez recebida com sucesso (JSON)", { response: data.response })
      return data.response
    } catch (jsonError) {
      // Se falhar o parse JSON, usa o texto diretamente
      log.info("Resposta do Jamez recebida com sucesso (texto)", { response: responseText })
      return responseText
    }

  } catch (error) {
    log.error("Erro ao obter resposta do Jamez", error)
    throw new Error('Falha ao obter resposta do assistente')
  }
}

