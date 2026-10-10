import { act, render } from '@testing-library/react-native';
import { router } from 'expo-router';

import { useAuth } from '@/features/auth/AuthProvider';
import { saveNextPath } from '@/features/auth/api';

import { NotificationsBridge } from './NotificationsBridge';
import { registerForPush, subscribeNotificationTaps } from './push';

jest.mock('expo-router', () => ({ router: { push: jest.fn() } }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/auth/api', () => ({ saveNextPath: jest.fn().mockResolvedValue(undefined) }));
jest.mock('./push', () => ({
  configureNotificationHandler: jest.fn(),
  registerForPush: jest.fn().mockResolvedValue('registered'),
  subscribeNotificationTaps: jest.fn(() => () => {}),
}));

const ID = '00000000-0000-4000-8000-000000000101';

function auth(o: { signedIn: boolean; enabled?: boolean; loading?: boolean }) {
  jest.mocked(useAuth).mockReturnValue({
    session: o.signedIn ? ({ user: { id: 'u-1' } } as never) : null,
    profile: o.signedIn
      ? {
          id: 'u-1',
          name: '栗橋 花子',
          phone: '09012345678',
          email: 'a@b.jp',
          pending_email: null,
          notifications_enabled: o.enabled ?? true,
          is_staff: false,
        }
      : null,
    isRegistered: o.signedIn,
    loading: o.loading ?? false,
    refreshProfile: jest.fn(),
    signOut: jest.fn(),
  });
}

/** 登録されたタップの受け口を取り出す */
function tapHandler(): (data: unknown, id: string) => void {
  return jest.mocked(subscribeNotificationTaps).mock.calls[0][0];
}

beforeEach(() => jest.clearAllMocks());

describe('NotificationsBridge', () => {
  it('ログイン済みで通知オンなら、端末を 1 回だけ登録する', async () => {
    auth({ signedIn: true });
    const { rerender } = await render(<NotificationsBridge />);
    await rerender(<NotificationsBridge />);
    expect(registerForPush).toHaveBeenCalledTimes(1);
  });

  it('通知オフなら登録しない', async () => {
    auth({ signedIn: true, enabled: false });
    await render(<NotificationsBridge />);
    expect(registerForPush).not.toHaveBeenCalled();
  });

  it('タップで該当画面を開く。同じ通知は二度開かない', async () => {
    auth({ signedIn: true });
    await render(<NotificationsBridge />);
    await act(async () => {
      tapHandler()({ url: `/bookings/${ID}` }, 'n-1');
      tapHandler()({ url: `/bookings/${ID}` }, 'n-1');
    });
    expect(router.push).toHaveBeenCalledTimes(1);
    expect(router.push).toHaveBeenCalledWith(`/bookings/${ID}`);
  });

  it('未ログインなら戻り先を保存してログインへ', async () => {
    auth({ signedIn: false });
    await render(<NotificationsBridge />);
    await act(async () => {
      tapHandler()({ url: `/bookings/${ID}` }, 'n-2');
    });
    expect(saveNextPath).toHaveBeenCalledWith(`/bookings/${ID}`);
    expect(router.push).toHaveBeenCalledWith('/auth/login');
  });

  it('起動直後のタップは、セッションの復元を待ってから開く（ログイン画面に送らない）', async () => {
    auth({ signedIn: false, loading: true });
    const { rerender } = await render(<NotificationsBridge />);
    await act(async () => {
      tapHandler()({ url: `/bookings/${ID}` }, 'n-4');
    });
    expect(router.push).not.toHaveBeenCalled();
    expect(saveNextPath).not.toHaveBeenCalled();
    auth({ signedIn: true });
    await rerender(<NotificationsBridge />);
    expect(router.push).toHaveBeenCalledWith(`/bookings/${ID}`);
    expect(saveNextPath).not.toHaveBeenCalled();
  });

  it('想定外の URL は開かない', async () => {
    auth({ signedIn: true });
    await render(<NotificationsBridge />);
    await act(async () => {
      tapHandler()({ url: 'https://example.com' }, 'n-3');
    });
    expect(router.push).not.toHaveBeenCalled();
  });
});
