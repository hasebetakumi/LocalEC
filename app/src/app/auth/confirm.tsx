import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Loading } from '@/components/LoadState';
import { Screen } from '@/components/Screen';
import { fetchProfile, verifyEmailLink } from '@/features/auth/api';
import { isProfileComplete } from '@/features/auth/AuthProvider';
import { goAfterLogin } from '@/features/auth/goAfterLogin';
import { supabase } from '@/lib/supabase';

/** メールのリンクから戻る先。token_hash を検証してログインし、行き先へ振り分ける（画面は読み込み中だけ） */
export default function ConfirmScreen() {
  const { token_hash: tokenHash, type } = useLocalSearchParams<{
    token_hash?: string;
    type?: string;
  }>();

  useEffect(() => {
    if (!tokenHash) {
      router.replace('/auth/login');
      return;
    }
    let active = true;
    (async () => {
      if (type === 'email_change') {
        // メールアドレス変更の確認リンク。完了したらマイページへ
        try {
          await verifyEmailLink(tokenHash, 'email_change');
          if (active) router.replace({ pathname: '/mypage', params: { emailChanged: '1' } });
        } catch {
          if (active) router.replace({ pathname: '/auth/login', params: { error: 'expired' } });
        }
        return;
      }
      try {
        await verifyEmailLink(tokenHash);
      } catch {
        if (active) router.replace({ pathname: '/auth/login', params: { error: 'expired' } });
        return;
      }
      const { data } = await supabase.auth.getUser();
      const profile = data.user ? await fetchProfile(data.user.id).catch(() => null) : null;
      if (!active) return;
      if (!isProfileComplete(profile)) {
        // 「予約へ進む」の行き先は保存したまま、登録情報の入力へ
        router.replace({ pathname: '/auth/register', params: { complete: '1' } });
        return;
      }
      await goAfterLogin();
    })();
    return () => {
      active = false;
    };
  }, [tokenHash, type]);

  return (
    <Screen>
      <Loading />
    </Screen>
  );
}
