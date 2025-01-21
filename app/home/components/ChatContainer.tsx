import { Message } from '../types'
import { useEffect, useRef } from 'react'

interface ChatContainerProps {
  messages: Message[]
}

export function ChatContainer({ messages }: ChatContainerProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  return (
    <div className="h-[400px] min-h-[120px] bg-[#0D0F1A] rounded-3xl p-4 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full" 
          style={{ 
            backgroundImage: "url('https://jamez.pro/wp-content/uploads/2025/01/bg_jamez.webp')" 
          }} 
        />
      </div>
      <div className="relative h-full overflow-y-auto space-y-4 pr-2">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                message.role === 'user'
                  ? 'bg-gray-700/50 text-white'
                  : 'bg-blue-600 text-white'
              }`}
            >
              {message.role === 'user' && (
                <span className="text-xs font-medium block mb-1">Você:</span>
              )}
              {message.role === 'assistant' && (
                <span className="text-xs font-medium block mb-1">Jamez:</span>
              )}
              <p className="text-sm">
                {message.content}
              </p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <style jsx>{`
        .overflow-y-auto {
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        .overflow-y-auto::-webkit-scrollbar-track {
          background: transparent;
        }
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background-color: rgba(255, 255, 255, 0.2);
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}

