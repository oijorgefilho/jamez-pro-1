import { NextResponse } from 'next/server'
import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
})

export async function POST(request: Request) {
  try {
    const { audio } = await request.json()

    if (!audio) {
      return NextResponse.json(
        { error: 'Nenhum áudio fornecido' },
        { status: 400 }
      )
    }

    // Converter base64 para Buffer
    const buffer = Buffer.from(audio, 'base64')
    const tempFile = new File([buffer], 'audio.webm', { type: 'audio/webm' })

    const transcription = await openai.audio.transcriptions.create({
      file: tempFile,
      model: 'whisper-1',
      language: 'pt'
    })

    return NextResponse.json({ text: transcription.text })
  } catch (error: any) {
    console.error('Erro na transcrição:', error)
    return NextResponse.json(
      { error: error.message || 'Erro ao transcrever áudio' },
      { status: 500 }
    )
  }
} 