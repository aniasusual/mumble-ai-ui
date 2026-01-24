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
          className="absolute w-[600px] h-[600px] rounded-full opacity-30 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(143, 236, 120, 0.8) 0%, transparent 70%)',
            top: '-10%',
            right: '-10%',
            animation: 'meshFloat1 20s ease-in-out infinite',
          }}
        />
        
        {/* Blue blob - bottom left */}
        <div 
          className="absolute w-[500px] h-[500px] rounded-full opacity-25 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(74, 144, 217, 0.8) 0%, transparent 70%)',
            bottom: '-5%',
            left: '-10%',
            animation: 'meshFloat2 25s ease-in-out infinite',
          }}
        />
        
        {/* Purple blob - center */}
        <div 
          className="absolute w-[400px] h-[400px] rounded-full opacity-20 blur-[80px]"
          style={{
            background: 'radial-gradient(circle, rgba(168, 85, 247, 0.7) 0%, transparent 70%)',
            top: '40%',
            left: '30%',
            animation: 'meshFloat3 18s ease-in-out infinite',
          }}
        />
        
        {/* Teal blob - top left */}
        <div 
          className="absolute w-[350px] h-[350px] rounded-full opacity-20 blur-[90px]"
          style={{
            background: 'radial-gradient(circle, rgba(45, 212, 191, 0.7) 0%, transparent 70%)',
            top: '10%',
            left: '10%',
            animation: 'meshFloat4 22s ease-in-out infinite',
          }}
        />
        
        {/* Pink blob - bottom right */}
        <div 
          className="absolute w-[450px] h-[450px] rounded-full opacity-20 blur-[100px]"
          style={{
            background: 'radial-gradient(circle, rgba(244, 114, 182, 0.6) 0%, transparent 70%)',
            bottom: '10%',
            right: '5%',
            animation: 'meshFloat5 28s ease-in-out infinite',
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
            transform: translate(-30px, 40px) scale(1.1);
          }
          50% {
            transform: translate(20px, -20px) scale(0.95);
          }
          75% {
            transform: translate(-10px, 30px) scale(1.05);
          }
        }
        
        @keyframes meshFloat2 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(40px, -30px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        @keyframes meshFloat3 {
          0%, 100% {
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          50% {
            transform: translate(30px, 30px) scale(1.15) rotate(10deg);
          }
        }
        
        @keyframes meshFloat4 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          40% {
            transform: translate(25px, 35px) scale(1.1);
          }
          80% {
            transform: translate(-15px, -25px) scale(0.95);
          }
        }
        
        @keyframes meshFloat5 {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          30% {
            transform: translate(-35px, -20px) scale(1.05);
          }
          60% {
            transform: translate(25px, 30px) scale(0.95);
          }
        }
      `}</style>
    </div>
  );
};

export default MeshGradientBackground;
