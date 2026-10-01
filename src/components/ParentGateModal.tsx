import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShieldCheck, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

interface ParentGateModalProps {
  isOpen: boolean;
  onSuccess: () => void;
  onClose: () => void;
}

interface MathProblem {
  num1: number;
  num2: number;
  correctAnswer: number;
  options: number[];
}

function generateMathProblem(): MathProblem {
  // Two-digit addition (e.g. 14 + 7, 23 + 9, etc.)
  const num1 = Math.floor(Math.random() * 26) + 12; // 12 ~ 37
  const num2 = Math.floor(Math.random() * 15) + 5;  // 5 ~ 19
  const correctAnswer = num1 + num2;

  // Generate 3 plausible unique distractors
  const distractors = new Set<number>();
  const candidates = [
    correctAnswer + 1,
    correctAnswer - 1,
    correctAnswer + 10,
    correctAnswer - 2,
    correctAnswer + 2,
    correctAnswer + 9,
  ];

  for (const c of candidates) {
    if (c > 0 && c !== correctAnswer && !distractors.has(c)) {
      distractors.add(c);
      if (distractors.size === 3) break;
    }
  }

  // Shuffle correct answer and distractors
  const options = [correctAnswer, ...Array.from(distractors)].sort(() => Math.random() - 0.5);

  return { num1, num2, correctAnswer, options };
}

export const ParentGateModal: React.FC<ParentGateModalProps> = ({ isOpen, onSuccess, onClose }) => {
  const { language, setScreen } = useAppStore();
  const [problem, setProblem] = useState<MathProblem>(generateMathProblem);
  const [hasFailed, setHasFailed] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setProblem(generateMathProblem());
      setHasFailed(false);
    }
  }, [isOpen]);

  const handleOptionClick = (chosen: number) => {
    if (chosen === problem.correctAnswer) {
      onSuccess();
    } else {
      // Wrong answer: "틀리면 홈으로."
      setHasFailed(true);
      setTimeout(() => {
        onClose();
        setScreen('home');
      }, 400);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm select-none">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.85, opacity: 0 }}
            transition={{ type: 'spring', damping: 22 }}
            className={`
              bg-white rounded-[36px] border-4 border-purple-200 p-6 sm:p-8 shadow-2xl max-w-sm w-full
              flex flex-col items-center text-center relative
              ${hasFailed ? 'animate-shake border-red-300' : ''}
            `}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                onClose();
                setScreen('home');
              }}
              className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Shield Icon */}
            <div className="w-14 h-14 rounded-2xl bg-purple-100 flex items-center justify-center text-purple-600 mb-3 shadow-inner">
              <ShieldCheck className="w-7 h-7" />
            </div>

            <h3 className="text-xl font-black text-slate-800 mb-1">
              {language === 'ko' ? '보호자 확인' : 'Parent Verification'}
            </h3>
            <p className="text-xs text-slate-500 mb-6">
              {language === 'ko'
                ? '아이들의 안전한 사용을 위해 문제를 풀어주세요.'
                : 'Please solve the problem to access settings.'}
            </p>

            {/* Math Question Display */}
            <div className="w-full bg-purple-50/80 border-2 border-purple-200 rounded-3xl py-4 px-6 mb-6">
              <span className="text-3xl sm:text-4xl font-black text-purple-900 tracking-wider">
                {problem.num1} + {problem.num2} = ?
              </span>
            </div>

            {/* 4 Numeric Option Buttons */}
            <div className="grid grid-cols-2 gap-3 w-full">
              {problem.options.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => handleOptionClick(opt)}
                  className="
                    py-3.5 px-4 rounded-2xl bg-white hover:bg-purple-50
                    border-2 border-slate-200 hover:border-purple-300 active:scale-95
                    text-xl font-black text-slate-800 transition-all cursor-pointer shadow-xs
                  "
                >
                  {opt}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
