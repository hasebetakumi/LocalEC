/**
 * 掲載の写真（設計書 6 章）。4:3 に切り抜いて長辺 1600px の JPEG にし、Storage の公開バケットに置く
 */
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const BUCKET = 'listing-photos';
const MAX_EDGE = 1600;

function randomName(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** 写真を選んでアップロードし、公開 URL を返す。選ばなければ null */
export async function pickAndUploadPhoto(storeId: string): Promise<string | null> {
  const picked = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.9,
  });
  if (picked.canceled || picked.assets.length === 0) return null;
  const asset = picked.assets[0];

  const context = ImageManipulator.manipulate(asset.uri);
  if (Math.max(asset.width, asset.height) > MAX_EDGE) {
    context.resize(asset.width >= asset.height ? { width: MAX_EDGE } : { height: MAX_EDGE });
  }
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ compress: 0.8, format: SaveFormat.JPEG });

  // React Native では Blob が空になることがあるので ArrayBuffer で送る
  const body = await (await fetch(saved.uri)).arrayBuffer();
  const path = `${storeId}/${randomName()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, body, {
    contentType: 'image/jpeg',
    upsert: false,
  });
  if (error) throw error;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

/** 公開 URL からバケット内のパスを取り出す。このバケットの URL でなければ null */
export function photoPathOf(url: string): string | null {
  const marker = `/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  return i >= 0 ? decodeURIComponent(url.slice(i + marker.length)) : null;
}

/**
 * 使われなくなった写真を消す。複製で同じファイルを参照していることがあるので、
 * 他の掲載が参照していなければ消す。失敗しても無視する（表示には影響しない）
 */
export async function removePhotoIfUnused(url: string, exceptListingId?: string): Promise<void> {
  const path = photoPathOf(url);
  if (!path) return;
  try {
    let q = supabase
      .from('listings')
      .select('id', { count: 'exact', head: true })
      .eq('photo_url', url);
    if (exceptListingId) q = q.neq('id', exceptListingId);
    const { count } = await q;
    if ((count ?? 0) > 0) return;
    await supabase.storage.from(BUCKET).remove([path]);
  } catch {
    // 消せなくても困らない
  }
}
