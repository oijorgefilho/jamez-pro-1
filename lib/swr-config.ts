import { SWRConfig } from 'swr'
import { log } from '@/utils/logger'

export const swrConfig = {
  errorRetryCount: 3,
  shouldRetryOnError: true,
  revalidateOnFocus: false,
  revalidateOnReconnect: true,
  refreshInterval: 0,
  onError: (error: any, key: string) => {
    log.error(`SWR Error for ${key}:`, error)
  },
  onSuccess: (data: any, key: string) => {
    log.info(`SWR Success for ${key}`)
  }
} 