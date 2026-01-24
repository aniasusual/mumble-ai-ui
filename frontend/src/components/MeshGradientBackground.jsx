import React from 'react';

const MeshGradientBackground = ({ children }) => {
  return (
    <div className="relative min-h-screen overflow-hidden bg-black">
      {/* Base gradient layer */}
      <div 
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(120, 119, 198, 0.3), transparent)',
        }}
      />
      
      {/* Animated mesh gradient blobs */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Green blob - top right */}
        <div 
          className="absolute w-[800px] h-[800px] rounded-full opacity-60 blur-[120px]"
          style={{
            background: 'radial-gradient(circle, rgba(143, 236, 120, 1) 0%, rgba(143, 236, 120, 0.4) 40%, transparent 70%)',
            top: '-20%',
            right: '-15%',
            animation: 'meshFloat1 20s ease-in-out infinite',
          }}
        />
        
        {/* Blue blob - bottom left */}
        <div 
          className="absolute w-[700px] h-[700px] rounded-full opacity-50 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(74, 144, 217, 1) 0%, rgba(74, 144, 217, 0.4) 40%, transparent 70%)',
            bottom: '-15%',
            left: '-15%',
            animation: 'meshFloat2 25s ease-in-out infinite',
          }}
        />
        
        {/* Purple blob - center */}
        <div 
          className="absolute w-[600px] h-[600px] rounded-full opacity-40 blur-[90px]"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 1) 0%, rgba(168, 85, 247, 0.3) 50%, transparent 70%)',
            top: '30%',
            left: '25%',
            animation: 'meshFloat3 18s ease-in-out infinite',
          }}
        />
        
        {/* Teal blob - top left */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-45 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(45, 212, 191, 1) 0%, rgba(45, 212, 191, 0.3) 50%, transparent 70%)',
            top: '5%',
            left: '5%',
            animation: 'meshFloat4 22s ease-in-out infinite',
          }}
        />
        
        {/* Pink blob - bottom right */}
        <div 
          className="absolute w-[650px] h-[650px] rounded-full opacity-45 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(244, 114, 182, 1) 0%, rgba(244, 114, 182, 0.3) 50%, transparent 70%)',
            bottom: '5%',
            right: '0%',
            animation: 'meshFloat5 28s ease-in-out infinite',
          }}
        />
        
        {/* Extra orange/yellow blob - center right */}
        <div 
          className="absolute w-[450px] h-[450px] rounded-full opacity-35 blur-[90px]"
          style={{
            background: 'radial-gradient(circle, rgba(251, 191, 36, 1) 0%, rgba(251, 146, 60, 0.3) 50%, transparent 70%)',
            top: '50%',
            right: '20%',
            animation: 'meshFloat6 24s ease-in-out infinite',
          }}
        />
      </div>
      
      {/* Noise texture overlay for depth */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes meshFloat1 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(-50px, 60px) scale(1.1);
          }
          50% {
            transform: translate(30px, -30px) scale(0.95);
          }
          75% {
            transform: translate(-20px, 40px) scale(1.05);
          }
        }
        
        @keyframes meshFloat2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(60px, -50px) scale(1.15);
          }
          66% {
            transform: translate(-30px, 30px) scale(0.9);
          }
        }
        
        @keyframes meshFloat3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(50px, 50px) scale(1.2) rotate(15deg);
          }
        }
        
        @keyframes meshFloat4 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          40% {
            transform: translate(40px, 50px) scale(1.15);
          }
          80% {
            transform: translate(-25px, -35px) scale(0.95);
          }
        }
        
        @keyframes meshFloat5 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          30% {
            transform: translate(-50px, -30px) scale(1.1);
          }
          60% {
            transform: translate(35px, 45px) scale(0.95);
          }
        }
        
        @keyframes meshFloat6 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          35% {
            transform: translate(-40px, 30px) scale(1.1);
          }
          70% {
            transform: translate(30px, -40px) scale(0.9);
          }
        }
      `}</style>
    </div>
  );
};

export default MeshGradientBackground;
