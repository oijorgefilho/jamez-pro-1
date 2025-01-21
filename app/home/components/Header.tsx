'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Clock } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'

interface HeaderProps {
  openSidebar: () => void;
}

export default function Header({ openSidebar }: HeaderProps) {
  const { user, userPlan, credits, isCountingDown, checkCreditsAndPlan } = useAuth()

  console.log('Header rendering with:', { user, userPlan, credits, isCountingDown })

  const formatCredits = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  useEffect(() => {
    const updateUserInfo = () => {
      console.log('Updating user info in Header')
      checkCreditsAndPlan();
    };

    updateUserInfo(); // Atualiza imediatamente ao montar o componente
    const interval = setInterval(updateUserInfo, 60000); // Atualiza a cada minuto

    return () => clearInterval(interval);
  }, [checkCreditsAndPlan]);

  return (
    <div className="w-full max-w-md mx-auto px-4 pt-6 pb-6">
      <div className="w-full bg-[#0D0F1A] rounded-[32px] px-6 py-4 flex items-center">
        <div className="flex-1 flex items-center justify-between">
          <Link href="/home">
            <Image
              src="https://jamez.pro/wp-content/uploads/2025/01/LOGO-jamez-colorbranco-2-1.png"
              alt="Jamez"
              width={120}
              height={40}
              className="h-8 w-auto"
            />
          </Link>
          <div className="flex items-center gap-4">
            {!user ? (
              <Link 
                href="/login"
                className="px-6 py-2 rounded-full border border-purple-500 text-purple-500 text-sm hover:bg-purple-500/10 transition-colors"
              >
                login
              </Link>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Clock className={`w-5 h-5 ${isCountingDown ? 'text-red-400' : 'text-gray-400'}`} />
                  <span className={`${isCountingDown ? 'text-red-400' : 'text-gray-400'}`}>{formatCredits(credits)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {userPlan === 'pro' ? (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-transparent bg-gradient-to-r from-purple-400 to-blue-400 flex items-center justify-center" style={{ background: 'linear-gradient(white, white) padding-box, linear-gradient(to right, #A855F7, #3B82F6) border-box' }}>
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-400 to-blue-400 transform rotate-45" />
                      </div>
                      <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                        Plano Pro
                      </span>
                    </>
                  ) : (
                    <>
                      <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                      </div>
                      <span className="text-blue-400">
                        Plano Teste
                      </span>
                    </>
                  )}
                </div>
              </>
            )}
            <button 
              onClick={openSidebar}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

