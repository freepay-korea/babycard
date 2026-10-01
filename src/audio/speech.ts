/**
 * src/audio/speech.ts
 * 
 * Hybrid text-to-speech manager:
 * - On Native Android (Capacitor): uses @capacitor-community/text-to-speech plugin
 *   (solving the known Android WebView Web Speech API limitation)
 * - On Web / PWA: uses Web Speech API (speechSynthesis)
 * - Rate: ~0.8, pitch: 1.1 for warm, gentle toddler pronunciation
 * - unlockAudio() helper for iOS/Safari audio context enablement
 */

import { Capacitor } from '@capacitor/core';
import { TextToSpeech } from '@capacitor-community/text-to-speech';
import { parentVoiceStorage } from './parentVoiceStorage';
import { useAppStore } from '../store/useAppStore';
import { PRAISE_ITEMS, getRandomDefaultPraise } from '../data/praise';

export type SupportedLanguage = 'ko' | 'en';

class ToddlerSpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;

  constructor() {
    this.initVoices();
    this.initParentVoiceCache();
  }

  private async initParentVoiceCache(): Promise<void> {
    try {
      const ids = await parentVoiceStorage.initCache();
      useAppStore.getState().setRecordedVoiceIds(ids);
    } catch (e) {
      console.warn('Parent voice cache init failed:', e);
    }
  }

  private initVoices(): void {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      return;
    }

    const loadVoices = () => {
      this.voices = window.speechSynthesis.getVoices();
      if (this.voices.length > 0) {
        this.isInitialized = true;
      }
    };

    loadVoices();

    if ('onvoiceschanged' in window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = () => {
        loadVoices();
      };
    }
  }

  public getVoice(lang: SupportedLanguage): SpeechSynthesisVoice | null {
    if (!this.isInitialized || this.voices.length === 0) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        this.voices = window.speechSynthesis.getVoices();
      }
    }

    const langPrefix = lang === 'ko' ? 'ko' : 'en';
    const langCode = lang === 'ko' ? 'ko-kr' : 'en-us';

    const candidates = this.voices.filter((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(langPrefix)
    );

    if (candidates.length === 0) {
      return null;
    }

    const scoreVoice = (voice: SpeechSynthesisVoice): number => {
      const name = voice.name.toLowerCase();
      const code = voice.lang.toLowerCase().replace('_', '-');
      let score = 0;

      if (code === langCode) score += 10;

      if (lang === 'ko') {
        if (name.includes('google')) score += 50;
        if (name.includes('yuna')) score += 40;
        if (name.includes('natural')) score += 35;
        if (name.includes('heami') || name.includes('sora')) score += 20;
      } else {
        if (name.includes('samantha')) score += 50;
        if (name.includes('google')) score += 45;
        if (name.includes('natural')) score += 40;
        if (name.includes('karen') || name.includes('jenny')) score += 30;
      }

      if (voice.default) score += 5;
      return score;
    };

    candidates.sort((a, b) => scoreVoice(b) - scoreVoice(a));
    return candidates[0] || null;
  }

  public hasVoice(lang: SupportedLanguage): boolean {
    if (Capacitor.isNativePlatform()) {
      return true; // Android native TTS is available on device
    }
    return this.getVoice(lang) !== null;
  }

  /**
   * Play parent voice recording directly from cache
   */
  public async playParentVoice(wordId: string): Promise<boolean> {
    const audioUrl = parentVoiceStorage.getVoiceUrl(wordId);
    if (!audioUrl) return false;

    return new Promise((resolve) => {
      try {
        if (this.currentAudioElement) {
          this.currentAudioElement.pause();
          this.currentAudioElement = null;
        }

        const audio = new Audio(audioUrl);
        this.currentAudioElement = audio;

        let finished = false;
        const done = (success: boolean) => {
          if (!finished) {
            finished = true;
            this.currentAudioElement = null;
            resolve(success);
          }
        };

        audio.onended = () => done(true);
        audio.onerror = () => done(false);

        // Max 5s fallback in case of audio stall
        setTimeout(() => done(true), 5000);

        audio.play().catch((err) => {
          console.warn('Audio play error:', err);
          done(false);
        });
      } catch (err) {
        console.warn('Parent voice play failed:', err);
        resolve(false);
      }
    });
  }

  /**
   * Speak text: automatically checks parent voice first (if enabled), then Native Android TTS, then Web Speech API
   */
  public async speak(text: string, lang: SupportedLanguage = 'ko', wordId?: string): Promise<void> {
    // 0. Check parent voice recording priority
    const storeState = useAppStore.getState();
    if (storeState.parentVoiceEnabled && wordId && parentVoiceStorage.hasVoice(wordId)) {
      const played = await this.playParentVoice(wordId);
      if (played) {
        return;
      }
    }

    // 1. Native Android / iOS via Capacitor Plugin
    if (Capacitor.isNativePlatform()) {
      try {
        await TextToSpeech.stop();
        await TextToSpeech.speak({
          text,
          lang: lang === 'ko' ? 'ko-KR' : 'en-US',
          rate: 0.85,
          pitch: 1.1,
          volume: 1.0,
          category: 'ambient',
        });
        return;
      } catch (err) {
        console.warn('Capacitor TextToSpeech error, falling back to Web Speech:', err);
      }
    }

    // 2. Web / PWA browser environment (Web Speech API)
    return new Promise((resolve) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        resolve();
        return;
      }

      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }

        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
        utterance.rate = 0.8;
        utterance.pitch = 1.1;

        const bestVoice = this.getVoice(lang);
        if (bestVoice) {
          utterance.voice = bestVoice;
        }

        this.activeUtterance = utterance;

        let resolved = false;
        const finish = () => {
          if (!resolved) {
            resolved = true;
            this.activeUtterance = null;
            resolve();
          }
        };

        utterance.onend = finish;
        utterance.onerror = () => {
          finish();
        };

        const timeoutDuration = Math.max(2000, text.length * 600);
        setTimeout(finish, timeoutDuration);

        window.speechSynthesis.speak(utterance);

        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        this.activeUtterance = null;
        resolve();
      }
    });
  }

  public unlockAudio(): void {
    if (typeof window === 'undefined') return;

    if (!Capacitor.isNativePlatform() && 'speechSynthesis' in window) {
      try {
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
        window.speechSynthesis.cancel();
        const silentUtterance = new SpeechSynthesisUtterance(' ');
        silentUtterance.volume = 0.01;
        silentUtterance.rate = 2.0;
        this.activeUtterance = silentUtterance;
        silentUtterance.onend = () => {
          this.activeUtterance = null;
        };
        window.speechSynthesis.speak(silentUtterance);
      } catch {
        // Ignore failure
      }
    }

    try {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        const dummyCtx = new AudioCtxClass();
        if (dummyCtx.state === 'suspended') {
          dummyCtx.resume();
        }
      }
    } catch {
      // Ignore failure
    }
  }

  public getAllVoices(): SpeechSynthesisVoice[] {
    return this.voices;
  }
}

export const toddlerSpeech = new ToddlerSpeechService();

export const speak = (text: string, lang: SupportedLanguage = 'ko', wordId?: string) =>
  toddlerSpeech.speak(text, lang, wordId);
export const playParentVoice = (wordId: string) => toddlerSpeech.playParentVoice(wordId);
export const unlockAudio = () => toddlerSpeech.unlockAudio();
export const hasVoice = (lang: SupportedLanguage) => toddlerSpeech.hasVoice(lang);

export const playPraiseVoice = async (wordText: string, lang: SupportedLanguage = 'ko'): Promise<void> => {
  const storeState = useAppStore.getState();

  // 1. If parent voice is enabled, check if any custom praise recording exists
  if (storeState.parentVoiceEnabled) {
    const recordedPraiseIds = PRAISE_ITEMS
      .map((p) => p.id)
      .filter((id) => parentVoiceStorage.hasVoice(id));

    if (recordedPraiseIds.length > 0) {
      // Pick a random recorded parent praise
      const randomId = recordedPraiseIds[Math.floor(Math.random() * recordedPraiseIds.length)];
      const played = await toddlerSpeech.playParentVoice(randomId);
      if (played) {
        return;
      }
    }
  }

  // 2. Default TTS praise
  const praiseText = getRandomDefaultPraise(wordText, lang);
  await toddlerSpeech.speak(praiseText, lang);
};

