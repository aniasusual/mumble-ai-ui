import React from 'react';

// Sound wave logo - clean, minimal, represents voice/speech
const MumbleLogo = ({ className = "", size = 40, color = "#ffffff", isAnimating = false }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 40 40" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Sound wave bars - 5 bars creating a wave pattern */}
      {/* Bar 1 - left */}
      <rect
        x="6"
        y="16"
        width="4"
        height="8"
        rx="2"
        fill={color}
        opacity={isAnimating ? 0.9 : 0.6}
        style={{
          transform: isAnimating ? 'scaleY(1.3)' : 'scaleY(1)',
          transformOrigin: 'center',
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Bar 2 */}
      <rect
        x="12"
        y="12"
        width="4"
        height="16"
        rx="2"
        fill={color}
        opacity={isAnimating ? 1 : 0.75}
        style={{
          transform: isAnimating ? 'scaleY(1.2)' : 'scaleY(1)',
          transformOrigin: 'center',
          transition: 'all 0.3s ease 0.05s',
        }}
      />
      
      {/* Bar 3 - center, tallest */}
      <rect
        x="18"
        y="8"
        width="4"
        height="24"
        rx="2"
        fill={isAnimating ? "#8FEC78" : color}
        opacity={1}
        style={{
          transform: isAnimating ? 'scaleY(1.1)' : 'scaleY(1)',
          transformOrigin: 'center',
          filter: isAnimating ? 'drop-shadow(0 0 6px rgba(143, 236, 120, 0.7))' : 'none',
          transition: 'all 0.3s ease 0.1s',
        }}
      />
      
      {/* Bar 4 */}
      <rect
        x="24"
        y="12"
        width="4"
        height="16"
        rx="2"
        fill={color}
        opacity={isAnimating ? 1 : 0.75}
        style={{
          transform: isAnimating ? 'scaleY(1.2)' : 'scaleY(1)',
          transformOrigin: 'center',
          transition: 'all 0.3s ease 0.15s',
        }}
      />
      
      {/* Bar 5 - right */}
      <rect
        x="30"
        y="16"
        width="4"
        height="8"
        rx="2"
        fill={color}
        opacity={isAnimating ? 0.9 : 0.6}
        style={{
          transform: isAnimating ? 'scaleY(1.3)' : 'scaleY(1)',
          transformOrigin: 'center',
          transition: 'all 0.3s ease 0.2s',
        }}
      />
    </svg>
  );
};

export default MumbleLogo;
