import React from 'react';
import { motion } from 'motion/react';
import { toddlerAudio } from '../audio/soundPlayer';

export type ToddlerColor = 'peach' | 'sky' | 'mint' | 'butter' | 'lavender' | 'coral';

interface ToddlerButtonProps {
  onClick: () => void;
  children: React.ReactNode;
  color?: ToddlerColor;
  className?: string;
  ariaLabel: string;
}

const COLOR_MAP: Record<ToddlerColor, { bg: string; border: string; text: string; shadow: string }> = {
  peach: {
    bg: 'bg-rose-100 active:bg-rose-200',
    border: 'border-rose-300',
    text: 'text-rose-600',
    shadow: 'shadow-[0_10px_0_0_#fda4af]',
  },
  sky: {
    bg: 'bg-sky-100 active:bg-sky-200',
    border: 'border-sky-300',
    text: 'text-sky-600',
    shadow: 'shadow-[0_10px_0_0_#7dd3fc]',
  },
  mint: {
    bg: 'bg-emerald-100 active:bg-emerald-200',
    border: 'border-emerald-300',
    text: 'text-emerald-700',
    shadow: 'shadow-[0_10px_0_0_#6ee7b7]',
  },
  butter: {
    bg: 'bg-amber-100 active:bg-amber-200',
    border: 'border-amber-300',
    text: 'text-amber-700',
    shadow: 'shadow-[0_10px_0_0_#fcd34d]',
  },
  lavender: {
    bg: 'bg-purple-100 active:bg-purple-200',
    border: 'border-purple-300',
    text: 'text-purple-600',
    shadow: 'shadow-[0_10px_0_0_#d8b4fe]',
  },
  coral: {
    bg: 'bg-orange-100 active:bg-orange-200',
    border: 'border-orange-300',
    text: 'text-orange-600',
    shadow: 'shadow-[0_10px_0_0_#fdba74]',
  },
};

export const ToddlerButton: React.FC<ToddlerButtonProps> = ({
  onClick,
  children,
  color = 'mint',
  className = '',
  ariaLabel,
}) => {
  const styles = COLOR_MAP[color];

  const handlePointerDown = () => {
    toddlerAudio.playSoftTap();
  };

  return (
    <motion.button
      type="button"
      aria-label={ariaLabel}
      onPointerDown={handlePointerDown}
      onClick={onClick}
      onContextMenu={(e) => e.preventDefault()}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.92, y: 6 }}
      transition={{ type: 'spring', stiffness: 450, damping: 22 }}
      className={`
        min-w-[140px] min-h-[140px] w-[140px] h-[140px]
        flex items-center justify-center
        rounded-[40px] border-4
        select-none cursor-pointer touch-manipulation
        outline-none transition-colors
        ${styles.bg} ${styles.border} ${styles.text} ${styles.shadow}
        ${className}
      `}
    >
      <div className="flex items-center justify-center pointer-events-none">
        {children}
      </div>
    </motion.button>
  );
};
