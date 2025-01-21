'use client'

import React, { useState, useEffect, useRef } from 'react'
import { SidebarMenu } from '@/components/SidebarMenu'
import Header from '../home/components/Header'

const RealsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const toggleSidebar = () => setIsSidebarOpen(prevState => !prevState);

  useEffect(() => {
    const handleResize = () => {
      if (iframeRef.current) {
        const headerHeight = 80; // Approximate height of the header
        const paddingTop = 24; // 6 * 4px (default tailwind spacing unit)
        const windowHeight = window.innerHeight;
        iframeRef.current.style.height = `${windowHeight - headerHeight - paddingTop}px`;
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#0A0B14]">
      <Header openSidebar={toggleSidebar} />
      <div className="flex-grow w-full overflow-hidden pt-6">
        <iframe
          ref={iframeRef}
          src="https://m.realsbet.com/signup?btag=UX-35492"
          id="custom-iframe"
          className="w-full h-full"
          style={{
            border: 'none',
            width: '100%',
            height: '100%',
          }}
          scrolling="no"
        />
      </div>
      <SidebarMenu isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
    </div>
  )
}

export default RealsPage

