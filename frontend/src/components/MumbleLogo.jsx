import React from 'react';

// Minimalist chat bubble with dot - represents conversation/speaking
const MumbleLogo = ({ className = "", size = 40, color = "#ffffff", isAnimating = false }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Rounded rectangle (chat bubble) dimensions
  const bubbleWidth = size * 0.6;
  const bubbleHeight = size * 0.45;
  const cornerRadius = size * 0.12;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Chat bubble outline */}
      <rect
        x={centerX - bubbleWidth / 2}
        y={centerY - bubbleHeight / 2 - size * 0.05}
        width={bubbleWidth}
        height={bubbleHeight}
        rx={cornerRadius}
        stroke={color}
        strokeWidth={2}
        fill="none"
        opacity={0.85}
        style={{
          transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          transformOrigin: 'center',
          transition: 'transform 0.3s ease',
        }}
      />
      
      {/* Bubble tail/pointer */}
      <path
        d={`M ${centerX - size * 0.08} ${centerY + bubbleHeight / 2 - size * 0.05}
            L ${centerX - size * 0.15} ${centerY + bubbleHeight / 2 + size * 0.1}
            L ${centerX + size * 0.02} ${centerY + bubbleHeight / 2 - size * 0.05}`}
        stroke={color}
        strokeWidth={2}
        fill="none"
        strokeLinejoin="round"
        opacity={0.85}
      />
      
      {/* Three dots inside - typing/speaking indicator */}
      {[-1, 0, 1].map((offset, index) => (
        <circle
          key={index}
          cx={centerX + offset * size * 0.12}
          cy={centerY - size * 0.05}
          r={size * 0.04}
          fill={color}
          style={{
            opacity: isAnimating ? [0.5, 0.8, 1][index] : 0.7,
            transform: isAnimating 
              ? `translateY(${Math.sin(index * 0.5) * -3}px)` 
              : 'translateY(0)',
            transition: `all 0.3s ease ${index * 0.1}s`,
          }}
        />
      ))}
    </svg>
  );
};

export default MumbleLogo;
