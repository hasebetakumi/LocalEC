import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>LocalEC</Text>
      <Text style={styles.description}>環境構築が完了しました。画面はこれから作ります。</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
  },
});
