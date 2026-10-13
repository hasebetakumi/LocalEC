import { router } from 'expo-router';
import { useEffect } from 'react';

import { useAuth } from './AuthProvider';
import { saveNextPath } from './api';

const bookPath = (listingId: string) => `/listings/${listingId}/book`;

/** 詳細の「予約へ進む」：未ログインならログイン、登録未完了なら登録情報の入力へ。戻り先は端末に保存 */
export function useStartBooking() {
  const { session, isRegistered, loading } = useAuth();
  return async (listingId: string) => {
    // ログイン状態を読み込み中は判断できないので待つ（申し込み画面でも確かめ直す）
    if (loading) return;
    if (!session) {
      await saveNextPath(bookPath(listingId));
      router.push('/auth/login');
      return;
    }
    if (!isRegistered) {
      await saveNextPath(bookPath(listingId));
      router.push({ pathname: '/auth/register', params: { complete: '1' } });
      return;
    }
    router.push({ pathname: '/listings/[id]/book', params: { id: listingId } });
  };
}

/** 申し込み画面を直接開かれた（ディープリンク・Web の再読み込み）ときも、ログイン・登録を確かめる */
export function useRequireRegistered(listingId: string | undefined) {
  const { session, isRegistered, loading } = useAuth();
  useEffect(() => {
    if (loading || !listingId) return;
    if (!session) {
      void saveNextPath(bookPath(listingId)).then(() => router.replace('/auth/login'));
    } else if (!isRegistered) {
      void saveNextPath(bookPath(listingId)).then(() =>
        router.replace({ pathname: '/auth/register', params: { complete: '1' } }),
      );
    }
  }, [loading, session, isRegistered, listingId]);
  return { loading };
}
