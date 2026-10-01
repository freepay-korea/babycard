import React from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Moon, Home, Sparkles } from 'lucide-react';

export const BedtimeScreen: React.FC = () => {
  const { setScreen, language } = useAppStore();

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col items-center justify-between p-6 max-w-lg mx-auto select-none bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 text-white">
      {/* Top Bar with gentle stars */}
      <header className="w-full flex items-center justify-between pt-2">
        <div className="flex items-center gap-1.5 text-indigo-300 text-xs font-bold">
          <Moon className="w-5 h-5 text-amber-200 fill-amber-200" />
          <span>{language === 'ko' ? '휴식 시간' : 'Rest Time'}</span>
        </div>

        <button
          type="button"
          onClick={() => setScreen('home')}
          aria-label="Home"
          className="w-11 h-11 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center text-white/80 active:scale-90 transition-transform cursor-pointer"
        >
          <Home className="w-5 h-5" />
        </button>
      </header>

      {/* Sleeping Animal Visual */}
      <main className="my-auto flex flex-col items-center text-center py-6">
        <motion.div
          animate={{
            scale: [1, 1.05, 1],
            y: [0, -6, 0],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative w-48 h-48 sm:w-56 sm:h-56 rounded-full bg-indigo-900/60 border-4 border-indigo-400/40 flex items-center justify-center text-8xl shadow-[0_0_40px_rgba(99,102,241,0.25)] mb-6"
        >
          {/* Sleeping cute animal */}
          <span className="select-none" role="img" aria-label="Sleeping Bear">
            🐻
          </span>
          <span className="absolute -top-3 right-6 text-4xl animate-pulse select-none">
            💤
          </span>
          <span className="absolute bottom-4 left-6 text-2xl select-none">
            🌙
          </span>
        </motion.div>

        {/* Calming Message */}
        <h2 className="text-3xl sm:text-4xl font-black text-amber-200 mb-3 tracking-tight">
          {language === 'ko' ? '오늘은 여기까지!' : "That's all for today!"}
        </h2>
        <p className="text-lg font-bold text-indigo-200/90 mb-2">
          {language === 'ko' ? '내일 또 만나요 🌙' : 'See you tomorrow 🌙'}
        </p>
        <p className="text-xs text-indigo-400/80 max-w-xs leading-relaxed">
          {language === 'ko'
            ? '오늘 설정한 스마트폰 사용 시간이 끝났어요. 눈을 쉬어주고 내일 재미있게 또 만나요!'
            : "Today's playtime limit reached. Rest your eyes and let's play again tomorrow!"}
        </p>
      </main>

      {/* Bottom Gentle Indicator */}
      <footer className="pb-8 flex items-center gap-1.5 text-xs text-indigo-400/70">
        <Sparkles className="w-4 h-4 text-amber-300" />
        <span>{language === 'ko' ? '날짜가 바뀌면 다시 열려요' : 'Unlocks again tomorrow'}</span>
      </footer>
    </div>
  );
};
