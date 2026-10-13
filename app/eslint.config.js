// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');
const prettierConfig = require('eslint-config-prettier/flat');

module.exports = defineConfig([
  expoConfig,
  prettierConfig,
  {
    // supabase/functions は Deno（Edge Functions）なのでアプリの Lint から外す
    ignores: ['dist/*', 'coverage/*', 'supabase/functions/*'],
  },
]);
