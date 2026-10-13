import { jstDate, NOW } from '@/test/fixtures';
import { makeStaffListing, staffStore } from '@/test/staffFixtures';

import {
  applyFollow,
  duplicateForm,
  formDefaults,
  formToRow,
  isPeriodChanged,
  listingToForm,
  lockedFieldRows,
  parseInteger,
  payTextOf,
  restrictedErrors,
  restrictedToUpdate,
  validateListingForm,
  type ListingForm,
} from './form';

function filledProduct(o: Partial<ListingForm> = {}): ListingForm {
  return {
    ...formDefaults('product', staffStore, NOW),
    title: '日替わり弁当',
    category: 'bento',
    price: '600',
    quantity: '20',
    start: jstDate('2026-10-06 11:30'),
    end: jstDate('2026-10-06 13:30'),
    deadline: jstDate('2026-10-06 10:00'),
    cancelDeadline: jstDate('2026-10-06 10:00'),
    publishEnd: jstDate('2026-10-06 13:30'),
    ...o,
  };
}

describe('初期値', () => {
  it('イベント・求人の場所は店舗、お知らせの公開終了は 30 日後', () => {
    const ev = formDefaults('event', staffStore, NOW);
    expect(ev.placeName).toBe('カフェ あけぼの 駅前店');
    expect(ev.placeAddress).toBe('埼玉県久喜市栗橋東1-2-8');
    expect(ev.maxPerBooking).toBe('4');
    expect(formDefaults('notice', staffStore, NOW).publishEnd).toEqual(jstDate('2026-11-04 09:00'));
    expect(formDefaults('product', staffStore, NOW).publishEnd).toBeNull();
  });
});

describe('追従ルール', () => {
  const base = formDefaults('product', staffStore, NOW);
  it('開始→締切→キャンセル期限、終了→公開終了', () => {
    const start = jstDate('2026-10-06 11:30');
    const end = jstDate('2026-10-06 13:30');
    let f = applyFollow(base, { ...base, start }, 'product');
    expect(f.deadline).toEqual(start);
    expect(f.cancelDeadline).toEqual(start);
    f = applyFollow(f, { ...f, end }, 'product');
    expect(f.publishEnd).toEqual(end);
  });
  it('手で変えた項目は追従しない', () => {
    const manual = jstDate('2026-10-06 09:00');
    const f = applyFollow(
      base,
      {
        ...base,
        deadline: manual,
        start: jstDate('2026-10-06 11:30'),
        touched: { ...base.touched, deadline: true },
      },
      'product',
    );
    expect(f.deadline).toEqual(manual);
  });
});

describe('検証', () => {
  it('下書きはタイトルだけ必須', () => {
    const empty = formDefaults('product', staffStore, NOW);
    expect(validateListingForm(empty, 'product', { publish: false })).toEqual({
      title: 'タイトルを入力してください',
    });
    expect(validateListingForm({ ...empty, title: 'x' }, 'product', { publish: false })).toEqual(
      {},
    );
  });
  it('公開は必須がそろっていること', () => {
    const e = validateListingForm(formDefaults('product', staffStore, NOW), 'product', {
      publish: true,
    });
    expect(Object.keys(e).sort()).toEqual(
      [
        'cancelDeadline',
        'category',
        'deadline',
        'end',
        'price',
        'publishEnd',
        'quantity',
        'start',
        'title',
      ].sort(),
    );
    expect(validateListingForm(filledProduct(), 'product', { publish: true })).toEqual({});
  });
  it('前後関係と元値', () => {
    const e = validateListingForm(
      filledProduct({
        end: jstDate('2026-10-06 10:00'),
        start: jstDate('2026-10-06 11:30'),
        originalPrice: '500',
      }),
      'product',
      { publish: true },
    );
    expect(e.end).toBe('受け取り終了は受け取り開始より後にしてください');
    expect(e.originalPrice).toBe('元値は価格より大きくしてください');
    expect(
      validateListingForm(filledProduct({ deadline: jstDate('2026-10-06 14:00') }), 'product', {
        publish: true,
      }).deadline,
    ).toBe('予約締切は受け取り終了より前にしてください');
  });
  it('数量は 1 以上の整数', () => {
    expect(
      validateListingForm(filledProduct({ quantity: '0' }), 'product', { publish: true }).quantity,
    ).toBe('数量は1以上の整数で入力してください');
  });
  it('お知らせは本文が必須', () => {
    const f = { ...formDefaults('notice', staffStore, NOW), title: 'お知らせ' };
    expect(validateListingForm(f, 'notice', { publish: true })).toEqual({
      body: '本文を入力してください',
    });
  });
  it('求人の報酬（その他は自由記述）', () => {
    const job = {
      ...filledProduct(),
      placeName: '作業場',
      placeAddress: '住所',
      payUnit: 'other' as const,
      payFreeText: '',
    };
    expect(validateListingForm(job, 'job', { publish: true }).payFreeText).toBe(
      '報酬を入力してください',
    );
  });
});

describe('行への変換', () => {
  it('数値の正規化と種類別の列', () => {
    expect(parseInteger('９，０００')).toBe(9000);
    expect(parseInteger('1.5')).toBeNull();
    const row = formToRow(
      filledProduct({ price: '1,200' }),
      'product',
      'store-1',
      'published',
      NOW,
    );
    expect(row).toMatchObject({
      store_id: 'store-1',
      kind: 'product',
      status: 'published',
      price: 1200,
      quantity_total: 20,
      pickup_start: jstDate('2026-10-06 11:30').toISOString(),
      cancel_deadline: jstDate('2026-10-06 10:00').toISOString(),
      food_label: '店舗にお問い合わせください',
    });
    expect(row).not.toHaveProperty('capacity');
  });
  it('キャンセル「できない」は期限 null', () => {
    const row = formToRow(
      filledProduct({ cancelAllowed: false }),
      'product',
      's',
      'published',
      NOW,
    );
    expect(row.cancel_deadline).toBeNull();
  });
  it('下書きで公開期間が空なら今から 30 日', () => {
    const row = formToRow(
      { ...formDefaults('product', staffStore, NOW), title: 'x', publishStart: null },
      'product',
      's',
      'draft',
      NOW,
    );
    expect(row.publish_start).toBe(NOW.toISOString());
    expect(row.publish_end).toBe(jstDate('2026-11-04 09:00').toISOString());
  });
  it('求人の報酬の文字列', () => {
    expect(payTextOf('daily', '9000', '')).toBe('日給 9,000円');
    expect(payTextOf('hourly', '1,100', '')).toBe('時給 1,100円');
    expect(payTextOf('other', '', '応相談')).toBe('応相談');
  });
  it('既存の掲載をフォームにして戻すと同じ値', () => {
    const l = makeStaffListing();
    const row = formToRow(listingToForm(l), 'product', 'store-1', 'published', NOW);
    expect(row).toMatchObject({ price: 600, original_price: 800, quantity_total: 20 });
  });
  it('複製は日時を空にする', () => {
    const f = duplicateForm(makeStaffListing(), NOW);
    expect(f.title).toBe('日替わり弁当（10/5）');
    expect(f.start).toBeNull();
    expect(f.publishStart).toEqual(NOW);
  });
});

describe('A-12 予約後の編集', () => {
  const l = makeStaffListing();
  it('数量は予約済み以上・元の数量以下', () => {
    const ok = { quantity: '10', start: l.start, end: l.end };
    expect(restrictedErrors(l, ok)).toEqual({});
    expect(restrictedErrors(l, { ...ok, quantity: '6' }).quantity).toBe(
      '予約済みの8食より少なくはできません',
    );
    expect(restrictedErrors(l, { ...ok, quantity: '30' }).quantity).toBe('増やすことはできません');
  });
  it('保存は数量と期間だけ', () => {
    expect(restrictedToUpdate(l, { quantity: '10', start: l.start, end: l.end })).toEqual({
      quantity_total: 10,
      pickup_start: l.start?.toISOString(),
      pickup_end: l.end?.toISOString(),
    });
  });
  it('期間の変更を検出', () => {
    expect(isPeriodChanged(l, { quantity: '10', start: l.start, end: l.end })).toBe(false);
    expect(
      isPeriodChanged(l, { quantity: '10', start: l.start, end: jstDate('2026-10-05 14:00') }),
    ).toBe(true);
  });
  it('変更できない項目', () => {
    expect(lockedFieldRows(l, '駅前店').map((r) => r.label)).toEqual([
      'タイトル',
      '価格',
      '店舗',
      '予約締切',
      'キャンセル',
      '食品表示',
    ]);
  });
});
