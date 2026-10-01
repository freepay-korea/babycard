import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { WordCategory } from '../data/words';

export type ScreenType = 'home' | 'game' | 'explore' | 'stickers' | 'parent' | 'audio-test' | 'bedtime';
export type LanguageType = 'ko' | 'en';
export type CardCountType = 2 | 3 | 4;
export type GameLevel = 1 | 2 | 3;
export type DifficultyMode = 'auto' | 2 | 3 | 4;
export type DailyLimitMinutes = 0 | 10 | 20 | 30;

function getTodayString(): string {
  try {
    return new Date().toISOString().split('T')[0];
  } catch {
    return '2026-09-30';
  }
}

export interface AppState {
  screen: ScreenType;
  language: LanguageType;
  soundEnabled: boolean;

  // Difficulty Mode
  difficultyMode: DifficultyMode; // 'auto' | 2 | 3 | 4
  level: GameLevel; // 1 (2 cards), 2 (3 cards), 3 (4 cards)
  cardCount: CardCountType; // 2, 3, or 4 picture cards
  isLevelLocked: boolean; // true if fixed 2, 3, or 4

  // Categories (at least 2 enabled)
  enabledCategories: WordCategory[];
  lastMistakeWordIds: string[];

  // Daily Usage Time Limit
  dailyLimitMinutes: DailyLimitMinutes; // 0 = unlimited, 10, 20, 30 mins
  usageDate: string; // YYYY-MM-DD
  usedSecondsToday: number; // accumulated usage seconds for today

  // Stickers Board (20 slots per board)
  boardStickers: string[]; // Up to 20 collected sticker IDs for the current board
  completedBoardsCount: number; // How many 20-slot boards completed
  unlockedStickers: string[]; // All unique stickers unlocked historically

  // Actions
  setScreen: (screen: ScreenType) => void;
  setLanguage: (lang: LanguageType) => void;
  toggleLanguage: () => void;
  toggleSound: () => void;
  setSoundEnabled: (enabled: boolean) => void;
  setDifficultyMode: (mode: DifficultyMode) => void;
  setLevel: (level: GameLevel, lock?: boolean) => void;
  setIsLevelLocked: (locked: boolean) => void;
  adjustAdaptiveLevel: (firstTryCorrectCount: number) => { changed: boolean; oldLevel: GameLevel; newLevel: GameLevel };
  toggleCategory: (category: WordCategory) => { success: boolean; reason?: string };
  setLastMistakeWordIds: (ids: string[]) => void;
  addMistakeWordId: (id: string) => void;
  clearMistakeWordIds: () => void;
  
  // Daily time limit actions
  setDailyLimitMinutes: (minutes: DailyLimitMinutes) => void;
  trackUsageSeconds: (seconds: number) => boolean; // returns true if limit reached
  isTimeLimitExceeded: () => boolean;
  resetDailyUsageIfNewDay: () => void;

  // Stickers
  addStickerToBoard: (stickerId: string) => { isBoardCompleted: boolean; count: number };
  startNewBoard: () => void;
  resetAllStickers: () => void;
  unlockSticker: (stickerId: string) => void;
}

const ALL_CATEGORIES: WordCategory[] = ['animal', 'food', 'vehicle', 'body', 'item', 'nature'];

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      screen: 'home',
      language: 'ko',
      soundEnabled: true,

      difficultyMode: 'auto',
      cardCount: 3,
      level: 2,
      isLevelLocked: false,

      enabledCategories: ALL_CATEGORIES,
      lastMistakeWordIds: [],

      // Daily limit
      dailyLimitMinutes: 0, // unlimited by default
      usageDate: getTodayString(),
      usedSecondsToday: 0,

      // Initial sticker board with 4 sample collected stickers
      boardStickers: ['dog', 'cat', 'apple', 'car'],
      completedBoardsCount: 0,
      unlockedStickers: ['dog', 'cat', 'apple', 'car'],

      setScreen: (screen: ScreenType) => set({ screen }),
      setLanguage: (language: LanguageType) => set({ language }),
      toggleLanguage: () => set({ language: get().language === 'ko' ? 'en' : 'ko' }),
      toggleSound: () => set({ soundEnabled: !get().soundEnabled }),
      setSoundEnabled: (soundEnabled: boolean) => set({ soundEnabled }),

      setDifficultyMode: (mode: DifficultyMode) => {
        if (mode === 'auto') {
          set({
            difficultyMode: 'auto',
            isLevelLocked: false,
          });
        } else {
          const cardCount = mode as CardCountType;
          const level: GameLevel = cardCount === 2 ? 1 : cardCount === 3 ? 2 : 3;
          set({
            difficultyMode: mode,
            isLevelLocked: true,
            cardCount,
            level,
          });
        }
      },

      setLevel: (level: GameLevel, lock = false) => {
        const cardCount: CardCountType = level === 1 ? 2 : level === 2 ? 3 : 4;
        set({ level, cardCount, isLevelLocked: lock });
      },

      setIsLevelLocked: (isLevelLocked: boolean) => set({ isLevelLocked }),

      adjustAdaptiveLevel: (firstTryCorrectCount: number) => {
        const { isLevelLocked, level } = get();
        if (isLevelLocked) {
          return { changed: false, oldLevel: level, newLevel: level };
        }

        let nextLevel: GameLevel = level;
        if (firstTryCorrectCount >= 4 && level < 3) {
          nextLevel = (level + 1) as GameLevel;
        } else if (firstTryCorrectCount <= 2 && level > 1) {
          nextLevel = (level - 1) as GameLevel;
        }

        if (nextLevel !== level) {
          const cardCount: CardCountType = nextLevel === 1 ? 2 : nextLevel === 2 ? 3 : 4;
          set({ level: nextLevel, cardCount });
          return { changed: true, oldLevel: level, newLevel: nextLevel };
        }

        return { changed: false, oldLevel: level, newLevel: level };
      },

      toggleCategory: (category: WordCategory) => {
        const current = get().enabledCategories;
        // At least 2 categories must remain enabled!
        if (current.includes(category)) {
          if (current.length <= 2) {
            return { success: false, reason: 'min_2' };
          }
          set({ enabledCategories: current.filter((c) => c !== category) });
          return { success: true };
        } else {
          set({ enabledCategories: [...current, category] });
          return { success: true };
        }
      },

      setLastMistakeWordIds: (ids: string[]) => set({ lastMistakeWordIds: ids }),

      addMistakeWordId: (id: string) => {
        const current = get().lastMistakeWordIds;
        if (!current.includes(id)) {
          set({ lastMistakeWordIds: [...current, id] });
        }
      },

      clearMistakeWordIds: () => set({ lastMistakeWordIds: [] }),

      // Daily usage time limit logic
      setDailyLimitMinutes: (minutes: DailyLimitMinutes) => {
        set({ dailyLimitMinutes: minutes });
      },

      resetDailyUsageIfNewDay: () => {
        const today = getTodayString();
        if (get().usageDate !== today) {
          set({
            usageDate: today,
            usedSecondsToday: 0,
          });
        }
      },

      trackUsageSeconds: (seconds: number) => {
        get().resetDailyUsageIfNewDay();
        const currentUsed = get().usedSecondsToday + seconds;
        set({ usedSecondsToday: currentUsed });

        const limitMinutes = get().dailyLimitMinutes;
        if (limitMinutes > 0 && currentUsed >= limitMinutes * 60) {
          return true;
        }
        return false;
      },

      isTimeLimitExceeded: () => {
        get().resetDailyUsageIfNewDay();
        const { dailyLimitMinutes, usedSecondsToday } = get();
        if (dailyLimitMinutes === 0) return false;
        return usedSecondsToday >= dailyLimitMinutes * 60;
      },

      addStickerToBoard: (stickerId: string) => {
        const currentBoard = get().boardStickers;
        const currentAll = get().unlockedStickers;

        const nextBoard = currentBoard.includes(stickerId)
          ? currentBoard
          : [...currentBoard, stickerId];

        const nextAll = currentAll.includes(stickerId)
          ? currentAll
          : [...currentAll, stickerId];

        const isCompleted = nextBoard.length >= 20;

        set({
          boardStickers: nextBoard,
          unlockedStickers: nextAll,
        });

        return { isBoardCompleted: isCompleted, count: nextBoard.length };
      },

      startNewBoard: () => {
        set((state) => ({
          boardStickers: [],
          completedBoardsCount: state.completedBoardsCount + 1,
        }));
      },

      resetAllStickers: () => {
        set({
          boardStickers: [],
          completedBoardsCount: 0,
          unlockedStickers: [],
        });
      },

      unlockSticker: (stickerId: string) => {
        get().addStickerToBoard(stickerId);
      },
    }),
    {
      name: 'toddler-first-words-storage',
    }
  )
);
