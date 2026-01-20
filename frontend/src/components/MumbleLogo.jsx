import React from 'react';

const MumbleLogo = ({ className = "", size = 40, color = "#8FEC78" }) => {
  const pillWidth = size * 0.18;
  const pillHeight = size * 0.7;
  const gap = size * 0.12;
  const cornerRadius = pillWidth / 2;
  
  // Calculate positions for 3 pills
  const totalWidth = (pillWidth * 3) + (gap * 2);
  const startX = (size - totalWidth) / 2;
  const pillY = (size - pillHeight) / 2;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* First pill */}
      <rect 
        x={startX} 
        y={pillY} 
        width={pillWidth} 
        height={pillHeight} 
        rx={cornerRadius}
        fill={color}
      />
      {/* Second pill (middle, slightly taller) */}
      <rect 
        x={startX + pillWidth + gap} 
        y={pillY - size * 0.08} 
        width={pillWidth} 
        height={pillHeight + size * 0.08} 
        rx={cornerRadius}
        fill={color}
      />
      {/* Third pill */}
      <rect 
        x={startX + (pillWidth + gap) * 2} 
        y={pillY} 
        width={pillWidth} 
        height={pillHeight} 
        rx={cornerRadius}
        fill={color}
      />
    </svg>
  );
};

export default MumbleLogo;
