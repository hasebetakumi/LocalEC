import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/Buttons';
import { LoadError, Loading } from '@/components/LoadState';
import { ConfirmSheet } from '@/components/admin/ConfirmSheet';
import { StaffScreen } from '@/components/admin/StaffScreen';
import { StoreHeader } from '@/components/admin/StoreHeader';
import { AdminBand } from '@/components/admin/WarningBox';
import { countPublishedProducts, updateStore } from '@/features/staff/api';
import { StoreFields } from '@/features/staff/components/StoreFields';
import { staffKeys, useStaffMutation, useStore } from '@/features/staff/hooks';
import { useStaffStore } from '@/features/staff/StaffStoreContext';
import {
  isPaymentChanged,
  isStoreFormChanged,
  normalizeStoreForm,
  storeToForm,
  validateStoreForm,
  type StoreFormErrors,
  type StoreFormValue,
} from '@/features/staff/storeForm';
import type { StoreInfo } from '@/features/staff/types';
import { adminSpace } from '@/theme/adminTokens';

/** A-02 店舗情報（常に編集できるフォーム） */
export default function StoreInfoScreen() {
  const summary = useStaffStore();
  const store = useStore(summary.id);

  return (
    <StaffScreen>
      <StoreHeader pcTitle="店舗情報" storeName={summary.name} />
      {store.isPending ? (
        <Loading />
      ) : store.isError || !store.data ? (
        <LoadError onRetry={() => void store.refetch()} />
      ) : (
        // 保存して元の値が変わったらフォームを作り直す
        <StoreInfoForm key={JSON.stringify(storeToForm(store.data))} store={store.data} />
      )}
    </StaffScreen>
  );
}

function StoreInfoForm({ store }: { store: StoreInfo }) {
  const queryClient = useQueryClient();
  const original = storeToForm(store);
  const [value, setValue] = useState<StoreFormValue>(original);
  const [errors, setErrors] = useState<StoreFormErrors>({});
  const [notice, setNotice] = useState<{ tone: 'info' | 'danger'; text: string } | null>(null);
  const [confirm, setConfirm] = useState<number | null>(null);
  const save = useStaffMutation((v: StoreFormValue) =>
    updateStore(store.id, normalizeStoreForm(v)),
  );
  const changed = isStoreFormChanged(value, original);

  const doSave = async () => {
    try {
      await save.mutateAsync(value);
      setConfirm(null);
      setNotice({ tone: 'info', text: '保存しました。' });
      void queryClient.invalidateQueries({ queryKey: staffKeys.summaries });
    } catch {
      setConfirm(null);
      setNotice({
        tone: 'danger',
        text: '保存できませんでした。時間をおいてもう一度お試しください。',
      });
    }
  };

  const submit = async () => {
    const e = validateStoreForm(value);
    setErrors(e);
    setNotice(null);
    if (Object.keys(e).length > 0) return;
    // 支払い方法の変更は公開中の商品の表示が変わるので確かめる
    if (isPaymentChanged(value, original)) {
      const count = await countPublishedProducts(store.id).catch(() => 0);
      if (count > 0) {
        setConfirm(count);
        return;
      }
    }
    await doSave();
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <StoreFields value={value} errors={errors} onChange={setValue} />
        {notice ? <AdminBand text={notice.text} tone={notice.tone} testID="store-notice" /> : null}
      </ScrollView>
      <View style={styles.footer}>
        <PrimaryButton
          testID="save-store"
          label={save.isPending ? '保存しています…' : '保存する'}
          onPress={() => void submit()}
          disabled={!changed || save.isPending}
          height={54}
          labelSize={17}
        />
      </View>
      <ConfirmSheet
        visible={confirm != null}
        title="支払い方法を変更しますか？"
        body={`公開中の商品 ${confirm ?? 0} 件の「お支払い」の表示が変わります。`}
        confirmLabel="変更する"
        tone="accent"
        busy={save.isPending}
        onConfirm={() => void doSave()}
        onClose={() => setConfirm(null)}
        testID="payment-confirm"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 14, paddingHorizontal: adminSpace.screenX, paddingBottom: 24, gap: 14 },
  footer: { paddingTop: 12, paddingBottom: 12, paddingHorizontal: adminSpace.screenX },
});
