import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Home, Sparkles, RotateCcw } from 'lucide-react';
import { WORDS, getWordById, WordItem } from '../data/words';
import { WordImage } from '../components/WordImage';
import { playTap, playCheer, playWobble } from '../audio/sfx';
import { speak } from '../audio/speech';
import { fireToddlerConfetti } from '../utils/confetti';

const TOTAL_SLOTS = 20;

export const StickersScreen: React.FC = () => {
  const {
    setScreen,
    language,
    soundEnabled,
    boardStickers,
    completedBoardsCount,
    startNewBoard,
  } = useAppStore();

  const [tappedSlotIndex, setTappedSlotIndex] = useState<number | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState<boolean>(boardStickers.length >= TOTAL_SLOTS);

  // Map the 20 slots
  // If slot has a collected sticker, resolve its WordItem
  // Otherwise, use a placeholder word from WORDS for the gray silhouette
  const slots: { isCollected: boolean; word: WordItem }[] = Array.from({ length: TOTAL_SLOTS }).map(
    (_, index) => {
      const isCollected = index < boardStickers.length;
      const stickerId = boardStickers[index];
      const word = (stickerId ? getWordById(stickerId) : null) || WORDS[index % WORDS.length];
      return { isCollected, word };
    }
  );

  const handleSlotClick = (index: number, item: { isCollected: boolean; word: WordItem }) => {
    setTappedSlotIndex(index);
    setTimeout(() => setTappedSlotIndex(null), 400);

    if (item.isCollected) {
      // 1. Tapping collected sticker: bounce + sfx.tap + speak word
      playTap();
      if (soundEnabled) {
        speak(language === 'ko' ? item.word.ko : item.word.en, language, item.word.id);
      }
    } else {
      // 2. Uncollected slot: gentle soft wobble
      playWobble();
    }
  };

  const handleStartNewBoard = () => {
    playCheer();
    fireToddlerConfetti();
    startNewBoard();
    setShowCompleteModal(false);
  };

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col p-4 md:p-6 max-w-4xl mx-auto select-none pb-12">
      {/* Top Bar: Small Home Icon & Visual Board Badge */}
      <header className="w-full flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={() => {
            playTap();
            setScreen('home');
          }}
          aria-label="Home"
          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-white/90 backdrop-blur-sm border-2 border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 active:scale-90 transition-transform cursor-pointer"
        >
          <Home className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Board Progress Counter (e.g. 4/20 with Star Icon) */}
        <div className="flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-2xl border-2 border-amber-200 shadow-sm">
          <Sparkles className="w-5 h-5 text-amber-500 fill-amber-400" />
          <span className="font-black text-amber-900 text-sm">
            {boardStickers.length} / {TOTAL_SLOTS}
          </span>
          {completedBoardsCount > 0 && (
            <span className="ml-1 text-xs font-bold text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">
              👑 {completedBoardsCount}
            </span>
          )}
        </div>
      </header>

      {/* 20-Slot Sticker Board (Grid: 4 columns on mobile, 5 on desktop) */}
      <main className="flex-1 w-full grid grid-cols-4 sm:grid-cols-5 gap-3 md:gap-4 items-center justify-items-center">
        {slots.map((slot, index) => {
          const isTapped = tappedSlotIndex === index;

          return (
            <motion.button
              key={index}
              type="button"
              onClick={() => handleSlotClick(index, slot)}
              whileTap={{ scale: 0.88 }}
              animate={
                isTapped
                  ? {
                      scale: [1, 1.28, 1.1],
                      transition: { duration: 0.35, ease: [0.34, 1.56, 0.64, 1] },
                    }
                  : { scale: 1 }
              }
              className={`
                w-full aspect-square max-w-[120px] max-h-[120px]
                rounded-[28px] sm:rounded-[32px]
                flex items-center justify-center p-2
                cursor-pointer touch-manipulation select-none
                transition-all relative
                ${
                  slot.isCollected
                    ? 'bg-gradient-to-tr from-amber-50 to-white border-3 border-amber-300 shadow-sm hover:shadow-md'
                    : 'bg-slate-100/70 border-3 border-dashed border-slate-200/90 shadow-inner'
                }
              `}
            >
              {slot.isCollected ? (
                // Collected: Vibrant full color 3D sticker!
                <div className="relative flex items-center justify-center w-full h-full">
                  <WordImage
                    word={slot.word}
                    alt=""
                    className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-xs"
                    emojiClassName="text-4xl sm:text-5xl"
                  />
                  {/* Subtle sparkle indicator on collected item */}
                  <span className="absolute -top-1 -right-1 text-xs select-none">✨</span>
                </div>
              ) : (
                // Uncollected: Gray silhouette of the word picture
                <div className="w-full h-full flex items-center justify-center opacity-25 filter grayscale contrast-50 select-none">
                  <WordImage
                    word={slot.word}
                    alt=""
                    className="w-12 h-12 sm:w-14 sm:h-14"
                    emojiClassName="text-3xl sm:text-4xl"
                  />
                </div>
              )}
            </motion.button>
          );
        })}
      </main>

      {/* 20 Stickers Full Celebration Modal (Start New Board) */}
      <AnimatePresence>
        {showCompleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white rounded-[40px] border-4 border-amber-300 p-8 shadow-2xl max-w-sm w-full flex flex-col items-center text-center relative overflow-hidden"
            >
              <div className="w-24 h-24 rounded-full bg-amber-100 border-4 border-amber-200 flex items-center justify-center text-5xl mb-4 shadow-inner">
                🌟
              </div>

              {/* 20 Complete Crown */}
              <div className="flex items-center gap-1.5 text-2xl font-black text-amber-900 mb-2">
                <span>20 / 20</span>
                <span>👑</span>
              </div>

              <div className="w-full h-1 bg-amber-100 rounded-full my-3" />

              {/* Pure Icon Action Button: Restart Fresh Board */}
              <motion.button
                type="button"
                onClick={handleStartNewBoard}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.92 }}
                className="w-full py-4 px-6 rounded-3xl bg-gradient-to-tr from-amber-400 to-amber-500 text-amber-950 font-black shadow-lg flex items-center justify-center gap-3 cursor-pointer mt-3"
              >
                <RotateCcw className="w-7 h-7 stroke-[2.5]" />
                <Sparkles className="w-7 h-7 fill-amber-300 stroke-amber-900" />
              </motion.button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
