import { View } from 'react-native';

import { AdminTextField, Field, MultiSelectChips } from '@/components/admin/Fields';

import { PAYMENT_OPTIONS, type StoreFormErrors, type StoreFormValue } from '../storeForm';

/** 店舗の入力欄（店舗の追加・A-02 店舗情報で共通） */
export function StoreFields({
  value,
  errors,
  onChange,
}: {
  value: StoreFormValue;
  errors: StoreFormErrors;
  onChange: (value: StoreFormValue) => void;
}) {
  const set = <K extends keyof StoreFormValue>(key: K, v: StoreFormValue[K]) =>
    onChange({ ...value, [key]: v });
  return (
    <View style={{ gap: 14 }}>
      <AdminTextField
        label="店舗名"
        required
        placeholder="例：カフェ あけぼの 栗橋店"
        value={value.name}
        onChangeText={(t) => set('name', t)}
        error={errors.name}
      />
      <AdminTextField
        label="住所"
        required
        placeholder="久喜市栗橋…"
        value={value.address}
        onChangeText={(t) => set('address', t)}
        hint="利用者の「地図アプリで開く」はこの住所で検索します"
        error={errors.address}
      />
      <AdminTextField
        label="電話番号"
        required
        placeholder="0480-00-0000"
        keyboardType="phone-pad"
        value={value.phone}
        onChangeText={(t) => set('phone', t)}
        hint="キャンセル期限後の予約詳細に、お客さまへの連絡先として表示します"
        error={errors.phone}
      />
      <AdminTextField
        label="営業時間"
        placeholder="例：月〜金 8:00〜17:00"
        value={value.hoursText}
        onChangeText={(t) => set('hoursText', t)}
        multiline
        minHeight={80}
      />
      <Field label="支払い方法（複数選択）" required error={errors.paymentMethods}>
        <MultiSelectChips
          options={PAYMENT_OPTIONS}
          values={value.paymentMethods}
          onChange={(v) => set('paymentMethods', v)}
        />
      </Field>
    </View>
  );
}
