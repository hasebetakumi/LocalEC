import { StyleSheet, TextInput, View } from 'react-native';

import { Icon } from '@/components/Icon';
import { adminColors, adminShadow } from '@/theme/adminTokens';

/** 番号で探す（4 桁の数字だけ。高さ 54・白・影） */
export function NumberSearchField({
  value,
  onChange,
  testID,
}: {
  value: string;
  onChange: (value: string) => void;
  testID?: string;
}) {
  return (
    <View style={styles.box}>
      <Icon name="search" size={22} color={adminColors.placeholder} strokeWidth={2} />
      <TextInput
        testID={testID}
        accessibilityLabel="番号で探す"
        value={value}
        onChangeText={(t) =>
          onChange(
            t
              .replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
              .replace(/\D/g, '')
              .slice(0, 4),
          )
        }
        placeholder="番号を入力（4桁）"
        placeholderTextColor={adminColors.placeholder}
        keyboardType="number-pad"
        maxLength={4}
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    height: 54,
    backgroundColor: adminColors.card,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    ...adminShadow.search,
  },
  input: {
    flex: 1,
    height: 54,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 1,
    color: adminColors.text,
    outlineWidth: 0,
  },
});
