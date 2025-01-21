"use client"

import * as React from "react"
import { Button } from '@/components/ui/button'
import { cn } from "@/lib/utils"

interface WalletButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
}

export const WalletButton = React.forwardRef<HTMLButtonElement, WalletButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <Button
        ref={ref}
        variant={variant}
        size={size}
        className={cn(
          'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white',
          className
        )}
        {...props}
      />
    )
  }
)

WalletButton.displayName = 'WalletButton'

