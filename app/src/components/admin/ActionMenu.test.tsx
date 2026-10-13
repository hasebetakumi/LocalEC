import { fireEvent, render, screen } from '@testing-library/react-native';
import { ActionSheetIOS } from 'react-native';

import { renderScreen } from '@/test/render';

import { ActionMenuIos, ActionMenuSheet, CANCEL_LABEL } from './ActionMenu';

const items = [
  { key: 'edit', label: '編集', onPress: jest.fn() },
  { key: 'delete', label: '削除', danger: true, onPress: jest.fn() },
];

const spyShow = () =>
  jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation(() => {});

beforeEach(() => jest.clearAllMocks());

describe('ActionMenuIos（OS 標準のアクションシート）', () => {
  it('開くと項目＋キャンセルを渡し、危険な項目は赤字の指定になる', async () => {
    const spy = spyShow();
    await render(<ActionMenuIos visible title="日替わり弁当" items={items} onClose={jest.fn()} />);
    expect(spy).toHaveBeenCalledTimes(1);
    const [options] = spy.mock.calls[0]!;
    expect(options.options).toEqual(['編集', '削除', CANCEL_LABEL]);
    expect(options.cancelButtonIndex).toBe(2);
    expect(options.destructiveButtonIndex).toEqual([1]);
    expect(options.title).toBe('日替わり弁当');
  });

  it('項目を選ぶと閉じてから処理が走り、キャンセルでは処理が走らない', async () => {
    const spy = spyShow();
    const onClose = jest.fn();
    await render(<ActionMenuIos visible items={items} onClose={onClose} />);
    expect(spy).toHaveBeenCalledTimes(1);
    const callback = spy.mock.calls[0]![1];
    callback(1);
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(items[1]!.onPress).toHaveBeenCalledTimes(1);
    callback(2);
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(items[0]!.onPress).not.toHaveBeenCalled();
    expect(items[1]!.onPress).toHaveBeenCalledTimes(1);
  });

  it('閉じている間はシートを出さない', async () => {
    const spy = spyShow();
    await render(<ActionMenuIos visible={false} items={items} onClose={jest.fn()} />);
    expect(spy).not.toHaveBeenCalled();
  });
});

describe('ActionMenuSheet（Android・Web の下シート）', () => {
  it('見出しと項目を行で出す', async () => {
    await renderScreen(
      <ActionMenuSheet visible title="操作" items={items} onClose={jest.fn()} testID="m" />,
    );
    expect(await screen.findByText('操作')).toBeTruthy();
    expect(screen.getByTestId('menu-edit')).toBeTruthy();
    expect(screen.getByTestId('menu-delete')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('menu-edit'));
  });
});
