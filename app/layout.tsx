'use client'

import './globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'
import { AuthProvider } from '@/contexts/AuthContext'
import { Toaster } from '@/components/ui/toaster'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-sans',
})

// Componente separado para verificação de créditos
function CreditChecker({ children }: { children: React.ReactNode }) {
  const { usePathname } = require('next/navigation')
  const { useAuth } = require('@/contexts/AuthContext')
  const { useEffect } = require('react')
  
  const pathname = usePathname()
  const { checkCreditsAndPlan } = useAuth()

  useEffect(() => {
    console.log('Página alterada:', pathname)
    checkCreditsAndPlan()
  }, [pathname, checkCreditsAndPlan])

  return children
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning className={inter.variable}>
      <head>
        <title>Jamez AI Assistant</title>
        <meta name="description" content="AI-powered voice assistant" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body suppressHydrationWarning className="min-h-screen bg-background text-foreground font-sans antialiased">
        <Providers>
          <AuthProvider>
            <CreditChecker>
              {children}
            </CreditChecker>
          </AuthProvider>
          <Toaster />
        </Providers>
      </body>
    </html>
  )
}