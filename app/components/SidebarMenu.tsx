'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'

interface SidebarMenuProps {
  isOpen: boolean
  onClose: () => void
}

export function SidebarMenu({ isOpen, onClose }: SidebarMenuProps) {
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEsc)
    }

    return () => {
      document.removeEventListener('keydown', handleEsc)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40"
        onClick={onClose}
      />
      <div className="fixed right-0 top-0 h-full w-64 bg-[#0A0B14] shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
        <div className="p-4 flex justify-between items-center border-b border-gray-700">
          <h2 className="text-white text-lg font-semibold">Menu</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="p-4">
          {/* Adicione seus itens de menu aqui */}
        </nav>
      </div>
    </>
  )
} 