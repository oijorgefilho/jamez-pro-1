import { Metadata } from 'next'
import { Providers } from '@/app/providers'

export const metadata: Metadata = {
  title: 'Login | Jamez AI Assistant',
  description: 'Faça login na sua conta Jamez AI Assistant',
}

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}

