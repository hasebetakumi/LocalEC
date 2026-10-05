import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import { env } from '@/lib/env';

const isWeb = Platform.OS === 'web';

// Web・iOS・Android で共通の接続。ログイン状態の保存先だけプラットフォームで変わる。
// Web はブラウザ既定の保存先（localStorage）、スマホは AsyncStorage。
export const supabase = createClient(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    ...(isWeb ? {} : { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    // パスワード再設定のリンクから戻ったときの処理。Web はブラウザが URL を扱うので有効にする
    detectSessionInUrl: isWeb,
    lock: processLock,
  },
});

// スマホではアプリが前面にあるときだけトークンを自動更新する
if (!isWeb) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') {
      supabase.auth.startAutoRefresh();
    } else {
      supabase.auth.stopAutoRefresh();
    }
  });
}

/** Supabase に到達できるかを確認する（Auth のヘルスチェック） */
export async function checkConnection(): Promise<boolean> {
  try {
    const res = await fetch(`${env.supabaseUrl}/auth/v1/health`, {
      headers: { apikey: env.supabasePublishableKey },
    });
    return res.ok;
  } catch {
    return false;
  }
}
