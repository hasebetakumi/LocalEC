import { registerForPush, subscribeNotificationTaps, unregisterPush } from './push.web';

describe('Web 版のプッシュ（要件：Web は通知なし）', () => {
  it('登録は unavailable、解除とタップの購読は何もしない', async () => {
    await expect(registerForPush()).resolves.toBe('unavailable');
    await expect(unregisterPush()).resolves.toBeUndefined();
    const onTap = jest.fn();
    subscribeNotificationTaps(onTap)();
    expect(onTap).not.toHaveBeenCalled();
  });
});
