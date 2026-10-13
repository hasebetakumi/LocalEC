import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Linking from 'expo-linking';

import { supabase } from '@/lib/supabase';

/**
 * メールのリンクから戻る先。Supabase が検証したあと「?code=…」を付けてここに転送する
 * Expo Go: exp://<xxx>-8081.exp.direct/--/auth/confirm、ビルド版: localec://auth/confirm、Web: http://localhost:8081/auth/confirm
 * メールアドレス変更は type=email_change を付けて、ログインと区別する（クエリは転送後も残る）
 */
export function authRedirectUrl(type?: 'email_change'): string {
  return Linking.createURL('/auth/confirm', { queryParams: type ? { type } : undefined });
}

export async function sendLoginLink(email: string) {
  const { error } = await supabase.auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: authRedirectUrl() },
  });
  if (error) throw error;
}

/** 新規登録。メタデータは auth.users のトリガーで profiles に写される（既存ユーザーなら無視される） */
export async function sendRegisterLink(input: { email: string; name: string; phone: string }) {
  const { error } = await supabase.auth.signInWithOtp({
    email: input.email.trim(),
    options: {
      emailRedirectTo: authRedirectUrl(),
      data: { name: input.name, phone: input.phone, agreed_terms_at: new Date().toISOString() },
    },
  });
  if (error) throw error;
}

/** メールのリンクから戻ったときの code をセッションに交換する（ログイン・登録・メールアドレス変更で共通） */
export async function exchangeLoginCode(code: string) {
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) throw error;
}

/** 登録情報の変更（氏名・電話は即反映） */
export async function updateProfile(userId: string, input: { name: string; phone: string }) {
  const { error } = await supabase.from('profiles').update(input).eq('id', userId);
  if (error) throw error;
}

/** U-30 通知のオン・オフ */
export async function setNotificationsEnabled(userId: string, enabled: boolean) {
  const { error } = await supabase
    .from('profiles')
    .update({ notifications_enabled: enabled })
    .eq('id', userId);
  if (error) throw error;
}

/** メールアドレスの変更。新しいアドレスに確認リンクを送り、押した時点で変更が完了する */
export async function requestEmailChange(email: string) {
  const { error } = await supabase.auth.updateUser(
    { email: email.trim() },
    { emailRedirectTo: authRedirectUrl('email_change') },
  );
  if (error) throw error;
}

/** メールだけでログインした人（登録情報なし）が氏名・電話を入れる */
export async function completeProfile(userId: string, input: { name: string; phone: string }) {
  const { error } = await supabase
    .from('profiles')
    .update({ name: input.name, phone: input.phone, agreed_terms_at: new Date().toISOString() })
    .eq('id', userId);
  if (error) throw error;
}

export type Profile = {
  id: string;
  name: string;
  phone: string;
  email: string;
  pending_email: string | null;
  notifications_enabled: boolean;
  is_staff: boolean;
};

export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, name, phone, email, pending_email, notifications_enabled, is_staff')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

// ログイン後に戻る画面。ログインへ送る側が保存し、ログイン完了（goAfterLogin）で消費する。メールのリンクには載せず端末に持つ
const NEXT_KEY = 'auth.next';
/**
 * 戻り先の有効期間。メールのリンクの期限（15 分、config.toml の otp_expiry）に、登録情報の入力の時間を足した長さ。
 * これより古い戻り先は、途中でやめたログインの名残なので使わない
 */
export const NEXT_TTL_MS = 60 * 60 * 1000;

/** 保存した値を読み、使える戻り先だけ返す（期限切れ・旧形式の文字列・ログイン画面自体は捨てる） */
export function parseNextPath(raw: string | null, now = Date.now()): string | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { path?: unknown; savedAt?: unknown };
    if (typeof v.path !== 'string' || typeof v.savedAt !== 'number') return null;
    if (!v.path.startsWith('/') || v.path.startsWith('/auth')) return null;
    if (now - v.savedAt > NEXT_TTL_MS) return null;
    return v.path;
  } catch {
    // 2026-10-13 以前は文字列をそのまま保存していた。いつ保存したか分からないので使わない
    return null;
  }
}

export async function saveNextPath(path: string) {
  await AsyncStorage.setItem(NEXT_KEY, JSON.stringify({ path, savedAt: Date.now() }));
}

export async function peekNextPath(): Promise<string | null> {
  return parseNextPath(await AsyncStorage.getItem(NEXT_KEY));
}

export async function consumeNextPath(): Promise<string | null> {
  const next = parseNextPath(await AsyncStorage.getItem(NEXT_KEY));
  await AsyncStorage.removeItem(NEXT_KEY);
  return next;
}

/** ログインせずに戻ったとき、古い戻り先が次のログインに残らないよう消す */
export async function clearNextPath() {
  await AsyncStorage.removeItem(NEXT_KEY);
}
