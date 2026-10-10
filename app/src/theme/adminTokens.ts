/**
 * 運営側のデザイントークン（design/README.md「運営側」・設計書 付録 A.1）。
 * 利用者側の tokens.ts とは分ける
 */
export const adminColors = {
  bg: '#FAF7F2',
  card: '#FFFFFF',
  fill: '#F1ECE5',
  divider: '#F0EBE4',
  line: '#E8E1D7',
  border: '#D9D0C4',
  text: '#231F1A',
  textSub: '#4A443D',
  textWeak: '#6B635A',
  placeholder: '#8A8178',
  placeholder2: '#9A9188',
  accent: '#B3471A',
  accentDark: '#8C3611',
  done: '#2F7A4F',
  danger: '#C2362B',
  dangerDark: '#A1361F',
  pendingPill: '#FFF1E4',
  pendingText: '#8C3611',
  donePill: '#E6F2EA',
  doneText: '#1F5A38',
  grayPill: '#EFEBE5',
  grayText: '#5F5850',
  sheetBack: '#4A443D',
  overlay: 'rgba(35,31,26,0.45)',
  overlayStrong: 'rgba(35,31,26,0.55)',
  expiredRow: '#FDF3F0',
  warningBg: '#FFF6DB',
  warningLine: '#E9D18C',
  warningText: '#4D3900',
  lockedBg: '#F3EFE9',
  lockedLine: '#D2C9BD',
  lockedRowLine: '#E6DFD5',
  dangerBand: '#FCEBE6',
  dangerBandText: '#7A2716',
  infoBand: '#E7EFFA',
  infoBandText: '#1E3F6B',
  disabledBg: '#E5DFD6',
  disabledText: '#6B635A',
  white: '#FFFFFF',
  pcHeader: '#231F1A',
  pcMenuSelected: '#FFF1E4',
  pcMenuSelectedText: '#8C3611',
  pcAside: '#F5F1EB',
} as const;

export const kindLabelColors = {
  product: { bg: '#FFF1E4', fg: '#8C3611', label: '商品' },
  event: { bg: '#E6F2EA', fg: '#1F5A38', label: 'イベント' },
  job: { bg: '#E7EFFA', fg: '#244F86', label: '求人' },
  notice: { bg: '#EFEBE5', fg: '#4A443D', label: 'お知らせ' },
} as const;

export const listingStatusColors = {
  published: { bg: '#2F7A4F', fg: '#FFFFFF' },
  scheduled: { bg: '#E7EFFA', fg: '#244F86' },
  draft: { bg: '#EFEBE5', fg: '#4A443D' },
  ended: { bg: '#5F5850', fg: '#FFFFFF' },
} as const;

export const staffStatusColors = {
  open: { bg: '#FFF1E4', fg: '#8C3611' },
  done: { bg: '#E6F2EA', fg: '#1F5A38' },
  closed: { bg: '#EFEBE5', fg: '#5F5850' },
} as const;

export const adminShadow = {
  card: {
    shadowColor: '#231F1A',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  search: {
    shadowColor: '#231F1A',
    shadowOpacity: 0.08,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  menu: {
    shadowColor: '#231F1A',
    shadowOpacity: 0.35,
    shadowRadius: 36,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
  },
} as const;

export const adminSpace = { screenX: 18 } as const;

/** Web で PC 向けの枠に切り替える幅 */
export const PC_BREAKPOINT = 960;
