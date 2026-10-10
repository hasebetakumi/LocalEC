import { fireEvent, screen } from '@testing-library/react-native';

import BookingsScreen from '@/app/(tabs)/bookings';
import { useAuth } from '@/features/auth/AuthProvider';
import { fetchMyBookings } from '@/features/bookings/api';
import { liveBooking } from '@/test/bookingFixtures';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), navigate: jest.fn() },
  useFocusEffect: jest.fn(),
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/bookings/api', () => ({ fetchMyBookings: jest.fn() }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));

const mockFetch = jest.mocked(fetchMyBookings);
const auth = (signedIn: boolean) =>
  jest.mocked(useAuth).mockReturnValue({
    session: signedIn ? ({ user: { id: 'u-1' } } as never) : null,
    profile: null,
    isRegistered: signedIn,
    loading: false,
    refreshProfile: jest.fn(),
    signOut: jest.fn(),
  });

beforeEach(() => jest.clearAllMocks());

describe('U-22 予約・申込', () => {
  it('予約・申し込み中は今日の見出しの下に番号つきで並ぶ', async () => {
    auth(true);
    mockFetch.mockResolvedValue([liveBooking()]);
    await renderScreen(<BookingsScreen />);
    expect(await screen.findByText('日替わり弁当　2食')).toBeTruthy();
    expect(screen.getByText('0427')).toBeTruthy();
    expect(screen.getByText('予約済み')).toBeTruthy();
  });

  it('履歴にはキャンセルが灰のピルで並ぶ', async () => {
    auth(true);
    mockFetch.mockResolvedValue([
      liveBooking({ id: 'c', number: '0377', status: 'cancelled', cancelledAt: new Date() }),
    ]);
    await renderScreen(<BookingsScreen />);
    await fireEvent.press(await screen.findByText('履歴'));
    expect(await screen.findByText('キャンセル')).toBeTruthy();
    expect(screen.getByText(/^\d+\/\d+\(.\) キャンセル$/)).toBeTruthy();
  });

  it('予約がなければ空状態', async () => {
    auth(true);
    mockFetch.mockResolvedValue([]);
    await renderScreen(<BookingsScreen />);
    expect(await screen.findByText('予約・申し込みはまだありません')).toBeTruthy();
  });

  it('未ログインならログインへの案内', async () => {
    auth(false);
    await renderScreen(<BookingsScreen />);
    expect(screen.getByText('ログインすると予約・申し込みが表示されます')).toBeTruthy();
    expect(mockFetch).not.toHaveBeenCalled();
  });
});
