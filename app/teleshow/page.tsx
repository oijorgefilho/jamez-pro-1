'use client'

import React, { useState, useEffect } from 'react'
import { SidebarMenu } from '@/components/SidebarMenu'
import { Send } from 'lucide-react'

const TeleshowPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prevState => !prevState);

  useEffect(() => {
    const iframe = document.getElementById('teleshow-iframe') as HTMLIFrameElement;
    if (iframe) {
      const resizeIframe = () => {
        iframe.style.height = `${window.innerHeight}px`;
      };
      window.addEventListener('resize', resizeIframe);
      resizeIframe();
      return () => window.removeEventListener('resize', resizeIframe);
    }
  }, []);

  return (
    <div 
      className="min-h-screen w-full flex flex-col bg-cover bg-center relative"
      style={{
        backgroundImage: "url('https://jamez.pro/wp-content/uploads/2025/01/bg_jamez_9_16_1.webp')",
      }}
    >
      <button 
        className="fixed top-4 right-4 z-50 p-2 bg-gray-800 rounded-md"
        onClick={toggleSidebar}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      </button>
      <div className="flex-grow w-full h-screen">
        <iframe
          src="https://teleshow.com.br/telegram/"
          id="teleshow-iframe"
          className="w-full h-full"
          style={{
            border: 'none',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          }}
        />
      </div>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  )
}

export default TeleshowPage

