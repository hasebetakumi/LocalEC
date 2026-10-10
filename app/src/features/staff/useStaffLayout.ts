import { Platform, useWindowDimensions } from 'react-native';

import { PC_BREAKPOINT } from '@/theme/adminTokens';

/** Web で幅 960 以上なら PC 向けの枠（黒いヘッダー＋左メニュー）にする（設計書 3.1） */
export function useStaffLayout(): { isWide: boolean } {
  const { width } = useWindowDimensions();
  return { isWide: Platform.OS === 'web' && width >= PC_BREAKPOINT };
}
