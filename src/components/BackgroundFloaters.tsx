import React from 'react';
import { motion } from 'motion/react';

export const BackgroundFloaters: React.FC = () => {
  // Generate a few stable bubbles and clouds
  const bubbles = [
    { id: 1, size: 48, startX: '15%', delay: 0, duration: 16 },
    { id: 2, size: 70, startX: '75%', delay: 3, duration: 20 },
    { id: 3, size: 36, startX: '45%', delay: 6, duration: 18 },
    { id: 4, size: 55, startX: '85%', delay: 9, duration: 22 },
    { id: 5, size: 42, startX: '25%', delay: 12, duration: 19 },
  ];

  const clouds = [
    { id: 'c1', top: '8%', scale: 1, duration: 38, delay: 0 },
    { id: 'c2', top: '22%', scale: 0.8, duration: 48, delay: 15 },
  ];

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none overflow-hidden select-none z-0"
    >
      {/* Drifting soft clouds */}
      {clouds.map((cloud) => (
        <motion.div
          key={cloud.id}
          initial={{ x: '-30vw' }}
          animate={{ x: '110vw' }}
          transition={{
            duration: cloud.duration,
            repeat: Infinity,
            ease: 'linear',
            delay: cloud.delay,
          }}
          style={{ top: cloud.top, transform: `scale(${cloud.scale})` }}
          className="absolute opacity-40 will-change-transform"
        >
          <svg width="180" height="90" viewBox="0 0 180 90" fill="white">
            <path d="M 35 70 A 25 25 0 0 1 50 30 A 35 35 0 0 1 115 25 A 30 30 0 0 1 155 50 A 25 25 0 0 1 145 75 Z" />
          </svg>
        </motion.div>
      ))}

      {/* Gentle floating soap bubbles drifting upwards */}
      {bubbles.map((b) => (
        <motion.div
          key={b.id}
          initial={{ y: '110vh', x: 0, opacity: 0 }}
          animate={{
            y: '-15vh',
            x: [-12, 14, -8, 12, 0],
            opacity: [0, 0.65, 0.75, 0.5, 0],
          }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: b.delay,
          }}
          style={{
            left: b.startX,
            width: b.size,
            height: b.size,
          }}
          className="absolute rounded-full border-2 border-white/60 bg-gradient-to-tr from-sky-200/20 via-pink-200/20 to-white/40 backdrop-blur-[1px] shadow-sm will-change-transform"
        >
          {/* Bubble glossy highlight */}
          <div className="absolute top-1.5 left-2 w-2.5 h-2 rounded-full bg-white/70 rotate-[-20deg]" />
        </motion.div>
      ))}
    </div>
  );
};
