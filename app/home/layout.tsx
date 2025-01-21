import { AuthProvider } from '@/contexts/AuthContext'
import { Providers } from '@/app/providers'

export default function HomeLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <AuthProvider>
      <Providers>{children}</Providers>
    </AuthProvider>
  )
}

