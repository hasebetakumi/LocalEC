/**
 * プッシュ通知の端末登録（iOS・Android）。Web は push.web.ts（何もしない）
 * 設計：docs/設計_通知の配信.md 4 章
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

const TOKEN_KEY = 'push.token';

export type RegisterResult = 'registered' | 'denied' | 'unavailable';

/** 前面で受けた通知もバナーとリストに出す */
export function configureNotificationHandler() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * 通知の許可を取り、Expo の端末トークンを DB に登録する。
 * シミュレータ、Android の Expo Go（SDK 53 以降はプッシュ不可）などでは unavailable
 */
export async function registerForPush(): Promise<RegisterResult> {
  if (!Device.isDevice) return 'unavailable';
  try {
    if (Platform.OS === 'android') {
      // Android 13 以降は、チャンネルを作ってから許可を求めないとダイアログが出ない
      await Notifications.setNotificationChannelAsync('default', {
        name: 'お知らせ',
        importance: Notifications.AndroidImportance.DEFAULT,
      });
    }
    const current = await Notifications.getPermissionsAsync();
    const status =
      current.status === 'granted'
        ? current.status
        : (await Notifications.requestPermissionsAsync()).status;
    if (status !== 'granted') return 'denied';

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    const { error } = await supabase.rpc('register_push_token', {
      p_token: token,
      p_platform: Platform.OS === 'ios' ? 'ios' : 'android',
    });
    if (error) throw error;
    await AsyncStorage.setItem(TOKEN_KEY, token);
    return 'registered';
  } catch (e) {
    // 通知が使えなくてもアプリの操作は止めない
    console.warn('プッシュ通知の登録に失敗しました', e);
    return 'unavailable';
  }
}

/** ログアウト・アカウント削除の前に、この端末のトークンを外す（別の人に届かないように） */
export async function unregisterPush(): Promise<void> {
  const token = await AsyncStorage.getItem(TOKEN_KEY);
  if (!token) return;
  await supabase.from('push_tokens').delete().eq('token', token);
  await AsyncStorage.removeItem(TOKEN_KEY);
}

/** 通知をタップしたとき（起動中・起動直後の両方）に呼ぶ */
export function subscribeNotificationTaps(onTap: (data: unknown, id: string) => void): () => void {
  const sub = Notifications.addNotificationResponseReceivedListener((response) => {
    onTap(response.notification.request.content.data, response.notification.request.identifier);
  });
  void Notifications.getLastNotificationResponseAsync().then((response) => {
    if (response)
      onTap(response.notification.request.content.data, response.notification.request.identifier);
  });
  return () => sub.remove();
}
