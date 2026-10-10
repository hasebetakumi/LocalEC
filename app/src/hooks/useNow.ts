import { useEffect, useState } from 'react';

/** 現在時刻。締切・新着の判定が画面を開いたままでも変わるよう、1 分ごとに更新する */
export function useNow(intervalMs = 60_000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}
