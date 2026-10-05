function required(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(
      `環境変数 ${name} が設定されていません。app/.env.example を参考に app/.env を作成してください。`,
    );
  }
  return value;
}

export const env = {
  supabaseUrl: required('EXPO_PUBLIC_SUPABASE_URL', process.env.EXPO_PUBLIC_SUPABASE_URL),
  supabasePublishableKey: required(
    'EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY',
    process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  ),
};
