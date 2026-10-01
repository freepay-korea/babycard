import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Lock } from 'lucide-react';

interface ParentGateButtonProps {
  onTriggerGate: () => void;
  className?: string;
}

export const ParentGateButton: React.FC<ParentGateButtonProps> = ({ onTriggerGate, className = '' }) => {
  const [progress, setProgress] = useState<number>(0); // 0 to 100
  const [isPressing, setIsPressing] = useState<boolean>(false);
  
  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);

  const HOLD_DURATION_MS = 3000;

  const cancelHold = () => {
    setIsPressing(false);
    setProgress(0);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
  };

  const startHold = (e: React.PointerEvent | React.TouchEvent | React.MouseEvent) => {
    e.preventDefault();
    setIsPressing(true);
    startTimeRef.current = Date.now();

    const updateProgress = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(100, (elapsed / HOLD_DURATION_MS) * 100);
      setProgress(pct);

      if (elapsed < HOLD_DURATION_MS) {
        animationFrameRef.current = requestAnimationFrame(updateProgress);
      } else {
        // 3 seconds reached!
        cancelHold();
        onTriggerGate();
      }
    };

    animationFrameRef.current = requestAnimationFrame(updateProgress);
  };

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  // Outer SVG circular gauge calculations
  const size = 68; // Prominently visible around the 48px button
  const strokeWidth = 5;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Remaining seconds countdown (3 -> 2 -> 1)
  const remainingSec = Math.max(1, Math.ceil(3 - (progress / 100) * 3));

  return (
    <div className={`relative flex items-center justify-center select-none touch-none ${className}`}>
      {/* 1. Pulsing Ripple Waves while pressing */}
      <AnimatePresence>
        {isPressing && (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: [1, 1.45, 1.8], opacity: [0.6, 0.3, 0] }}
              transition={{ duration: 1.2, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-14 h-14 rounded-full bg-purple-400/40 pointer-events-none"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0.8 }}
              animate={{ scale: [1, 1.45, 1.8], opacity: [0.6, 0.3, 0] }}
              transition={{ duration: 1.2, delay: 0.4, repeat: Infinity, ease: 'easeOut' }}
              className="absolute w-14 h-14 rounded-full bg-fuchsia-400/30 pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* 2. Large High-Visibility Circular Gauge SVG (Size 68px) */}
      <svg
        className="absolute -rotate-90 pointer-events-none drop-shadow-[0_0_8px_rgba(168,85,247,0.5)]"
        width={size}
        height={size}
      >
        <defs>
          <linearGradient id="parentGateGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#a855f7" />
            <stop offset="50%" stopColor="#c084fc" />
            <stop offset="100%" stopColor="#ec4899" />
          </linearGradient>
        </defs>

        {/* Faint track background (visible always or subtle) */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(216, 180, 254, 0.35)"
          strokeWidth={strokeWidth}
          fill="none"
        />

        {/* Dynamic Glowing Progress Arc */}
        {isPressing && (
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#parentGateGradient)"
            strokeWidth={strokeWidth}
            fill="none"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-[stroke-dashoffset] duration-75"
          />
        )}
      </svg>

      {/* 3. Gear Button with Continuous Spin & Scale Feedback */}
      <motion.button
        type="button"
        onPointerDown={startHold}
        onPointerUp={cancelHold}
        onPointerLeave={cancelHold}
        onPointerCancel={cancelHold}
        aria-label="Parent Settings Gate"
        animate={
          isPressing
            ? {
                scale: [0.94, 0.98, 0.94],
                backgroundColor: '#f3e8ff',
              }
            : {
                scale: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.9)',
              }
        }
        transition={
          isPressing
            ? {
                scale: { duration: 0.6, repeat: Infinity, ease: 'easeInOut' },
                backgroundColor: { duration: 0.2 },
              }
            : { duration: 0.2 }
        }
        className={`
          relative z-10 w-12 h-12 rounded-full backdrop-blur-sm shadow-md
          border-2 transition-colors cursor-pointer flex items-center justify-center
          ${
            isPressing
              ? 'border-purple-400 text-purple-700 shadow-purple-200'
              : 'border-purple-200/80 text-purple-600 hover:border-purple-300'
          }
        `}
      >
        {/* Continuously rotating Gear Icon while held */}
        <motion.div
          animate={
            isPressing
              ? { rotate: 360 }
              : { rotate: 0 }
          }
          transition={
            isPressing
              ? { duration: 1.6, repeat: Infinity, ease: 'linear' }
              : { duration: 0.2 }
          }
          className="flex items-center justify-center will-change-transform"
        >
          <Settings className="w-6 h-6 stroke-[2.3]" />
        </motion.div>
      </motion.button>

      {/* 4. Highly Visible Floating Countdown Badge */}
      <AnimatePresence>
        {isPressing && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.8 }}
            transition={{ duration: 0.15 }}
            className="
              absolute -bottom-9 right-0 sm:right-auto
              whitespace-nowrap px-3 py-1 rounded-full
              bg-purple-900/95 text-white
              shadow-[0_4px_16px_rgba(147,51,234,0.4)]
              border border-purple-400/60
              text-[11px] font-black
              flex items-center gap-1.5 z-40 pointer-events-none
            "
          >
            <Lock className="w-3 h-3 text-purple-300 animate-pulse" />
            <span>{remainingSec}초 꾹 누르기</span>
            <span className="text-purple-300 text-[10px] font-bold">
              {Math.round(progress)}%
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
