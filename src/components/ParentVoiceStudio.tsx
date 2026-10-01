import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Mic,
  Square,
  Play,
  Trash2,
  RotateCcw,
  Check,
  Sparkles,
  Volume2,
  X,
  AlertCircle,
  HelpCircle,
  Award,
  BookOpen,
} from 'lucide-react';
import { WORDS, CATEGORIES, WordCategory, WordItem } from '../data/words';
import { PRAISE_ITEMS, PraiseItem } from '../data/praise';
import { WordImage } from './WordImage';
import { SimpleAudioRecorder, RecordingResult } from '../audio/audioRecorder';
import { parentVoiceStorage } from '../audio/parentVoiceStorage';
import { useAppStore } from '../store/useAppStore';
import { playParentVoice, speak } from '../audio/speech';
import { playTap, playCorrect } from '../audio/sfx';

type ActiveStudioTab = 'praise' | 'words';
type RecordingTarget =
  | { type: 'word'; item: WordItem }
  | { type: 'praise'; item: PraiseItem };

export const ParentVoiceStudio: React.FC = () => {
  const {
    language,
    parentVoiceEnabled,
    toggleParentVoice,
    recordedVoiceIds,
    addRecordedVoiceId,
    removeRecordedVoiceId,
  } = useAppStore();

  const [studioTab, setStudioTab] = useState<ActiveStudioTab>('praise');
  const [selectedCat, setSelectedCat] = useState<WordCategory | 'all'>('all');
  const [activeTarget, setActiveTarget] = useState<RecordingTarget | null>(null);

  // Recording Modal State
  const [recorderStatus, setRecorderStatus] = useState<'idle' | 'recording' | 'preview'>('idle');
  const [recordTimerSec, setRecordTimerSec] = useState<number>(0);
  const [tempRecording, setTempRecording] = useState<RecordingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

  const recorderRef = useRef<SimpleAudioRecorder | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const filteredWords = selectedCat === 'all'
    ? WORDS
    : WORDS.filter((w) => w.category === selectedCat);

  const recordedPraiseCount = PRAISE_ITEMS.filter((p) => recordedVoiceIds.includes(p.id)).length;
  const recordedWordCount = WORDS.filter((w) => recordedVoiceIds.includes(w.id)).length;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (recorderRef.current) recorderRef.current.cancel();
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const openRecordModal = (target: RecordingTarget) => {
    playTap();
    setActiveTarget(target);
    setRecorderStatus('idle');
    setTempRecording(null);
    setErrorMessage(null);
    setRecordTimerSec(0);
  };

  const closeRecordModal = () => {
    if (recorderRef.current && recorderRef.current.recording) {
      recorderRef.current.cancel();
    }
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }
    setActiveTarget(null);
    setRecorderStatus('idle');
    setTempRecording(null);
    setErrorMessage(null);
    setIsPlayingAudio(false);
  };

  // Start recording
  const handleStartRecording = async () => {
    playTap();
    setErrorMessage(null);

    try {
      const recorder = new SimpleAudioRecorder();
      recorderRef.current = recorder;
      await recorder.start();

      setRecorderStatus('recording');
      setRecordTimerSec(0);

      const startTime = Date.now();
      timerIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordTimerSec(elapsed);

        // Auto-stop after 5 seconds
        if (elapsed >= 5) {
          handleStopRecording();
        }
      }, 200);
    } catch (err: any) {
      setErrorMessage(err.message || '마이크에 접근할 수 없습니다.');
      setRecorderStatus('idle');
    }
  };

  // Stop recording
  const handleStopRecording = async () => {
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);

    if (recorderRef.current && recorderRef.current.recording) {
      try {
        const result = await recorderRef.current.stop();
        setTempRecording(result);
        setRecorderStatus('preview');
        // Auto preview what was just recorded
        playPreviewAudio(result.url);
      } catch (err: any) {
        setErrorMessage('녹음 저장 중 문제가 발생했습니다: ' + err.message);
        setRecorderStatus('idle');
      }
    }
  };

  // Play preview audio
  const playPreviewAudio = (audioUrl: string) => {
    if (previewAudioRef.current) {
      previewAudioRef.current.pause();
      previewAudioRef.current = null;
    }

    try {
      const audio = new Audio(audioUrl);
      previewAudioRef.current = audio;
      setIsPlayingAudio(true);

      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => setIsPlayingAudio(false);
      audio.play().catch(() => setIsPlayingAudio(false));
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Save voice to IndexedDB & store
  const handleSaveVoice = async () => {
    if (!activeTarget || !tempRecording) return;

    try {
      await parentVoiceStorage.saveVoice(activeTarget.item.id, tempRecording.blob);
      addRecordedVoiceId(activeTarget.item.id);
      playCorrect();
      closeRecordModal();
    } catch (err: any) {
      setErrorMessage('저장에 실패했습니다: ' + err.message);
    }
  };

  // Delete voice from IndexedDB & store
  const handleDeleteVoice = async (id: string) => {
    playTap();
    try {
      await parentVoiceStorage.deleteVoice(id);
      removeRecordedVoiceId(id);
      if (activeTarget?.item.id === id) {
        closeRecordModal();
      }
    } catch (err: any) {
      console.warn('Failed to delete voice:', err);
    }
  };

  // Quick listen
  const handleQuickListenWord = async (word: WordItem) => {
    playTap();
    if (parentVoiceStorage.hasVoice(word.id)) {
      await playParentVoice(word.id);
    } else {
      speak(language === 'ko' ? word.ko : word.en, language);
    }
  };

  const handleQuickListenPraise = async (praise: PraiseItem) => {
    playTap();
    if (parentVoiceStorage.hasVoice(praise.id)) {
      await playParentVoice(praise.id);
    } else {
      speak(language === 'ko' ? praise.defaultTextKo : praise.defaultTextEn, language);
    }
  };

  return (
    <section className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-5">
      {/* Title & Master Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <Mic className="w-4 h-4 stroke-[2.5]" />
            </div>
            <h2 className="text-base font-black text-slate-800">
              엄마·아빠 목소리 녹음실
            </h2>
          </div>
          <p className="text-xs text-slate-500 font-medium mt-1">
            정답 칭찬 소리와 낱말 소리를 부모님의 다정한 목소리로 녹음할 수 있습니다.
          </p>
        </div>

        {/* Master Toggle */}
        <button
          type="button"
          onClick={() => {
            playTap();
            toggleParentVoice();
          }}
          className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl border-2 font-bold text-xs cursor-pointer transition-all shrink-0 ${
            parentVoiceEnabled
              ? 'bg-rose-50 border-rose-300 text-rose-700'
              : 'bg-slate-50 border-slate-200 text-slate-500'
          }`}
        >
          <span>{parentVoiceEnabled ? '부모 목소리 우선 켜짐' : '기본 음성(TTS) 사용'}</span>
          <div
            className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
              parentVoiceEnabled ? 'bg-rose-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                parentVoiceEnabled ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </div>
        </button>
      </div>

      {/* Studio Navigation Tabs (Praise vs Words) */}
      <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-2xl">
        <button
          type="button"
          onClick={() => {
            playTap();
            setStudioTab('praise');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            studioTab === 'praise'
              ? 'bg-white text-rose-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>정답 칭찬 목소리 ({recordedPraiseCount}/4)</span>
        </button>

        <button
          type="button"
          onClick={() => {
            playTap();
            setStudioTab('words');
          }}
          className={`flex-1 py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            studioTab === 'words'
              ? 'bg-white text-amber-600 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>낱말 목소리 ({recordedWordCount}/42)</span>
        </button>
      </div>

      {/* ---------------------------------------------------- */}
      {/* TAB 1: PRAISE VOICES (맞았을 때 나오는 칭찬 소리) */}
      {/* ---------------------------------------------------- */}
      {studioTab === 'praise' && (
        <div className="space-y-3">
          <div className="bg-rose-50/70 border border-rose-200/80 rounded-2xl p-3 text-xs text-rose-950 font-medium flex items-start gap-2">
            <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">아이를 위한 정답 환호성!</p>
              <p className="text-[11px] text-rose-800/90 mt-0.5">
                문제를 맞혔을 때 기계음 대신 엄마·아빠가 직접 축하해 주는 따뜻한 목소리가 랜덤으로 재생됩니다.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {PRAISE_ITEMS.map((praise) => {
              const isRecorded = recordedVoiceIds.includes(praise.id);

              return (
                <div
                  key={praise.id}
                  className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all ${
                    isRecorded
                      ? 'bg-rose-50/60 border-rose-300'
                      : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-3xl shrink-0">{praise.icon}</span>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-800">
                          {praise.title}
                        </span>
                        {isRecorded ? (
                          <span className="px-2 py-0.2 rounded-full bg-rose-100 text-rose-700 font-bold text-[10px]">
                            녹음됨
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-medium">
                            기본 칭찬
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-semibold truncate mt-0.5">
                        {language === 'ko' ? praise.guideKo : praise.guideEn}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {/* Listen */}
                    <button
                      type="button"
                      onClick={() => handleQuickListenPraise(praise)}
                      title="미리듣기"
                      aria-label={`${praise.title} 미리듣기`}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-rose-600 active:scale-90 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Record */}
                    <button
                      type="button"
                      onClick={() => openRecordModal({ type: 'praise', item: praise })}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                        isRecorded
                          ? 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                          : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{isRecorded ? '재녹음' : '녹음'}</span>
                    </button>

                    {/* Delete */}
                    {isRecorded && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVoice(praise.id)}
                        title="기존 녹음 삭제"
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 active:scale-90 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* TAB 2: WORDS VOICES (낱말 목소리) */}
      {/* ---------------------------------------------------- */}
      {studioTab === 'words' && (
        <div className="space-y-4">
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full text-xs">
            <button
              type="button"
              onClick={() => setSelectedCat('all')}
              className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer whitespace-nowrap transition-all ${
                selectedCat === 'all'
                  ? 'bg-slate-800 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              전체 ({WORDS.length})
            </button>
            {CATEGORIES.map((cat) => {
              const catWordsCount = WORDS.filter((w) => w.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCat(cat.id)}
                  className={`px-3 py-1.5 rounded-xl font-bold cursor-pointer whitespace-nowrap transition-all ${
                    selectedCat === cat.id
                      ? 'bg-amber-400 text-amber-950 shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat.icon} {cat.ko} ({catWordsCount})
                </button>
              );
            })}
          </div>

          {/* Word Grid / List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[380px] overflow-y-auto pr-1">
            {filteredWords.map((word) => {
              const isRecorded = recordedVoiceIds.includes(word.id);

              return (
                <div
                  key={word.id}
                  className={`flex items-center justify-between p-2.5 rounded-2xl border transition-all ${
                    isRecorded
                      ? 'bg-rose-50/50 border-rose-200/80'
                      : 'bg-slate-50/60 border-slate-100 hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <WordImage
                      word={word}
                      alt={word.ko}
                      className="w-10 h-10 shrink-0"
                      emojiClassName="text-2xl"
                    />
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-sm text-slate-800 truncate">
                          {word.ko}
                        </span>
                        <span className="text-xs text-slate-400 truncate">
                          ({word.en})
                        </span>
                      </div>
                      <div className="text-[11px] font-semibold mt-0.5">
                        {isRecorded ? (
                          <span className="text-rose-600 font-bold flex items-center gap-1">
                            <Check className="w-3 h-3 stroke-[3]" /> 부모 목소리
                          </span>
                        ) : (
                          <span className="text-slate-400">기본 음성(TTS)</span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Listen button */}
                    <button
                      type="button"
                      onClick={() => handleQuickListenWord(word)}
                      title="미리듣기"
                      aria-label={`${word.ko} 미리듣기`}
                      className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-600 hover:text-amber-600 active:scale-90 transition-all cursor-pointer"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>

                    {/* Record Button */}
                    <button
                      type="button"
                      onClick={() => openRecordModal({ type: 'word', item: word })}
                      title={isRecorded ? '다시 녹음하기' : '녹음하기'}
                      aria-label={`${word.ko} ${isRecorded ? '다시 녹음하기' : '녹음하기'}`}
                      className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                        isRecorded
                          ? 'bg-white border border-rose-200 text-rose-700 hover:bg-rose-50'
                          : 'bg-rose-500 hover:bg-rose-600 text-white shadow-xs'
                      }`}
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{isRecorded ? '재녹음' : '녹음'}</span>
                    </button>

                    {/* Delete button (if recorded) */}
                    {isRecorded && (
                      <button
                        type="button"
                        onClick={() => handleDeleteVoice(word.id)}
                        title="녹음 삭제하고 기본 음성으로 복원"
                        aria-label={`${word.ko} 녹음 삭제`}
                        className="w-8 h-8 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-rose-500 active:scale-90 transition-all cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recording Dialog Modal */}
      <AnimatePresence>
        {activeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 15 }}
              className="bg-white rounded-[36px] max-w-sm w-full p-6 shadow-2xl border-4 border-rose-200 flex flex-col items-center text-center relative overflow-hidden"
            >
              {/* Close Icon */}
              <button
                type="button"
                onClick={closeRecordModal}
                aria-label="닫기"
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 active:scale-90 transition-all cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Target Visual & Name */}
              {activeTarget.type === 'word' ? (
                <>
                  <div className="w-24 h-24 rounded-3xl bg-rose-50 border-2 border-rose-100 flex items-center justify-center mb-3">
                    <WordImage
                      word={activeTarget.item}
                      alt={activeTarget.item.ko}
                      className="w-18 h-18"
                      emojiClassName="text-5xl"
                    />
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {activeTarget.item.ko}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold mb-4">
                    {activeTarget.item.en}
                  </p>
                  <div className="w-full bg-amber-50 border border-amber-200/80 rounded-2xl p-2.5 text-xs text-amber-900 font-semibold mb-6 flex items-start gap-2 text-left">
                    <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      아이에게 다정하게 <strong>&ldquo;{activeTarget.item.ko}!&rdquo;</strong> 또는{' '}
                      <strong>&ldquo;맛있는 {activeTarget.item.ko}!&rdquo;</strong>라고 말해주세요.
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="w-24 h-24 rounded-3xl bg-amber-50 border-2 border-amber-100 flex items-center justify-center mb-3 text-5xl">
                    {activeTarget.item.icon}
                  </div>
                  <h3 className="text-2xl font-black text-slate-800">
                    {activeTarget.item.title} (정답 칭찬)
                  </h3>
                  <p className="text-xs text-rose-500 font-bold mb-4">
                    {language === 'ko' ? activeTarget.item.guideKo : activeTarget.item.guideEn}
                  </p>
                  <div className="w-full bg-rose-50 border border-rose-200/80 rounded-2xl p-2.5 text-xs text-rose-900 font-semibold mb-6 flex items-start gap-2 text-left">
                    <Sparkles className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>
                      아이가 정답을 맞혔을 때 들을 환호성을 <strong>밝고 기쁜 목소리</strong>로 녹음해 주세요!
                    </span>
                  </div>
                </>
              )}

              {/* Error Message if any */}
              {errorMessage && (
                <div className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-2.5 text-xs text-rose-700 font-bold mb-4 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* State 1: IDLE */}
              {recorderStatus === 'idle' && (
                <div className="flex flex-col items-center gap-3 w-full">
                  <motion.button
                    type="button"
                    onClick={handleStartRecording}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-20 h-20 rounded-full bg-rose-500 hover:bg-rose-600 text-white flex items-center justify-center shadow-lg shadow-rose-200 cursor-pointer"
                  >
                    <Mic className="w-9 h-9" />
                  </motion.button>
                  <span className="text-xs font-bold text-slate-500">
                    버튼을 누르고 말씀하세요
                  </span>
                </div>
              )}

              {/* State 2: RECORDING */}
              {recorderStatus === 'recording' && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="relative">
                    <motion.div
                      animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0.2, 0.6] }}
                      transition={{ duration: 1.2, repeat: Infinity }}
                      className="absolute -inset-3 rounded-full bg-rose-400 pointer-events-none"
                    />
                    <motion.button
                      type="button"
                      onClick={handleStopRecording}
                      whileTap={{ scale: 0.95 }}
                      className="relative w-20 h-20 rounded-full bg-rose-600 text-white flex items-center justify-center shadow-lg cursor-pointer"
                    >
                      <Square className="w-7 h-7 fill-white" />
                    </motion.button>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                    <span className="text-sm font-black text-rose-600">
                      녹음 중... {recordTimerSec}초
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={handleStopRecording}
                    className="px-5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs cursor-pointer"
                  >
                    녹음 마치기
                  </button>
                </div>
              )}

              {/* State 3: PREVIEW & SAVE */}
              {recorderStatus === 'preview' && tempRecording && (
                <div className="flex flex-col items-center gap-4 w-full">
                  <div className="flex items-center justify-center gap-3">
                    <button
                      type="button"
                      onClick={() => playPreviewAudio(tempRecording.url)}
                      className={`px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-all ${
                        isPlayingAudio
                          ? 'bg-rose-500 text-white ring-2 ring-rose-300'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Play className="w-4 h-4 fill-current" />
                      <span>{isPlayingAudio ? '재생 중...' : '녹음 들어보기'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleStartRecording}
                      className="px-3.5 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>다시 녹음</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-2 w-full pt-2">
                    <button
                      type="button"
                      onClick={handleSaveVoice}
                      className="flex-1 py-3 px-4 rounded-2xl bg-rose-500 hover:bg-rose-600 text-white font-black text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>이 목소리로 저장</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Existing recording deletion option */}
              {recordedVoiceIds.includes(activeTarget.item.id) && recorderStatus !== 'recording' && (
                <div className="mt-4 pt-3 border-t border-slate-100 w-full text-center">
                  <button
                    type="button"
                    onClick={() => handleDeleteVoice(activeTarget.item.id)}
                    className="text-xs text-slate-400 hover:text-rose-600 font-semibold cursor-pointer underline underline-offset-2"
                  >
                    기존 녹음 삭제하고 기본 음성으로 복원
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};
