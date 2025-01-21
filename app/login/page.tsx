'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from './components/LoginForm'
import Background from './components/Background'
import Image from 'next/image'
import { showToast } from '@/components/ui/custom-toast'

export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()

  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password)
      showToast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo(a) de volta!",
        type: "success"
      })
      router.push('/home')
    } catch (error: any) {
      showToast({
        title: "Erro no login",
        description: error.message || 'Ocorreu um erro ao fazer login',
        type: "error"
      })
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0B14] relative overflow-hidden flex flex-col items-center justify-center p-4">
      <Background />
      
      <div className="w-full max-w-md z-10">
        <div className="flex justify-center mb-8">
          <div className="relative w-[120px] h-[40px]">
            <Image
              src={process.env.NEXT_PUBLIC_LOGO_JAMEZ || '/placeholder-logo.avif'}
              alt="Jamez"
              width={120}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>
        <div className="w-full bg-gradient-to-b from-[#1A1D2E] to-[#0D0F1A] backdrop-blur-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-800/50">
          <h1 className="text-2xl text-white font-medium mb-6">
            Bem-Vindo(a)
          </h1>
          <LoginForm onSubmit={handleLogin} />
        </div>
      </div>
    </div>
  )
}

