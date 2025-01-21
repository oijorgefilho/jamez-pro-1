'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { WalletButton } from './WalletButton'
import Image from 'next/image'
import { Clock } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useToast } from '@/components/ui/use-toast'
import Header from '../home/components/Header'
import { SidebarMenu } from '@/components/SidebarMenu'
import { ProPlanBenefits } from './components/ProPlanBenefits';

export default function WalletPage() {
  const { addCredits } = useAuth()
  const [selectedMinutes, setSelectedMinutes] = useState(30)
  const router = useRouter()
  const { toast } = useToast()
  const [userPlan, setUserPlan] = useState('free'); // Added state for user plan
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Added state for sidebar

  const handleAddCredits = async () => {
    try {
      await addCredits(selectedMinutes)
      toast({
        title: 'Créditos adicionados',
        description: `${selectedMinutes} minutos de créditos foram adicionados à sua conta.`,
      })
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Falha ao adicionar créditos. Por favor, tente novamente.',
      })
    }
  }

  const timeOptions = {
    free: [
      { minutes: 30, label: '30 min', price: 10 },
      { minutes: 45, label: '45 min', price: 14 },
      { minutes: 60, label: '60 min', price: 18 },
      { minutes: 100, label: '100 min', price: 28 },
    ],
    pro: [
      { minutes: 30, label: '30 min', price: 8.50 },
      { minutes: 45, label: '45 min', price: 11.90 },
      { minutes: 60, label: '60 min', price: 15.30 },
      { minutes: 100, label: '100 min', price: 23.80 },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white px-4 sm:px-6 pb-16">
      {/* Header */}
      <Header openSidebar={() => setIsSidebarOpen(true)} />

      {/* Logo */}
      {/* This section is replaced by the Header component */}

      <div className="px-6 pb-8">
        <div className="space-y-6 sm:space-y-8">
          <h1 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8">Carteira</h1>

          {/* Add Time Section */}
          <div>
            <h2 className="text-lg sm:text-xl mb-3 sm:mb-4">Adicione mais tempo</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-4 sm:mb-6">Selecione a quantidade de minutos desejada:</p>
            
            <div className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8">
              {(userPlan === 'free' ? timeOptions.free : timeOptions.pro).map(({ minutes, label, price }) => (
                <button
                  key={minutes}
                  onClick={() => setSelectedMinutes(minutes)}
                  className={cn(
                    "flex flex-col justify-center items-stretch gap-1 px-3 sm:px-4 py-2 sm:py-3 rounded-xl transition-colors text-sm sm:text-base",
                    selectedMinutes === minutes
                      ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white"
                      : "bg-[#1A1B1E] text-gray-300 hover:bg-[#252629]"
                  )}
                >
                  <div className="flex flex-col items-center">
                    <span className="font-semibold">{label}</span>
                    <span>R$ {price.toFixed(2)}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm sm:text-base text-gray-400">Valor:</span>
                <span className="text-lg sm:text-xl font-semibold">
                  R$ {(userPlan === 'free' ? timeOptions.free : timeOptions.pro).find(option => option.minutes === selectedMinutes)?.price.toFixed(2)}
                </span>
              </div>
              <WalletButton
                onClick={handleAddCredits}
                className="w-full py-4 sm:py-6 text-base sm:text-lg font-medium mt-6 mb-8"
              >
                ADICIONAR MINUTOS
              </WalletButton>
              {userPlan === 'free' && (
                <div className="mt-2 p-4 bg-gradient-to-r from-purple-900 to-indigo-900 rounded-xl shadow-lg border border-purple-500/30">
                  <h4 className="text-lg font-semibold text-purple-300 mb-2">Economize com o Plano Pro!</h4>
                  <p className="text-sm text-gray-300 leading-snug">
                    Para uso regular, o <span className="font-bold text-purple-300">Plano Pro</span> oferece:
                  </p>
                  <ul className="mt-2 space-y-1">
                    <li className="flex items-center text-sm">
                      <span className="text-green-400 mr-2">✓</span>
                      <span className="text-gray-200">300 minutos mensais</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <span className="text-green-400 mr-2">✓</span>
                      <span className="text-gray-200">Apenas R$27,75/mês</span>
                    </li>
                    <li className="flex items-center text-sm">
                      <span className="text-green-400 mr-2">✓</span>
                      <span className="text-gray-200">Menor custo por minuto!</span>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Information Section */}
          <div className="bg-[#0D0F1A] rounded-2xl p-4 sm:p-6">
            <h3 className="text-lg sm:text-xl mb-3 sm:mb-4">Informações</h3>
            <ul className="space-y-2 sm:space-y-3 text-sm sm:text-base text-gray-400">
              <li>• Quanto mais minutos você compra, maior a economia</li>
              <li>• Os minutos adquiridos são adicionados instantaneamente à conta</li>
              <li>• Após o período do Plano Grátis acabar, você só poderá usar o JAMEZ AI adquirindo mais minutos.</li>
            </ul>
          </div>

          {/* Pro Plan Button and Benefits */}
          <div className="pt-4 pb-8">
            {userPlan === 'free' ? (
              <>
                <WalletButton 
                  variant="pro"
                  className="w-full py-4 sm:py-6 text-base sm:text-lg"
                  onClick={() => console.log('Upgrade to Pro')} 
                >
                  ASSINAR PLANO PRO
                </WalletButton>
                <ProPlanBenefits />
              </>
            ) : (
              <div className="bg-[#0D0F1A] rounded-2xl p-4 sm:p-6 text-center">
                <p className="text-purple-400 text-sm sm:text-base">
                  Você já está no Plano Pro
                </p>
                <p className="text-gray-400 text-xs sm:text-sm mt-2">
                  Aproveite 2 horas de uso diário!
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  )
}

