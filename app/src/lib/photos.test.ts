import { resolvePhotoUrl } from './photos';

describe('resolvePhotoUrl', () => {
  const original = process.env.EXPO_PUBLIC_SUPABASE_URL;
  beforeAll(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = 'http://192.168.1.10:58321';
  });
  afterAll(() => {
    process.env.EXPO_PUBLIC_SUPABASE_URL = original;
  });

  it('アップロードした写真の URL はそのまま', () => {
    const url = 'http://localhost:58321/storage/v1/object/public/listing-photos/s/a.jpg';
    expect(resolvePhotoUrl(url)).toBe(url);
  });
  it('シードのパスは今の接続先の公開 URL にする', () => {
    expect(resolvePhotoUrl('seed/bento.jpg')).toBe(
      'http://192.168.1.10:58321/storage/v1/object/public/listing-photos/seed/bento.jpg',
    );
  });
  it('写真なし', () => {
    expect(resolvePhotoUrl(null)).toBeNull();
    expect(resolvePhotoUrl('')).toBeNull();
  });
});
