'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Clock, Wallet, Camera, Lock, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { WalletButton } from '../wallet/WalletButton'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import ImageCropper from '@/components/ImageCropper'
import { updateUserProfile, uploadProfileImage } from './actions'

export default function ProfilePage() {
  const { user, userPlan, credits, updatePassword, signOut } = useAuth()
  const router = useRouter()
  const { toast } = useToast()

  const [isUpdating, setIsUpdating] = useState(false)
  const [cropImage, setCropImage] = useState<string | null>(null)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        if (e.target?.result) {
          setCropImage(e.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleCropComplete = async (croppedImage: string) => {
    try {
      if (user) {
        setIsUpdating(true)
        const response = await fetch(croppedImage)
        const blob = await response.blob()
        const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' })
        const publicUrl = await uploadProfileImage(user.id, file)
        await updateUserProfile(user.id, user.user_metadata.name, publicUrl)
        toast({
          title: 'Imagem de perfil atualizada',
          description: 'Sua foto de perfil foi atualizada com sucesso.',
        })
      }
    } catch (error) {
      console.error('Error updating profile image:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a imagem de perfil. Tente novamente.',
      })
    } finally {
      setIsUpdating(false)
      setCropImage(null)
    }
  }

  const handleUpdatePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'As senhas não coincidem.',
      })
      return
    }

    setIsUpdating(true)
    try {
      await updatePassword(oldPassword, newPassword)
      toast({
        title: 'Senha atualizada',
        description: 'Sua senha foi atualizada com sucesso.',
      })
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error updating password:', error)
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Não foi possível atualizar a senha. Verifique se a senha atual está correta.',
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0A0B14] text-white flex flex-col">
      {/* Header */}
      <div className="px-6 py-4">
        <button 
          onClick={() => router.push('/home')}
          className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>voltar</span>
        </button>
      </div>

      {/* Logo */}
      <div className="w-full flex justify-center mb-8">
        <Image
          src="https://jamez.pro/wp-content/uploads/2025/01/LOGO-jamez-colorbranco-2-1.png"
          alt="Jamez"
          width={120}
          height={40}
          className="h-8 w-auto"
        />
      </div>

      <div className="px-4 sm:px-6 space-y-6 sm:space-y-8">
        {/* Profile Section */}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold mb-6 sm:mb-8">Meu perfil</h1>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-700 rounded-full mb-3 sm:mb-4 flex items-center justify-center relative">
              <Image
                src={user?.user_metadata?.avatar_url || "https://jamez.pro/wp-content/uploads/2025/01/generic-avatar-jamez.png"}
                alt="Profile"
                width={80}
                height={80}
                className="rounded-full object-cover"
              />
              <label htmlFor="profile-image" className="absolute bottom-0 right-0 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full p-2 cursor-pointer hover:from-purple-700 hover:to-indigo-700 transition-all duration-300">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  id="profile-image"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
              </label>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold mb-1">{user?.user_metadata.name || 'User'}</h2>
            <p className="text-sm sm:text-base text-gray-400">{user?.email}</p>
          </div>
        </div>

        {/* General View Section */}
        <div>
          <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Visão Geral</h2>

          {/* Add Time Button */}
          <Link href="/wallet" className="block mb-3 sm:mb-4">
            <div className="bg-[#0D0F1A] rounded-xl sm:rounded-2xl p-3 sm:p-4 flex items-center justify-between">
              <div className="flex items-center gap-2 sm:gap-3">
                <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
                <span className="text-sm sm:text-base">Adicionar mais Tempo</span>
              </div>
              <span className="text-sm sm:text-base text-purple-400">Acessar Carteira</span>
            </div>
          </Link>

          {/* Plan Info */}
          <div className="bg-[#0D0F1A] rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-4">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <span className="text-base sm:text-lg">Plano Teste</span>
              <div className="flex items-center gap-2 bg-[#1A1B1E] rounded-full px-3 py-1 sm:px-4 sm:py-2">
                <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
                <span className="text-xs sm:text-sm text-gray-300">{formatTime(credits)}</span>
              </div>
            </div>

            {userPlan === 'free' && (
              <WalletButton
                variant="pro"
                className="w-full py-3 sm:py-4 text-base sm:text-lg"
                onClick={() => router.push('/wallet')}
              >
                ASSINAR PLANO PRO
              </WalletButton>
            )}
          </div>
        </div>

        {/* Change Password Button */}
        <div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full">
                <Lock className="w-4 h-4 mr-2" />
                Alterar Senha
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar Senha</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="old-password">Senha Atual</label>
                  <Input
                    id="old-password"
                    type="password"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="new-password">Nova Senha</label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="confirm-password">Confirmar Nova Senha</label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                  />
                </div>
              </div>
              <Button 
                onClick={handleUpdatePassword} 
                disabled={isUpdating}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                {isUpdating ? 'Atualizando...' : 'Atualizar Senha'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="mt-auto pt-8 pb-4 text-center">
        <button
          onClick={async () => {
            try {
              await signOut()
              router.push('/login')
            } catch (error) {
              console.error('Erro ao fazer logout:', error)
              toast({
                variant: 'destructive',
                title: 'Erro',
                description: 'Não foi possível fazer logout. Tente novamente.',
              })
            }
          }}
          className="text-sm text-gray-400 hover:text-white transition-colors inline-flex items-center"
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sair
        </button>
      </div>

      {cropImage && (
        <ImageCropper
          image={cropImage}
          onCropFinish={handleCropComplete}
          onCancel={() => setCropImage(null)}
        />
      )}
    </div>
  )
}

