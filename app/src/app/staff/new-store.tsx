import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/components/Buttons';
import { AdminBand } from '@/components/admin/WarningBox';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { createStore } from '@/features/staff/api';
import { StoreFields } from '@/features/staff/components/StoreFields';
import { useStaffMutation } from '@/features/staff/hooks';
import {
  EMPTY_STORE,
  normalizeStoreForm,
  validateStoreForm,
  type StoreFormErrors,
} from '@/features/staff/storeForm';
import { adminSpace } from '@/theme/adminTokens';

/** A-01 店舗を追加（下から出る画面）。追加後はその店舗モードへ */
export default function NewStoreScreen() {
  const insets = useSafeAreaInsets();
  const [value, setValue] = useState(EMPTY_STORE);
  const [errors, setErrors] = useState<StoreFormErrors>({});
  const [failed, setFailed] = useState(false);
  const create = useStaffMutation(createStore);

  const submit = async () => {
    const e = validateStoreForm(value);
    setErrors(e);
    if (Object.keys(e).length > 0) return;
    setFailed(false);
    try {
      const id = await create.mutateAsync(normalizeStoreForm(value));
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
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <StoreFields value={value} errors={errors} onChange={setValue} />
          {failed ? (
            <AdminBand
              text="追加できませんでした。時間をおいてもう一度お試しください。"
              tone="danger"
            />
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
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  content: { paddingTop: 6, paddingHorizontal: adminSpace.screenX, paddingBottom: 24 },
  footer: { paddingTop: 12, paddingHorizontal: adminSpace.screenX },
});
