import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, TextButton } from '@/components/Buttons';
import { Icon } from '@/components/Icon';
import { ConfirmSheet } from '@/components/admin/ConfirmSheet';
import { DateTimeField } from '@/components/admin/DateTimeField';
import { AdminTextField } from '@/components/admin/Fields';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { AdminBand, WarningBox } from '@/components/admin/WarningBox';
import { adminColors, adminSpace } from '@/theme/adminTokens';

import { endListing, StaffError, updateListing } from '../api';
import {
  isPeriodChanged,
  KIND_TEXT,
  lockedFieldRows,
  restrictedErrors,
  restrictedToUpdate,
  type RestrictedForm,
} from '../form';
import { useListingBookings, useStaffMutation } from '../hooks';
import type { StaffListing } from '../types';
import { useDiscardGuard } from '../useDiscardGuard';

const ALLOWED: Record<string, string> = {
  product: '「数量を減らす」「受け取り期間」「終了する」',
  event: '「定員を減らす」「日時」「終了する」',
  job: '「募集人数」「日時」「終了する」',
};

/** A-12 予約が入った後の編集（数量を減らす・期間・終了だけ。他は固定） */
export function RestrictedEditView({
  listing: l,
  storeName,
}: {
  listing: StaffListing;
  storeName: string;
}) {
  const insets = useSafeAreaInsets();
  const bookings = useListingBookings(l.id);
  const [form, setForm] = useState<RestrictedForm>({
    quantity: l.quantity == null ? '' : String(l.quantity),
    start: l.start,
    end: l.end,
  });
  const [confirmEnd, setConfirmEnd] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const t = KIND_TEXT[l.kind];
  const unit = l.kind === 'product' ? l.unit : '名';
  const errors = restrictedErrors(l, form);
  const changed =
    form.quantity !== (l.quantity == null ? '' : String(l.quantity)) || isPeriodChanged(l, form);
  const guard = useDiscardGuard(changed);
  // 通知が届くのは予約中の人
  const reservedPeople = (bookings.data ?? []).filter((b) => b.status === 'reserved').length;

  const save = useStaffMutation(() => updateListing(l.id, restrictedToUpdate(l, form)));
  const end = useStaffMutation(() => endListing(l.id));

  const close = () => {
    guard.allowLeave();
    if (router.canGoBack()) router.back();
    else
      router.replace({
        pathname: '/staff/[storeId]/listings/[id]',
        params: { storeId: l.storeId, id: l.id },
      });
  };

  const submit = async () => {
    setSaveError(null);
    try {
      await save.mutateAsync(undefined);
      close();
    } catch (e) {
      const code = e instanceof StaffError ? e.code : 'unknown';
      setSaveError(
        code === 'quantity_below_reserved'
          ? `予約済みの${l.reservedQuantity}${unit}より少なくはできません`
          : code === 'quantity_increase_not_allowed'
            ? '増やすことはできません'
            : code === 'locked_fields'
              ? '予約が入っているため、この項目は変更できません'
              : '保存できませんでした。時間をおいてもう一度お試しください。',
      );
    }
  };

  const doEnd = async () => {
    try {
      await end.mutateAsync(undefined);
      setConfirmEnd(false);
      close();
    } catch {
      setSaveError('終了できませんでした。');
      setConfirmEnd(false);
    }
  };

  return (
    <StaffScreen padTop={Platform.OS !== 'ios'}>
      <StaffNavBar
        backIcon="close"
        center={
          <Text style={styles.navTitle} accessibilityRole="header">
            掲載を編集
          </Text>
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <WarningBox
            title={`予約が${l.reservedQuantity}件入っています`}
            body={`変更できるのは${ALLOWED[l.kind]}だけです。予約者へは変更の通知が届きます。`}
          />
          {saveError ? (
            <AdminBand text={saveError} tone="danger" testID="restricted-error" />
          ) : null}

          <AdminTextField
            label={t.quantity}
            value={form.quantity}
            onChangeText={(v) => setForm((f) => ({ ...f, quantity: v }))}
            keyboardType="number-pad"
            unit={unit}
            outlined
            hint={
              l.kind === 'job'
                ? undefined
                : `${l.reservedQuantity}〜${l.quantity ?? ''}${unit}の範囲で減らせます`
            }
            error={errors.quantity}
            testID="restricted-quantity"
          />
          <DateTimeField
            label={t.start}
            value={form.start}
            onChange={(v) => setForm((f) => ({ ...f, start: v }))}
            outlined
          />
          <DateTimeField
            label={t.end}
            value={form.end}
            onChange={(v) => setForm((f) => ({ ...f, end: v }))}
            outlined
            error={errors.end}
          />
          {isPeriodChanged(l, form) && !errors.end ? (
            <Text style={styles.notify}>変更あり：保存すると予約者{reservedPeople}名に通知</Text>
          ) : null}

          <View style={styles.lockedHead}>
            <Icon name="lock" size={16} color={adminColors.text} strokeWidth={2} />
            <Text style={styles.lockedTitle}>変更できない項目</Text>
          </View>
          <View style={styles.locked} testID="locked-fields">
            {lockedFieldRows(l, storeName).map((r, i) => (
              <View key={r.label} style={[styles.lockedRow, i > 0 && styles.lockedBorder]}>
                <Text style={styles.lockedLabel}>{r.label}</Text>
                <Text style={styles.lockedValue}>{r.value}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
          <PrimaryButton
            testID="save-restricted"
            label={save.isPending ? '保存しています…' : '変更を保存する'}
            onPress={() => void submit()}
            disabled={!changed || Object.keys(errors).length > 0 || save.isPending}
            height={54}
            labelSize={16}
          />
          {l.status === 'published' ? (
            <TextButton
              label="掲載を終了する"
              color={adminColors.danger}
              onPress={() => setConfirmEnd(true)}
              style={{ height: 46 }}
            />
          ) : null}
        </View>
      </KeyboardAvoidingView>

      <ConfirmSheet
        visible={confirmEnd}
        title="掲載を終了しますか？"
        body="新しい予約を受け付けなくなります。入っている予約はそのまま残ります。"
        confirmLabel="終了する"
        busy={end.isPending}
        onConfirm={() => void doEnd()}
        onClose={() => setConfirmEnd(false)}
      />
      <ConfirmSheet
        visible={guard.confirmVisible}
        title="入力内容を破棄しますか？"
        body="保存していない変更は失われます。"
        confirmLabel="破棄する"
        cancelLabel="入力を続ける"
        onConfirm={guard.discard}
        onClose={guard.keep}
      />
    </StaffScreen>
  );
}

const styles = StyleSheet.create({
  navTitle: { fontSize: 17, fontWeight: '800', color: adminColors.text },
  content: { paddingTop: 6, paddingHorizontal: adminSpace.screenX, paddingBottom: 24, gap: 14 },
  notify: { fontSize: 12.5, fontWeight: '700', color: adminColors.accentDark, marginTop: -6 },
  lockedHead: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  lockedTitle: { fontSize: 14, fontWeight: '800', color: adminColors.text },
  locked: {
    backgroundColor: adminColors.lockedBg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: adminColors.lockedLine,
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  lockedRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 10, paddingVertical: 9 },
  lockedBorder: { borderTopWidth: 1, borderTopColor: adminColors.lockedRowLine },
  lockedLabel: { fontSize: 14, fontWeight: '700', color: adminColors.textWeak },
  lockedValue: { fontSize: 14, color: adminColors.textSub, textAlign: 'right', flexShrink: 1 },
  footer: { paddingTop: 12, paddingHorizontal: adminSpace.screenX, gap: 8 },
});
