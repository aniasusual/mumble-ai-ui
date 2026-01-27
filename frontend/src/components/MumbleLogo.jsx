// Sound wave bars forming an "M" shape
const MumbleLogo = ({ className = "", size = 40, color = "#ffffff", isAnimating = false }) => {
  // Bar heights form an M pattern: tall, short, tall (middle peak), short, tall
  const bars = [
    { x: 4, height: 22, y: 9 },    // Left tall
    { x: 10, height: 12, y: 14 },   // Left short (valley)
    { x: 16, height: 20, y: 10 },   // Middle tall (center peak)
    { x: 22, height: 12, y: 14 },   // Right short (valley)
    { x: 28, height: 22, y: 9 },    // Right tall
  ];

  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 36 40" 
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {bars.map((bar, index) => {
        const isCenter = index === 2;
        const delay = index * 0.05;
        
        return (
          <rect
            key={index}
            x={bar.x}
            y={bar.y}
            width="4"
            height={bar.height}
            rx="2"
            fill={isAnimating && isCenter ? "#8FEC78" : color}
            opacity={isAnimating ? 1 : (isCenter ? 1 : 0.7)}
            style={{
              transform: isAnimating ? 'scaleY(1.15)' : 'scaleY(1)',
              transformOrigin: 'center',
              filter: isAnimating && isCenter ? 'drop-shadow(0 0 6px rgba(143, 236, 120, 0.7))' : 'none',
              transition: `all 0.3s ease ${delay}s`,
            }}
          />
        );
      })}
    </svg>
  );
};

export default MumbleLogo;
