import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

/**
 * 画面に戻ってきたとき（タブの切り替え・前の画面から戻る）に取り直す。
 * 一覧の画面で使う。詳細・申し込み画面は開くたびに取り直すので不要（features/listings/hooks.ts）
 */
export function useRefetchOnFocus(refetch: () => unknown, enabled = true) {
  useFocusEffect(
    useCallback(() => {
      if (enabled) void refetch();
    }, [refetch, enabled]),
  );
}
