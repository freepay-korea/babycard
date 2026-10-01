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

export type SupportedLanguage = 'ko' | 'en';

class ToddlerSpeechService {
  private voices: SpeechSynthesisVoice[] = [];
  private isInitialized = false;
  private activeUtterance: SpeechSynthesisUtterance | null = null;

  constructor() {
    this.initVoices();
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
   * Speak text: automatically chooses between Native Android TTS and Web Speech API
   */
  public async speak(text: string, lang: SupportedLanguage = 'ko'): Promise<void> {
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

export const speak = (text: string, lang: SupportedLanguage = 'ko') => toddlerSpeech.speak(text, lang);
export const unlockAudio = () => toddlerSpeech.unlockAudio();
export const hasVoice = (lang: SupportedLanguage) => toddlerSpeech.hasVoice(lang);
