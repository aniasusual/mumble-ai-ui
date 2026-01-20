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
  const offsetX = (mousePosition.x - 0.5) * 20;
  const offsetY = (mousePosition.y - 0.5) * 20;
  
  return (
    <div className={`relative ${className}`}>
      {/* Glow effect behind orb */}
      <div 
        className="absolute inset-0 orb-glow"
        style={{
          background: 'radial-gradient(circle, rgba(143, 236, 120, 0.4) 0%, rgba(74, 144, 217, 0.3) 40%, transparent 70%)',
          transform: `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      />
      
      {/* Ripple effects */}
      {isSpeaking && (
        <>
          <div 
            className="absolute inset-0 ripple-effect rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 50%, rgba(143, 236, 120, 0.2) 70%, transparent 80%)',
              animationDelay: '0s',
            }}
          />
          <div 
            className="absolute inset-0 ripple-effect rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 50%, rgba(74, 144, 217, 0.2) 70%, transparent 80%)',
              animationDelay: '0.5s',
            }}
          />
          <div 
            className="absolute inset-0 ripple-effect rounded-full"
            style={{
              background: 'radial-gradient(circle, transparent 50%, rgba(34, 211, 238, 0.15) 70%, transparent 80%)',
              animationDelay: '1s',
            }}
          />
        </>
      )}
      
      {/* Main liquid orb */}
      <div 
        className={`liquid-orb ${isSpeaking ? 'speaking' : ''} relative w-48 h-48 md:w-64 md:h-64`}
        style={{
          background: `
            radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4) 0%, transparent 30%),
            radial-gradient(circle at 70% 70%, rgba(74, 144, 217, 0.6) 0%, transparent 40%),
            radial-gradient(circle at 50% 50%, rgba(143, 236, 120, 0.9) 0%, rgba(129, 221, 103, 0.8) 40%, rgba(74, 144, 217, 0.7) 80%)
          `,
          boxShadow: `
            0 0 60px rgba(143, 236, 120, 0.5),
            0 0 120px rgba(74, 144, 217, 0.3),
            inset 0 0 60px rgba(255, 255, 255, 0.2),
            inset 0 0 30px rgba(143, 236, 120, 0.3)
          `,
          transform: `translate(${offsetX}px, ${offsetY}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        {/* Inner highlight */}
        <div 
          className="absolute w-12 h-8 md:w-16 md:h-10 rounded-full opacity-60"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, transparent 60%)',
            top: '20%',
            left: '15%',
            transform: 'rotate(-25deg)',
          }}
        />
        
        {/* Secondary highlight */}
        <div 
          className="absolute w-6 h-4 md:w-8 md:h-6 rounded-full opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 60%)',
            bottom: '25%',
            right: '20%',
            transform: 'rotate(-25deg)',
          }}
        />
      </div>
    </div>
  );
};

export default LiquidOrb;
