import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { ConfirmSheet } from '@/components/admin/ConfirmSheet';
import { DateTimeField } from '@/components/admin/DateTimeField';
import {
  AdminTextField,
  CheckRow,
  Field,
  FormSection,
  SelectField,
  ToggleChips,
} from '@/components/admin/Fields';
import { KindLabel } from '@/components/admin/Labels';
import { PhotoField } from '@/components/admin/PhotoField';
import { StaffNavBar, StaffScreen } from '@/components/admin/StaffScreen';
import { AdminBand } from '@/components/admin/WarningBox';
import { CATEGORIES, paymentMethodsText } from '@/features/listings/master';
import { useNow } from '@/hooks/useNow';
import { adminColors, adminSpace } from '@/theme/adminTokens';

import { insertListing, updateListing } from '../api';
import {
  applyFollow,
  formToRow,
  formToUpdate,
  KIND_TEXT,
  UNIT_CHOICES,
  validateListingForm,
  type FormErrors,
  type ListingForm,
} from '../form';
import { useStaffMutation } from '../hooks';
import { removePhotoIfUnused } from '../photo';
import type { ListingKind, ListingStatus, StoreSummary } from '../types';
import { useDiscardGuard } from '../useDiscardGuard';

type Props = {
  kind: ListingKind;
  store: StoreSummary;
  initial: ListingForm;
  /** 編集のとき：対象の掲載 ID と今の状態 */
  editing?: { id: string; status: ListingStatus; photoUrl: string | null };
};

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c.key, label: c.label }));
const UNIT_OPTIONS = UNIT_CHOICES.map((u) => ({ value: u, label: u }));
const PAY_UNIT_OPTIONS = [
  { value: 'daily', label: '日給' },
  { value: 'hourly', label: '時給' },
  { value: 'other', label: 'その他（自由記述）' },
] as const;
const CANCEL_OPTIONS = [
  { value: 'yes', label: 'できる' },
  { value: 'no', label: 'できない' },
] as const;

const NOTE: Record<ListingKind, string> = {
  product: '期間に合わせて自動で公開・終了します。数量が0になると自動で締め切ります。',
  event: '定員に達すると自動で締め切ります。キャンセルで空きが出れば再開します。',
  job: '募集人数に達しても締め切りません。公開終了で締切。',
  notice: '店舗名は自動で付きます。',
};

/** A-10 掲載入力（新規・複製・編集）。種類は変えられない */
export function ListingFormView({ kind, store, initial, editing }: Props) {
  const now = useNow();
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const [form, setForm] = useState<ListingForm>(initial);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saveError, setSaveError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const guard = useDiscardGuard(dirty);
  const t = KIND_TEXT[kind];

  const save = useStaffMutation(async ({ status }: { status: 'draft' | 'published' | 'ended' }) => {
    if (editing) {
      await updateListing(editing.id, formToUpdate(form, kind, store.id, status, now));
      return editing.id;
    }
    return insertListing(formToRow(form, kind, store.id, status, now));
  });

  const update = (patch: Partial<ListingForm>, touch?: keyof ListingForm['touched']) => {
    setDirty(true);
    setForm((prev) => {
      const next = {
        ...prev,
        ...patch,
        touched: touch ? { ...prev.touched, [touch]: true } : prev.touched,
      };
      return applyFollow(prev, next, kind);
    });
  };

  const isDraft = !editing || editing.status === 'draft';
  const submit = async (publish: boolean) => {
    const e = validateListingForm(form, kind, { publish });
    setErrors(e);
    setSaveError(null);
    if (Object.keys(e).length > 0) {
      setSaveError('入力内容を確認してください。');
      scrollRef.current?.scrollTo({ y: 0, animated: true });
      return;
    }
    const status: 'draft' | 'published' | 'ended' = isDraft
      ? publish
        ? 'published'
        : 'draft'
      : editing.status === 'ended'
        ? 'ended'
        : 'published';
    try {
      await save.mutateAsync({ status });
      if (editing?.photoUrl && editing.photoUrl !== form.photoUrl) {
        void removePhotoIfUnused(editing.photoUrl, editing.id);
      }
      guard.allowLeave();
      if (router.canGoBack()) router.back();
      else router.replace({ pathname: '/staff/[storeId]/listings', params: { storeId: store.id } });
    } catch {
      setSaveError('保存できませんでした。時間をおいてもう一度お試しください。');
    }
  };

  const title = editing ? `${t.name}を編集` : `${t.name}を掲載`;

  return (
    <StaffScreen padTop={Platform.OS !== 'ios'}>
      <StaffNavBar
        backIcon="close"
        fallback={`/staff/${store.id}/listings`}
        center={
          <>
            <KindLabel kind={kind} size="md" />
            <Text style={styles.navTitleText} accessibilityRole="header">
              {title}
            </Text>
          </>
        }
      />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {saveError ? <AdminBand text={saveError} tone="danger" testID="form-error" /> : null}

          {kind === 'notice' ? (
            <FormSection title="内容">
              <AdminTextField
                label="タイトル"
                required
                value={form.title}
                onChangeText={(v) => update({ title: v })}
                error={errors.title}
              />
              <AdminTextField
                label="本文"
                required
                value={form.body}
                onChangeText={(v) => update({ body: v })}
                multiline
                minHeight={160}
                error={errors.body}
              />
              <Text style={styles.note}>
                お知らせには写真・価格・予約はありません。{NOTE.notice}
              </Text>
            </FormSection>
          ) : (
            <>
              <FormSection title="基本情報">
                <PhotoField
                  storeId={store.id}
                  value={form.photoUrl}
                  onChange={(url) => update({ photoUrl: url })}
                />
                <AdminTextField
                  label="タイトル"
                  required
                  value={form.title}
                  onChangeText={(v) => update({ title: v })}
                  error={errors.title}
                />
                {kind === 'product' ? (
                  <>
                    <SelectField
                      label="カテゴリ"
                      required
                      options={CATEGORY_OPTIONS}
                      value={form.category}
                      onChange={(v) => update({ category: v })}
                      error={errors.category}
                      testID="field-category"
                    />
                    <View style={styles.row2}>
                      <View style={styles.col}>
                        <AdminTextField
                          label="価格（税込）"
                          required
                          value={form.price}
                          onChangeText={(v) => update({ price: v })}
                          keyboardType="number-pad"
                          unit="円"
                          error={errors.price}
                        />
                      </View>
                      <View style={styles.col}>
                        <AdminTextField
                          label="元値"
                          value={form.originalPrice}
                          onChangeText={(v) => update({ originalPrice: v })}
                          keyboardType="number-pad"
                          unit="円"
                          error={errors.originalPrice}
                        />
                      </View>
                    </View>
                    <View style={styles.row2}>
                      <View style={styles.col}>
                        <AdminTextField
                          label="数量"
                          required
                          value={form.quantity}
                          onChangeText={(v) => update({ quantity: v })}
                          keyboardType="number-pad"
                          unit={form.unit}
                          error={errors.quantity}
                        />
                      </View>
                      <View style={styles.col}>
                        <SelectField
                          label="単位"
                          options={UNIT_OPTIONS}
                          value={form.unit}
                          onChange={(v) => update({ unit: v })}
                        />
                      </View>
                    </View>
                    <Text style={styles.note}>
                      元値を入れると、割引バッジと取り消し線が付きます。
                    </Text>
                  </>
                ) : null}
                {kind === 'event' ? (
                  <View style={styles.row2}>
                    <View style={styles.col}>
                      <AdminTextField
                        label="料金（1名）"
                        value={form.pricePerPerson}
                        onChangeText={(v) => update({ pricePerPerson: v })}
                        keyboardType="number-pad"
                        unit="円"
                        hint="空欄なら無料"
                        error={errors.pricePerPerson}
                      />
                    </View>
                    <View style={styles.col}>
                      <AdminTextField
                        label="定員"
                        required
                        value={form.quantity}
                        onChangeText={(v) => update({ quantity: v })}
                        keyboardType="number-pad"
                        unit="名"
                        error={errors.quantity}
                      />
                    </View>
                  </View>
                ) : null}
                {kind === 'job' ? (
                  <>
                    <View style={styles.row2}>
                      <View style={styles.col}>
                        <SelectField
                          label="報酬の単位"
                          required
                          options={PAY_UNIT_OPTIONS}
                          value={form.payUnit}
                          onChange={(v) => update({ payUnit: v })}
                        />
                      </View>
                      <View style={styles.col}>
                        {form.payUnit === 'other' ? null : (
                          <AdminTextField
                            label="報酬"
                            required
                            value={form.payAmount}
                            onChangeText={(v) => update({ payAmount: v })}
                            keyboardType="number-pad"
                            unit="円"
                            error={errors.payAmount}
                          />
                        )}
                      </View>
                    </View>
                    {form.payUnit === 'other' ? (
                      <AdminTextField
                        label="報酬"
                        required
                        placeholder="例：1回 3,000円"
                        value={form.payFreeText}
                        onChangeText={(v) => update({ payFreeText: v })}
                        error={errors.payFreeText}
                      />
                    ) : null}
                    <AdminTextField
                      label="募集人数"
                      required
                      value={form.quantity}
                      onChangeText={(v) => update({ quantity: v })}
                      keyboardType="number-pad"
                      unit="名"
                      error={errors.quantity}
                    />
                  </>
                ) : null}
              </FormSection>

              <FormSection
                title={
                  kind === 'product'
                    ? '受け取り・予約'
                    : kind === 'event'
                      ? '日時・場所・申し込み'
                      : '日時・場所・応募'
                }
              >
                {kind === 'product' ? (
                  <Field label="受け取り店舗">
                    <View style={styles.readonly}>
                      <Text style={styles.readonlyMain}>{store.name}</Text>
                      <Text style={styles.readonlySub}>
                        支払い：{paymentMethodsText(store.paymentMethods)}（店舗の設定）
                      </Text>
                    </View>
                  </Field>
                ) : null}
                <DateTimeField
                  label={t.start}
                  required
                  value={form.start}
                  onChange={(v) => update({ start: v })}
                  error={errors.start}
                  testID="field-start"
                />
                <DateTimeField
                  label={t.end}
                  required
                  value={form.end}
                  onChange={(v) => update({ end: v })}
                  error={errors.end}
                  testID="field-end"
                />
                {kind === 'job' ? (
                  <AdminTextField
                    label="勤務日時の補足"
                    placeholder="例：週2日〜 10:00〜15:00"
                    value={form.workText}
                    onChangeText={(v) => update({ workText: v })}
                    hint="入れると、利用者の画面では日時の代わりにこれを表示します"
                  />
                ) : null}
                {kind !== 'product' ? (
                  <>
                    <AdminTextField
                      label="場所"
                      required
                      value={form.placeName}
                      onChangeText={(v) => update({ placeName: v })}
                      error={errors.placeName}
                    />
                    <AdminTextField
                      label="住所"
                      required
                      value={form.placeAddress}
                      onChangeText={(v) => update({ placeAddress: v })}
                      error={errors.placeAddress}
                    />
                  </>
                ) : null}
                <DateTimeField
                  label={t.deadline}
                  required
                  value={form.deadline}
                  onChange={(v) => update({ deadline: v }, 'deadline')}
                  error={errors.deadline}
                  testID="field-deadline"
                />
                {kind === 'event' ? (
                  <AdminTextField
                    label="1件で申し込める人数の上限"
                    required
                    value={form.maxPerBooking}
                    onChangeText={(v) => update({ maxPerBooking: v })}
                    keyboardType="number-pad"
                    unit="名"
                    error={errors.maxPerBooking}
                  />
                ) : null}
                <Field label={kind === 'job' ? '応募の取り消し' : 'キャンセル'}>
                  <ToggleChips
                    options={CANCEL_OPTIONS}
                    value={form.cancelAllowed ? 'yes' : 'no'}
                    onChange={(v) => update({ cancelAllowed: v === 'yes' })}
                  />
                </Field>
                {form.cancelAllowed ? (
                  <DateTimeField
                    label="期限"
                    required
                    value={form.cancelDeadline}
                    onChange={(v) => update({ cancelDeadline: v }, 'cancelDeadline')}
                    error={errors.cancelDeadline}
                    testID="field-cancel-deadline"
                  />
                ) : null}
              </FormSection>

              <FormSection title={kind === 'product' ? '説明・食品表示' : '説明'}>
                {kind === 'product' ? (
                  <>
                    <AdminTextField
                      label="説明"
                      hint="中身や特徴。利用者の詳細画面に表示"
                      value={form.body}
                      onChangeText={(v) => update({ body: v })}
                      multiline
                    />
                    <AdminTextField
                      label="食品表示"
                      hint="初期値は「店舗にお問い合わせください」。必要なら書き換える"
                      value={form.foodLabel}
                      onChangeText={(v) => update({ foodLabel: v })}
                      multiline
                      minHeight={72}
                    />
                  </>
                ) : (
                  <AdminTextField
                    label={kind === 'event' ? '内容・参加条件・持ち物' : '仕事内容・条件'}
                    hint="利用者の詳細画面に表示"
                    value={form.conditions}
                    onChangeText={(v) => update({ conditions: v })}
                    multiline
                  />
                )}
              </FormSection>
            </>
          )}

          <FormSection title="公開設定">
            <DateTimeField
              label="公開開始"
              required
              value={form.publishStart}
              onChange={(v) => update({ publishStart: v })}
              error={errors.publishStart}
              testID="field-publish-start"
            />
            <DateTimeField
              label="公開終了"
              required
              value={form.publishEnd}
              onChange={(v) => update({ publishEnd: v }, 'publishEnd')}
              error={errors.publishEnd}
              testID="field-publish-end"
            />
            {kind !== 'notice' ? <Text style={styles.note}>{NOTE[kind]}</Text> : null}
            <CheckRow
              label="公開時に新着通知を送る"
              hint="通知をオンにしている全員に届きます"
              checked={form.notifyOnPublish}
              onChange={(v) => update({ notifyOnPublish: v })}
              testID="field-notify"
            />
          </FormSection>
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) + 14 }]}>
          {isDraft ? (
            <>
              <SecondaryButton
                testID="save-draft"
                label="下書き保存"
                onPress={() => void submit(false)}
                disabled={save.isPending}
                height={54}
                style={{ flex: 1 }}
              />
              <PrimaryButton
                testID="publish"
                label={save.isPending ? '保存しています…' : '公開する'}
                onPress={() => void submit(true)}
                disabled={save.isPending}
                height={54}
                labelSize={16}
                style={{ flex: 1.4 }}
              />
            </>
          ) : (
            <PrimaryButton
              testID="save-listing"
              label={save.isPending ? '保存しています…' : '変更を保存する'}
              onPress={() => void submit(true)}
              disabled={save.isPending}
              height={54}
              labelSize={16}
              style={{ flex: 1 }}
            />
          )}
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
  navTitleText: { fontSize: 17, fontWeight: '800', color: adminColors.text },
  content: { paddingTop: 6, paddingHorizontal: adminSpace.screenX, paddingBottom: 24, gap: 18 },
  row2: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },
  note: { fontSize: 12.5, lineHeight: 19, color: adminColors.textWeak },
  readonly: {
    borderRadius: 12,
    backgroundColor: adminColors.lockedBg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 2,
  },
  readonlyMain: { fontSize: 15, fontWeight: '700', color: adminColors.text },
  readonlySub: { fontSize: 12.5, color: adminColors.textWeak },
  footer: { flexDirection: 'row', gap: 10, paddingTop: 12, paddingHorizontal: adminSpace.screenX },
});
