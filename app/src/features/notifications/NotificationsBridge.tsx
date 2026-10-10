import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';

import { useAuth } from '@/features/auth/AuthProvider';
import { saveNextPath } from '@/features/auth/api';

import { notificationUrl } from './links';
import { configureNotificationHandler, registerForPush, subscribeNotificationTaps } from './push';

configureNotificationHandler();

/**
 * 通知とアプリをつなぐ（画面は持たない）。
 * - ログイン済みで通知オンなら、起動時に端末を登録する（ユーザーごとに 1 回）
 * - 通知をタップしたら該当画面を開く。未ログインなら戻り先を保存してログインへ。
 *   起動直後のタップはセッションの復元を待ってから判断する（待たないと、ログイン済みでもログイン画面に送ってしまう）
 */
export function NotificationsBridge() {
  const { session, profile, loading } = useAuth();
  const registeredFor = useRef<string | null>(null);
  const handled = useRef(new Set<string>());
  // タップした URL。state にすると効果の中で消すことになるので ref に持ち、再評価の合図だけ state にする
  const pendingUrl = useRef<string | null>(null);
  const [tapCount, setTapCount] = useState(0);

  useEffect(() => {
    if (loading || !profile || !profile.notifications_enabled) return;
    if (registeredFor.current === profile.id) return;
    registeredFor.current = profile.id;
    void registerForPush();
  }, [loading, profile]);

  useEffect(
    () =>
      subscribeNotificationTaps((data, id) => {
        if (handled.current.has(id)) return;
        handled.current.add(id);
        const url = notificationUrl(data);
        if (!url) return;
        pendingUrl.current = url;
        setTapCount((c) => c + 1);
      }),
    [],
  );

  useEffect(() => {
    const url = pendingUrl.current;
    if (loading || !url) return;
    pendingUrl.current = null;
    if (session) {
      router.push(url as Parameters<typeof router.push>[0]);
    } else {
      void saveNextPath(url).then(() => router.push('/auth/login'));
    }
  }, [loading, tapCount, session]);

  return null;
}
