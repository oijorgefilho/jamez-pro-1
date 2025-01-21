'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'

interface User {
  email: string
  credits: number
}

interface AuthContextType {
  user: User | null
  userPlan: string
  credits: number
  isCountingDown: boolean
  startCreditCycle: () => void
  stopCreditCycle: () => void
  finalizeCreditCycle: (seconds: number) => Promise<void>
  checkCreditsAndPlan: () => Promise<void>
  useCredits: (seconds: number) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userPlan, setUserPlan] = useState('free')
  const [credits, setCredits] = useState(0)
  const [isCountingDown, setIsCountingDown] = useState(false)

  const startCreditCycle = useCallback(() => {
    setIsCountingDown(true)
  }, [])

  const stopCreditCycle = useCallback(() => {
    setIsCountingDown(false)
  }, [])

  const finalizeCreditCycle = useCallback(async (seconds: number) => {
    // Implementar lógica de finalização do ciclo
    console.log('Finalizando ciclo de créditos:', seconds)
  }, [])

  const checkCreditsAndPlan = useCallback(async () => {
    // Implementar verificação de créditos e plano
    console.log('Verificando créditos e plano')
  }, [])

  const useCredits = useCallback(async (seconds: number) => {
    // Implementar uso de créditos
    console.log('Usando créditos:', seconds)
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        userPlan,
        credits,
        isCountingDown,
        startCreditCycle,
        stopCreditCycle,
        finalizeCreditCycle,
        checkCreditsAndPlan,
        useCredits,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider')
  }
  return context
} 