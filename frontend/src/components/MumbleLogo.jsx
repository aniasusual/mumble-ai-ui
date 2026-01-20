import React from 'react';

// Abstract speech bubble with sound waves - modern and minimal
const MumbleLogo = ({ className = "", size = 40, color = "#ffffff", isAnimating = false }) => {
  const centerX = size / 2;
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
      {/* Outer ring - speech bubble abstraction */}
      <circle
        cx={centerX}
        cy={centerY}
        r={size * 0.38}
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.3}
      />
      
      {/* Inner animated ring */}
      <circle
        cx={centerX}
        cy={centerY}
        r={size * 0.26}
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.6}
        style={{
          transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
          transformOrigin: 'center',
          transition: 'transform 0.3s ease',
        }}
      />
      
      {/* Center dot - voice source */}
      <circle
        cx={centerX}
        cy={centerY}
        r={size * 0.1}
        fill={color}
        style={{
          transform: isAnimating ? 'scale(1.2)' : 'scale(1)',
          transformOrigin: 'center',
          transition: 'transform 0.2s ease',
        }}
      />
      
      {/* Small accent dot - like a speech indicator */}
      <circle
        cx={centerX + size * 0.32}
        cy={centerY + size * 0.32}
        r={size * 0.05}
        fill={color}
        opacity={0.7}
      />
    </svg>
  );
};

export default MumbleLogo;
