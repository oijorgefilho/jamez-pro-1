'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { User, Wallet, Play, Diamond, Home, X, PlusCircle, Clock } from 'lucide-react'
import { cn } from "@/lib/utils"
import { useAuth } from '@/contexts/AuthContext'

interface SidebarMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SidebarMenu: React.FC<SidebarMenuProps> = ({ isOpen, onClose }) => {
  const pathname = usePathname()
  const { userPlan, credits, isCountingDown } = useAuth()

  const formatCredits = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return (
    <div 
      className={`fixed inset-y-0 right-0 w-64 bg-[#0A0A0B] transform ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } transition-transform duration-300 ease-in-out z-50`}
    >
      <div className="flex flex-col h-full py-6 px-4">
        <button 
          onClick={onClose}
          className="self-end p-2 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Logo and Plan Info */}
        <div className="flex flex-col items-center space-y-4 mb-8">
          <Image 
            src="https://jamez.pro/wp-content/uploads/2025/01/LOGO-jamez-colorbranco-2-1.png"
            alt="Logo Jamez"
            width={120}
            height={40}
            className="mb-4"
          />
          <div className="flex items-center gap-2 bg-[#1A1B1E] rounded-full px-4 py-2 w-full max-w-[200px]">
            <div className="flex items-center gap-2">
              <Clock className={`w-4 h-4 ${isCountingDown ? 'text-red-400' : 'text-gray-400'}`} />
              <span className={`${isCountingDown ? 'text-red-400' : 'text-gray-300'} text-sm`}>{formatCredits(credits)}</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-purple-400 text-sm">Plano {userPlan === 'pro' ? 'Pro' : 'Teste'}</span>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex flex-col gap-2">
          <Link
            href="/home"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1A1B1E] transition-colors",
              pathname === '/home' && 'bg-[#1A1B1E] text-white'
            )}
          >
            <Home className="w-5 h-5" />
            <span className="text-sm font-medium">Jamez</span>
          </Link>

          {/* Divider */}
          <div className="h-px bg-gray-800 my-2" />

          <Link
            href="/profile"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1A1B1E] transition-colors",
              pathname === '/profile' && 'bg-[#1A1B1E] text-white'
            )}
          >
            <User className="w-5 h-5" />
            <span className="text-sm font-medium">Meu perfil</span>
          </Link>
          <Link
            href="/wallet"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1A1B1E] transition-colors",
              pathname === '/wallet' && 'bg-[#1A1B1E] text-white'
            )}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-sm font-medium">Carteira</span>
          </Link>
          <Link
            href="/teleshow"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1A1B1E] transition-colors",
              pathname === '/teleshow' && 'bg-[#1A1B1E] text-white'
            )}
          >
            <Play className="w-5 h-5" />
            <span className="text-sm font-medium">Teleshow</span>
          </Link>
          <Link
            href="/reals"
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-[#1A1B1E] transition-colors",
              pathname === '/reals' && 'bg-[#1A1B1E] text-white'
            )}
          >
            <Diamond className="w-5 h-5" />
            <span className="text-sm font-medium">Reals</span>
          </Link>
        </nav>
        {/* Gambling Warning */}
        <div className="mt-auto pt-4 px-4">
          <div className="bg-yellow-900/30 border border-yellow-600/50 rounded-lg p-3 flex items-start space-x-3">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <p className="text-xs text-yellow-200">
              Aviso: Jogos de aposta são permitidos apenas para maiores de 18 anos.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SidebarMenu

