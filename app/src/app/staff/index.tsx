import { EmptyState } from '@/components/EmptyState';
import { NavBar, Screen } from '@/components/Screen';

/** スタッフメニューの入口（運営画面 A-01 の実装時に置き換える） */
export default function StaffMenuScreen() {
  return (
    <Screen>
      <NavBar title="スタッフメニュー" />
      <EmptyState
        icon="tag"
        title="運営画面は準備中です"
        body="掲載の入力や受け取り処理は、この画面から行えるようになります。"
      />
    </Screen>
  );
}
