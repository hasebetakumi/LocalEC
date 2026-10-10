/**
 * お知らせの既読（端末に保存する。ログインしていなくてもベルの未読数を出すため）
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Notice } from '@/features/listings/types';

const KEY = 'notices.read';
/** 公開から 30 日を過ぎたお知らせは未読に数えない（初回起動で古いものが全部 NEW にならないように） */
export const UNREAD_WINDOW_MS = 30 * 24 * 60 * 60 * 1000;

export async function loadReadIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export async function saveReadIds(ids: readonly string[]) {
  // 増え続けないよう新しい 300 件だけ残す
  await AsyncStorage.setItem(KEY, JSON.stringify(ids.slice(-300)));
}

export function isUnread(n: Notice, readIds: readonly string[], now: Date): boolean {
  if (readIds.includes(n.id)) return false;
  const age = now.getTime() - n.publishStart.getTime();
  return age >= 0 && age <= UNREAD_WINDOW_MS;
}

export function unreadCount(
  notices: readonly Notice[],
  readIds: readonly string[],
  now: Date,
): number {
  return notices.filter((n) => isUnread(n, readIds, now)).length;
}
