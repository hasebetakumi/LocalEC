import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { Loading } from '@/components/LoadState';
import { Screen } from '@/components/Screen';
import { exchangeLoginCode, fetchProfile } from '@/features/auth/api';
import { isProfileComplete } from '@/features/auth/AuthProvider';
import { goAfterLogin } from '@/features/auth/goAfterLogin';
import { supabase } from '@/lib/supabase';

/**
 * メールのリンクから戻る先。Supabase が付けた code をセッションに交換してログインし、行き先へ振り分ける（画面は読み込み中だけ）
 * 期限切れなどは code の代わりに error_code が付いて戻る
 */
export default function ConfirmScreen() {
  const {
    code,
    type,
    error_code: errorCode,
  } = useLocalSearchParams<{
    code?: string;
    type?: string;
    error_code?: string;
  }>();

  useEffect(() => {
    if (!code) {
      if (errorCode) {
        router.replace({ pathname: '/auth/login', params: { error: 'expired' } });
      } else {
        router.replace('/auth/login');
      }
      return;
    }
    let active = true;
    (async () => {
      try {
        await exchangeLoginCode(code);
      } catch {
        if (active) router.replace({ pathname: '/auth/login', params: { error: 'expired' } });
        return;
      }
      if (type === 'email_change') {
        // メールアドレス変更の確認リンク。完了したらマイページへ
        if (active) router.replace({ pathname: '/mypage', params: { emailChanged: '1' } });
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
  }, [code, type, errorCode]);

  return (
    <Screen>
      <Loading />
    </Screen>
  );
}
