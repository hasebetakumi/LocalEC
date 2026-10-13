import { jstDate, NOW, store2 } from '@/test/fixtures';

import {
  eventAvailability,
  isHeadcountReached,
  jobAvailability,
  listMeta,
  listStatus,
  payLabel,
  priceLabel,
  scheduleText,
  totalLabel,
} from './eventJob';
import type { EventListing, JobListing } from './types';

function makeEvent(o: Partial<EventListing> = {}): EventListing {
  return {
    kind: 'event',
    id: 'e-1',
    title: '親子でさつまいも掘り体験',
    body: null,
    photoUrl: null,
    publishStart: jstDate('2026-10-01 00:00'),
    publishEnd: jstDate('2026-10-18 12:00'),
    displayStatus: 'published',
    store: store2,
    pricePerPerson: 500,
    capacity: 20,
    maxPerBooking: 4,
    remaining: 8,
    eventStart: jstDate('2026-10-18 10:00'),
    eventEnd: jstDate('2026-10-18 12:00'),
    placeName: 'あけぼの農園 第2畑',
    placeAddress: '埼玉県久喜市栗橋北3-10',
    applicationDeadline: jstDate('2026-10-15 00:00'),
    cancelDeadline: jstDate('2026-10-16 18:00'),
    conditions: null,
    ...o,
  };
}

function makeJob(o: Partial<JobListing> = {}): JobListing {
  return {
    kind: 'job',
    id: 'j-1',
    title: '稲の脱穀作業（日払い）',
    body: null,
    photoUrl: null,
    publishStart: jstDate('2026-10-01 00:00'),
    publishEnd: jstDate('2026-10-10 15:00'),
    displayStatus: 'published',
    store: store2,
    payText: '日給 9,000円',
    payAmount: 9000,
    payUnit: 'daily',
    headcount: 5,
    reservedQuantity: 2,
    workStart: jstDate('2026-10-10 08:00'),
    workEnd: jstDate('2026-10-10 15:00'),
    workText: null,
    placeName: 'あけぼの農園 作業場',
    placeAddress: '埼玉県久喜市栗橋北3-12',
    applicationDeadline: jstDate('2026-10-08 00:00'),
    cancelDeadline: jstDate('2026-10-08 18:00'),
    conditions: null,
    ...o,
  };
}

describe('イベント', () => {
  it('受付中・満員・締切後', () => {
    expect(eventAvailability(makeEvent(), NOW)).toBe('open');
    expect(eventAvailability(makeEvent({ remaining: 0 }), NOW)).toBe('full');
    expect(eventAvailability(makeEvent(), jstDate('2026-10-15 00:00'))).toBe('deadline_passed');
  });
  it('価格は 0 や null なら無料', () => {
    expect(priceLabel(makeEvent())).toBe('500円');
    expect(priceLabel(makeEvent({ pricePerPerson: 0 }))).toBe('無料');
    expect(totalLabel(makeEvent(), 2)).toBe('1,000円');
    expect(totalLabel(makeEvent({ pricePerPerson: null }), 2)).toBe('無料');
  });
  it('一覧の表示', () => {
    expect(listMeta(makeEvent())).toBe('残り8名 / 20名　500円');
    expect(listStatus(makeEvent({ remaining: 3 }), NOW)).toEqual({
      label: '残りわずか',
      tone: 'few',
    });
    expect(listStatus(makeEvent(), NOW)).toBeNull();
    expect(scheduleText(makeEvent())).toBe('10/18(日) 10:00〜12:00');
  });
});

describe('求人', () => {
  it('募集人数に達しても受付中', () => {
    const j = makeJob({ reservedQuantity: 5 });
    expect(jobAvailability(j, NOW)).toBe('open');
    expect(isHeadcountReached(j)).toBe(true);
    expect(listStatus(j, NOW)).toEqual({ label: '募集中', tone: 'weak' });
  });
  it('締切後は受付終了', () => {
    expect(jobAvailability(makeJob(), jstDate('2026-10-08 00:00'))).toBe('deadline_passed');
  });
  it('報酬の表示', () => {
    expect(payLabel(makeJob())).toEqual({ unit: '日給', amount: '9,000円' });
    expect(payLabel(makeJob({ payUnit: 'hourly', payAmount: 1100 }))).toEqual({
      unit: '時給',
      amount: '1,100円',
    });
    expect(payLabel(makeJob({ payUnit: null, payText: '応相談' }))).toEqual({
      unit: null,
      amount: '応相談',
    });
    expect(listMeta(makeJob())).toBe('日給 9,000円　5名');
  });
  it('勤務の文字列があれば日時より優先', () => {
    expect(scheduleText(makeJob({ workText: '週2日〜 10:00〜15:00' }))).toBe(
      '週2日〜 10:00〜15:00',
    );
  });
});
