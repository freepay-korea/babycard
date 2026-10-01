import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useAppStore } from './store/useAppStore';
import { HomeScreen } from './screens/HomeScreen';
import { GameScreen } from './screens/GameScreen';
import { ExploreScreen } from './screens/ExploreScreen';
import { StickersScreen } from './screens/StickersScreen';
import { ParentScreen } from './screens/ParentScreen';
import { BedtimeScreen } from './screens/BedtimeScreen';
import { AudioTestScreen } from './screens/AudioTestScreen';
import { BackgroundFloaters } from './components/BackgroundFloaters';
import { unlockAudio } from './audio/speech';
import { sfx } from './audio/sfx';
import { initNativeBridge } from './native/nativeBridge';

export default function App() {
  const { screen } = useAppStore();

  // 0. Initialize native Android / PWA bridge (wake lock, status bar, back button)
  useEffect(() => {
    initNativeBridge();
  }, []);

  // 1. First user interaction unlock for Web Audio & Web Speech API (iframe & mobile autoplay policy)
  useEffect(() => {
    const handleFirstInteraction = () => {
      unlockAudio();
      sfx.unlock();
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, []);

  // 2. Prevent context menus, double-tap zoom gestures, and pull-to-refresh
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    // Prevent double tap zoom on iOS/Safari
    let lastTouchEnd = 0;
    const handleTouchEnd = (e: TouchEvent) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        e.preventDefault();
      }
      lastTouchEnd = now;
    };

    // Prevent touch drag refresh
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('touchend', handleTouchEnd, { passive: false });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });

    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div
      onContextMenu={(e) => e.preventDefault()}
      className="relative w-full min-h-screen bg-gradient-to-b from-sky-50/70 via-amber-50/40 to-pink-50/50 text-slate-800 flex flex-col justify-center items-center select-none overflow-x-hidden touch-manipulation font-sans"
    >
      {/* Universal Floating Clouds & Soap Bubbles (Passive decoration, pointer-events-none) */}
      <BackgroundFloaters />

      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative z-10 w-full h-full min-h-screen flex flex-col"
        >
          {screen === 'home' && <HomeScreen />}
          {screen === 'game' && <GameScreen />}
          {screen === 'explore' && <ExploreScreen />}
          {screen === 'stickers' && <StickersScreen />}
          {screen === 'parent' && <ParentScreen />}
          {screen === 'bedtime' && <BedtimeScreen />}
          {screen === 'audio-test' && <AudioTestScreen />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
