import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { text } = await request.json()

    if (!text) {
      return NextResponse.json(
        { error: 'Texto não fornecido' },
        { status: 400 }
      )
    }

    console.log('Gerando áudio para:', text)

    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "echo", // voz masculina mais natural
      input: text,
      speed: 1.0,
      response_format: "mp3"
    })

    // Converter para Buffer
    const buffer = Buffer.from(await mp3.arrayBuffer())

    // Retornar o áudio
    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString()
      }
    })
  } catch (error: any) {
    console.error('Erro ao gerar áudio:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar áudio' },
      { status: 500 }
    )
  }
} 