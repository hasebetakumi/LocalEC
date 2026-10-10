import {
  formatDateTimeJa,
  formatDeadline,
  formatPhone,
  formatPickup,
  formatYen,
  isValidEmail,
  isValidPhone,
  normalizePhone,
} from './format';

const jst = (text: string) => new Date(`${text.replace(' ', 'T')}:00+09:00`);

describe('formatPickup', () => {
  it('同じ日なら日付と時間帯', () => {
    expect(formatPickup(jst('2026-10-05 11:30'), jst('2026-10-05 13:30'))).toBe(
      '10/5(月) 11:30〜13:30',
    );
  });

  it('withDate=false なら時間帯だけ', () => {
    expect(
      formatPickup(jst('2026-10-05 11:30'), jst('2026-10-05 13:30'), { withDate: false }),
    ).toBe('11:30〜13:30');
  });

  it('複数日なら月日の範囲', () => {
    expect(formatPickup(jst('2026-10-04 09:00'), jst('2026-10-06 17:00'))).toBe('10/4〜10/6');
  });
});

describe('formatDeadline', () => {
  const now = jst('2026-10-05 08:00');
  it('今日なら時刻だけ', () => {
    expect(formatDeadline(jst('2026-10-05 10:00'), now)).toBe('10:00');
  });
  it('別の日なら日付つき', () => {
    expect(formatDeadline(jst('2026-10-15 18:00'), now)).toBe('10/15(木) 18:00');
  });
});

describe('タイムゾーン', () => {
  it('UTC の日時を日本時間で表示する', () => {
    expect(formatDateTimeJa(new Date('2026-10-05T02:00:00Z'))).toBe('10/5(月) 11:00');
  });
  it('UTC では前日でも日本時間の日付になる', () => {
    expect(formatDateTimeJa(new Date('2026-10-04T15:30:00Z'))).toBe('10/5(月) 0:30');
  });
});

describe('formatYen', () => {
  it('3 桁区切り', () => {
    expect(formatYen(1200)).toBe('1,200');
    expect(formatYen(600)).toBe('600');
    expect(formatYen(1234567)).toBe('1,234,567');
  });
});

describe('電話番号', () => {
  it('11 桁は 3-4-4', () => {
    expect(formatPhone('09012345678')).toBe('090-1234-5678');
  });
  it('10 桁は 3-3-4', () => {
    expect(formatPhone('0480000001')).toBe('048-000-0001');
  });
  it('ハイフン・空白・全角数字を正規化する', () => {
    expect(normalizePhone('090-1234 5678')).toBe('09012345678');
    expect(normalizePhone('０９０１２３４５６７８')).toBe('09012345678');
  });
  it('形式チェック', () => {
    expect(isValidPhone('09012345678')).toBe(true);
    expect(isValidPhone('0480000001')).toBe(true);
    expect(isValidPhone('090123')).toBe(false);
    expect(isValidPhone('19012345678')).toBe(false);
  });
});

describe('isValidEmail', () => {
  it('簡易チェック', () => {
    expect(isValidEmail('example@mail.jp')).toBe(true);
    expect(isValidEmail('example@mail')).toBe(false);
    expect(isValidEmail('')).toBe(false);
  });
});
