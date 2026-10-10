import { router, type Href } from 'expo-router';

import { consumeNextPath } from './api';

/**
 * ログイン・登録が終わったあとの行き先（「予約へ進む」から来ていればその画面、なければホーム）。
 * ログイン・メール送信後の画面はスタックから外し、タブの上に行き先を積む
 */
export async function goAfterLogin() {
  // 保存してあるのはアプリ内のパスだけ（例：/listings/<id>/book）
  const next = (await consumeNextPath()) as Href | null;
  if (router.canDismiss()) {
    router.dismissAll();
    if (next) router.push(next);
    else router.navigate('/');
  } else {
    // Web でリンクを開いた直後など、下に画面がない
    router.replace(next ?? '/');
  }
}
