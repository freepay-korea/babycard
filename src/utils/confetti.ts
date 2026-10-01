import confetti from 'canvas-confetti';

export function fireToddlerConfetti() {
  try {
    confetti({
      particleCount: 50,
      spread: 80,
      origin: { y: 0.55 },
      colors: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#FF8E72', '#A8E6CF', '#DED2F9'],
      ticks: 180,
      gravity: 0.7,
      scalar: 1.2,
      disableForReducedMotion: true,
    });
  } catch (err) {
    console.warn('Confetti trigger failed:', err);
  }
}
