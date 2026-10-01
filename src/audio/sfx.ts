/**
 * src/audio/sfx.ts
 * 
 * Sound Effects Manager using Howler:
 * - 4 SFX sounds: correct (딩동댕), tap (뿅), cheer (박수), wobble (뽀용)
 * - Assumes audio files reside in public/sfx/{name}.mp3 or {name}.wav
 * - SFX volume set to 0.5 (softer than TTS so speech remains distinct)
 * - Includes Web Audio synthesizer fallbacks so sound is always audible even if audio files are not yet uploaded
 * - Integrates with unlockAudio for iOS/Safari audio context
 */

import { Howl, Howler } from 'howler';

const SFX_VOLUME = 0.5;

// Synthesizer fallback using Web Audio API when MP3/WAV files are not found
function playSynthesizedFallback(type: 'correct' | 'tap' | 'cheer' | 'wobble') {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = Howler.ctx || new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const now = ctx.currentTime;

    if (type === 'tap') {
      // 뿅 (Soft rising bubble pop)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(450, now);
      osc.frequency.exponentialRampToValueAtTime(900, now + 0.08);

      gain.gain.setValueAtTime(0.18 * SFX_VOLUME, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.12);
    } else if (type === 'correct') {
      // 딩동댕 (3-tone ascending bright chime: C5 -> E5 -> G5)
      const notes = [523.25, 659.25, 783.99];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25 * SFX_VOLUME, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } else if (type === 'cheer') {
      // 박수/환호 (Sparkling cascade + warm harmonic wash)
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.2 * SFX_VOLUME, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.45);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.45);
      });
    } else if (type === 'wobble') {
      // 뽀용 (Gentle bouncy spring wobble)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(560, now + 0.09);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.18);
      osc.frequency.exponentialRampToValueAtTime(420, now + 0.25);

      gain.gain.setValueAtTime(0.2 * SFX_VOLUME, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.28);
    }
  } catch {
    // Ignore audio context error
  }
}

class ToddlerSFXService {
  private correctHowl: Howl | null = null;
  private tapHowl: Howl | null = null;
  private cheerHowl: Howl | null = null;
  private wobbleHowl: Howl | null = null;

  constructor() {
    this.initHowls();
  }

  private initHowls() {
    // 1. correct (딩동댕)
    this.correctHowl = new Howl({
      src: ['/sfx/correct.mp3', '/sfx/correct.wav'],
      volume: SFX_VOLUME,
      preload: true,
      onloaderror: () => {
        // Fallback to synth if file not loaded
      },
    });

    // 2. tap (뿅)
    this.tapHowl = new Howl({
      src: ['/sfx/tap.mp3', '/sfx/tap.wav'],
      volume: SFX_VOLUME,
      preload: true,
      onloaderror: () => {
        // Fallback
      },
    });

    // 3. cheer (박수)
    this.cheerHowl = new Howl({
      src: ['/sfx/cheer.mp3', '/sfx/cheer.wav'],
      volume: SFX_VOLUME,
      preload: true,
      onloaderror: () => {
        // Fallback
      },
    });

    // 4. wobble (뽀용)
    this.wobbleHowl = new Howl({
      src: ['/sfx/wobble.mp3', '/sfx/wobble.wav'],
      volume: SFX_VOLUME,
      preload: true,
      onloaderror: () => {
        // Fallback
      },
    });
  }

  /**
   * 딩동댕 - 정답 시 경쾌한 종소리
   */
  public playCorrect(): void {
    if (this.correctHowl && this.correctHowl.state() === 'loaded') {
      this.correctHowl.play();
    } else {
      playSynthesizedFallback('correct');
    }
  }

  /**
   * 뿅 - 카드나 버튼을 톡 누를 때의 부드러운 방울소리
   */
  public playTap(): void {
    if (this.tapHowl && this.tapHowl.state() === 'loaded') {
      this.tapHowl.play();
    } else {
      playSynthesizedFallback('tap');
    }
  }

  /**
   * 박수 - 축하 시 터지는 환호/박수음
   */
  public playCheer(): void {
    if (this.cheerHowl && this.cheerHowl.state() === 'loaded') {
      this.cheerHowl.play();
    } else {
      playSynthesizedFallback('cheer');
    }
  }

  /**
   * 뽀용 - 살짝 갸웃거리거나 틀렸을 때의 장난스러운 스프링 음 (절대 부정적이지 않음)
   */
  public playWobble(): void {
    if (this.wobbleHowl && this.wobbleHowl.state() === 'loaded') {
      this.wobbleHowl.play();
    } else {
      playSynthesizedFallback('wobble');
    }
  }

  /**
   * Howler AudioContext unlock for iOS/Safari
   */
  public unlock(): void {
    try {
      if (Howler.ctx && Howler.ctx.state === 'suspended') {
        Howler.ctx.resume();
      }
    } catch {
      // Ignore
    }
  }
}

export const sfx = new ToddlerSFXService();

// Export convenience functions matching the brief
export const playCorrect = () => sfx.playCorrect();
export const playTap = () => sfx.playTap();
export const playCheer = () => sfx.playCheer();
export const playWobble = () => sfx.playWobble();
