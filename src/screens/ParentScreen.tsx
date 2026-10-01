import React, { useState, useEffect } from 'react';
import { useAppStore, DifficultyMode, DailyLimitMinutes } from '../store/useAppStore';
import {
  Home,
  ShieldCheck,
  Check,
  Volume2,
  VolumeX,
  AlertTriangle,
  RotateCcw,
  Clock,
  Sliders,
  Layers,
  Info,
} from 'lucide-react';
import { CATEGORIES, WordCategory } from '../data/words';
import { hasVoice } from '../audio/speech';
import { playTap } from '../audio/sfx';
import { PWAInstallButton } from '../components/PWAInstallButton';

export const ParentScreen: React.FC = () => {
  const {
    setScreen,
    language,
    setLanguage,
    difficultyMode,
    setDifficultyMode,
    enabledCategories,
    toggleCategory,
    dailyLimitMinutes,
    setDailyLimitMinutes,
    usedSecondsToday,
    soundEnabled,
    setSoundEnabled,
    resetAllStickers,
    boardStickers,
    unlockedStickers,
  } = useAppStore();

  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Check TTS voice availability for selected language
  useEffect(() => {
    // Check if voice exists on current browser/device
    const voiceExists = hasVoice(language);
    if (!voiceExists) {
      if (language === 'ko') {
        setVoiceNotice('이 기기에 한국어 음성이 없어요.');
      } else {
        setVoiceNotice('No English TTS voice found on this device.');
      }
    } else {
      setVoiceNotice(null);
    }
  }, [language]);

  const handleLanguageChange = (lang: 'ko' | 'en') => {
    playTap();
    setLanguage(lang);
  };

  const handleDifficultyChange = (mode: DifficultyMode) => {
    playTap();
    setDifficultyMode(mode);
  };

  const handleCategoryToggle = (cat: WordCategory) => {
    playTap();
    const result = toggleCategory(cat);
    if (!result.success && result.reason === 'min_2') {
      setCategoryNotice(
        language === 'ko'
          ? '최소 2개 이상의 카테고리가 켜져 있어야 해요.'
          : 'At least 2 categories must remain active.'
      );
      setTimeout(() => setCategoryNotice(null), 3000);
    } else {
      setCategoryNotice(null);
    }
  };

  const handleDailyLimitChange = (mins: DailyLimitMinutes) => {
    playTap();
    setDailyLimitMinutes(mins);
  };

  const handleConfirmResetStickers = () => {
    resetAllStickers();
    setShowResetConfirm(false);
  };

  const usedMinutes = Math.floor(usedSecondsToday / 60);

  return (
    <div className="w-full h-full min-h-screen flex flex-col p-4 sm:p-6 max-w-2xl mx-auto pb-20 select-none">
      {/* Top Header */}
      <header className="w-full flex items-center justify-between mb-6">
        <button
          type="button"
          onClick={() => {
            playTap();
            setScreen('home');
          }}
          aria-label="Home"
          className="w-12 h-12 rounded-full bg-white border-2 border-slate-200 shadow-xs flex items-center justify-center text-slate-700 active:scale-95 transition-transform cursor-pointer"
        >
          <Home className="w-6 h-6 stroke-[2.2]" />
        </button>

        <h1 className="text-xl font-black text-slate-800">
          {language === 'ko' ? '보호자 안심 설정' : 'Parent Settings'}
        </h1>

        <div className="w-12" />
      </header>

      <div className="space-y-5">
        {/* 1. Language Setting & Voice Detection Alert */}
        <section className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <label className="block text-sm font-black text-slate-800 mb-2">
            {language === 'ko' ? '학습 언어' : 'Language'}
          </label>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <button
              type="button"
              onClick={() => handleLanguageChange('ko')}
              className={`py-3 px-4 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                language === 'ko'
                  ? 'border-amber-400 bg-amber-50 text-amber-950 font-black'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span>🇰🇷 한국어</span>
              {language === 'ko' && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
            </button>

            <button
              type="button"
              onClick={() => handleLanguageChange('en')}
              className={`py-3 px-4 rounded-2xl font-bold text-sm border-2 transition-all flex items-center justify-center gap-2 cursor-pointer ${
                language === 'en'
                  ? 'border-amber-400 bg-amber-50 text-amber-950 font-black'
                  : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              <span>🇺🇸 English</span>
              {language === 'en' && <Check className="w-4 h-4 text-amber-600 stroke-[3]" />}
            </button>
          </div>

          {/* Voice Not Found Alert */}
          {voiceNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-2 text-rose-800 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{voiceNotice}</span>
            </div>
          )}
        </section>

        {/* 2. Difficulty Mode (자동 / 2개 / 3개 / 4개 고정) */}
        <section className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-1">
            <Sliders className="w-4 h-4 text-sky-600" />
            <label className="text-sm font-black text-slate-800">
              {language === 'ko' ? '난이도 설정' : 'Difficulty'}
            </label>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {language === 'ko'
              ? '자동 선택 시 아이의 정답률에 맞춰 카드가 2~4개로 부드럽게 조절됩니다.'
              : 'Auto mode adapts cards (2~4) based on child performance.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { id: 'auto', labelKo: '자동', labelEn: 'Auto', desc: '1~3단계' },
              { id: 2, labelKo: '2개 고정', labelEn: '2 Cards', desc: '1단계' },
              { id: 3, labelKo: '3개 고정', labelEn: '3 Cards', desc: '2단계' },
              { id: 4, labelKo: '4개 고정', labelEn: '4 Cards', desc: '3단계' },
            ].map((item) => {
              const isSelected = difficultyMode === item.id;
              return (
                <button
                  key={String(item.id)}
                  type="button"
                  onClick={() => handleDifficultyChange(item.id as DifficultyMode)}
                  className={`py-3 px-2 rounded-2xl border-2 transition-all flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'border-sky-400 bg-sky-50 text-sky-950 font-black shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
                  }`}
                >
                  <span className="text-sm">{language === 'ko' ? item.labelKo : item.labelEn}</span>
                  <span className="text-[11px] text-slate-400 font-normal">{item.desc}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 3. Category Toggles (At least 2 enabled) */}
        <section className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-600" />
              <label className="text-sm font-black text-slate-800">
                {language === 'ko' ? '출제 카테고리 (최소 2개)' : 'Categories (Min 2)'}
              </label>
            </div>
            <span className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
              {enabledCategories.length} / {CATEGORIES.length}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {language === 'ko'
              ? '원하는 주제만 골라 출제할 수 있습니다.'
              : 'Choose which themes appear in questions.'}
          </p>

          {/* Minimum 2 Warning Notice */}
          {categoryNotice && (
            <div className="p-2.5 mb-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-amber-900 text-xs font-bold">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{categoryNotice}</span>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {CATEGORIES.map((cat) => {
              const isEnabled = enabledCategories.includes(cat.id);
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => handleCategoryToggle(cat.id)}
                  className={`p-3 rounded-2xl border-2 font-bold text-xs flex items-center justify-between transition-all cursor-pointer ${
                    isEnabled
                      ? 'border-amber-400 bg-amber-50/90 text-amber-950 font-black shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-400 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-1.5 truncate">
                    <span>{cat.icon}</span>
                    <span className="truncate">{language === 'ko' ? cat.ko : cat.en}</span>
                  </div>
                  {isEnabled && <Check className="w-4 h-4 text-amber-600 stroke-[3] shrink-0" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Daily Usage Time Limit */}
        <section className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              <label className="text-sm font-black text-slate-800">
                {language === 'ko' ? '하루 사용 시간 제한' : 'Daily Playtime Limit'}
              </label>
            </div>
            <span className="text-xs text-slate-500 font-bold">
              {language === 'ko' ? `오늘 사용: ${usedMinutes}분` : `Used today: ${usedMinutes}m`}
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            {language === 'ko'
              ? "시간이 다 되면 현재 문제를 마친 뒤 '오늘은 여기까지! 내일 또 만나' 화면이 나타나며, 날짜가 바뀌면 자동 초기화됩니다."
              : 'When time is up, questions finish and a sleeping bedtime screen appears.'}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {[
              { mins: 0, labelKo: '제한 없음', labelEn: 'Unlimited' },
              { mins: 10, labelKo: '10분', labelEn: '10 mins' },
              { mins: 20, labelKo: '20분', labelEn: '20 mins' },
              { mins: 30, labelKo: '30분', labelEn: '30 mins' },
            ].map((item) => {
              const isSelected = dailyLimitMinutes === item.mins;
              return (
                <button
                  key={item.mins}
                  type="button"
                  onClick={() => handleDailyLimitChange(item.mins as DailyLimitMinutes)}
                  className={`py-3 px-2 rounded-2xl border-2 transition-all flex items-center justify-center cursor-pointer ${
                    isSelected
                      ? 'border-indigo-400 bg-indigo-50 text-indigo-950 font-black shadow-xs'
                      : 'border-slate-200 bg-slate-50 text-slate-600 font-bold'
                  }`}
                >
                  <span className="text-sm">{language === 'ko' ? item.labelKo : item.labelEn}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* 5. Sound & SFX Switch */}
        <section className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
            </div>
            <div>
              <span className="block text-sm font-black text-slate-800">
                {language === 'ko' ? '효과음 및 목소리' : 'Sound Effects & Voice'}
              </span>
              <span className="text-xs text-slate-500">
                {language === 'ko' ? '단어 읽어주기 및 터치 효과음' : 'Word speech and chime sounds'}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer ${
              soundEnabled ? 'bg-emerald-500' : 'bg-slate-300'
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full bg-white transition-transform ${
                soundEnabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </section>

        {/* 6. Stickers Reset Button */}
        <section className="p-5 bg-white rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="block text-sm font-black text-slate-800">
              {language === 'ko' ? '스티커판 초기화' : 'Reset Sticker Book'}
            </span>
            <span className="text-xs text-slate-500">
              {language === 'ko'
                ? `현재 모은 스티커 ${boardStickers.length}장 / 전체 ${unlockedStickers.length}장`
                : `${boardStickers.length} on current board`}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="px-4 py-2 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-black active:scale-95 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'ko' ? '초기화' : 'Reset'}</span>
          </button>
        </section>

        {/* 7. PWA Install Button */}
        <section className="p-1">
          <PWAInstallButton />
        </section>

        {/* 8. App Info & Privacy Guarantee */}
        <section className="p-5 bg-emerald-50/80 border border-emerald-200 rounded-3xl">
          <div className="flex items-center gap-2 mb-2 text-emerald-900 font-black text-sm">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <span>{language === 'ko' ? '개인정보 보호 및 안심 약속' : 'Child Privacy Guarantee'}</span>
          </div>
          <div className="space-y-1.5 text-xs text-emerald-800 leading-relaxed font-medium">
            <p>
              • {language === 'ko'
                ? '본 앱은 어떠한 개인정보, 음성, 위치, 기기 식별값도 외부 서버로 수집하거나 전송하지 않습니다.'
                : 'This app does NOT collect or transmit any personal data, voice, or identifiers.'}
            </p>
            <p>
              • {language === 'ko'
                ? '모든 학습 진행 내역과 스티커는 보호자 기기의 로컬 저장소에만 안전하게 보관됩니다.'
                : 'All game progress and stickers are stored exclusively on your device.'}
            </p>
            <p>
              • {language === 'ko'
                ? '광고, 유료 결제 유도, 외부 링크가 전혀 없는 100% 안전한 청정 유아 환경입니다.'
                : 'Zero ads, zero in-app purchases, zero external tracking.'}
            </p>
          </div>
        </section>
      </div>

      {/* Stickers Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs select-none">
          <div className="bg-white rounded-3xl border-2 border-slate-200 p-6 shadow-xl max-w-xs w-full text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-3">
              <RotateCcw className="w-6 h-6" />
            </div>
            <h3 className="text-base font-black text-slate-800 mb-1">
              {language === 'ko' ? '스티커를 모두 지울까요?' : 'Reset All Stickers?'}
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              {language === 'ko'
                ? '지금까지 모은 모든 스티커가 처음 상태로 되돌아갑니다.'
                : 'All earned stickers will be reset to empty.'}
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="py-2.5 rounded-xl bg-slate-100 font-bold text-xs text-slate-600 cursor-pointer"
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleConfirmResetStickers}
                className="py-2.5 rounded-xl bg-rose-500 font-bold text-xs text-white cursor-pointer"
              >
                {language === 'ko' ? '초기화' : 'Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
