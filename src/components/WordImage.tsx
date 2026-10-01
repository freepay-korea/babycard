import React, { useState } from 'react';
import { WordItem } from '../data/words';

interface WordImageProps {
  word: WordItem;
  alt?: string;
  className?: string;
  emojiClassName?: string;
}

/**
 * WordImage Component:
 * - Attempts to display high-quality 3D Fluent Emoji PNG from public/images/{id}.png
 * - Automatically falls back to large crisp Unicode emoji if image file is missing or fails to load
 * - Ensures toddler touch-safe, zero broken image frames
 */
export const WordImage: React.FC<WordImageProps> = ({
  word,
  alt,
  className = 'w-28 h-28 md:w-36 md:h-36',
  emojiClassName = 'text-7xl md:text-8xl',
}) => {
  const [hasError, setHasError] = useState(false);

  if (hasError || !word.image) {
    return (
      <span
        role="img"
        aria-label={alt || word.ko}
        className={`select-none pointer-events-none drop-shadow-[0_10px_16px_rgba(0,0,0,0.12)] filter inline-flex items-center justify-center ${emojiClassName}`}
      >
        {word.emoji}
      </span>
    );
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <img
        src={word.image}
        alt={alt || word.ko}
        onError={() => setHasError(true)}
        loading="eager"
        draggable={false}
        referrerPolicy="no-referrer"
        className="w-full h-full object-contain pointer-events-none select-none drop-shadow-[0_12px_16px_rgba(0,0,0,0.12)] filter transition-transform duration-200"
      />
    </div>
  );
};
