import { Metadata } from 'next'
import { Providers } from '@/app/providers'

export const metadata: Metadata = {
  title: 'Meu Perfil | Jamez AI Assistant',
  description: 'Gerencie suas informações de perfil no Jamez AI Assistant',
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}

