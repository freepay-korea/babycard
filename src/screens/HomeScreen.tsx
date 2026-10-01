import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Play, BookOpen, Star } from 'lucide-react';
import { unlockAudio } from '../audio/speech';
import { sfx, playTap } from '../audio/sfx';
import { ParentGateButton } from '../components/ParentGateButton';
import { ParentGateModal } from '../components/ParentGateModal';

export const HomeScreen: React.FC = () => {
  const { setScreen } = useAppStore();
  const [isGateOpen, setIsGateOpen] = useState<boolean>(false);

  const handlePlayClick = () => {
    // iOS Safari audio unlock on user gesture
    unlockAudio();
    sfx.unlock();
    playTap();
    setScreen('game');
  };

  const handleExploreClick = () => {
    unlockAudio();
    sfx.unlock();
    playTap();
    setScreen('explore');
  };

  const handleStickersClick = () => {
    unlockAudio();
    sfx.unlock();
    playTap();
    setScreen('stickers');
  };

  const handleTriggerParentGate = () => {
    setIsGateOpen(true);
  };

  const handleGateSuccess = () => {
    setIsGateOpen(false);
    setScreen('parent');
  };

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between items-center p-6 max-w-lg mx-auto select-none">
      {/* Top Bar: Small 3-Second Hold Parent Gate Button in Top-Right Corner */}
      <header className="w-full flex items-center justify-end pt-2 px-1">
        <ParentGateButton onTriggerGate={handleTriggerParentGate} />
      </header>

      {/* Center: Very Large Play (▶) Button */}
      <main className="my-auto flex flex-col items-center justify-center py-6">
        <motion.button
          type="button"
          onClick={handlePlayClick}
          aria-label="Play Game"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
          animate={{
            scale: [1, 1.05, 1],
          }}
          transition={{
            scale: {
              duration: 2.8,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          className="
            relative
            w-48 h-48 sm:w-56 sm:h-56
            rounded-full
            bg-gradient-to-tr from-emerald-400 via-emerald-500 to-teal-400
            shadow-[0_20px_40px_rgba(16,185,129,0.35)]
            border-[6px] border-white
            flex items-center justify-center
            cursor-pointer
            touch-manipulation
            will-change-transform
          "
        >
          {/* Subtle glossy highlight */}
          <div className="absolute top-3 left-6 right-6 h-16 bg-white/25 rounded-full blur-[1px] pointer-events-none" />

          {/* Giant Play Icon (▶) */}
          <Play className="w-24 h-24 sm:w-28 sm:h-28 fill-white stroke-white translate-x-2 drop-shadow-md" />
        </motion.button>
      </main>

      {/* Bottom Controls: Book Icon (Explore) & Star Icon (Sticker Board) */}
      <footer className="w-full flex items-center justify-center gap-8 pb-8">
        {/* Book Icon (도감 / Explore) */}
        <motion.button
          type="button"
          onClick={handleExploreClick}
          aria-label="Book Explore"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
          className="
            w-24 h-24 sm:w-28 sm:h-28
            rounded-[32px]
            bg-gradient-to-tr from-sky-400 to-blue-400
            border-[5px] border-white
            shadow-[0_12px_24px_rgba(56,189,248,0.3)]
            flex items-center justify-center
            cursor-pointer
            touch-manipulation
          "
        >
          <BookOpen className="w-12 h-12 sm:w-14 sm:h-14 text-white stroke-[2.5] drop-shadow-sm" />
        </motion.button>

        {/* Star Icon (스티커판 / Sticker Board) */}
        <motion.button
          type="button"
          onClick={handleStickersClick}
          aria-label="Star Sticker Board"
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.88 }}
          className="
            w-24 h-24 sm:w-28 sm:h-28
            rounded-[32px]
            bg-gradient-to-tr from-amber-400 to-yellow-300
            border-[5px] border-white
            shadow-[0_12px_24px_rgba(251,191,36,0.35)]
            flex items-center justify-center
            cursor-pointer
            touch-manipulation
          "
        >
          <Star className="w-12 h-12 sm:w-14 sm:h-14 fill-white stroke-white drop-shadow-sm" />
        </motion.button>
      </footer>

      {/* Parent Math Gate Modal */}
      <ParentGateModal
        isOpen={isGateOpen}
        onSuccess={handleGateSuccess}
        onClose={() => setIsGateOpen(false)}
      />
    </div>
  );
};
