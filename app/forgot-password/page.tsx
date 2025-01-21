'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import { useToast } from '../components/ui/use-toast'
import Background from '../login/components/Background'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const { toast } = useToast()
  const supabase = createClient()

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      toast({
        title: 'Email enviado',
        description: 'Verifique seu email para redefinir sua senha.',
      })
      router.push('/login')
    } catch (error) {
      console.error('Reset password error:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Ocorreu um erro ao enviar o email de redefinição de senha.',
      })
    } finally {
      setIsLoading(false)
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
          <h1 className="text-2xl text-white font-bold mb-6 text-center">
            Esqueceu sua senha?
          </h1>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              type="email"
              placeholder="Seu e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full py-4 sm:py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400"
              required
            />
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 sm:py-6 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-full font-medium"
            >
              {isLoading ? 'Enviando...' : 'Enviar email de recuperação'}
            </Button>
            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Voltar para o login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

