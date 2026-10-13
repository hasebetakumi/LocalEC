import { fireEvent, screen } from '@testing-library/react-native';
import { router } from 'expo-router';

import ProductDetailScreen from '@/app/listings/[id]/index';
import { useAuth } from '@/features/auth/AuthProvider';
import { saveNextPath } from '@/features/auth/api';
import { fetchListing } from '@/features/listings/api';
import { liveProduct } from '@/test/fixturesRelative';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({
  router: { push: jest.fn(), back: jest.fn(), canGoBack: () => true, replace: jest.fn() },
  useLocalSearchParams: () => ({ id: 'p-1' }),
}));
jest.mock('@/features/listings/api', () => ({ fetchListing: jest.fn() }));
jest.mock('@/features/auth/api', () => ({ saveNextPath: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));

const mockFetchProduct = jest.mocked(fetchListing);
const mockUseAuth = jest.mocked(useAuth);

function signedIn(isRegistered: boolean) {
  mockUseAuth.mockReturnValue({
    session: { user: { id: 'u-1' } } as never,
    profile: null,
    isRegistered,
    loading: false,
    refreshProfile: jest.fn(),
    signOut: jest.fn(),
  });
}

function signedOut() {
  mockUseAuth.mockReturnValue({
    session: null,
    profile: null,
    isRegistered: false,
    loading: false,
    refreshProfile: jest.fn(),
    signOut: jest.fn(),
  });
}

beforeEach(() => jest.clearAllMocks());

describe('U-12 商品詳細', () => {
  it('受付中なら「予約へ進む」で数量選択へ', async () => {
    signedIn(true);
    mockFetchProduct.mockResolvedValue(liveProduct());
    await renderScreen(<ProductDetailScreen />);
    await fireEvent.press(await screen.findByText('予約へ進む'));
    expect(router.push).toHaveBeenCalledWith({
      pathname: '/listings/[id]/book',
      params: { id: 'p-1' },
    });
  });

  it('未ログインならログインへ。戻り先を保存する', async () => {
    signedOut();
    mockFetchProduct.mockResolvedValue(liveProduct());
    await renderScreen(<ProductDetailScreen />);
    await fireEvent.press(await screen.findByText('予約へ進む'));
    await screen.findByText('予約へ進む');
    expect(saveNextPath).toHaveBeenCalledWith('/listings/p-1/book');
    expect(router.push).toHaveBeenCalledWith('/auth/login');
  });

  it('売り切れはボタンが押せず、理由を表示する', async () => {
    signedIn(true);
    mockFetchProduct.mockResolvedValue(liveProduct({ remaining: 0 }));
    await renderScreen(<ProductDetailScreen />);
    expect(await screen.findByText('売り切れのため、予約できません。')).toBeTruthy();
    const button = screen.getByTestId('go-book');
    expect(button.props.accessibilityState).toMatchObject({ disabled: true });
    expect(screen.getByText('予約できません')).toBeTruthy();
  });

  it('締切後は締切日時を理由に出す', async () => {
    signedIn(true);
    mockFetchProduct.mockResolvedValue(
      liveProduct({ bookingDeadline: new Date(Date.now() - 60_000) }),
    );
    await renderScreen(<ProductDetailScreen />);
    expect(await screen.findByText(/予約の受付は .+ で終了しました。/)).toBeTruthy();
    expect(screen.getByText('予約受付は終了しました')).toBeTruthy();
  });
});
