/**
 * scripts/fetch-images.mjs
 * 
 * Downloads 42 Microsoft Fluent UI 3D Emoji PNG images (MIT License)
 * from github.com/microsoft/fluentui-emoji and saves them into public/images/{id}.png.
 * 
 * Usage:
 *   node scripts/fetch-images.mjs
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TARGET_DIR = path.resolve(__dirname, '../public/images');

// Base URL for raw assets on main branch of microsoft/fluentui-emoji
const BASE_URL = 'https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets';

export const EMOJI_MAPPING = [
  // 1. 동물 (Animals)
  {
    id: 'dog',
    ko: '강아지',
    en: 'dog',
    folder: 'Dog face',
    file: 'dog_face_3d.png',
    path: 'Dog face/3D/dog_face_3d.png',
  },
  {
    id: 'cat',
    ko: '고양이',
    en: 'cat',
    folder: 'Cat face',
    file: 'cat_face_3d.png',
    path: 'Cat face/3D/cat_face_3d.png',
  },
  {
    id: 'rabbit',
    ko: '토끼',
    en: 'rabbit',
    folder: 'Rabbit face',
    file: 'rabbit_face_3d.png',
    path: 'Rabbit face/3D/rabbit_face_3d.png',
  },
  {
    id: 'bear',
    ko: '곰',
    en: 'bear',
    folder: 'Bear',
    file: 'bear_3d.png',
    path: 'Bear/3D/bear_3d.png',
  },
  {
    id: 'lion',
    ko: '사자',
    en: 'lion',
    folder: 'Lion',
    file: 'lion_3d.png',
    path: 'Lion/3D/lion_3d.png',
  },
  {
    id: 'elephant',
    ko: '코끼리',
    en: 'elephant',
    folder: 'Elephant',
    file: 'elephant_3d.png',
    path: 'Elephant/3D/elephant_3d.png',
  },
  {
    id: 'fish',
    ko: '물고기',
    en: 'fish',
    folder: 'Fish',
    file: 'fish_3d.png',
    path: 'Fish/3D/fish_3d.png',
  },

  // 2. 음식 (Food)
  {
    id: 'apple',
    ko: '사과',
    en: 'apple',
    folder: 'Red apple',
    file: 'red_apple_3d.png',
    path: 'Red apple/3D/red_apple_3d.png',
  },
  {
    id: 'banana',
    ko: '바나나',
    en: 'banana',
    folder: 'Banana',
    file: 'banana_3d.png',
    path: 'Banana/3D/banana_3d.png',
  },
  {
    id: 'strawberry',
    ko: '딸기',
    en: 'strawberry',
    folder: 'Strawberry',
    file: 'strawberry_3d.png',
    path: 'Strawberry/3D/strawberry_3d.png',
  },
  {
    id: 'grapes',
    ko: '포도',
    en: 'grapes',
    folder: 'Grapes',
    file: 'grapes_3d.png',
    path: 'Grapes/3D/grapes_3d.png',
  },
  {
    id: 'watermelon',
    ko: '수박',
    en: 'watermelon',
    folder: 'Watermelon',
    file: 'watermelon_3d.png',
    path: 'Watermelon/3D/watermelon_3d.png',
  },
  {
    id: 'milk',
    ko: '우유',
    en: 'milk',
    folder: 'Glass of milk',
    file: 'glass_of_milk_3d.png',
    path: 'Glass of milk/3D/glass_of_milk_3d.png',
  },
  {
    id: 'bread',
    ko: '빵',
    en: 'bread',
    folder: 'Bread',
    file: 'bread_3d.png',
    path: 'Bread/3D/bread_3d.png',
  },

  // 3. 탈것 (Vehicles)
  {
    id: 'car',
    ko: '자동차',
    en: 'car',
    folder: 'Automobile',
    file: 'automobile_3d.png',
    path: 'Automobile/3D/automobile_3d.png',
  },
  {
    id: 'bus',
    ko: '버스',
    en: 'bus',
    folder: 'Bus',
    file: 'bus_3d.png',
    path: 'Bus/3D/bus_3d.png',
  },
  {
    id: 'train',
    ko: '기차',
    en: 'train',
    folder: 'Locomotive',
    file: 'locomotive_3d.png',
    path: 'Locomotive/3D/locomotive_3d.png',
  },
  {
    id: 'airplane',
    ko: '비행기',
    en: 'airplane',
    folder: 'Airplane',
    file: 'airplane_3d.png',
    path: 'Airplane/3D/airplane_3d.png',
  },
  {
    id: 'ship',
    ko: '배',
    en: 'ship',
    folder: 'Ship',
    file: 'ship_3d.png',
    path: 'Ship/3D/ship_3d.png',
  },
  {
    id: 'bicycle',
    ko: '자전거',
    en: 'bicycle',
    folder: 'Bicycle',
    file: 'bicycle_3d.png',
    path: 'Bicycle/3D/bicycle_3d.png',
  },
  {
    id: 'fire_truck',
    ko: '소방차',
    en: 'fire truck',
    folder: 'Fire engine',
    file: 'fire_engine_3d.png',
    path: 'Fire engine/3D/fire_engine_3d.png',
  },

  // 4. 몸 (Body)
  {
    id: 'eye',
    ko: '눈',
    en: 'eye',
    folder: 'Eye',
    file: 'eye_3d.png',
    path: 'Eye/3D/eye_3d.png',
  },
  {
    id: 'nose',
    ko: '코',
    en: 'nose',
    folder: 'Nose',
    file: 'nose_3d_default.png',
    path: 'Nose/Default/3D/nose_3d_default.png',
  },
  {
    id: 'mouth',
    ko: '입',
    en: 'mouth',
    folder: 'Mouth',
    file: 'mouth_3d.png',
    path: 'Mouth/3D/mouth_3d.png',
  },
  {
    id: 'ear',
    ko: '귀',
    en: 'ear',
    folder: 'Ear',
    file: 'ear_3d_default.png',
    path: 'Ear/Default/3D/ear_3d_default.png',
  },
  {
    id: 'hand',
    ko: '손',
    en: 'hand',
    folder: 'Hand with fingers splayed',
    file: 'hand_with_fingers_splayed_3d_default.png',
    path: 'Hand with fingers splayed/Default/3D/hand_with_fingers_splayed_3d_default.png',
  },
  {
    id: 'foot',
    ko: '발',
    en: 'foot',
    folder: 'Foot',
    file: 'foot_3d_default.png',
    path: 'Foot/Default/3D/foot_3d_default.png',
  },
  {
    id: 'hair',
    ko: '머리카락',
    en: 'hair',
    folder: 'Person curly hair',
    file: 'person_curly_hair_3d_default.png',
    path: 'Person curly hair/Default/3D/person_curly_hair_3d_default.png',
  },

  // 5. 물건 (Items)
  {
    id: 'ball',
    ko: '공',
    en: 'ball',
    folder: 'Soccer ball',
    file: 'soccer_ball_3d.png',
    path: 'Soccer ball/3D/soccer_ball_3d.png',
  },
  {
    id: 'book',
    ko: '책',
    en: 'book',
    folder: 'Open book',
    file: 'open_book_3d.png',
    path: 'Open book/3D/open_book_3d.png',
  },
  {
    id: 'shoe',
    ko: '신발',
    en: 'shoe',
    folder: 'Running shoe',
    file: 'running_shoe_3d.png',
    path: 'Running shoe/3D/running_shoe_3d.png',
  },
  {
    id: 'hat',
    ko: '모자',
    en: 'hat',
    folder: 'Billed cap',
    file: 'billed_cap_3d.png',
    path: 'Billed cap/3D/billed_cap_3d.png',
  },
  {
    id: 'toothbrush',
    ko: '칫솔',
    en: 'toothbrush',
    folder: 'Toothbrush',
    file: 'toothbrush_3d.png',
    path: 'Toothbrush/3D/toothbrush_3d.png',
  },
  {
    id: 'umbrella',
    ko: '우산',
    en: 'umbrella',
    folder: 'Umbrella',
    file: 'umbrella_3d.png',
    path: 'Umbrella/3D/umbrella_3d.png',
  },
  {
    id: 'clock',
    ko: '시계',
    en: 'clock',
    folder: 'Alarm clock',
    file: 'alarm_clock_3d.png',
    path: 'Alarm clock/3D/alarm_clock_3d.png',
  },

  // 6. 자연 (Nature)
  {
    id: 'sun',
    ko: '해',
    en: 'sun',
    folder: 'Sun',
    file: 'sun_3d.png',
    path: 'Sun/3D/sun_3d.png',
  },
  {
    id: 'moon',
    ko: '달',
    en: 'moon',
    folder: 'Crescent moon',
    file: 'crescent_moon_3d.png',
    path: 'Crescent moon/3D/crescent_moon_3d.png',
  },
  {
    id: 'star',
    ko: '별',
    en: 'star',
    folder: 'Star',
    file: 'star_3d.png',
    path: 'Star/3D/star_3d.png',
  },
  {
    id: 'flower',
    ko: '꽃',
    en: 'flower',
    folder: 'Cherry blossom',
    file: 'cherry_blossom_3d.png',
    path: 'Cherry blossom/3D/cherry_blossom_3d.png',
  },
  {
    id: 'tree',
    ko: '나무',
    en: 'tree',
    folder: 'Deciduous tree',
    file: 'deciduous_tree_3d.png',
    path: 'Deciduous tree/3D/deciduous_tree_3d.png',
  },
  {
    id: 'rain',
    ko: '비',
    en: 'rain',
    folder: 'Cloud with rain',
    file: 'cloud_with_rain_3d.png',
    path: 'Cloud with rain/3D/cloud_with_rain_3d.png',
  },
  {
    id: 'snowman',
    ko: '눈사람',
    en: 'snowman',
    folder: 'Snowman',
    file: 'snowman_3d.png',
    path: 'Snowman/3D/snowman_3d.png',
  },
];

async function downloadImages() {
  console.log(`[fetch-images] Starting download of ${EMOJI_MAPPING.length} Fluent 3D Emoji images...`);
  
  if (!fs.existsSync(TARGET_DIR)) {
    fs.mkdirSync(TARGET_DIR, { recursive: true });
    console.log(`[fetch-images] Created directory: ${TARGET_DIR}`);
  }

  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < EMOJI_MAPPING.length; i++) {
    const item = EMOJI_MAPPING[i];
    const targetFile = path.join(TARGET_DIR, `${item.id}.png`);
    const encodedPath = item.path.split('/').map(encodeURIComponent).join('/');
    const url = `${BASE_URL}/${encodedPath}`;

    process.stdout.write(`[${i + 1}/${EMOJI_MAPPING.length}] Downloading ${item.ko} (${item.en}) -> ${item.id}.png... `);

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(targetFile, buffer);

      console.log(`✓ OK (${(buffer.length / 1024).toFixed(1)} KB)`);
      successCount++;
    } catch (err) {
      console.log(`✗ FAIL (${err.message})`);
      failCount++;
    }
  }

  console.log('\n========================================');
  console.log(`Finished: ${successCount} succeeded, ${failCount} failed.`);
  console.log(`Target path: ${TARGET_DIR}`);
  console.log('========================================\n');
}

downloadImages();
