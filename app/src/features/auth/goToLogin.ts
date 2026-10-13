import { router, type Href } from 'expo-router';

import { saveNextPath } from './api';

/** ログイン画面を開く。ログインが終わったら、押した画面（next）に戻る */
export async function goToLogin(next: string) {
  await saveNextPath(next);
  router.push('/auth/login' as Href);
}
