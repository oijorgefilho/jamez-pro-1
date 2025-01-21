import { toast as showToastBase } from '@/components/ui/use-toast'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

interface ToastProps {
  title: string
  description?: string
  type?: 'success' | 'error' | 'warning'
}

export const showToast = ({ title, description, type = 'success' }: ToastProps) => {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-green-500" />,
    error: <AlertCircle className="h-5 w-5 text-red-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />
  }

  showToastBase({
    variant: type === 'error' ? 'destructive' : 'default',
    title,
    description,
    className: `${
      type === 'success'
        ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900/50'
        : type === 'error'
        ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-900/50'
        : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-900/50'
    }`
  })
} 