import { WordItem, WordCategory, WORDS } from '../data/words';
import { GameLevel } from '../store/useAppStore';

export interface StickerOption {
  word: WordItem;
  isCorrect: boolean;
  zone: {
    x: string;
    y: string;
    scale: number;
    rotate: number;
    floatY: number[];
    floatRotate: number[];
    duration: number;
    delay: number;
  };
}

export interface GameQuestion {
  questionIndex: number; // 0 to 4
  targetWord: WordItem;
  stickers: StickerOption[];
}

export interface RoundConfig {
  level: GameLevel; // 1, 2, or 3
  enabledCategories: WordCategory[];
  lastMistakeWordIds?: string[];
}

// Organic screen positions for 2, 3, and 4 items
const ZONE_PRESETS: Record<number, StickerOption['zone'][]> = {
  2: [
    {
      x: '30%',
      y: '48%',
      scale: 1.05,
      rotate: -5,
      floatY: [-9, 8, -9],
      floatRotate: [-6, -2, -6],
      duration: 3.2,
      delay: 0,
    },
    {
      x: '70%',
      y: '48%',
      scale: 0.98,
      rotate: 6,
      floatY: [-10, 7, -10],
      floatRotate: [5, 9, 5],
      duration: 2.9,
      delay: 0.3,
    },
  ],
  3: [
    {
      x: '26%',
      y: '28%',
      scale: 1.05,
      rotate: -6,
      floatY: [-9, 8, -9],
      floatRotate: [-7, -3, -7],
      duration: 3.2,
      delay: 0,
    },
    {
      x: '74%',
      y: '30%',
      scale: 0.95,
      rotate: 7,
      floatY: [-11, 7, -11],
      floatRotate: [5, 9, 5],
      duration: 2.8,
      delay: 0.4,
    },
    {
      x: '50%',
      y: '68%',
      scale: 1.0,
      rotate: -3,
      floatY: [-8, 10, -8],
      floatRotate: [-5, -1, -5],
      duration: 3.5,
      delay: 0.8,
    },
  ],
  4: [
    {
      x: '28%',
      y: '26%',
      scale: 0.98,
      rotate: -6,
      floatY: [-8, 8, -8],
      floatRotate: [-7, -3, -7],
      duration: 3.1,
      delay: 0,
    },
    {
      x: '72%',
      y: '28%',
      scale: 1.02,
      rotate: 5,
      floatY: [-10, 6, -10],
      floatRotate: [4, 8, 4],
      duration: 2.7,
      delay: 0.2,
    },
    {
      x: '28%',
      y: '68%',
      scale: 1.0,
      rotate: 4,
      floatY: [-9, 7, -9],
      floatRotate: [3, 7, 3],
      duration: 3.4,
      delay: 0.5,
    },
    {
      x: '72%',
      y: '68%',
      scale: 0.96,
      rotate: -5,
      floatY: [-7, 9, -7],
      floatRotate: [-6, -2, -6],
      duration: 3.0,
      delay: 0.7,
    },
  ],
};

// Simple array shuffle helper
function shuffleArray<T>(arr: T[]): T[] {
  const copied = [...arr];
  for (let i = copied.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copied[i], copied[j]] = [copied[j], copied[i]];
  }
  return copied;
}

/**
 * Generates a round consisting of 5 questions based on difficulty level and enabled categories.
 * 
 * Rules:
 * - 1 round = 5 questions.
 * - Options per question: level 1 -> 2 options, level 2 -> 3 options, level 3 -> 4 options.
 * - level 1: All distractors from different categories.
 * - level 2: Exactly 1 distractor from same category; remainder from different categories.
 * - level 3: All distractors from the same category as target.
 * - Targets must come from enabledCategories.
 * - No duplicate targets within a single round.
 * - Words mistaken in the prior round are prioritized.
 * - Option placement is randomized.
 */
export function makeRound(config: RoundConfig): GameQuestion[] {
  const { level, enabledCategories, lastMistakeWordIds = [] } = config;

  // 1. Available candidate words from enabled categories
  const activePool = WORDS.filter((w) => enabledCategories.includes(w.category));
  const pool = activePool.length > 0 ? activePool : WORDS; // Safe fallback

  // 2. Prioritize words mistaken in the last round
  const mistakeWords = pool.filter((w) => lastMistakeWordIds.includes(w.id));
  const otherWords = pool.filter((w) => !lastMistakeWordIds.includes(w.id));

  const shuffledMistakes = shuffleArray(mistakeWords);
  const shuffledOthers = shuffleArray(otherWords);

  // Combine prioritized mistakes first, then other words
  const orderedCandidates = [...shuffledMistakes, ...shuffledOthers];

  // Pick 5 distinct target words for the 5 questions
  const totalQuestions = 5;
  const targetWords: WordItem[] = [];
  
  for (const word of orderedCandidates) {
    if (!targetWords.some((t) => t.id === word.id)) {
      targetWords.push(word);
      if (targetWords.length === totalQuestions) break;
    }
  }

  // If pool has fewer than 5 unique words, loop over pool
  if (targetWords.length < totalQuestions) {
    const remaining = totalQuestions - targetWords.length;
    for (let i = 0; i < remaining; i++) {
      targetWords.push(pool[i % pool.length]);
    }
  }

  // 3. For each target word, select distractors according to level rules
  const questions: GameQuestion[] = targetWords.map((target, qIndex) => {
    let distractors: WordItem[] = [];

    // Same category words excluding target
    const sameCatWords = WORDS.filter(
      (w) => w.category === target.category && w.id !== target.id
    );

    // Different category words
    const diffCatWords = WORDS.filter(
      (w) => w.category !== target.category
    );

    if (level === 1) {
      // Level 1: 2 options (1 target + 1 distractor from DIFFERENT category)
      const diffShuffled = shuffleArray(diffCatWords);
      distractors = diffShuffled.slice(0, 1);
    } else if (level === 2) {
      // Level 2: 3 options (1 target + 1 SAME category + 1 DIFFERENT category)
      const sameShuffled = shuffleArray(sameCatWords);
      const diffShuffled = shuffleArray(diffCatWords);

      const oneSame = sameShuffled[0] || diffShuffled[0];
      const oneDiff = diffShuffled.find((w) => w.id !== oneSame?.id) || sameShuffled[1];

      distractors = [oneSame, oneDiff].filter(Boolean) as WordItem[];
    } else {
      // Level 3: 4 options (1 target + 3 SAME category distractors)
      const sameShuffled = shuffleArray(sameCatWords);
      if (sameShuffled.length >= 3) {
        distractors = sameShuffled.slice(0, 3);
      } else {
        // Fallback if ever needed
        const diffShuffled = shuffleArray(diffCatWords);
        distractors = [...sameShuffled, ...diffShuffled].slice(0, 3);
      }
    }

    // 4. Combine target + distractors and shuffle to randomize correct answer position
    const optionsRaw = [
      { word: target, isCorrect: true },
      ...distractors.map((d) => ({ word: d, isCorrect: false })),
    ];

    const shuffledOptions = shuffleArray(optionsRaw);
    const count = shuffledOptions.length;
    const presets = ZONE_PRESETS[count] || ZONE_PRESETS[3];

    // Assign organic zone positioning
    const stickers: StickerOption[] = shuffledOptions.map((opt, optIdx) => {
      const preset = presets[optIdx % presets.length];
      return {
        word: opt.word,
        isCorrect: opt.isCorrect,
        zone: {
          ...preset,
          // Add subtle dynamic micro-jitter within safety bounds (-2% to +2%)
          x: preset.x,
          y: preset.y,
        },
      };
    });

    return {
      questionIndex: qIndex,
      targetWord: target,
      stickers,
    };
  });

  return questions;
}
