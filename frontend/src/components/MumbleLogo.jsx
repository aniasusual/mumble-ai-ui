import React from 'react';

// Concentric sound ripples logo - represents voice/speech emanating outward
const MumbleLogo = ({ className = "", size = 40, color = "#ffffff", isAnimating = false }) => {
  const centerX = size / 2;
  const centerY = size / 2;
  
  // Three concentric arcs on the right side (like sound waves)
  const arcs = [
    { radius: size * 0.15, strokeWidth: 2.5 },
    { radius: size * 0.26, strokeWidth: 2 },
    { radius: size * 0.37, strokeWidth: 1.5 },
  ];
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Center dot - the source of sound */}
      <circle
        cx={centerX * 0.65}
        cy={centerY}
        r={size * 0.08}
        fill={color}
        style={{
          opacity: isAnimating ? 1 : 0.9,
          transform: isAnimating ? 'scale(1.1)' : 'scale(1)',
          transformOrigin: `${centerX * 0.65}px ${centerY}px`,
          transition: 'all 0.2s ease',
        }}
      />
      
      {/* Sound wave arcs */}
      {arcs.map((arc, index) => (
        <path
          key={index}
          d={`M ${centerX * 0.65 + arc.radius * 0.7} ${centerY - arc.radius}
              A ${arc.radius} ${arc.radius} 0 0 1 ${centerX * 0.65 + arc.radius * 0.7} ${centerY + arc.radius}`}
          stroke={color}
          strokeWidth={arc.strokeWidth}
          strokeLinecap="round"
          fill="none"
          style={{
            opacity: isAnimating ? [0.9, 0.7, 0.5][index] : [0.8, 0.6, 0.4][index],
            transform: isAnimating 
              ? `translateX(${(index + 1) * 2}px)` 
              : 'translateX(0)',
            transition: `all 0.3s ease ${index * 0.1}s`,
          }}
        />
      ))}
    </svg>
  );
};

export default MumbleLogo;
