import React, { useState, useEffect, useCallback, useRef } from 'react';

const LiquidOrb = ({ isSpeaking = false, className = "" }) => {
  const [mousePosition, setMousePosition] = useState({ x: 0.5, y: 0.5 });
  const [audioLevel, setAudioLevel] = useState(0);
  const animationRef = useRef(null);
  
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
  
  // Simulate audio-reactive animation ONLY when speaking
  useEffect(() => {
    if (isSpeaking) {
      const animateLevel = () => {
        // Create organic, speech-like fluctuations
        const time = Date.now() / 1000;
        const base = Math.sin(time * 3) * 0.3;
        const mid = Math.sin(time * 7) * 0.25;
        const high = Math.sin(time * 13) * 0.15;
        const random = Math.random() * 0.3;
        const level = Math.abs(base + mid + high + random);
        setAudioLevel(Math.min(1, level));
        animationRef.current = requestAnimationFrame(animateLevel);
      };
      animateLevel();
    } else {
      // Reset to static state
      setAudioLevel(0);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isSpeaking]);
  
  // Calculate subtle offset based on mouse position
  const offsetX = (mousePosition.x - 0.5) * 15;
  const offsetY = (mousePosition.y - 0.5) * 15;
  
  // Dynamic values - only apply when speaking
  const scale = isSpeaking ? 1 + audioLevel * 0.15 : 1;
  const pulseScale = 1 + audioLevel * 0.3;
  
  return (
    <div 
      className={`relative ${className}`}
      style={{
        padding: isSpeaking ? '60px' : '40px',
        margin: isSpeaking ? '-60px' : '-40px',
        transition: 'padding 0.3s ease-out, margin 0.3s ease-out',
      }}
    >
      {/* === SPEAKING ONLY: Outer ripple rings === */}
      {isSpeaking && (
        <>
          <div 
            className="absolute rounded-full"
            style={{
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              border: `2px solid rgba(143, 236, 120, ${0.1 + audioLevel * 0.2})`,
              transform: `scale(${1.2 + audioLevel * 0.3})`,
              transition: 'transform 0.1s ease-out, border-color 0.1s ease-out',
              opacity: 0.6,
            }}
          />
          <div 
            className="absolute rounded-full"
            style={{
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              border: `1px solid rgba(143, 236, 120, ${0.05 + audioLevel * 0.15})`,
              transform: `scale(${1.4 + audioLevel * 0.4})`,
              transition: 'transform 0.15s ease-out, border-color 0.15s ease-out',
              opacity: 0.4,
            }}
          />
          <div 
            className="absolute rounded-full"
            style={{
              top: '20px',
              left: '20px',
              right: '20px',
              bottom: '20px',
              border: `1px solid rgba(143, 236, 120, ${0.03 + audioLevel * 0.1})`,
              transform: `scale(${1.6 + audioLevel * 0.5})`,
              transition: 'transform 0.2s ease-out, border-color 0.2s ease-out',
              opacity: 0.2,
            }}
          />
        </>
      )}
      
      {/* Glow effect - static when idle, dynamic when speaking */}
      <div 
        className="absolute orb-glow"
        style={{
          top: '0',
          left: '0',
          right: '0',
          bottom: '0',
          background: isSpeaking
            ? `radial-gradient(circle, rgba(143, 236, 120, ${0.4 + audioLevel * 0.4}) 0%, rgba(74, 144, 217, ${0.24 + audioLevel * 0.24}) 40%, transparent 70%)`
            : 'radial-gradient(circle, rgba(143, 236, 120, 0.25) 0%, rgba(74, 144, 217, 0.15) 40%, transparent 70%)',
          transform: isSpeaking 
            ? `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px) scale(${pulseScale})`
            : `translate(${offsetX * 0.5}px, ${offsetY * 0.5}px)`,
          transition: isSpeaking ? 'transform 0.1s ease-out' : 'transform 0.4s ease-out',
        }}
      />
      
      {/* === SPEAKING ONLY: Pulsing aura === */}
      {isSpeaking && (
        <div 
          className="absolute rounded-full"
          style={{
            top: '30px',
            left: '30px',
            right: '30px',
            bottom: '30px',
            background: `radial-gradient(circle, transparent 40%, rgba(143, 236, 120, ${0.15 + audioLevel * 0.2}) 50%, transparent 60%)`,
            transform: `scale(${pulseScale})`,
            transition: 'transform 0.1s ease-out',
          }}
        />
      )}
      
      {/* Main liquid orb */}
      <div 
        className={`liquid-orb ${isSpeaking ? 'speaking' : ''} relative w-40 h-40 md:w-52 md:h-52 rounded-full`}
        style={{
          background: isSpeaking 
            ? `
              radial-gradient(circle at 30% 30%, rgba(255, 255, 255, ${0.15 + audioLevel * 0.1}) 0%, transparent 25%),
              radial-gradient(circle at 70% 70%, rgba(74, 144, 217, ${0.4 + audioLevel * 0.2}) 0%, transparent 35%),
              radial-gradient(circle at 50% 50%, rgba(143, 236, 120, ${0.7 + audioLevel * 0.2}) 0%, rgba(129, 221, 103, ${0.5 + audioLevel * 0.15}) 40%, rgba(74, 144, 217, ${0.4 + audioLevel * 0.2}) 80%)
            `
            : `
              radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, transparent 25%),
              radial-gradient(circle at 70% 70%, rgba(74, 144, 217, 0.4) 0%, transparent 35%),
              radial-gradient(circle at 50% 50%, rgba(143, 236, 120, 0.7) 0%, rgba(129, 221, 103, 0.5) 40%, rgba(74, 144, 217, 0.4) 80%)
            `,
          boxShadow: isSpeaking
            ? `
              0 0 ${80 + audioLevel * 60}px rgba(143, 236, 120, ${0.3 + audioLevel * 0.3}),
              0 0 ${150 + audioLevel * 80}px rgba(74, 144, 217, ${0.15 + audioLevel * 0.15}),
              inset 0 0 ${40 + audioLevel * 20}px rgba(255, 255, 255, ${0.1 + audioLevel * 0.1}),
              inset 0 0 ${20 + audioLevel * 15}px rgba(143, 236, 120, ${0.2 + audioLevel * 0.2})
            `
            : `
              0 0 80px rgba(143, 236, 120, 0.3),
              0 0 150px rgba(74, 144, 217, 0.15),
              inset 0 0 40px rgba(255, 255, 255, 0.1),
              inset 0 0 20px rgba(143, 236, 120, 0.2)
            `,
          transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
          transition: isSpeaking ? 'transform 0.1s ease-out, box-shadow 0.1s ease-out' : 'transform 0.4s ease-out',
        }}
      >
        {/* Inner highlight - static when idle, moves when speaking */}
        <div 
          className="absolute w-10 h-6 md:w-12 md:h-8 rounded-full opacity-40"
          style={{
            background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.6) 0%, transparent 60%)',
            top: isSpeaking ? `${18 - audioLevel * 3}%` : '18%',
            left: isSpeaking ? `${15 + audioLevel * 2}%` : '15%',
            transform: `rotate(${isSpeaking ? -25 + audioLevel * 10 : -25}deg)`,
            opacity: isSpeaking ? 0.4 + audioLevel * 0.2 : 0.4,
            transition: isSpeaking ? 'all 0.1s ease-out' : 'none',
          }}
        />
        
        {/* === SPEAKING ONLY: Secondary highlight === */}
        {isSpeaking && (
          <div 
            className="absolute w-6 h-4 md:w-8 md:h-5 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, transparent 60%)',
              bottom: `${20 + audioLevel * 5}%`,
              right: `${18 + audioLevel * 3}%`,
              transform: `rotate(${155 - audioLevel * 15}deg)`,
              opacity: 0.2 + audioLevel * 0.3,
              transition: 'all 0.1s ease-out',
            }}
          />
        )}
        
        {/* === SPEAKING ONLY: Center glow pulse === */}
        {isSpeaking && (
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(255, 255, 255, ${audioLevel * 0.15}) 0%, transparent 50%)`,
              transition: 'background 0.1s ease-out',
            }}
          />
        )}
      </div>
      
      {/* === SPEAKING ONLY: Sound wave indicators === */}
      {isSpeaking && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 rounded-full"
              style={{
                height: `${8 + audioLevel * 20 + Math.sin(Date.now() / 100 + i) * 5}px`,
                background: `linear-gradient(to top, rgba(143, 236, 120, ${0.3 + audioLevel * 0.4}), transparent)`,
                transform: `rotate(${i * 45}deg) translateY(${-95 - audioLevel * 10}px)`,
                transition: 'height 0.05s ease-out',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default LiquidOrb;
