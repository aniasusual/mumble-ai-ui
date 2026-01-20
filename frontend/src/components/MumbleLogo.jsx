import React from 'react';

// Waveform-based "M" logo - represents sound/mumble
const MumbleLogo = ({ className = "", size = 40, color = "#ffffff", isAnimating = false }) => {
  const barWidth = size * 0.08;
  const gap = size * 0.06;
  const maxHeight = size * 0.7;
  
  // 5 bars forming an "M" shape with waveform aesthetic
  // Heights: short, tall, medium, tall, short (M shape)
  const barHeights = [0.5, 0.9, 0.6, 0.9, 0.5];
  
  const totalWidth = (barWidth * 5) + (gap * 4);
  const startX = (size - totalWidth) / 2;
  
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox={`0 0 ${size} ${size}`} 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {barHeights.map((heightRatio, index) => {
        const barHeight = maxHeight * heightRatio;
        const x = startX + (index * (barWidth + gap));
        const y = (size - barHeight) / 2;
        
        return (
          <rect
            key={index}
            className={`waveform-bar ${!isAnimating ? 'paused' : ''}`}
            x={x}
            y={y}
            width={barWidth}
            height={barHeight}
            rx={barWidth / 2}
            fill={color}
            style={{
              transformOrigin: `${x + barWidth/2}px ${size/2}px`,
            }}
          />
        );
      })}
    </svg>
  );
};

export default MumbleLogo;
