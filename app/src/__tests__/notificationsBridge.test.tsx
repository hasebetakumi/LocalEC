import { render } from '@testing-library/react-native';

import { useAuth } from '@/features/auth/AuthProvider';
import { NotificationsBridge } from '@/features/notifications/NotificationsBridge';
import { registerForPush } from '@/features/notifications/push';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/auth/api', () => ({ saveNextPath: jest.fn().mockResolvedValue(undefined) }));
jest.mock('@/features/notifications/push', () => ({
  configureNotificationHandler: jest.fn(),
  registerForPush: jest.fn().mockResolvedValue('registered'),
  subscribeNotificationTaps: jest.fn(() => () => {}),
}));

function mockAuth(userId: string | null, enabled = true) {
  jest.mocked(useAuth).mockReturnValue({
    session: userId ? ({ user: { id: userId } } as never) : null,
    profile: userId
      ? {
          id: userId,
          name: '栗橋 花子',
          phone: '09012345678',
          email: 'a@b.jp',
          pending_email: null,
          notifications_enabled: enabled,
          is_staff: false,
        }
      : null,
    isRegistered: userId !== null,
    loading: false,
    refreshProfile: jest.fn(async () => null),
    signOut: jest.fn(),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('NotificationsBridge の端末登録', () => {
  it('ログイン済みで通知オンなら起動時に 1 回だけ登録する', async () => {
    mockAuth('u-1');
    const { rerender } = await render(<NotificationsBridge />);
    await rerender(<NotificationsBridge />);
    expect(registerForPush).toHaveBeenCalledTimes(1);
  });

  it('通知オフなら登録しない', async () => {
    mockAuth('u-1', false);
    await render(<NotificationsBridge />);
    expect(registerForPush).not.toHaveBeenCalled();
  });

  it('ログアウトしてから同じ人でログインし直すと、もう一度登録する', async () => {
    mockAuth('u-1');
    const { rerender } = await render(<NotificationsBridge />);
    expect(registerForPush).toHaveBeenCalledTimes(1);

    // ログアウト（端末トークンは DB から消えている）
    mockAuth(null);
    await rerender(<NotificationsBridge />);

    // 同じ人で再ログイン
    mockAuth('u-1');
    await rerender(<NotificationsBridge />);
    expect(registerForPush).toHaveBeenCalledTimes(2);
  });
});
