import { NEXT_TTL_MS, parseNextPath } from './api';

jest.mock('@/lib/supabase', () => ({ supabase: {} }));

const NOW = Date.UTC(2026, 9, 13, 6, 0);
const saved = (path: string, ageMs = 0) => JSON.stringify({ path, savedAt: NOW - ageMs });

describe('ログイン後の戻り先', () => {
  it('期限内のアプリ内のパスだけ返す', () => {
    expect(parseNextPath(saved('/mypage'), NOW)).toBe('/mypage');
    expect(parseNextPath(saved('/listings/l-1/book', NEXT_TTL_MS), NOW)).toBe('/listings/l-1/book');
  });

  it('期限を過ぎた戻り先は途中でやめたログインの名残なので使わない', () => {
    expect(parseNextPath(saved('/staff', NEXT_TTL_MS + 1), NOW)).toBeNull();
  });

  it('旧形式（文字列だけ）は、いつ保存したか分からないので使わない', () => {
    expect(parseNextPath('/staff', NOW)).toBeNull();
  });

  it('ログイン画面自体・アプリ外・壊れた値は使わない', () => {
    expect(parseNextPath(saved('/auth/sent'), NOW)).toBeNull();
    expect(parseNextPath(saved('https://example.com'), NOW)).toBeNull();
    expect(parseNextPath('{"path":1}', NOW)).toBeNull();
    expect(parseNextPath(null, NOW)).toBeNull();
  });
});
