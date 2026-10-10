import { jstDate, NOW, store1 } from '@/test/fixtures';

import type { Notice } from '@/features/listings/types';

import { isUnread, unreadCount } from './readState';

jest.mock('@react-native-async-storage/async-storage', () => ({}));

function notice(id: string, publishStart: Date): Notice {
  return {
    kind: 'notice',
    id,
    title: 't',
    body: 'b',
    photoUrl: null,
    publishStart,
    publishEnd: jstDate('2026-12-01 00:00'),
    displayStatus: 'published',
    store: store1,
  };
}

describe('お知らせの未読', () => {
  const fresh = notice('a', jstDate('2026-10-03 09:00'));
  const old = notice('b', jstDate('2026-09-01 09:00'));
  it('既読でなく、公開から 30 日以内なら未読', () => {
    expect(isUnread(fresh, [], NOW)).toBe(true);
    expect(isUnread(fresh, ['a'], NOW)).toBe(false);
    expect(isUnread(old, [], NOW)).toBe(false);
  });
  it('未読数', () => {
    expect(unreadCount([fresh, old, notice('c', jstDate('2026-10-04 09:00'))], ['c'], NOW)).toBe(1);
  });
});
