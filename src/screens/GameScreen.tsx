import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Home, Volume2, Sparkles, Award } from 'lucide-react';
import { speak } from '../audio/speech';
import { playCorrect, playWobble, playCheer } from '../audio/sfx';
import { fireToddlerConfetti } from '../utils/confetti';
import { WordImage } from '../components/WordImage';
import { makeRound, GameQuestion, StickerOption } from '../game/makeRound';
import { WordItem, WORDS } from '../data/words';

export const GameScreen: React.FC = () => {
  const {
    setScreen,
    language,
    soundEnabled,
    level,
    enabledCategories,
    lastMistakeWordIds,
    setLastMistakeWordIds,
    adjustAdaptiveLevel,
    unlockedStickers,
    unlockSticker,
    trackUsageSeconds,
    isTimeLimitExceeded,
  } = useAppStore();

  // 0. Track playtime every second while active in game
  useEffect(() => {
    const interval = setInterval(() => {
      trackUsageSeconds(1);
    }, 1000);
    return () => clearInterval(interval);
  }, [trackUsageSeconds]);

  // 1. Generate 5 questions for this round
  const [roundKey, setRoundKey] = useState<number>(0);
  const questions: GameQuestion[] = useMemo(() => {
    return makeRound({
      level,
      enabledCategories,
      lastMistakeWordIds,
    });
  }, [roundKey, level, enabledCategories, lastMistakeWordIds]);

  // Current question index in 0..4
  const [currentQIndex, setCurrentQIndex] = useState<number>(0);
  // Scene state: 'intro' (Scene A: Big word) | 'finding' (Scene B: Floating pictures)
  const [scene, setScene] = useState<'intro' | 'finding'>('intro');

  // Input lock: all taps locked during 1.5s success celebration or intro transition
  const [isInputLocked, setIsInputLocked] = useState<boolean>(false);

  // Per-question interactive states
  const [correctCardId, setCorrectCardId] = useState<string | null>(null);
  const [wobblingCardId, setWobblingCardId] = useState<string | null>(null);
  const [disabledCardIds, setDisabledCardIds] = useState<string[]>([]);
  const [hintActive, setHintActive] = useState<boolean>(false);

  // Round scoring & statistics
  // Tracks whether current question was answered on first try (without touching any wrong card first)
  const [isCurrentQuestionFirstTry, setIsCurrentQuestionFirstTry] = useState<boolean>(true);
  const [firstTryCorrectCount, setFirstTryCorrectCount] = useState<number>(0);
  const [roundMistakes, setRoundMistakes] = useState<string[]>([]);

  // Round completion & reward state
  const [isRoundComplete, setIsRoundComplete] = useState<boolean>(false);
  const [rewardSticker, setRewardSticker] = useState<WordItem | null>(null);
  const [levelChangeInfo, setLevelChangeInfo] = useState<{ changed: boolean; oldLevel: number; newLevel: number } | null>(null);

  // Inactivity hint timers (5s re-speak, 10s wiggle/sparkle)
  const inactivityTimer5sRef = useRef<NodeJS.Timeout | null>(null);
  const inactivityTimer10sRef = useRef<NodeJS.Timeout | null>(null);
  const introTimerRef = useRef<NodeJS.Timeout | null>(null);
  const nextQuestionTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentQuestion = questions[currentQIndex] || questions[0];
  const targetWord = currentQuestion.targetWord;
  const currentWordText = language === 'ko' ? targetWord.ko : targetWord.en;
  const letters = currentWordText.split('');
  const stickers = currentQuestion.stickers;

  // Clear all inactivity timers
  const clearInactivityTimers = useCallback(() => {
    if (inactivityTimer5sRef.current) clearTimeout(inactivityTimer5sRef.current);
    if (inactivityTimer10sRef.current) clearTimeout(inactivityTimer10sRef.current);
  }, []);

  // Start or restart 5s and 10s inactivity hint timers
  const resetInactivityTimers = useCallback(() => {
    clearInactivityTimers();
    setHintActive(false);

    if (scene !== 'finding' || isInputLocked || isRoundComplete) return;

    // 5-second inactivity hint: re-read word
    inactivityTimer5sRef.current = setTimeout(() => {
      if (soundEnabled && scene === 'finding') {
        speak(currentWordText, language);
      }
    }, 5000);

    // 10-second inactivity hint: target card sparkles and gently wiggles
    inactivityTimer10sRef.current = setTimeout(() => {
      if (scene === 'finding') {
        setHintActive(true);
      }
    }, 10000);
  }, [clearInactivityTimers, currentWordText, isInputLocked, isRoundComplete, language, scene, soundEnabled]);

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      clearInactivityTimers();
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
      if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
    };
  }, [clearInactivityTimers]);

  // Scene A (Intro): Speak word + auto transition to Scene B after speech finishes
  useEffect(() => {
    if (isRoundComplete) return;

    if (scene === 'intro') {
      setIsInputLocked(true);
      setCorrectCardId(null);
      setWobblingCardId(null);
      setDisabledCardIds([]);
      setHintActive(false);
      setIsCurrentQuestionFirstTry(true);
      clearInactivityTimers();

      let isMounted = true;

      if (soundEnabled) {
        speak(currentWordText, language).then(() => {
          if (isMounted) {
            introTimerRef.current = setTimeout(() => {
              if (isMounted) {
                setScene('finding');
                setIsInputLocked(false);
              }
            }, 350);
          }
        });
      } else {
        introTimerRef.current = setTimeout(() => {
          if (isMounted) {
            setScene('finding');
            setIsInputLocked(false);
          }
        }, 1300);
      }

      return () => {
        isMounted = false;
        if (introTimerRef.current) clearTimeout(introTimerRef.current);
      };
    }
  }, [scene, currentQIndex, currentWordText, language, soundEnabled, isRoundComplete, clearInactivityTimers]);

  // Whenever scene enters 'finding', start inactivity timers
  useEffect(() => {
    if (scene === 'finding' && !isInputLocked && !isRoundComplete) {
      resetInactivityTimers();
    }
  }, [scene, isInputLocked, isRoundComplete, resetInactivityTimers]);

  // Re-read word on demand (touching top word in Scene B or center in Scene A)
  const handleWordTap = () => {
    resetInactivityTimers();
    if (soundEnabled) {
      speak(currentWordText, language);
    }
  };

  // Generate random praise phrase for correct answer
  const getRandomPraise = (word: string): string => {
    if (language === 'ko') {
      const phrases = [
        `딩동댕! ${word}!`,
        `잘했어! ${word}!`,
        `최고야! ${word}!`,
        `와! ${word}!`,
        `참 잘했어요!`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    } else {
      const phrases = [
        `Great! ${word}!`,
        `Yay! ${word}!`,
        `Awesome! ${word}!`,
        `Super! ${word}!`,
        `Good job!`,
      ];
      return phrases[Math.floor(Math.random() * phrases.length)];
    }
  };

  // Sticker tap handler (Scene B only)
  const handleStickerClick = (sticker: StickerOption) => {
    if (scene !== 'finding' || isInputLocked || isRoundComplete) return;

    // Reset inactivity timers whenever child interacts
    resetInactivityTimers();

    const tappedWordText = language === 'ko' ? sticker.word.ko : sticker.word.en;

    // ----------------------------------------------------
    // 1. 정답인 경우 (Correct Answer)
    // ----------------------------------------------------
    if (sticker.isCorrect) {
      // Lock all inputs immediately for the 1.5s animation
      setIsInputLocked(true);
      clearInactivityTimers();
      setHintActive(false);
      setCorrectCardId(sticker.word.id);

      // Card scale-up bounce, confetti particles, correct chime
      fireToddlerConfetti();
      playCorrect();

      // Random praise TTS
      if (soundEnabled) {
        const praise = getRandomPraise(tappedWordText);
        speak(praise, language);
      }

      // If answered on first try, increment firstTryCorrectCount
      let updatedFirstTryCount = firstTryCorrectCount;
      if (isCurrentQuestionFirstTry) {
        updatedFirstTryCount = firstTryCorrectCount + 1;
        setFirstTryCorrectCount(updatedFirstTryCount);
      }

      // 1.5 seconds later: advance to next question or complete round (or bedtime if time limit reached)
      nextQuestionTimerRef.current = setTimeout(() => {
        // "시간이 다 되면 현재 문제를 마친 뒤 '오늘은 여기까지! 내일 또 만나' 화면"
        if (isTimeLimitExceeded()) {
          setScreen('bedtime');
          return;
        }

        if (currentQIndex < questions.length - 1) {
          setCurrentQIndex((prev) => prev + 1);
          setScene('intro');
          setIsInputLocked(false);
        } else {
          // Round Finished! (All 5 questions complete)
          handleRoundComplete(updatedFirstTryCount);
        }
      }, 1500);
    } else {
      // ----------------------------------------------------
      // 2. 오답인 경우 (Incorrect Answer - Gentle Learning)
      // ----------------------------------------------------
      // No red marks, no ✕, no buzzers!
      setIsCurrentQuestionFirstTry(false);

      // Record this question's target word for priority review in the next round
      if (!roundMistakes.includes(targetWord.id)) {
        setRoundMistakes((prev) => [...prev, targetWord.id]);
      }

      // Wobble card + soft gentle wobble sound
      setWobblingCardId(sticker.word.id);
      playWobble();
      setTimeout(() => setWobblingCardId(null), 500);

      // The tapped incorrect card becomes faded and disabled
      setDisabledCardIds((prev) => [...prev, sticker.word.id]);

      // Friendly explanation: "이건 바나나야. 사과는 어디에 있을까?"
      if (soundEnabled) {
        let explanationText = '';
        if (language === 'ko') {
          explanationText = `이건 ${tappedWordText}야. ${currentWordText}는 어디에 있을까?`;
        } else {
          explanationText = `This is a ${tappedWordText}. Where is the ${currentWordText}?`;
        }
        speak(explanationText, language);
      }
    }
  };

  // Round completion logic (Adaptive Level & Sticker Reward)
  const handleRoundComplete = (finalFirstTryCount: number) => {
    setIsRoundComplete(true);
    setIsInputLocked(true);
    clearInactivityTimers();

    // 1. Adaptive difficulty adjustment: >= 4 -> level+1, <= 2 -> level-1
    const levelResult = adjustAdaptiveLevel(finalFirstTryCount);
    setLevelChangeInfo(levelResult);

    // 2. Save mistaken words for priority in the next round
    if (roundMistakes.length > 0) {
      setLastMistakeWordIds(roundMistakes);
    }

    // 3. Select a reward sticker (pick an uncollected one or a word from this round)
    const candidates = WORDS.filter((w) => !unlockedStickers.includes(w.id));
    const chosenReward = candidates.length > 0
      ? candidates[Math.floor(Math.random() * candidates.length)]
      : targetWord;

    setRewardSticker(chosenReward);
    unlockSticker(chosenReward.id);

    // 4. Play celebratory cheer sound and confetti!
    playCheer();
    fireToddlerConfetti();
  };

  // Start next round
  const handleStartNextRound = () => {
    clearInactivityTimers();
    if (nextQuestionTimerRef.current) clearTimeout(nextQuestionTimerRef.current);
    if (introTimerRef.current) clearTimeout(introTimerRef.current);

    setRoundMistakes([]);
    setFirstTryCorrectCount(0);
    setCurrentQIndex(0);
    setIsRoundComplete(false);
    setRewardSticker(null);
    setLevelChangeInfo(null);
    setScene('intro');
    setRoundKey((prev) => prev + 1);
  };

  return (
    <div className="relative w-full h-full min-h-screen overflow-hidden flex flex-col justify-between select-none">
      {/* Top Bar Navigation */}
      <header className="relative z-30 w-full flex items-center justify-between p-3 md:p-4 max-w-4xl mx-auto">
        {/* Small Home Button */}
        <button
          type="button"
          onClick={() => setScreen('home')}
          aria-label="홈으로 가기 (Go Home)"
          className="w-12 h-12 rounded-2xl bg-white/90 backdrop-blur-sm border-2 border-slate-200/90 shadow-sm flex items-center justify-center text-slate-700 active:scale-90 transition-transform cursor-pointer"
        >
          <Home className="w-6 h-6" />
        </button>

        {/* Top Word Badge in Scene B (Tappable with volume pulse) */}
        {scene === 'finding' && !isRoundComplete && (
          <motion.button
            layoutId="game-word-title"
            type="button"
            onClick={handleWordTap}
            whileTap={{ scale: 1.15 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="flex items-center gap-2 px-5 py-2 rounded-full bg-white/95 backdrop-blur-sm border-2 border-rose-200 shadow-sm cursor-pointer"
          >
            <span className="text-2xl md:text-3xl font-black text-rose-500 tracking-tight">
              {currentWordText}
            </span>
            <Volume2 className="w-5 h-5 text-rose-400 animate-pulse" />
          </motion.button>
        )}

        {/* 5-Question Progress Indicator Dots in Corner */}
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3.5 py-2 rounded-2xl border-2 border-amber-200/70 shadow-sm">
          {[0, 1, 2, 3, 4].map((idx) => {
            const isCompleted = idx < currentQIndex;
            const isCurrent = idx === currentQIndex;
            return (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full transition-all duration-300 ${
                  isCompleted
                    ? 'bg-amber-400 scale-100'
                    : isCurrent
                    ? 'bg-amber-500 scale-125 ring-2 ring-amber-300'
                    : 'bg-amber-200/60 scale-90'
                }`}
                title={`문제 ${idx + 1}`}
              />
            );
          })}
        </div>
      </header>

      {/* Scene A (Intro): Center Giant Word Presentation */}
      {scene === 'intro' && !isRoundComplete && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4">
          <motion.div
            layoutId="game-word-title"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.6, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 350, damping: 22 }}
            className="flex flex-col items-center justify-center text-center cursor-pointer pointer-events-auto"
            onClick={handleWordTap}
          >
            <div className="flex items-center justify-center gap-2 md:gap-4">
              {letters.map((char, index) => (
                <motion.span
                  key={`${char}-${index}`}
                  initial={{ scale: 0, y: 50, opacity: 0 }}
                  animate={{
                    scale: [0, 1.25, 1],
                    y: 0,
                    opacity: 1,
                  }}
                  transition={{
                    duration: 0.45,
                    delay: index * 0.14,
                    ease: [0.34, 1.56, 0.64, 1],
                  }}
                  className="
                    text-8xl sm:text-9xl md:text-[120px] font-black text-rose-500
                    drop-shadow-[0_8px_16px_rgba(244,63,94,0.18)]
                    inline-block will-change-transform select-none
                  "
                >
                  {char}
                </motion.span>
              ))}
            </div>

            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-base md:text-lg font-bold text-amber-800/80 mt-4 bg-white/70 backdrop-blur-sm px-5 py-2 rounded-full border border-amber-200"
            >
              {language === 'ko' ? '어디에 있을까?' : 'Where is it?'}
            </motion.p>
          </motion.div>
        </div>
      )}

      {/* Scene B (Finding): Frameless Floating Picture Stickers */}
      <main className="relative flex-1 w-full max-w-2xl mx-auto z-10 px-2">
        <AnimatePresence>
          {scene === 'finding' && !isRoundComplete && (
            <div className="relative w-full h-full min-h-[460px] sm:min-h-[500px]">
              {stickers.map((sticker, idx) => {
                const isCorrectChosen = correctCardId === sticker.word.id;
                const isWobbling = wobblingCardId === sticker.word.id;
                const isDisabled = disabledCardIds.includes(sticker.word.id);
                const isHintTarget = hintActive && sticker.isCorrect;

                return (
                  <div
                    key={`${currentQIndex}-${sticker.word.id}`}
                    style={{
                      position: 'absolute',
                      left: sticker.zone.x,
                      top: sticker.zone.y,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`z-10 ${isDisabled ? 'pointer-events-none' : ''}`}
                  >
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: isCorrectChosen
                          ? [1, 1.35, 1.15, 1.25]
                          : isDisabled
                          ? 0.92
                          : isHintTarget
                          ? [sticker.zone.scale, sticker.zone.scale * 1.14, sticker.zone.scale]
                          : sticker.zone.scale,
                        opacity: isDisabled ? 0.38 : 1,
                        rotate: isHintTarget ? [-4, 4, -4, 0] : 0,
                        x: isWobbling ? [-10, 10, -7, 7, -3, 3, 0] : 0,
                        transition: {
                          scale: isCorrectChosen
                            ? { duration: 0.8, ease: 'easeOut' }
                            : isHintTarget
                            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                            : { duration: 0.5, delay: idx * 0.12, ease: [0.34, 1.56, 0.64, 1] },
                          rotate: isHintTarget
                            ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                            : undefined,
                          opacity: { duration: 0.25 },
                          x: isWobbling ? { duration: 0.45, ease: 'easeInOut' } : undefined,
                        },
                      }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="will-change-transform"
                    >
                      {/* Gentle floating loop */}
                      <motion.div
                        animate={
                          !isCorrectChosen && !isWobbling
                            ? {
                                y: sticker.zone.floatY,
                                rotate: sticker.zone.floatRotate,
                              }
                            : undefined
                        }
                        transition={
                          !isCorrectChosen && !isWobbling
                            ? {
                                duration: sticker.zone.duration,
                                repeat: Infinity,
                                ease: 'easeInOut',
                                delay: sticker.zone.delay,
                              }
                            : undefined
                        }
                        className="will-change-transform relative"
                      >
                        {/* Touch hitbox >= 130px on small mobile, >= 140px on tablet */}
                        <motion.button
                          type="button"
                          disabled={isDisabled || isInputLocked}
                          onClick={() => handleStickerClick(sticker)}
                          whileTap={!isDisabled && !isInputLocked ? { scale: 0.88, rotate: -4 } : undefined}
                          aria-label={language === 'ko' ? sticker.word.ko : sticker.word.en}
                          className={`
                            min-w-[126px] min-h-[126px] sm:min-w-[140px] sm:min-h-[140px] w-32 h-32 sm:w-40 sm:h-40
                            flex items-center justify-center
                            select-none touch-manipulation
                            bg-transparent border-none outline-none
                            relative
                            ${isDisabled ? 'cursor-not-allowed filter grayscale-[30%]' : 'cursor-pointer'}
                          `}
                        >
                          <WordImage
                            word={sticker.word}
                            alt={language === 'ko' ? sticker.word.ko : sticker.word.en}
                            className="w-28 h-28 sm:w-32 sm:h-32 md:w-36 md:h-36"
                            emojiClassName="text-7xl sm:text-8xl md:text-9xl"
                          />

                          {/* Correct Celebration Sparkle Crown */}
                          {isCorrectChosen && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: [0, 1.4, 1.1], opacity: 1 }}
                              transition={{ duration: 0.4 }}
                              className="absolute -top-6 text-4xl select-none pointer-events-none drop-shadow-md"
                            >
                              ✨👑✨
                            </motion.div>
                          )}

                          {/* 10s Inactivity Hint Sparkle Guide */}
                          {isHintTarget && !isCorrectChosen && (
                            <motion.div
                              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
                              transition={{ duration: 1.2, repeat: Infinity }}
                              className="absolute -top-3 text-3xl select-none pointer-events-none drop-shadow-sm"
                            >
                              ✨
                            </motion.div>
                          )}
                        </motion.button>
                      </motion.div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          )}
        </AnimatePresence>

        {/* Sticker Reward & Round Clear Screen */}
        {isRoundComplete && rewardSticker && (
          <div className="absolute inset-0 z-40 flex flex-col items-center justify-center p-6 text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', damping: 20 }}
              className="bg-white/95 backdrop-blur-md rounded-[44px] border-4 border-amber-300 p-8 shadow-2xl max-w-sm w-full flex flex-col items-center relative overflow-hidden"
            >
              {/* Background ambient light */}
              <div className="absolute -top-16 w-64 h-64 bg-amber-200/50 rounded-full blur-2xl pointer-events-none" />

              <div className="flex items-center gap-1.5 text-amber-600 font-bold text-sm mb-2">
                <Award className="w-5 h-5 text-amber-500" />
                <span>{language === 'ko' ? '5문제 모두 완료!' : 'All 5 Complete!'}</span>
              </div>

              <h3 className="text-2xl md:text-3xl font-black text-amber-900 mb-6">
                {language === 'ko' ? '새 스티커 획득!' : 'New Sticker Earned!'}
              </h3>

              {/* Big Spinning Sticker Reveal (scale: [0, 1.25, 1], rotate: [0, 720]) */}
              <motion.div
                initial={{ scale: 0, rotate: 0 }}
                animate={{ scale: [0, 1.25, 1], rotate: [0, 720] }}
                transition={{ duration: 1.1, ease: [0.34, 1.56, 0.64, 1] }}
                className="w-40 h-40 rounded-full bg-gradient-to-tr from-amber-100 to-amber-50 border-4 border-amber-300 flex items-center justify-center shadow-lg mb-4 p-4 relative"
              >
                <WordImage
                  word={rewardSticker}
                  alt={language === 'ko' ? rewardSticker.ko : rewardSticker.en}
                  className="w-28 h-28"
                  emojiClassName="text-7xl"
                />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ delay: 0.9, duration: 0.4 }}
                  className="absolute -top-2 -right-2 text-3xl"
                >
                  ⭐
                </motion.div>
              </motion.div>

              <p className="text-lg font-black text-slate-800 mb-1">
                {language === 'ko' ? rewardSticker.ko : rewardSticker.en}
              </p>
              <p className="text-xs text-slate-500 font-medium mb-5">
                {language === 'ko' ? '스티커북에 쏙 들어갔어요!' : 'Saved into your Sticker Book!'}
              </p>

              {/* Adaptive Level Change Notification */}
              {levelChangeInfo?.changed && (
                <div className="w-full bg-sky-50 border border-sky-200 rounded-2xl p-2.5 mb-5 text-xs text-sky-800 font-bold flex items-center justify-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-sky-500" />
                  <span>
                    {levelChangeInfo.newLevel > levelChangeInfo.oldLevel
                      ? (language === 'ko' ? `실력이 늘어 ${levelChangeInfo.newLevel}단계로 올라갔어요! 🚀` : `Levelled up to Level ${levelChangeInfo.newLevel}! 🚀`)
                      : (language === 'ko' ? `더 편안하게 ${levelChangeInfo.newLevel}단계로 맞춰드렸어요! 🌱` : `Adjusted to Level ${levelChangeInfo.newLevel} for comfort! 🌱`)}
                  </span>
                </div>
              )}

              {/* Action Buttons: Play Again or Go Home */}
              <div className="flex flex-col gap-3 w-full">
                <button
                  type="button"
                  onClick={handleStartNextRound}
                  className="w-full py-4 px-6 rounded-2xl bg-amber-400 hover:bg-amber-500 text-amber-950 font-black text-lg shadow-md active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-6 h-6" />
                  <span>{language === 'ko' ? '한 판 더 놀기' : 'Play Again'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setScreen('home')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-base active:scale-95 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Home className="w-5 h-5" />
                  <span>{language === 'ko' ? '홈으로' : 'Home'}</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </main>

      {/* Bottom hint label */}
      <footer className="relative z-20 pb-4 text-center">
        {!isRoundComplete && (
          <p className="text-sm font-bold text-slate-400 select-none">
            {scene === 'intro'
              ? '🎧 ' + (language === 'ko' ? '단어를 귀로 들어요' : 'Listen to the word')
              : '👉 ' + (language === 'ko' ? '맞는 그림을 톡! 눌러보세요' : 'Tap the matching picture!')}
          </p>
        )}
      </footer>
    </div>
  );
};
