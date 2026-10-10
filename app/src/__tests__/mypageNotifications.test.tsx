import { fireEvent, screen, waitFor } from '@testing-library/react-native';

import MyPageScreen from '@/app/(tabs)/mypage';
import { useAuth } from '@/features/auth/AuthProvider';
import { setNotificationsEnabled } from '@/features/auth/api';
import { registerForPush } from '@/features/notifications/push';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({}),
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/auth/api', () => ({
  setNotificationsEnabled: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/features/notifications/push', () => ({ registerForPush: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(useAuth).mockReturnValue({
    session: { user: { id: 'u-1' } } as never,
    profile: {
      id: 'u-1',
      name: '栗橋 花子',
      phone: '09012345678',
      email: 'a@b.jp',
      pending_email: null,
      notifications_enabled: false,
      is_staff: false,
    },
    isRegistered: true,
    loading: false,
    refreshProfile: jest.fn().mockResolvedValue(null),
    signOut: jest.fn(),
  });
});

describe('U-30 通知スイッチ', () => {
  it('オンにすると保存して端末を登録する', async () => {
    jest.mocked(registerForPush).mockResolvedValue('registered');
    await renderScreen(<MyPageScreen />);
    await fireEvent(screen.getByLabelText('お知らせ通知'), 'valueChange', true);
    await waitFor(() => expect(registerForPush).toHaveBeenCalled());
    expect(setNotificationsEnabled).toHaveBeenCalledWith('u-1', true);
  });

  it('端末で拒否されていたら案内を出す', async () => {
    jest.mocked(registerForPush).mockResolvedValue('denied');
    await renderScreen(<MyPageScreen />);
    await fireEvent(screen.getByLabelText('お知らせ通知'), 'valueChange', true);
    expect(
      await screen.findByText('端末の設定で、このアプリの通知を許可してください。'),
    ).toBeTruthy();
  });

  it('オフでは端末の登録をしない', async () => {
    await renderScreen(<MyPageScreen />);
    await fireEvent(screen.getByLabelText('お知らせ通知'), 'valueChange', false);
    await waitFor(() => expect(setNotificationsEnabled).toHaveBeenCalledWith('u-1', false));
    expect(registerForPush).not.toHaveBeenCalled();
  });
});
