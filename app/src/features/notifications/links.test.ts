import { notificationUrl } from './links';

const ID = '00000000-0000-4000-8000-000000000101';

describe('notificationUrl', () => {
  it('予約・お知らせ・掲載の画面だけ開く', () => {
    expect(notificationUrl({ url: `/bookings/${ID}` })).toBe(`/bookings/${ID}`);
    expect(notificationUrl({ url: `/notices/${ID}` })).toBe(`/notices/${ID}`);
    expect(notificationUrl({ url: `/listings/${ID}` })).toBe(`/listings/${ID}`);
    expect(notificationUrl({ url: '/' })).toBe('/');
  });
  it('外部の URL や想定外のパスは開かない', () => {
    expect(notificationUrl({ url: 'https://example.com' })).toBeNull();
    expect(notificationUrl({ url: '/staff' })).toBeNull();
    expect(notificationUrl({ url: `/bookings/${ID}/../../staff` })).toBeNull();
    expect(notificationUrl({})).toBeNull();
    expect(notificationUrl(null)).toBeNull();
  });
});
