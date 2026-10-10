import { fireEvent, screen } from '@testing-library/react-native';

import ListingsScreen from '@/app/staff/[storeId]/(tabs)/listings';
import { fetchStoreListings } from '@/features/staff/api';
import { makeStaffListing } from '@/test/staffFixtures';
import { mockAuthValue, renderStaff } from '@/test/staffRender';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
  useFocusEffect: jest.fn(),
  usePathname: () => '/staff/store-1/listings',
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/staff/api', () => ({ fetchStoreListings: jest.fn() }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: () => mockAuthValue }));

describe('A-11 掲載一覧', () => {
  it('予約数を右端に出し、状態ピルは公開以外のときだけ', async () => {
    jest.mocked(fetchStoreListings).mockResolvedValue([
      makeStaffListing({ id: 'a', title: '公開中の弁当' }),
      makeStaffListing({
        id: 'b',
        title: '下書きの弁当',
        status: 'draft',
        displayStatus: 'draft',
      }),
    ]);
    await renderStaff(<ListingsScreen />);
    expect(await screen.findByText('公開中の弁当')).toBeTruthy();
    expect(screen.getAllByText('8 / 20食')).toHaveLength(2);
    expect(screen.getByText('下書き')).toBeTruthy();
    expect(screen.queryByText('公開')).toBeNull();
    expect(screen.getByText('2件')).toBeTruthy();
  });

  it('状態で絞り込む', async () => {
    jest.mocked(fetchStoreListings).mockResolvedValue([
      makeStaffListing({ id: 'a', title: '公開中の弁当' }),
      makeStaffListing({
        id: 'b',
        title: '下書きの弁当',
        status: 'draft',
        displayStatus: 'draft',
      }),
    ]);
    await renderStaff(<ListingsScreen />);
    await fireEvent.press(await screen.findByTestId('filter-status'));
    await fireEvent.press(await screen.findByTestId('option-draft'));
    expect(await screen.findByText('1件')).toBeTruthy();
    expect(screen.queryByText('公開中の弁当')).toBeNull();
  });
});
