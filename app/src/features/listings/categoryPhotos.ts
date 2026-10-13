import type { ImageSource } from 'expo-image';

import type { ProductCategory } from './master';

/**
 * ホームのカテゴリアイコンの写真（アプリに同梱。240×240）。
 * シードの掲載写真と同じイメージ画像を正方形に切り抜いたもので、出典は supabase/seed-photos-credits.md
 */
export const CATEGORY_PHOTOS: Record<ProductCategory, ImageSource> = {
  bento: require('../../../assets/images/categories/bento.jpg'),
  rice: require('../../../assets/images/categories/rice.jpg'),
  vegetable: require('../../../assets/images/categories/vegetable.jpg'),
  bread: require('../../../assets/images/categories/bread.jpg'),
  sweets: require('../../../assets/images/categories/sweets.jpg'),
  processed: require('../../../assets/images/categories/processed.jpg'),
  laundry: require('../../../assets/images/categories/laundry.jpg'),
};
