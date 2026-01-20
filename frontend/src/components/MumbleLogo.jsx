import React from 'react';

// Two overlapping circles forming an abstract "m" - modern, clean, memorable
const MumbleLogo = ({ className = "", size = 40, color = "#ffffff", isAnimating = false }) => {
  const r = size * 0.22; // radius of each circle
  const overlap = size * 0.12; // how much circles overlap
  
  const leftX = size / 2 - r + overlap / 2;
  const rightX = size / 2 + r - overlap / 2;
  const centerY = size / 2;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Left circle */}
      <circle
        cx={leftX}
        cy={centerY}
        r={r}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        style={{
          opacity: isAnimating ? 1 : 0.85,
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: `${leftX}px ${centerY}px`,
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Right circle */}
      <circle
        cx={rightX}
        cy={centerY}
        r={r}
        stroke={color}
        strokeWidth={2.5}
        fill="none"
        style={{
          opacity: isAnimating ? 1 : 0.85,
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: `${rightX}px ${centerY}px`,
          transition: 'all 0.3s ease 0.1s',
        }}
      />
      
      {/* Center connection dot */}
      <circle
        cx={size / 2}
        cy={centerY}
        r={size * 0.045}
        fill={color}
        style={{
          opacity: isAnimating ? 1 : 0.7,
          transform: isAnimating ? 'scale(1.3)' : 'scale(1)',
          transformOrigin: 'center',
          transition: 'all 0.2s ease',
        }}
      />
    </svg>
  );
};

export default MumbleLogo;
