import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { router } from 'expo-router';

import BookScreen from '@/app/listings/[id]/book';
import { useAuth } from '@/features/auth/AuthProvider';
import { BookingError, createBooking } from '@/features/bookings/api';
import { fetchListing } from '@/features/listings/api';
import { liveProduct } from '@/test/fixturesRelative';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'p-1' }),
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/listings/api', () => ({ fetchListing: jest.fn() }));
jest.mock('@/features/auth/api', () => ({ saveNextPath: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/bookings/api', () => {
  const actual = jest.requireActual('@/features/bookings/api');
  return { ...actual, createBooking: jest.fn() };
});

const mockFetchProduct = jest.mocked(fetchListing);
const mockCreateBooking = jest.mocked(createBooking);

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    session: { user: { id: 'u-1' } } as never,
    profile: null,
    isRegistered: true,
    loading: false,
    refreshProfile: jest.fn(),
    signOut: jest.fn(),
  });
});

describe('U-20 数量選択', () => {
  it('＋で合計が増え、残りに達すると＋が押せず理由が出る', async () => {
    mockFetchProduct.mockResolvedValue(liveProduct({ remaining: 2, price: 600 }));
    await renderScreen(<BookScreen />);
    expect(await screen.findByTestId('book-total')).toHaveTextContent('600円');
    await fireEvent.press(screen.getByTestId('stepper-inc'));
    expect(screen.getByTestId('book-total')).toHaveTextContent('1,200円');
    expect(screen.getByTestId('limit-message')).toHaveTextContent(
      '残りが2食のため、これ以上は選べません',
    );
    expect(screen.getByTestId('stepper-inc').props.accessibilityState).toMatchObject({
      disabled: true,
    });
  });

  it('確定すると完了画面へ', async () => {
    mockFetchProduct.mockResolvedValue(liveProduct({ remaining: 5 }));
    mockCreateBooking.mockResolvedValue({ id: 'b-1', number: '0427' });
    await renderScreen(<BookScreen />);
    await fireEvent.press(await screen.findByTestId('confirm-booking'));
    await waitFor(() =>
      expect(router.replace).toHaveBeenCalledWith({
        pathname: '/bookings/[id]/done',
        params: { id: 'b-1' },
      }),
    );
    expect(mockCreateBooking).toHaveBeenCalledWith('p-1', 1);
  });

  it('確定の瞬間に売り切れたら、最新の残りで理由を出す', async () => {
    mockFetchProduct
      .mockResolvedValueOnce(liveProduct({ remaining: 3 }))
      .mockResolvedValue(liveProduct({ remaining: 0 }));
    mockCreateBooking.mockRejectedValue(new BookingError('sold_out'));
    await renderScreen(<BookScreen />);
    await fireEvent.press(await screen.findByTestId('confirm-booking'));
    expect(await screen.findByTestId('book-error')).toHaveTextContent(
      '売り切れのため、予約できません。',
    );
  });
});
