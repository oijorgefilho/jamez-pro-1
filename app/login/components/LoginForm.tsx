'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Mail, Lock } from 'lucide-react'
import { showToast } from '@/components/ui/custom-toast'

interface LoginFormProps {
  onSubmit: (email: string, password: string) => Promise<void>
}

export default function LoginForm({ onSubmit }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await onSubmit(email, password)
      showToast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo(a) de volta!",
        type: "success"
      })
    } catch (error: any) {
      let errorMessage = 'Ocorreu um erro ao fazer login'
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = 'Email ou senha incorretos'
      } else if (error.message.includes('Email not confirmed')) {
        errorMessage = 'Por favor, confirme seu email antes de fazer login'
      }

      showToast({
        title: "Erro no login",
        description: errorMessage,
        type: "error"
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-4">
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="email"
            placeholder="Seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full pl-10 py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400"
            required
          />
        </div>

        <div className="relative">
          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-10 py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400"
            required
          />
        </div>
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        variant="gradient"
        className="w-full py-6 rounded-full font-medium"
      >
        {isLoading ? 'Entrando...' : 'ENTRAR'}
      </Button>

      <div className="text-center">
        <Link
          href="/forgot-password"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          esqueceu a senha?
        </Link>
      </div>
      <div className="mt-4 text-center">
        <Link
          href="/register"
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Criar nova conta
        </Link>
      </div>
    </form>
  )
}

