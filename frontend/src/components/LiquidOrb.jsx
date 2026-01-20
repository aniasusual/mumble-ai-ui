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
    <div 
      className={`relative ${className}`}
      style={{
        // Add padding to prevent clipping of glow and animations
        padding: '40px',
        margin: '-40px',
      }}
    >
      {/* Glow effect behind orb - subtle on dark background */}
      <div 
        className="absolute orb-glow"
        style={{
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: 'radial-gradient(circle, rgba(143, 236, 120, 0.25) 0%, rgba(74, 144, 217, 0.15) 40%, transparent 70%)',
          transform: `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)`,
          transition: 'transform 0.4s ease-out',
        }}
      />
      
      {/* Soft pulse effect when speaking - very subtle */}
      {isSpeaking && (
        <div 
          className="absolute rounded-full"
          style={{
            top: '40px',
            left: '40px',
            right: '40px',
            bottom: '40px',
            background: 'radial-gradient(circle, transparent 45%, rgba(143, 236, 120, 0.12) 55%, transparent 65%)',
            animation: 'softPulse 2s ease-in-out infinite',
          }}
        />
      )}
      
      {/* Main liquid orb */}
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
