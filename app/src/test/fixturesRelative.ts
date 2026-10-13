import { makeProduct } from './fixtures';

const HOUR = 60 * 60 * 1000;

/** 実行時刻を基準にした商品（画面テストは本物の時計で動くため） */
export function liveProduct(overrides: Parameters<typeof makeProduct>[0] = {}) {
  const now = Date.now();
  return makeProduct({
    pickupStart: new Date(now + 2 * HOUR),
    pickupEnd: new Date(now + 4 * HOUR),
    bookingDeadline: new Date(now + HOUR),
    cancelDeadline: new Date(now + HOUR),
    publishStart: new Date(now - 100 * HOUR),
    publishEnd: new Date(now + 24 * HOUR),
    ...overrides,
  });
}

export const HOURS = HOUR;
