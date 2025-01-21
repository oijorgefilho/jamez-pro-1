import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { WalletButton } from '@/app/wallet/WalletButton'
import { useRouter } from 'next/navigation'
import { X } from 'lucide-react'

interface NoCreditsPopupProps {
  isOpen: boolean
  onClose: () => void
}

const NoCreditsPopup: React.FC<NoCreditsPopupProps> = ({ isOpen, onClose }) => {
  const router = useRouter()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[90%] w-[320px] md:w-[425px] bg-[#1A1B1E] text-white rounded-xl">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-lg sm:text-xl font-semibold text-center">Créditos Insuficientes</DialogTitle>
        </DialogHeader>
        <div className="mt-2 sm:mt-4 text-center px-4 sm:px-6">
          <p className="mb-4 sm:mb-6 text-sm sm:text-base">Você não tem créditos disponíveis para usar o Jamez. Por favor, recarregue seus créditos para continuar.</p>
          <WalletButton
            onClick={() => {
              router.push('/wallet')
              onClose()
            }}
            className="w-full py-2 sm:py-3 text-sm sm:text-base"
          >
            Recarregar Créditos
          </WalletButton>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default NoCreditsPopup

