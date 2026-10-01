export type WordCategory = 'animal' | 'food' | 'vehicle' | 'body' | 'item' | 'nature';

export interface WordItem {
  id: string;
  category: WordCategory;
  ko: string;
  en: string;
  image: string;
  emoji: string; // 그림 파일이 없을 때 보여줄 대체 이모지
}

export const CATEGORIES: { id: WordCategory; ko: string; en: string; icon: string }[] = [
  { id: 'animal', ko: '동물', en: 'Animals', icon: '🐶' },
  { id: 'food', ko: '음식', en: 'Food', icon: '🍎' },
  { id: 'vehicle', ko: '탈것', en: 'Vehicles', icon: '🚗' },
  { id: 'body', ko: '몸', en: 'Body', icon: '👀' },
  { id: 'item', ko: '물건', en: 'Items', icon: '⚽' },
  { id: 'nature', ko: '자연', en: 'Nature', icon: '☀️' },
];

export const WORDS: WordItem[] = [
  // 1. 동물 (Animals) - 7개
  {
    id: 'dog',
    category: 'animal',
    ko: '강아지',
    en: 'dog',
    image: '/images/dog.png',
    emoji: '🐶',
  },
  {
    id: 'cat',
    category: 'animal',
    ko: '고양이',
    en: 'cat',
    image: '/images/cat.png',
    emoji: '🐱',
  },
  {
    id: 'rabbit',
    category: 'animal',
    ko: '토끼',
    en: 'rabbit',
    image: '/images/rabbit.png',
    emoji: '🐰',
  },
  {
    id: 'bear',
    category: 'animal',
    ko: '곰',
    en: 'bear',
    image: '/images/bear.png',
    emoji: '🐻',
  },
  {
    id: 'lion',
    category: 'animal',
    ko: '사자',
    en: 'lion',
    image: '/images/lion.png',
    emoji: '🦁',
  },
  {
    id: 'elephant',
    category: 'animal',
    ko: '코끼리',
    en: 'elephant',
    image: '/images/elephant.png',
    emoji: '🐘',
  },
  {
    id: 'fish',
    category: 'animal',
    ko: '물고기',
    en: 'fish',
    image: '/images/fish.png',
    emoji: '🐟',
  },

  // 2. 음식 (Food) - 7개
  {
    id: 'apple',
    category: 'food',
    ko: '사과',
    en: 'apple',
    image: '/images/apple.png',
    emoji: '🍎',
  },
  {
    id: 'banana',
    category: 'food',
    ko: '바나나',
    en: 'banana',
    image: '/images/banana.png',
    emoji: '🍌',
  },
  {
    id: 'strawberry',
    category: 'food',
    ko: '딸기',
    en: 'strawberry',
    image: '/images/strawberry.png',
    emoji: '🍓',
  },
  {
    id: 'grapes',
    category: 'food',
    ko: '포도',
    en: 'grapes',
    image: '/images/grapes.png',
    emoji: '🍇',
  },
  {
    id: 'watermelon',
    category: 'food',
    ko: '수박',
    en: 'watermelon',
    image: '/images/watermelon.png',
    emoji: '🍉',
  },
  {
    id: 'milk',
    category: 'food',
    ko: '우유',
    en: 'milk',
    image: '/images/milk.png',
    emoji: '🥛',
  },
  {
    id: 'bread',
    category: 'food',
    ko: '빵',
    en: 'bread',
    image: '/images/bread.png',
    emoji: '🍞',
  },

  // 3. 탈것 (Vehicles) - 7개
  {
    id: 'car',
    category: 'vehicle',
    ko: '자동차',
    en: 'car',
    image: '/images/car.png',
    emoji: '🚗',
  },
  {
    id: 'bus',
    category: 'vehicle',
    ko: '버스',
    en: 'bus',
    image: '/images/bus.png',
    emoji: '🚌',
  },
  {
    id: 'train',
    category: 'vehicle',
    ko: '기차',
    en: 'train',
    image: '/images/train.png',
    emoji: '🚂',
  },
  {
    id: 'airplane',
    category: 'vehicle',
    ko: '비행기',
    en: 'airplane',
    image: '/images/airplane.png',
    emoji: '✈️',
  },
  {
    id: 'ship',
    category: 'vehicle',
    ko: '배',
    en: 'ship',
    image: '/images/ship.png',
    emoji: '🚢',
  },
  {
    id: 'bicycle',
    category: 'vehicle',
    ko: '자전거',
    en: 'bicycle',
    image: '/images/bicycle.png',
    emoji: '🚲',
  },
  {
    id: 'fire_truck',
    category: 'vehicle',
    ko: '소방차',
    en: 'fire truck',
    image: '/images/fire_truck.png',
    emoji: '🚒',
  },

  // 4. 몸 (Body) - 7개
  {
    id: 'eye',
    category: 'body',
    ko: '눈',
    en: 'eye',
    image: '/images/eye.png',
    emoji: '👁️',
  },
  {
    id: 'nose',
    category: 'body',
    ko: '코',
    en: 'nose',
    image: '/images/nose.png',
    emoji: '👃',
  },
  {
    id: 'mouth',
    category: 'body',
    ko: '입',
    en: 'mouth',
    image: '/images/mouth.png',
    emoji: '👄',
  },
  {
    id: 'ear',
    category: 'body',
    ko: '귀',
    en: 'ear',
    image: '/images/ear.png',
    emoji: '👂',
  },
  {
    id: 'hand',
    category: 'body',
    ko: '손',
    en: 'hand',
    image: '/images/hand.png',
    emoji: '🖐️',
  },
  {
    id: 'foot',
    category: 'body',
    ko: '발',
    en: 'foot',
    image: '/images/foot.png',
    emoji: '🦶',
  },
  {
    id: 'hair',
    category: 'body',
    ko: '머리카락',
    en: 'hair',
    image: '/images/hair.png',
    emoji: '💇',
  },

  // 5. 물건 (Items) - 7개
  {
    id: 'ball',
    category: 'item',
    ko: '공',
    en: 'ball',
    image: '/images/ball.png',
    emoji: '⚽',
  },
  {
    id: 'book',
    category: 'item',
    ko: '책',
    en: 'book',
    image: '/images/book.png',
    emoji: '📖',
  },
  {
    id: 'shoe',
    category: 'item',
    ko: '신발',
    en: 'shoe',
    image: '/images/shoe.png',
    emoji: '👟',
  },
  {
    id: 'hat',
    category: 'item',
    ko: '모자',
    en: 'hat',
    image: '/images/hat.png',
    emoji: '🧢',
  },
  {
    id: 'toothbrush',
    category: 'item',
    ko: '칫솔',
    en: 'toothbrush',
    image: '/images/toothbrush.png',
    emoji: '🪥',
  },
  {
    id: 'umbrella',
    category: 'item',
    ko: '우산',
    en: 'umbrella',
    image: '/images/umbrella.png',
    emoji: '☂️',
  },
  {
    id: 'clock',
    category: 'item',
    ko: '시계',
    en: 'clock',
    image: '/images/clock.png',
    emoji: '⏰',
  },

  // 6. 자연 (Nature) - 7개
  {
    id: 'sun',
    category: 'nature',
    ko: '해',
    en: 'sun',
    image: '/images/sun.png',
    emoji: '☀️',
  },
  {
    id: 'moon',
    category: 'nature',
    ko: '달',
    en: 'moon',
    image: '/images/moon.png',
    emoji: '🌙',
  },
  {
    id: 'star',
    category: 'nature',
    ko: '별',
    en: 'star',
    image: '/images/star.png',
    emoji: '⭐',
  },
  {
    id: 'flower',
    category: 'nature',
    ko: '꽃',
    en: 'flower',
    image: '/images/flower.png',
    emoji: '🌸',
  },
  {
    id: 'tree',
    category: 'nature',
    ko: '나무',
    en: 'tree',
    image: '/images/tree.png',
    emoji: '🌳',
  },
  {
    id: 'rain',
    category: 'nature',
    ko: '비',
    en: 'rain',
    image: '/images/rain.png',
    emoji: '🌧️',
  },
  {
    id: 'snowman',
    category: 'nature',
    ko: '눈사람',
    en: 'snowman',
    image: '/images/snowman.png',
    emoji: '⛄',
  },
];

// Helper to look up a word by id
export const getWordById = (id: string): WordItem | undefined => {
  return WORDS.find((w) => w.id === id);
};

// Helper to get words by category
export const getWordsByCategory = (category: WordCategory): WordItem[] => {
  return WORDS.filter((w) => w.category === category);
};
