import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAppStore } from '../store/useAppStore';
import { Home, Volume2, Sparkles, Bell, Play, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { speak, unlockAudio, hasVoice, toddlerSpeech } from '../audio/speech';
import { playCorrect, playTap, playCheer, playWobble } from '../audio/sfx';

export const AudioTestScreen: React.FC = () => {
  const { setScreen } = useAppStore();

  const [customKo, setCustomKo] = useState('사과');
  const [customEn, setCustomEn] = useState('Apple');
  const [isPlaying, setIsPlaying] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [showVoiceList, setShowVoiceList] = useState(false);

  useEffect(() => {
    const updateVoiceList = () => {
      setVoices(toddlerSpeech.getAllVoices());
    };

    updateVoiceList();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoiceList;
    }
  }, []);

  const selectedKoVoice = toddlerSpeech.getVoice('ko');
  const selectedEnVoice = toddlerSpeech.getVoice('en');

  const handleSpeak = async (text: string, lang: 'ko' | 'en') => {
    setIsPlaying(true);
    await speak(text, lang);
    setIsPlaying(false);
  };

  const handleUnlock = () => {
    unlockAudio();
    setUnlocked(true);
    playTap();
  };

  const sampleKoWords = ['사과', '강아지', '자동차', '코끼리', '비행기', '눈사람', '수박'];
  const sampleEnWords = ['Apple', 'Dog', 'Car', 'Elephant', 'Airplane', 'Snowman', 'Watermelon'];

  return (
    <div className="w-full h-full min-h-screen flex flex-col p-4 md:p-6 max-w-3xl mx-auto pb-16">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => setScreen('parent')}
          aria-label="뒤로 가기"
          className="w-14 h-14 rounded-2xl bg-white border-2 border-slate-200 shadow-sm flex items-center justify-center text-slate-700 active:scale-95 transition-transform cursor-pointer"
        >
          <Home className="w-7 h-7" />
        </button>

        <h1 className="text-xl md:text-2xl font-black text-slate-800">
          오디오 & 발음 테스트
        </h1>

        <button
          type="button"
          onClick={handleUnlock}
          className={`px-3 py-2 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-colors cursor-pointer ${
            unlocked
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-amber-50 text-amber-700 border-amber-300 hover:bg-amber-100'
          }`}
        >
          {unlocked ? <CheckCircle2 className="w-4 h-4" /> : <Play className="w-4 h-4" />}
          <span>{unlocked ? 'iOS 언락 완료' : 'iOS 오디오 언락'}</span>
        </button>
      </header>

      {/* Voice Status Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-3">
          Web Speech API 음성 감지 상태
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Korean Voice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-amber-900 text-sm">🇰🇷 한국어 음성</span>
              {hasVoice('ko') ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> 사용 가능
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> 기본 음성 없음
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-amber-800 truncate" title={selectedKoVoice?.name}>
              {selectedKoVoice ? `선택: ${selectedKoVoice.name}` : '시스템 기본 합성기 사용'}
            </p>
            <p className="text-[11px] text-amber-600 mt-1">속도: 0.8 · 음높이: 1.1 (유아 맞춤)</p>
          </div>

          {/* English Voice */}
          <div className="p-3.5 rounded-2xl bg-sky-50/60 border border-sky-200/80">
            <div className="flex items-center justify-between mb-1">
              <span className="font-black text-sky-900 text-sm">🇺🇸 English Voice</span>
              {hasVoice('en') ? (
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Available
                </span>
              ) : (
                <span className="text-xs font-bold text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> No Voice
                </span>
              )}
            </div>
            <p className="text-xs font-medium text-sky-800 truncate" title={selectedEnVoice?.name}>
              {selectedEnVoice ? `Selected: ${selectedEnVoice.name}` : 'Using system default synth'}
            </p>
            <p className="text-[11px] text-sky-600 mt-1">Rate: 0.8 · Pitch: 1.1 (Toddler friendly)</p>
          </div>
        </div>
      </div>

      {/* 1. Korean Pronunciation Test */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <span>🇰🇷 한국어 발음 테스트</span>
          </h2>
          <span className="text-xs text-slate-400">속도 0.8 / 높이 1.1</span>
        </div>

        {/* Sample words */}
        <div className="flex flex-wrap gap-2 mb-4">
          {sampleKoWords.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => handleSpeak(word, 'ko')}
              className="px-4 py-2.5 rounded-2xl bg-amber-100/70 hover:bg-amber-200 text-amber-900 font-black text-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Volume2 className="w-4 h-4 text-amber-700" />
              <span>{word}</span>
            </button>
          ))}
        </div>

        {/* Custom text input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customKo}
            onChange={(e) => setCustomKo(e.target.value)}
            placeholder="직접 단어 입력..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-amber-400 bg-slate-50"
          />
          <button
            type="button"
            onClick={() => handleSpeak(customKo, 'ko')}
            className="px-5 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-sm active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Volume2 className="w-4 h-4" />
            <span>말하기</span>
          </button>
        </div>
      </section>

      {/* 2. English Pronunciation Test */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-slate-800 flex items-center gap-2">
            <span>🇺🇸 English Pronunciation Test</span>
          </h2>
          <span className="text-xs text-slate-400">Rate 0.8 / Pitch 1.1</span>
        </div>

        {/* Sample words */}
        <div className="flex flex-wrap gap-2 mb-4">
          {sampleEnWords.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => handleSpeak(word, 'en')}
              className="px-4 py-2.5 rounded-2xl bg-sky-100/70 hover:bg-sky-200 text-sky-900 font-black text-sm active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <Volume2 className="w-4 h-4 text-sky-700" />
              <span>{word}</span>
            </button>
          ))}
        </div>

        {/* Custom text input */}
        <div className="flex gap-2">
          <input
            type="text"
            value={customEn}
            onChange={(e) => setCustomEn(e.target.value)}
            placeholder="Type any word..."
            className="flex-1 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold focus:outline-none focus:border-sky-400 bg-slate-50"
          />
          <button
            type="button"
            onClick={() => handleSpeak(customEn, 'en')}
            className="px-5 py-2.5 rounded-2xl bg-sky-500 hover:bg-sky-600 text-white font-black text-sm active:scale-95 transition-transform flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <Volume2 className="w-4 h-4" />
            <span>Speak</span>
          </button>
        </div>
      </section>

      {/* 3. SFX Effects (Howler) Test */}
      <section className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-black text-slate-800">
            효과음 4종 테스트 (Howler, 볼륨 0.5)
          </h2>
          <span className="text-xs text-slate-400">public/sfx/*.mp3</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* correct */}
          <button
            type="button"
            onClick={playCorrect}
            className="p-4 rounded-2xl bg-emerald-100/80 hover:bg-emerald-200 active:scale-95 border-2 border-emerald-300 text-emerald-900 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Bell className="w-6 h-6 text-emerald-600" />
            <span className="font-black text-sm">딩동댕</span>
            <span className="text-[11px] text-emerald-700">correct</span>
          </button>

          {/* tap */}
          <button
            type="button"
            onClick={playTap}
            className="p-4 rounded-2xl bg-amber-100/80 hover:bg-amber-200 active:scale-95 border-2 border-amber-300 text-amber-900 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Volume2 className="w-6 h-6 text-amber-600" />
            <span className="font-black text-sm">뿅</span>
            <span className="text-[11px] text-amber-700">tap</span>
          </button>

          {/* cheer */}
          <button
            type="button"
            onClick={playCheer}
            className="p-4 rounded-2xl bg-purple-100/80 hover:bg-purple-200 active:scale-95 border-2 border-purple-300 text-purple-900 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Sparkles className="w-6 h-6 text-purple-600" />
            <span className="font-black text-sm">박수/환호</span>
            <span className="text-[11px] text-purple-700">cheer</span>
          </button>

          {/* wobble */}
          <button
            type="button"
            onClick={playWobble}
            className="p-4 rounded-2xl bg-rose-100/80 hover:bg-rose-200 active:scale-95 border-2 border-rose-300 text-rose-900 flex flex-col items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className="w-6 h-6 text-rose-600" />
            <span className="font-black text-sm">뽀용</span>
            <span className="text-[11px] text-rose-700">wobble</span>
          </button>
        </div>
      </section>

      {/* 4. Diagnostics: All Available Device Voices */}
      <section className="bg-white/80 rounded-3xl p-4 border border-slate-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-slate-500">
            기기 내 전체 감지된 TTS 음성 목록 ({voices.length}개)
          </span>
          <button
            type="button"
            onClick={() => setShowVoiceList(!showVoiceList)}
            className="text-xs font-bold text-sky-600 hover:text-sky-700 underline cursor-pointer"
          >
            {showVoiceList ? '숨기기' : '자세히 보기'}
          </button>
        </div>

        {showVoiceList && (
          <div className="mt-3 max-h-48 overflow-y-auto space-y-1 text-xs text-slate-600 border-t pt-2">
            {voices.length === 0 ? (
              <p className="text-slate-400 italic">음성 목록 로딩 중...</p>
            ) : (
              voices.map((v, i) => (
                <div key={i} className="flex justify-between py-0.5 border-b border-slate-100">
                  <span className="font-medium text-slate-800">{v.name}</span>
                  <span className="text-slate-400">{v.lang} {v.default ? '(기본)' : ''}</span>
                </div>
              ))
            )}
          </div>
        )}
      </section>
    </div>
  );
};
