import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { BottomSheet } from '@/components/BottomSheet';
import { PrimaryButton, SecondaryButton } from '@/components/Buttons';
import { Chip } from '@/components/Chips';
import { colors } from '@/theme/tokens';

import { CATEGORIES, type ProductCategory } from '../master';
import type { Store } from '../types';

export type FilterValue = { category?: ProductCategory; storeId?: string };

type Props = {
  visible: boolean;
  value: FilterValue;
  stores: Store[];
  onApply: (value: FilterValue) => void;
  onClose: () => void;
};

/** U-13 絞り込みシート。カテゴリ・店舗とも 1 つだけ選ぶ（キーワード検索なし） */
export function FilterSheet({ visible, value, stores, onApply, onClose }: Props) {
  return (
    <BottomSheet visible={visible} onClose={onClose} title="絞り込み" testID="filter-sheet">
      {(close) => (
        // シートを開くたびに現在の条件から編集を始める
        <FilterForm
          key={String(visible)}
          initial={value}
          stores={stores}
          onApply={(v) => close(() => onApply(v))}
        />
      )}
    </BottomSheet>
  );
}

function FilterForm({
  initial,
  stores,
  onApply,
}: {
  initial: FilterValue;
  stores: Store[];
  onApply: (value: FilterValue) => void;
}) {
  const [category, setCategory] = useState<ProductCategory | undefined>(initial.category);
  const [storeId, setStoreId] = useState<string | undefined>(initial.storeId);

  const storeOptions = [{ id: undefined, name: 'すべての店舗' }, ...stores];

  return (
    <View style={styles.form}>
      <View style={styles.group}>
        <Text style={styles.groupLabel}>カテゴリ</Text>
        <View style={styles.chips} accessibilityRole="radiogroup">
          <Chip label="すべて" selected={!category} onPress={() => setCategory(undefined)} />
          {CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              label={c.label}
              selected={category === c.key}
              onPress={() => setCategory(c.key)}
            />
          ))}
        </View>
      </View>

      <View>
        <Text style={[styles.groupLabel, { marginBottom: 6 }]}>店舗</Text>
        <View accessibilityRole="radiogroup">
          {storeOptions.map((s) => {
            const selected = storeId === s.id;
            return (
              <Pressable
                key={s.id ?? 'all'}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => setStoreId(s.id)}
                style={styles.radioRow}
              >
                <View style={[styles.radio, selected && styles.radioOn]}>
                  {selected ? <View style={styles.radioDot} /> : null}
                </View>
                <Text style={styles.radioLabel}>{s.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.actions}>
        <SecondaryButton
          label="クリア"
          onPress={() => {
            setCategory(undefined);
            setStoreId(undefined);
          }}
          style={{ flex: 1 }}
        />
        <PrimaryButton
          testID="filter-apply"
          label="この条件で見る"
          onPress={() => onApply({ category, storeId })}
          height={56}
          style={{ flex: 2 }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: 16 },
  group: { gap: 10 },
  groupLabel: { fontSize: 14, fontWeight: '700', color: colors.text },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  radioRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { borderColor: colors.accent, borderWidth: 2 },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: colors.accent },
  radioLabel: { fontSize: 15.5, color: colors.text },
  actions: { flexDirection: 'row', gap: 10 },
});
