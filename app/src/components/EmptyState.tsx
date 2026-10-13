import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

import { PrimaryButton, SecondaryButton } from './Buttons';
import { Icon, type IconName } from './Icon';

type Props = {
  icon: IconName;
  title: string;
  body?: string;
  action?: { label: string; onPress: () => void; kind: 'primary' | 'secondary' };
};

/** 空状態：線画アイコン＋見出し＋説明（＋ボタン）（design 05） */
export function EmptyState({ icon, title, body, action }: Props) {
  return (
    <View style={styles.wrap}>
      <Icon name={icon} size={64} color={colors.iconOff} strokeWidth={1.4} />
      <Text style={styles.title}>{title}</Text>
      {body ? <Text style={styles.body}>{body}</Text> : null}
      {action ? (
        action.kind === 'primary' ? (
          <PrimaryButton
            label={action.label}
            onPress={action.onPress}
            height={52}
            style={styles.btn}
          />
        ) : (
          <SecondaryButton
            label={action.label}
            onPress={action.onPress}
            height={52}
            style={styles.btn}
          />
        )
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 },
  title: { fontSize: 18, fontWeight: '800', color: colors.text, textAlign: 'center' },
  body: { fontSize: 14, lineHeight: 22, color: colors.textWeak, textAlign: 'center' },
  btn: { marginTop: 8, paddingHorizontal: 28 },
});
