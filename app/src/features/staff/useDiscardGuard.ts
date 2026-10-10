import { useNavigation } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';

type NavAction = { type: string; payload?: object; source?: string; target?: string };

/**
 * 入力途中で画面を閉じようとしたら止めて、確認を出す（設計書 3 章）。
 * Expo Router 57 は usePreventRemove を公開していないので beforeRemove を直接使う
 */
export function useDiscardGuard(dirty: boolean) {
  const navigation = useNavigation();
  const [pending, setPending] = useState<NavAction | null>(null);
  const allowRef = useRef(false);

  useEffect(() => {
    if (!dirty) return;
    return navigation.addListener('beforeRemove', (e) => {
      if (allowRef.current) return;
      e.preventDefault();
      setPending(e.data.action as NavAction);
    });
  }, [navigation, dirty]);

  /** 保存できたときなど、確認なしで閉じてよい状態にする */
  const allowLeave = useCallback(() => {
    allowRef.current = true;
  }, []);

  /** 「破棄する」：止めていた遷移をそのまま実行する */
  const discard = useCallback(() => {
    allowRef.current = true;
    const action = pending;
    setPending(null);
    if (action) navigation.dispatch(action);
  }, [navigation, pending]);

  const keep = useCallback(() => setPending(null), []);

  return { confirmVisible: pending != null, discard, keep, allowLeave };
}
