import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import { AppState, Platform } from 'react-native';

import type { Database } from '@/lib/database.types';
import { env } from '@/lib/env';

const isWeb = Platform.OS === 'web';

// Web・iOS・Android で共通の接続。ログイン状態の保存先だけプラットフォームで変わる。
// Web はブラウザ既定の保存先（localStorage）、スマホは AsyncStorage。
export const supabase = createClient<Database>(env.supabaseUrl, env.supabasePublishableKey, {
  auth: {
    ...(isWeb ? {} : { storage: AsyncStorage }),
    autoRefreshToken: true,
    persistSession: true,
    // メールのリンクは Supabase が検証したあと「?code=…」を付けてアプリに戻る（PKCE）
    flowType: 'pkce',
    // code の交換は Web でも /auth/confirm 画面が行う。自動検出と二重にならないよう切る
    detectSessionInUrl: false,
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
