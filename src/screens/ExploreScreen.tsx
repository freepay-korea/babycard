import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Home, Volume2 } from 'lucide-react';
import { WORDS, WordCategory, WordItem, getWordById } from '../data/words';
import { speak } from '../audio/speech';
import { playTap } from '../audio/sfx';
import { WordImage } from '../components/WordImage';

// 6 Category Representative Word IDs for picture-only tabs
const CATEGORY_REPRESENTATIVES: { category: WordCategory; repWordId: string; bgGradient: string }[] = [
  { category: 'animal', repWordId: 'dog', bgGradient: 'from-amber-100 to-amber-200' },
  { category: 'food', repWordId: 'apple', bgGradient: 'from-rose-100 to-rose-200' },
  { category: 'vehicle', repWordId: 'car', bgGradient: 'from-sky-100 to-sky-200' },
  { category: 'body', repWordId: 'eyes', bgGradient: 'from-pink-100 to-pink-200' },
  { category: 'item', repWordId: 'ball', bgGradient: 'from-emerald-100 to-emerald-200' },
  { category: 'nature', repWordId: 'sun', bgGradient: 'from-orange-100 to-orange-200' },
];

export const ExploreScreen: React.FC = () => {
  const { setScreen, language, soundEnabled } = useAppStore();
  const [selectedCategory, setSelectedCategory] = useState<WordCategory>('animal');
  const [activeWordId, setActiveWordId] = useState<string | null>(null);

  const filteredWords = WORDS.filter((w) => w.category === selectedCategory);

  const handleCardTouch = (word: WordItem) => {
    setActiveWordId(word.id);
    playTap();
    if (soundEnabled) {
      speak(language === 'ko' ? word.ko : word.en, language);
    }
  };

  const handleCategorySelect = (cat: WordCategory) => {
    playTap();
    setSelectedCategory(cat);
    setActiveWordId(null);
  };

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col p-4 md:p-6 max-w-4xl mx-auto select-none pb-12">
      {/* Top Bar: Small Home Icon Only */}
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
      </header>

      {/* 6 Category Tabs: Pure Picture/Icon Only (No Words) */}
      <nav aria-label="Category tabs" className="w-full flex items-center justify-center gap-2.5 sm:gap-4 mb-6 px-1">
        {CATEGORY_REPRESENTATIVES.map(({ category, repWordId, bgGradient }) => {
          const repWord = getWordById(repWordId)!;
          const isSelected = selectedCategory === category;

          return (
            <motion.button
              key={category}
              type="button"
              onClick={() => handleCategorySelect(category)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.88 }}
              animate={isSelected ? { scale: [1, 1.12, 1.06] } : { scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`
                relative
                w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20
                rounded-2xl sm:rounded-3xl
                flex items-center justify-center p-1.5
                cursor-pointer touch-manipulation transition-all
                ${
                  isSelected
                    ? `bg-gradient-to-br ${bgGradient} border-4 border-amber-400 shadow-[0_8px_16px_rgba(251,191,36,0.35)] ring-4 ring-amber-200/60`
                    : 'bg-white/80 border-2 border-slate-200/80 shadow-xs opacity-75 hover:opacity-100'
                }
              `}
            >
              <WordImage
                word={repWord}
                alt=""
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14"
                emojiClassName="text-3xl sm:text-4xl md:text-5xl"
              />
            </motion.button>
          );
        })}
      </nav>

      {/* Picture Card Grid (7 cards per category, frameless floating toddler cards) */}
      <main className="flex-1 w-full grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 md:gap-6 items-center justify-items-center">
        <AnimatePresence mode="popLayout">
          {filteredWords.map((word) => {
            const isActive = activeWordId === word.id;
            const wordText = language === 'ko' ? word.ko : word.en;

            return (
              <motion.button
                key={word.id}
                type="button"
                onClick={() => handleCardTouch(word)}
                whileTap={{ scale: 0.9 }}
                animate={
                  isActive
                    ? {
                        scale: [1, 1.25, 1.12],
                        transition: { duration: 0.45, ease: [0.34, 1.56, 0.64, 1] },
                      }
                    : { scale: 1 }
                }
                className={`
                  min-w-[130px] min-h-[140px] w-full max-w-[170px]
                  rounded-[36px] p-4
                  flex flex-col items-center justify-center
                  cursor-pointer touch-manipulation select-none
                  transition-colors relative
                  ${
                    isActive
                      ? 'bg-white shadow-[0_16px_32px_rgba(244,63,94,0.18)] border-4 border-rose-300 ring-4 ring-rose-100'
                      : 'bg-white/70 hover:bg-white border-3 border-amber-100 shadow-sm'
                  }
                `}
              >
                {/* 3D Picture */}
                <WordImage
                  word={word}
                  alt=""
                  className={`transition-transform duration-300 ${
                    isActive ? 'w-24 h-24 sm:w-28 sm:h-28' : 'w-20 h-20 sm:w-24 sm:h-24'
                  }`}
                  emojiClassName={isActive ? 'text-7xl sm:text-8xl' : 'text-6xl sm:text-7xl'}
                />

                {/* Text reveals ONLY when card is touched */}
                <div className="h-8 mt-2 flex items-center justify-center">
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.8 }}
                        transition={{ duration: 0.25 }}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 shadow-xs"
                      >
                        <span className="text-base sm:text-lg font-black text-rose-600 tracking-tight">
                          {wordText}
                        </span>
                        <Volume2 className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
            );
          })}
        </AnimatePresence>
      </main>
    </div>
  );
};
