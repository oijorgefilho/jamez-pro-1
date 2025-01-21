'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface NoCreditsPopupProps {
  isOpen: boolean
  onClose: () => void
}

export default function NoCreditsPopup({ isOpen, onClose }: NoCreditsPopupProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-[#0A0B14] rounded-lg shadow-lg z-50 p-6">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Créditos Esgotados</h2>
          <p className="text-gray-300 mb-6">
            Seus créditos acabaram. Para continuar usando o Jamez, recarregue seus créditos.
          </p>

          <div className="flex flex-col gap-4">
            <Button
              variant="default"
              size="lg"
              className="w-full"
              onClick={() => window.location.href = '/planos'}
            >
              Ver Planos
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={onClose}
            >
              Fechar
            </Button>
          </div>
        </div>
      </div>
    </>
  )
} 