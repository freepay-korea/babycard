import { Howl } from 'howler';

/**
 * Audio manager tailored for toddlers (2-4 yo):
 * - Gentle positive chimes (synthesized Web Audio or Howl)
 * - TTS speech reader for Korean & English
 * - Absolutely NO negative buzzers, failure chimes, or harsh sounds.
 */

class ToddlerAudioService {
  private audioCtx: AudioContext | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Gentle, soft bubble pop when toddler taps any card or button
   */
  public playSoftTap(): void {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      // Pitch drop creates cute bubble pop
      osc.frequency.setValueAtTime(420, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.08);

      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } catch {
      // AudioContext may be restricted before user gesture
    }
  }

  /**
   * Joyful sparkling harmonic chime for celebrations
   */
  public playSparkle(): void {
    try {
      const ctx = this.getAudioContext();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const startTime = ctx.currentTime + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, startTime);

        gain.gain.setValueAtTime(0.12, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.35);
      });
    } catch {
      // AudioContext fallback
    }
  }

  /**
   * Speak word using browser Web Speech API (offline, zero data collection)
   */
  public speak(text: string, lang: 'ko' | 'en' = 'ko'): void {
    if (!('speechSynthesis' in window)) return;

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'ko' ? 'ko-KR' : 'en-US';
      utterance.rate = 0.85; // Slightly slower, clearer tempo for toddlers
      utterance.pitch = 1.25; // Gentle, warmer and friendly pitch

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis not available', e);
    }
  }
}

export const toddlerAudio = new ToddlerAudioService();
