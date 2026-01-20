import React from 'react';

// Clean, modern "m" lettermark with subtle gradient - represents mumble/speaking
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
      {/* Background circle with subtle glow when animating */}
      <circle
        cx="20"
        cy="20"
        r="18"
        fill="transparent"
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity={isAnimating ? 0.4 : 0.15}
        style={{
          transition: 'stroke-opacity 0.3s ease',
        }}
      />
      
      {/* Stylized "m" made of smooth curves */}
      <path
        d="M12 26V18C12 15.5 13.5 14 16 14C18.5 14 20 15.5 20 18V26M20 18C20 15.5 21.5 14 24 14C26.5 14 28 15.5 28 18V26"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        style={{
          filter: isAnimating ? 'drop-shadow(0 0 4px rgba(143, 236, 120, 0.5))' : 'none',
          transition: 'filter 0.3s ease',
        }}
      />
      
      {/* Small accent dots representing sound/speech - only visible when animating */}
      {isAnimating && (
        <>
          <circle
            cx="32"
            cy="16"
            r="1.5"
            fill={color}
            opacity="0.6"
            style={{
              animation: 'fadeInOut 1s ease-in-out infinite',
            }}
          />
          <circle
            cx="34"
            cy="20"
            r="1"
            fill={color}
            opacity="0.4"
            style={{
              animation: 'fadeInOut 1s ease-in-out infinite 0.2s',
            }}
          />
        </>
      )}
    </svg>
  );
};

export default MumbleLogo;
