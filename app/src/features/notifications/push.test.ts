import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

import {
  configureNotificationHandler,
  getPushPermission,
  registerForPush,
  subscribeNotificationTaps,
  unregisterPush,
} from './push';

const mockIsDevice = jest.fn(() => true);
jest.mock('expo-device', () => ({
  get isDevice() {
    return mockIsDevice();
  },
}));
const mockIsExpoGo = jest.fn(() => false);
jest.mock('expo', () => ({ isRunningInExpoGo: () => mockIsExpoGo() }));
jest.mock('expo-constants', () => ({ expoConfig: { extra: { eas: { projectId: 'project-1' } } } }));
jest.mock('expo-notifications', () => ({
  setNotificationHandler: jest.fn(),
  setNotificationChannelAsync: jest.fn(),
  getPermissionsAsync: jest.fn(),
  requestPermissionsAsync: jest.fn(),
  getExpoPushTokenAsync: jest.fn(),
  addNotificationResponseReceivedListener: jest.fn(),
  getLastNotificationResponseAsync: jest.fn(),
  AndroidImportance: { DEFAULT: 3 },
}));
const mockDelete = jest.fn();
jest.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: jest.fn(),
    from: jest.fn(() => ({ delete: () => ({ eq: (...args: unknown[]) => mockDelete(...args) }) })),
  },
}));

const N = jest.mocked(Notifications);

beforeEach(async () => {
  jest.clearAllMocks();
  await AsyncStorage.clear();
  mockIsDevice.mockReturnValue(true);
  mockIsExpoGo.mockReturnValue(false);
});

describe('getPushPermission', () => {
  it('端末の許可状態をダイアログなしで返す', async () => {
    N.getPermissionsAsync.mockResolvedValue({ status: 'denied' } as never);
    await expect(getPushPermission()).resolves.toBe('denied');
    N.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
    await expect(getPushPermission()).resolves.toBe('granted');
    N.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as never);
    await expect(getPushPermission()).resolves.toBe('undetermined');
    expect(N.requestPermissionsAsync).not.toHaveBeenCalled();
  });

  it('シミュレータでは unavailable', async () => {
    mockIsDevice.mockReturnValue(false);
    await expect(getPushPermission()).resolves.toBe('unavailable');
    expect(N.getPermissionsAsync).not.toHaveBeenCalled();
  });
});

describe('registerForPush', () => {
  it('許可済みならトークンを登録して端末に覚える', async () => {
    N.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
    N.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]', type: 'expo' });
    jest.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
    await expect(registerForPush()).resolves.toBe('registered');
    expect(N.getExpoPushTokenAsync).toHaveBeenCalledWith({ projectId: 'project-1' });
    expect(supabase.rpc).toHaveBeenCalledWith('register_push_token', {
      p_token: 'ExponentPushToken[abc]',
      p_platform: 'ios',
    });
    expect(await AsyncStorage.getItem('push.token')).toBe('ExponentPushToken[abc]');
  });

  it('許可を求めて拒否されたら denied（登録しない）', async () => {
    N.getPermissionsAsync.mockResolvedValue({ status: 'undetermined' } as never);
    N.requestPermissionsAsync.mockResolvedValue({ status: 'denied' } as never);
    await expect(registerForPush()).resolves.toBe('denied');
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('シミュレータでは何もしない', async () => {
    mockIsDevice.mockReturnValue(false);
    await expect(registerForPush()).resolves.toBe('unavailable');
    expect(N.getPermissionsAsync).not.toHaveBeenCalled();
  });

  it('トークンが取れなくても（Android の Expo Go など）例外にしない', async () => {
    N.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
    N.getExpoPushTokenAsync.mockRejectedValue(new Error('not supported'));
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    await expect(registerForPush()).resolves.toBe('unavailable');
    warn.mockRestore();
  });
});

describe('Android の Expo Go', () => {
  // expo-notifications は import しただけで例外になるので、どの関数からも触らない
  beforeEach(() => {
    jest.replaceProperty(Platform, 'OS', 'android');
    mockIsExpoGo.mockReturnValue(true);
  });
  afterEach(() => jest.restoreAllMocks());

  it('許可も登録も unavailable で、expo-notifications を呼ばない', async () => {
    await expect(getPushPermission()).resolves.toBe('unavailable');
    await expect(registerForPush()).resolves.toBe('unavailable');
    expect(N.setNotificationChannelAsync).not.toHaveBeenCalled();
    expect(N.getPermissionsAsync).not.toHaveBeenCalled();
    expect(supabase.rpc).not.toHaveBeenCalled();
  });

  it('通知の表示設定とタップの購読は何もしない', () => {
    configureNotificationHandler();
    const unsubscribe = subscribeNotificationTaps(jest.fn());
    unsubscribe();
    expect(N.setNotificationHandler).not.toHaveBeenCalled();
    expect(N.addNotificationResponseReceivedListener).not.toHaveBeenCalled();
  });

  it('開発ビルドの Android ではチャンネルを作ってから登録する', async () => {
    mockIsExpoGo.mockReturnValue(false);
    N.getPermissionsAsync.mockResolvedValue({ status: 'granted' } as never);
    N.getExpoPushTokenAsync.mockResolvedValue({ data: 'ExponentPushToken[abc]', type: 'expo' });
    jest.mocked(supabase.rpc).mockResolvedValue({ error: null } as never);
    await expect(registerForPush()).resolves.toBe('registered');
    expect(N.setNotificationChannelAsync).toHaveBeenCalled();
    expect(supabase.rpc).toHaveBeenCalledWith('register_push_token', {
      p_token: 'ExponentPushToken[abc]',
      p_platform: 'android',
    });
  });
});

describe('unregisterPush', () => {
  it('覚えているトークンを DB から消す', async () => {
    await AsyncStorage.setItem('push.token', 'ExponentPushToken[abc]');
    await unregisterPush();
    expect(supabase.from).toHaveBeenCalledWith('push_tokens');
    expect(mockDelete).toHaveBeenCalledWith('token', 'ExponentPushToken[abc]');
    expect(await AsyncStorage.getItem('push.token')).toBeNull();
  });
  it('トークンがなければ何もしない', async () => {
    await unregisterPush();
    expect(supabase.from).not.toHaveBeenCalled();
  });
});
