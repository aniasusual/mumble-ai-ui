import React, { useState, useEffect, useCallback } from 'react';

const LiquidOrb = ({ isSpeaking = false, className = "" }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  
  // Track mouse position for subtle interaction
  const handleMouseMove = useCallback((e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    setMousePosition({ x, y });
  }, []);
  
  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [handleMouseMove]);
  
  // Calculate subtle offset based on mouse position
  const offsetX = (mousePosition.x - 0.5) * 15;
  const offsetY = (mousePosition.y - 0.5) * 15;
  
  return (
    <div className={`relative ${className}`}>
      {/* Glow effect behind orb - subtle on dark background */}
      <div 
        className="absolute inset-0 orb-glow"
        style={{
          background: 'radial-gradient(circle, rgba(143, 236, 120, 0.25) 0%, rgba(74, 144, 217, 0.15) 40%, transparent 70%)',
          transform: `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)`,
          transition: 'transform 0.4s ease-out',
        }}
      />
      
      {/* Ripple effects when speaking */}
      {isSpeaking && (
        <>
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 40%, rgba(143, 236, 120, 0.15) 60%, transparent 70%)',
              animation: 'pulse 1.5s ease-in-out infinite',
            }}
          />
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 40%, rgba(74, 144, 217, 0.1) 60%, transparent 70%)',
              animation: 'pulse 1.5s ease-in-out infinite 0.5s',
            }}
          />
        </>
      )}
      
      {/* Main liquid orb - darker, more subtle */}
      <div 
        className={`liquid-orb ${isSpeaking ? 'speaking' : ''} relative w-40 h-40 md:w-52 md:h-52`}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 25%),
            radial-gradient(circle at 70% 70%, rgba(74, 144, 217, 0.4) 0%, transparent 35%),
            radial-gradient(circle at 50% 50%, rgba(143, 236, 120, 0.7) 0%, rgba(129, 221, 103, 0.5) 40%, rgba(74, 144, 217, 0.4) 80%)
          `,
          boxShadow: `
            0 0 80px rgba(143, 236, 120, 0.3),
            0 0 150px rgba(74, 144, 217, 0.15),
            inset 0 0 40px rgba(255, 255, 255, 0.1),
            inset 0 0 20px rgba(143, 236, 120, 0.2)
          `,
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          transition: 'transform 0.4s ease-out',
        }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute w-10 h-6 md:w-12 md:h-8 rounded-full opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 60%)',
            top: '18%',
            left: '15%',
            transform: 'rotate(-25deg)',
          }}
        />
      </div>
    </div>
  );
};

export default LiquidOrb;
