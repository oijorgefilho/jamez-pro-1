import { Providers } from '../providers'

// Layout component for the register page
export default function RegisterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <Providers>{children}</Providers>
}

