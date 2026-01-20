import React from 'react';

// Creative logo: Abstract speech bubble with flowing sound waves forming conversation
// Represents: Language learning, AI conversation, the "mumble" of learning to speak
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
      {/* Speech bubble base - represents conversation */}
      <path
        d="M8 10C8 7.79086 9.79086 6 12 6H28C30.2091 6 32 7.79086 32 10V22C32 24.2091 30.2091 26 28 26H18L12 32V26H12C9.79086 26 8 24.2091 8 22V10Z"
        fill={isAnimating ? "rgba(143, 236, 120, 0.15)" : "rgba(255, 255, 255, 0.08)"}
        stroke={color}
        strokeWidth="1.5"
        strokeOpacity={isAnimating ? 0.8 : 0.4}
        style={{
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Sound wave lines inside - representing speech/language */}
      {/* First wave */}
      <path
        d="M13 13C13 13 14.5 11 16 13C17.5 15 19 13 19 13"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity={isAnimating ? 1 : 0.7}
        style={{
          transform: isAnimating ? 'translateX(1px)' : 'translateX(0)',
          transition: 'all 0.4s ease',
        }}
      />
      
      {/* Second wave - middle, larger */}
      <path
        d="M13 18C13 18 15 15 17.5 18C20 21 22 18 22 18C22 18 24 15 27 18"
        stroke={isAnimating ? "#8FEC78" : color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity={isAnimating ? 1 : 0.9}
        style={{
          filter: isAnimating ? 'drop-shadow(0 0 3px rgba(143, 236, 120, 0.6))' : 'none',
          transition: 'all 0.3s ease',
        }}
      />
      
      {/* Third wave */}
      <path
        d="M17 23C17 23 18.5 21 20 23C21.5 25 23 23 23 23"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity={isAnimating ? 1 : 0.7}
        style={{
          transform: isAnimating ? 'translateX(-1px)' : 'translateX(0)',
          transition: 'all 0.4s ease',
        }}
      />
      
      {/* AI sparkle/dot - represents artificial intelligence */}
      <circle
        cx="30"
        cy="8"
        r={isAnimating ? 2.5 : 2}
        fill={isAnimating ? "#8FEC78" : color}
        opacity={isAnimating ? 1 : 0.6}
        style={{
          filter: isAnimating ? 'drop-shadow(0 0 4px rgba(143, 236, 120, 0.8))' : 'none',
          transition: 'all 0.3s ease',
        }}
      />
    </svg>
  );
};

export default MumbleLogo;
