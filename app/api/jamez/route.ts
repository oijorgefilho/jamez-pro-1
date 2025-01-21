import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const webhookUrl = process.env.N8N_WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('URL do webhook não configurada')
    }

    const { text, userEmail } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Texto não fornecido' },
        { status: 400 }
      )
    }

    console.log('Enviando para n8n:', { text, userEmail })

    // Enviar para o webhook do n8n
    const n8nResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        userEmail,
        timestamp: new Date().toISOString()
      }),
    })

    if (!n8nResponse.ok) {
      console.error('Erro n8n:', await n8nResponse.text())
      throw new Error(`Erro na chamada do n8n: ${n8nResponse.statusText}`)
    }

    // Tentar obter a resposta como texto primeiro
    const responseText = await n8nResponse.text()
    console.log('Resposta n8n (texto):', responseText)

    let responseData
    try {
      // Tentar parsear como JSON
      responseData = JSON.parse(responseText)
      console.log('Resposta n8n (JSON):', responseData)
    } catch (e) {
      // Se não for JSON válido, usar o texto diretamente
      responseData = { response: responseText }
      console.log('Usando resposta como texto:', responseData)
    }
    
    return NextResponse.json({ 
      response: responseData.response || responseData.text || responseText || 'Desculpe, não entendi. Pode repetir?' 
    })
  } catch (error: any) {
    console.error('Erro ao processar resposta do Jamez:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao processar resposta' },
      { status: 500 }
    )
  }
} 