/**
 * src/data/praise.ts
 * 
 * Praise voice configuration and default strings for correct answers.
 */

export interface PraiseItem {
  id: string;
  title: string;
  icon: string;
  guideKo: string;
  guideEn: string;
  defaultTextKo: string;
  defaultTextEn: string;
}

export const PRAISE_ITEMS: PraiseItem[] = [
  {
    id: 'praise_1',
    title: '칭찬 1',
    icon: '🎉',
    guideKo: '"딩동댕! 정말 잘했어!"',
    guideEn: '"Ding-dong! Great job!"',
    defaultTextKo: '딩동댕! 정말 잘했어!',
    defaultTextEn: 'Ding-dong! Great job!',
  },
  {
    id: 'praise_2',
    title: '칭찬 2',
    icon: '⭐',
    guideKo: '"우와! 우리 아기 최고야!"',
    guideEn: '"Wow! You are the best!"',
    defaultTextKo: '우와! 우리 아기 최고야!',
    defaultTextEn: 'Wow! You are the best!',
  },
  {
    id: 'praise_3',
    title: '칭찬 3',
    icon: '👏',
    guideKo: '"맞았어! 너무너무 멋지다!"',
    guideEn: '"That\'s right! Awesome!"',
    defaultTextKo: '맞았어! 너무너무 멋지다!',
    defaultTextEn: 'That\'s right! Awesome!',
  },
  {
    id: 'praise_4',
    title: '칭찬 4',
    icon: '💖',
    guideKo: '"정답이야! 엄마 아빠가 사랑해~"',
    guideEn: '"Correct! We love you so much~"',
    defaultTextKo: '정답이야! 엄마 아빠가 사랑해~',
    defaultTextEn: 'Correct! We love you so much~',
  },
];

export function getRandomDefaultPraise(wordText: string, lang: 'ko' | 'en'): string {
  if (lang === 'ko') {
    const phrases = [
      `딩동댕! ${wordText}! 정말 잘했어!`,
      `우와! ${wordText}! 최고야!`,
      `맞았어! ${wordText}!`,
      `참 잘했어요!`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  } else {
    const phrases = [
      `Great job! ${wordText}!`,
      `Awesome! ${wordText}!`,
      `That's right! ${wordText}!`,
      `You did it!`,
    ];
    return phrases[Math.floor(Math.random() * phrases.length)];
  }
}
