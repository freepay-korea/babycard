import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Share, X } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const { language } = useAppStore();

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-amber-950 font-black text-xs shadow-sm flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
      >
        <Download className="w-4 h-4 stroke-[2.5]" />
        <span>{language === 'ko' ? '홈 화면에 앱 설치하기 (오프라인 지원)' : 'Install App to Home Screen'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="w-full py-3.5 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 transition-all"
        >
          <Share className="w-4 h-4 text-sky-600" />
          <span>{language === 'ko' ? '아이폰/아이패드 홈 화면에 추가' : 'Add to iPhone / iPad Home Screen'}</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 select-none">
            <div className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl relative text-left">
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-base font-black text-slate-900 mb-2">
                {language === 'ko' ? '홈 화면에 추가하는 방법' : 'Install on iPhone / iPad'}
              </h3>
              <div className="text-xs text-slate-600 space-y-2 mb-4 leading-relaxed">
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[11px] shrink-0">1</span>
                  <span>{language === 'ko' ? 'Safari 하단의 [공유] 버튼(네모 위 화살표)을 터치합니다.' : 'Tap the Share button in Safari.'}</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[11px] shrink-0">2</span>
                  <span>{language === 'ko' ? '메뉴에서 [홈 화면에 추가]를 선택합니다.' : 'Scroll and tap "Add to Home Screen".'}</span>
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-3 rounded-2xl bg-amber-400 text-amber-950 font-black text-xs cursor-pointer"
              >
                {language === 'ko' ? '확인' : 'Got it'}
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
