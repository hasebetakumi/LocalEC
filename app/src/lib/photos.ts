/**
 * 掲載写真の置き場所（Storage の公開バケット）と、表示用の URL への変換。
 *
 * photo_url には 2 つの形が入る：
 * - 運営画面でアップロードした写真：公開 URL（http〜）
 * - シードの写真：バケット内のパス（例 seed/bento.jpg）。接続先（localhost か PC の IP か）に
 *   左右されないようパスで持ち、表示するときに今の接続先の URL にする
 */
export const PHOTO_BUCKET = 'listing-photos';

export function resolvePhotoUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^https?:\/\//.test(value)) return value;
  const base = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
  const path = value.split('/').map(encodeURIComponent).join('/');
  return `${base}/storage/v1/object/public/${PHOTO_BUCKET}/${path}`;
}
