import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Band } from '@/components/Bands';
import { PrimaryButton } from '@/components/Buttons';
import { ConfirmSheet } from '@/components/ConfirmSheet';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { createStore } from '@/features/staff/api';
import { StoreFields } from '@/features/staff/components/StoreFields';
import { useStaffMutation } from '@/features/staff/hooks';
import {
  EMPTY_STORE,
  isStoreFormChanged,
  normalizeStoreForm,
  validateStoreForm,
  type StoreFormErrors,
} from '@/features/staff/storeForm';
import { useDiscardGuard } from '@/hooks/useDiscardGuard';
import { adminSpace } from '@/theme/adminTokens';

/** A-01 店舗を追加（下から出る画面）。追加後はその店舗モードへ */
export default function NewStoreScreen() {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(EMPTY_STORE);
  const [errors, setErrors] = useState<StoreFormErrors>({});
  const [failed, setFailed] = useState(false);
  const create = useStaffMutation(createStore);
  const scrollRef = useRef<ScrollView>(null);
  const guard = useDiscardGuard(isStoreFormChanged(value, EMPTY_STORE));

  const submit = async () => {
    const e = validateStoreForm(value);
    setErrors(e);
    if (Object.keys(e).length > 0) {
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    setFailed(false);
    try {
      const id = await create.mutateAsync(normalizeStoreForm(value));
      guard.allowLeave();
      router.dismissAll();
      router.push({ pathname: '/staff/[storeId]/listings', params: { storeId: id } });
    } catch {
      setFailed(true);
    }
  };

  return (
    <StaffScreen padTop={Platform.OS !== 'ios'}>
      <StaffNavBar title="店舗を追加" backIcon="close" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <StoreFields value={value} errors={errors} onChange={setValue} />
          {failed ? (
            <Band text="追加できませんでした。時間をおいてもう一度お試しください。" tone="danger" />
          ) : null}
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
          <PrimaryButton
            testID="create-store"
            label={create.isPending ? '追加しています…' : '追加する'}
            onPress={() => void submit()}
            disabled={create.isPending}
            height={54}
            labelSize={17}
          />
        </View>
      </KeyboardAvoidingView>
      <ConfirmSheet
        visible={guard.confirmVisible}
        title="入力内容を破棄しますか？"
        body="保存していない変更は失われます。"
        confirmLabel="破棄する"
        cancelLabel="入力を続ける"
        onConfirm={guard.discard}
        onClose={guard.keep}
        testID="discard-sheet"
      />
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 6, paddingHorizontal: adminSpace.screenX, paddingBottom: 24 },
  footer: { paddingTop: 12, paddingHorizontal: adminSpace.screenX },
});
