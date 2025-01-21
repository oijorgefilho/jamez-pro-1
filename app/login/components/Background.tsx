export default function Background() {
  return (
    <>
      {/* Dark gradient base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#0A0B14] via-[#0D0F1A] to-[#0A0B14]" />

      {/* Animated glow effects */}
      <div className="absolute inset-0">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-purple-600/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-40 left-1/4 w-[400px] h-[400px] bg-blue-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-60 right-1/4 w-[500px] h-[500px] bg-purple-600/20 rounded-full blur-[120px]" />
      </div>

      {/* Grid overlay */}
      <div 
        className="absolute inset-0 opacity-[0.15]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px)
          `,
          backgroundSize: '20px 20px'
        }}
      />

      {/* Radial platform effect */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-[400px]"
        style={{
          background: `
            radial-gradient(
              circle at 50% 100%,
              rgba(147, 51, 234, 0.3) 0%,
              rgba(147, 51, 234, 0) 70%
            )
          `
        }}
      />

      {/* Accent lines */}
      <div className="absolute bottom-20 left-0 right-0">
        <div className="relative max-w-md mx-auto">
          <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
          <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/30 to-transparent transform translate-y-2" />
        </div>
      </div>
    </>
  )
}

