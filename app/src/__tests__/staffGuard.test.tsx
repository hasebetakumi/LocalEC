import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen } from '@testing-library/react-native';

import StaffLayout from '@/app/staff/_layout';
import { peekNextPath, saveNextPath } from '@/features/auth/api';
import { useAuth } from '@/features/auth/AuthProvider';
import { renderScreen } from '@/test/render';

const mockPathname = jest.fn(() => '/staff/store-1/bookings/b-1');

jest.mock('expo-router', () => {
  function Stack() {
    return null;
  }
  Stack.Screen = function Screen() {
    return null;
  };
  return {
    Redirect: function Redirect({ href }: { href: string }) {
      const { Text: RNText } = jest.requireActual('react-native');
      return <RNText testID="redirect">{href}</RNText>;
    },
    Stack,
    router: { replace: jest.fn() },
    usePathname: () => mockPathname(),
  };
});
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));

const auth = (signedIn: boolean) =>
  jest.mocked(useAuth).mockReturnValue({
    session: signedIn ? ({ user: { id: 'staff-1' } } as never) : null,
    profile: signedIn
      ? {
          id: 'staff-1',
          name: '山田 太郎',
          phone: '09011112222',
          email: 'staff@example.com',
          pending_email: null,
          notifications_enabled: true,
          is_staff: true,
        }
      : null,
    isRegistered: signedIn,
    loading: false,
    refreshProfile: jest.fn(),
    signOut: jest.fn(),
  });

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
});

describe('運営画面のガード', () => {
  it('未ログインで深い URL を開いたら、その URL を戻り先にしてログインへ', async () => {
    auth(false);
    await renderScreen(<StaffLayout />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/auth/login');
    expect(await peekNextPath()).toBe('/staff/store-1/bookings/b-1');
  });

  it('画面にいる間にログアウトしたら、戻り先を残さない', async () => {
    auth(true);
    // ログイン中は Stack（モックでは何も描かない）だけなので、プロバイダーなしで同じ画面を描き直せる
    const view = await render(<StaffLayout />);
    expect(screen.queryByTestId('redirect')).toBeNull();
    auth(false);
    await view.rerender(<StaffLayout />);
    expect(screen.getByTestId('redirect')).toHaveTextContent('/auth/login');
    expect(await peekNextPath()).toBeNull();
  });

  it('裏に残ったガードは、画面遷移しても戻り先を上書きしない', async () => {
    auth(false);
    const view = await render(<StaffLayout />);
    expect(await peekNextPath()).toBe('/staff/store-1/bookings/b-1');
    // マイページの「ログイン・新規登録」が戻り先を保存し、ログイン画面へ進む
    await saveNextPath('/mypage');
    mockPathname.mockReturnValue('/auth/login');
    await view.rerender(<StaffLayout />);
    expect(await peekNextPath()).toBe('/mypage');
  });
});
