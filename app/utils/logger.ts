type LogLevel = 'info' | 'warn' | 'error'

class Logger {
  private prefix = '[Jamez]'

  private formatMessage(level: LogLevel, message: string, data?: any) {
    const timestamp = new Date().toISOString()
    const formattedMessage = `${this.prefix} [${timestamp}] [${level.toUpperCase()}] ${message}`
    if (data) {
      return { message: formattedMessage, data }
    }
    return formattedMessage
  }

  info(message: string, data?: any) {
    console.log(this.formatMessage('info', message, data))
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage('warn', message, data))
  }

  error(message: string, error?: any) {
    console.error(this.formatMessage('error', message, error))
  }
}

export const log = new Logger() 