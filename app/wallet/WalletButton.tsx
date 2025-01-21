"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const walletButtonVariants = cva(
  "inline-flex items-center justify-center text-base font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 rounded-full shadow-lg",
  {
    variants: {
      variant: {
        default: "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white",
        secondary: "bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white",
        outline: "border-2 border-purple-500 bg-transparent text-purple-500 hover:bg-purple-500 hover:text-white",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        pro: "bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 hover:from-indigo-600 hover:via-purple-600 hover:to-pink-600 text-white",
      },
      size: {
        default: "h-12 px-6 py-3",
        sm: "h-10 px-4 py-2",
        lg: "h-14 px-8 py-4",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface WalletButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof walletButtonVariants> {
  isLoading?: boolean;
}

const WalletButton = React.forwardRef<HTMLButtonElement, WalletButtonProps>(
  ({ className, variant, size, isLoading, children, ...props }, ref) => {
    return (
      <button
        className={cn(
          walletButtonVariants({ variant, size, className }),
          "font-sora transform hover:scale-105 active:scale-100 transition-transform",
          isLoading && "opacity-70 cursor-not-allowed"
        )}
        disabled={isLoading}
        ref={ref}
        {...props}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
            Carregando...
          </div>
        ) : (
          children
        )}
      </button>
    )
  }
)
WalletButton.displayName = "WalletButton"

export { WalletButton, walletButtonVariants }

