import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Linking } from 'react-native';

import MyPageScreen from '@/app/(tabs)/mypage';
import { useAuth } from '@/features/auth/AuthProvider';
import { setNotificationsEnabled } from '@/features/auth/api';
import { getPushPermission, registerForPush } from '@/features/notifications/push';
import { renderScreen } from '@/test/render';

jest.mock('expo-router', () => ({
  router: { push: jest.fn() },
  useLocalSearchParams: () => ({}),
  // 画面を開いたときの処理をそのまま走らせる
  useFocusEffect: (cb: () => void | (() => void)) => {
    const { useEffect } = jest.requireActual<typeof import('react')>('react');
    useEffect(cb, [cb]);
  },
}));
jest.mock('@/lib/supabase', () => ({ supabase: {} }));
jest.mock('@/features/auth/AuthProvider', () => ({ useAuth: jest.fn() }));
jest.mock('@/features/auth/api', () => ({
  setNotificationsEnabled: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/features/notifications/push', () => ({
  registerForPush: jest.fn(),
  getPushPermission: jest.fn().mockResolvedValue('granted'),
}));

/** ログイン済み・登録済みの利用者。refreshProfile で保存した値が profile に反映される */
function mockAuth(enabled: boolean) {
  const state = { enabled };
  jest.mocked(useAuth).mockImplementation(() => ({
    session: { user: { id: 'u-1' } } as never,
    profile: {
      id: 'u-1',
      name: '栗橋 花子',
      phone: '09012345678',
      email: 'a@b.jp',
      pending_email: null,
      notifications_enabled: state.enabled,
      is_staff: false,
    },
    isRegistered: true,
    loading: false,
    refreshProfile: jest.fn(async () => {
      state.enabled = jest.mocked(setNotificationsEnabled).mock.lastCall?.[1] ?? state.enabled;
      return null;
    }),
    signOut: jest.fn(),
  }));
}

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(getPushPermission).mockResolvedValue('granted');
  mockAuth(false);
});

describe('U-30 通知スイッチ', () => {
  it('オンにすると保存して端末を登録する', async () => {
    jest.mocked(registerForPush).mockResolvedValue('registered');
    await renderScreen(<MyPageScreen />);
    await fireEvent(screen.getByLabelText('お知らせ通知'), 'valueChange', true);
    await waitFor(() => expect(registerForPush).toHaveBeenCalled());
    expect(setNotificationsEnabled).toHaveBeenCalledWith('u-1', true);
  });

  it('オンにしたとき端末で拒否されていたら、案内と「設定を開く」を出す', async () => {
    jest.mocked(registerForPush).mockResolvedValue('denied');
    await renderScreen(<MyPageScreen />);
    expect(screen.queryByText('端末の設定で通知が許可されていません。')).toBeNull();
    jest.mocked(getPushPermission).mockResolvedValue('denied');
    await fireEvent(screen.getByLabelText('お知らせ通知'), 'valueChange', true);
    expect(await screen.findByText('端末の設定で通知が許可されていません。')).toBeTruthy();
    const open = jest.spyOn(Linking, 'openSettings').mockResolvedValue();
    fireEvent.press(screen.getByText('設定を開く'));
    expect(open).toHaveBeenCalled();
  });

  it('スイッチがオンでも端末で拒否されていれば、開いた時点で案内を出す', async () => {
    mockAuth(true);
    jest.mocked(getPushPermission).mockResolvedValue('denied');
    await renderScreen(<MyPageScreen />);
    expect(await screen.findByText('端末の設定で通知が許可されていません。')).toBeTruthy();
  });

  it('スイッチがオフなら端末で拒否されていても案内を出さない', async () => {
    jest.mocked(getPushPermission).mockResolvedValue('denied');
    await renderScreen(<MyPageScreen />);
    await waitFor(() => expect(getPushPermission).toHaveBeenCalled());
    expect(screen.queryByText('端末の設定で通知が許可されていません。')).toBeNull();
  });

  it('オフでは端末の登録をしない', async () => {
    await renderScreen(<MyPageScreen />);
    await fireEvent(screen.getByLabelText('お知らせ通知'), 'valueChange', false);
    await waitFor(() => expect(setNotificationsEnabled).toHaveBeenCalledWith('u-1', false));
    expect(registerForPush).not.toHaveBeenCalled();
  });
});
