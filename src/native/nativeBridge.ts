import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';
import { App as CapApp } from '@capacitor/app';
import { useAppStore } from '../store/useAppStore';

/**
 * Initializes native Android / PWA app behaviors:
 * 1. Screen Wake Lock (화면 꺼짐 방지)
 * 2. Status Bar Hide (상태바 숨김 - 전체 화면 몰입)
 * 3. Back Button Navigation (뒤로가기 시 항상 홈 화면으로 이동, 앱 종료 방지)
 */
export async function initNativeBridge(): Promise<void> {
  // 1. Keep Screen Awake (Web Screen Wake Lock API)
  enableScreenWakeLock();

  // 2. Native Capacitor App features
  if (Capacitor.isNativePlatform()) {
    try {
      // Hide status bar for toddler immersion
      await StatusBar.hide();
    } catch (err) {
      console.warn('StatusBar.hide error:', err);
    }

    try {
      // Android Hardware Back Button: always navigates to 'home'
      CapApp.addListener('backButton', () => {
        const state = useAppStore.getState();
        if (state.screen !== 'home') {
          state.setScreen('home');
        }
      });
    } catch (err) {
      console.warn('CapApp backButton listener error:', err);
    }
  } else {
    // 3. Web browser popstate handling: prevent accidental page exit
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', window.location.href);
      window.addEventListener('popstate', () => {
        window.history.pushState(null, '', window.location.href);
        const state = useAppStore.getState();
        if (state.screen !== 'home') {
          state.setScreen('home');
        }
      });
    }
  }
}

/**
 * Screen Wake Lock API implementation:
 * Keeps the screen on while the toddler is playing
 */
async function enableScreenWakeLock() {
  if (typeof navigator === 'undefined' || !('wakeLock' in navigator)) {
    return;
  }

  let wakeLockSentinel: any = null;

  const requestLock = async () => {
    try {
      wakeLockSentinel = await (navigator as any).wakeLock.request('screen');
    } catch {
      // Ignore if device battery saver denies wake lock
    }
  };

  await requestLock();

  // Re-acquire lock if app returns to foreground
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && !wakeLockSentinel) {
      requestLock();
    }
  });
}
