import { screen } from '@testing-library/react-native';

import StaffListingDetailScreen from '@/app/staff/[storeId]/listings/[id]';
import { fetchListingBookings, fetchStaffListing } from '@/features/staff/api';
import { makeRow, makeStaffListing } from '@/test/staffFixtures';
import { mockAuthValue, renderStaff } from '@/test/staffRender';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true, navigate: jest.fn() },
  useFocusEffect: jest.fn(),
  useLocalSearchParams: () => ({ storeId: 'store-1', id: 'listing-1' }),
  usePathname: () => '/staff/store-1/listings/listing-1',
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => mockAuthValue }));
jest.mock('@/hooks/useNow', () => ({
  useNow: () => jest.requireActual('@/test/fixtures').NOW,
}));
jest.mock('@/features/staff/api', () => ({
  ...jest.requireActual('@/features/staff/api'),
  fetchStaffListing: jest.fn(),
  fetchListingBookings: jest.fn(),
}));

describe('A-11 掲載詳細', () => {
  it('お得は予約の件数と合計金額を出す（キャンセルは除く）', async () => {
    jest.mocked(fetchStaffListing).mockResolvedValue(makeStaffListing({ id: 'listing-1' }));
    jest
      .mocked(fetchListingBookings)
      .mockResolvedValue([
        makeRow({ id: 'b1', number: '0001' }),
        makeRow({ id: 'b2', number: '0002', amount: 600, status: 'completed' }),
        makeRow({ id: 'b3', number: '0003', amount: 5000, status: 'cancelled' }),
      ]);
    await renderStaff(<StaffListingDetailScreen />);
    expect(await screen.findByTestId('listing-total')).toHaveTextContent('予約 2件　合計 1,800円');
  });

  it('予約がなければ合計は出さない', async () => {
    jest.mocked(fetchStaffListing).mockResolvedValue(makeStaffListing({ id: 'listing-1' }));
    jest.mocked(fetchListingBookings).mockResolvedValue([]);
    await renderStaff(<StaffListingDetailScreen />);
    expect(await screen.findByText('まだ予約はありません')).toBeTruthy();
    expect(screen.queryByTestId('listing-total')).toBeNull();
  });
});
