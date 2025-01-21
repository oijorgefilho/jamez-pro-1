'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '../contexts/AuthContext'
import { Input } from '../components/ui/input'
import { Button } from '../components/ui/button'
import Link from 'next/link'
import Image from 'next/image'
import Background from '../login/components/Background'
import { showToast } from '../components/ui/custom-toast'
import { log } from '../utils/logger'

const formatPhoneNumber = (value: string) => {
  const phoneNumber = value.replace(/\D/g, '')
  const phoneNumberLength = phoneNumber.length

  if (phoneNumberLength < 3) return phoneNumber
  if (phoneNumberLength < 7) return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2)}`
  return `(${phoneNumber.slice(0, 2)}) ${phoneNumber.slice(2, 7)}-${phoneNumber.slice(7, 11)}`
}

const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

const validatePassword = (password: string): string | null => {
  if (password.length < 6) return 'A senha deve ter pelo menos 6 caracteres'
  if (!/[A-Z]/.test(password)) return 'A senha deve conter pelo menos uma letra maiúscula'
  if (!/[0-9]/.test(password)) return 'A senha deve conter pelo menos um número'
  return null
}

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [day, setDay] = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear] = useState('')
  const [phone, setPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showAgeWarning, setShowAgeWarning] = useState(false)
  const router = useRouter()
  const { signUp } = useAuth()

  const checkAge = useCallback(() => {
    if (day && month && year) {
      const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day))
      const today = new Date()
      let age = today.getFullYear() - birthDate.getFullYear()
      const monthDiff = today.getMonth() - birthDate.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
      setShowAgeWarning(age < 18)
      return age >= 18
    }
    return false
  }, [day, month, year])

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      log.info('Iniciando processo de registro')

      // Validações
      if (!email || !password || !name || !day || !month || !year || !phone) {
        throw new Error('Todos os campos são obrigatórios')
      }

      if (!validateEmail(email)) {
        throw new Error('Por favor, insira um email válido')
      }

      const passwordError = validatePassword(password)
      if (passwordError) {
        throw new Error(passwordError)
      }

      if (!checkAge()) {
        throw new Error('Você precisa ter 18 anos ou mais para se cadastrar')
      }

      // Formatar dados
      const dateOfBirth = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      const cleanPhone = phone.replace(/\D/g, '')

      log.info('Dados validados, iniciando registro')

      await signUp({
        email,
        password,
        name,
        dateOfBirth,
        phone: cleanPhone
      })
      
      showToast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo(a) ao Jamezz!",
        type: "success"
      })

      router.push('/home')
    } catch (error: any) {
      showToast({
        title: "Erro no cadastro",
        description: error.message || 'Ocorreu um erro ao criar sua conta',
        type: "error"
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
          <h1 className="text-2xl sm:text-3xl text-white font-bold mb-6 sm:mb-8 text-center">
            Criar Conta
          </h1>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-4">
              <Input
                type="text"
                placeholder="Seu nome"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full py-4 sm:py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400"
                required
                minLength={2}
                maxLength={100}
              />
              <Input
                type="email"
                placeholder="Seu e-mail"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full py-4 sm:py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400"
                required
              />
              <Input
                type="password"
                placeholder="Senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full py-4 sm:py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400"
                required
                minLength={6}
              />
              <div className="flex space-x-2">
                <select
                  value={day}
                  onChange={(e) => {
                    setDay(e.target.value)
                    checkAge()
                  }}
                  className="w-1/3 py-4 sm:py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400 rounded-md"
                  required
                >
                  <option value="">Dia</option>
                  {[...Array(31)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <select
                  value={month}
                  onChange={(e) => {
                    setMonth(e.target.value)
                    checkAge()
                  }}
                  className="w-1/3 py-4 sm:py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400 rounded-md"
                  required
                >
                  <option value="">Mês</option>
                  {[...Array(12)].map((_, i) => (
                    <option key={i + 1} value={i + 1}>{i + 1}</option>
                  ))}
                </select>
                <select
                  value={year}
                  onChange={(e) => {
                    setYear(e.target.value)
                    checkAge()
                  }}
                  className="w-1/3 py-4 sm:py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400 rounded-md"
                  required
                >
                  <option value="">Ano</option>
                  {[...Array(100)].map((_, i) => {
                    const year = new Date().getFullYear() - i
                    return <option key={year} value={year}>{year}</option>
                  })}
                </select>
              </div>
              {showAgeWarning && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3 mt-2">
                  <p className="text-red-400 text-sm">
                    O Jamez só está disponível para maiores de 18 anos.
                  </p>
                </div>
              )}
              <Input
                type="tel"
                placeholder="Telefone"
                value={phone}
                onChange={(e) => {
                  const formattedPhone = formatPhoneNumber(e.target.value)
                  setPhone(formattedPhone)
                }}
                className="w-full py-4 sm:py-6 bg-[#0D0F1A] border-none text-white placeholder:text-gray-400"
                required
                maxLength={15}
              />
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full py-4 sm:py-6 bg-gradient-to-r from-purple-600 to-purple-800 hover:from-purple-700 hover:to-purple-900 text-white rounded-full font-medium transition-colors"
            >
              {isLoading ? 'Criando conta...' : 'CRIAR CONTA'}
            </Button>

            <div className="text-center mt-4">
              <Link
                href="/login"
                className="text-sm text-gray-400 hover:text-white transition-colors"
              >
                Já tem uma conta? Faça login
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

