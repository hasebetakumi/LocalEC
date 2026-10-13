import { fireEvent, screen } from '@testing-library/react-native';

import StoreSelectScreen from '@/app/staff/index';
import { fetchStoreSummaries, searchBookings } from '@/features/staff/api';
import { makeRow } from '@/test/staffFixtures';
import { mockAuthValue, renderStaff, summary } from '@/test/staffRender';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => mockAuthValue }));
jest.mock('@/features/staff/api', () => ({
  fetchStoreSummaries: jest.fn(),
  searchBookings: jest.fn(),
}));

describe('A-01 店舗を選ぶ', () => {
  it('店舗ごとの件数と、全店舗の番号検索', async () => {
    jest.mocked(fetchStoreSummaries).mockResolvedValue([
      summary,
      {
        ...summary,
        id: 'store-2',
        name: 'コインランドリー あけぼの',
        publishedCount: 0,
        scheduledCount: 1,
        todayCount: 0,
      },
    ]);
    jest.mocked(searchBookings).mockResolvedValue([makeRow({ number: '0427' })]);
    await renderStaff(<StoreSelectScreen />);
    expect(await screen.findByText('公開中の掲載 7件')).toBeTruthy();
    expect(screen.getByText('本日の予定 5件')).toBeTruthy();
    expect(screen.getByText('公開予定の掲載 1件')).toBeTruthy();
    expect(screen.getByText('本日の予定 なし')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('global-number-search'), '04');
    expect(await screen.findByText('0427')).toBeTruthy();
    expect(jest.mocked(searchBookings).mock.calls[0]).toEqual(['04', {}]);
  });
});
