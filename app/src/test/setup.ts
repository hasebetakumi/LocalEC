// テスト全体の共通設定（package.json の jest.setupFiles から読み込む）

// AsyncStorage はネイティブモジュールなので、公式のモックに差し替える
jest.mock('@react-native-async-storage/async-storage', () =>
  jest.requireActual('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
