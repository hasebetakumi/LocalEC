/**
 * 利用者側のデザイントークン（design/README.md・06_デザインルール）。
 * 寸法の正は docs/設計_利用者予約フロー_U10-U12-U20.md の付録 A。
 */
export const colors = {
  bg: '#F6F1E8',
  card: '#FFFFFF',
  fill: '#EFE9DF',
  divider: '#F0EBE4',
  line: '#EAE2D6',
  lineStrong: '#DDD3C4',
  text: '#1F1B17',
  textSub: '#4A443D',
  textWeak: '#6A6159',
  placeholder: '#9A9087',
  iconOff: '#8A8178',
  accent: '#B3471A',
  accentDark: '#8C3611',
  accentLight: '#FBEBE0',
  event: '#2E7D52',
  eventLight: '#E4F2E9',
  eventText: '#1F5A38',
  job: '#2F5F9E',
  jobLight: '#E7EFFA',
  jobText: '#244F86',
  noticeBand: '#FDF0C8',
  noticeBandText: '#6B4A00',
  danger: '#C2362B',
  dangerLight: '#FCEBE6',
  dangerText: '#7A2716',
  infoText: '#1E3F6B',
  grayPill: '#EFE9DF',
  grayPillText: '#5F5850',
  disabledBg: '#E5DFD6',
  disabledText: '#6B635A',
  overlay: 'rgba(31,27,23,0.5)',
  remainPill: 'rgba(31,27,23,0.78)',
  soldOutPill: 'rgba(31,27,23,0.85)',
  photo: '#EADFD0',
  photoText: '#8C7B68',
  photoFresh: '#E3E8DA',
  photoFreshText: '#6E7A5E',
  photoJob: '#E9E3D1',
  photoJobText: '#7F7556',
  white: '#FFFFFF',
} as const;

export const radius = {
  card: 20,
  cardSm: 16,
  input: 14,
  sheet: 28,
  pill: 999,
  label: 6,
  thumb: 14,
} as const;

export const shadow = {
  card: {
    shadowColor: '#1F1B17',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  float: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  done: {
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

export const space = {
  screenX: 20,
  cardPad: 14,
  gap: 12,
  section: 18,
} as const;

/** 種類の色（点・ラベル・完了画面の地） */
export const kindColors = {
  product: { main: colors.accent, light: colors.accentLight, text: colors.accentDark },
  event: { main: colors.event, light: colors.eventLight, text: colors.eventText },
  job: { main: colors.job, light: colors.jobLight, text: colors.jobText },
} as const;
