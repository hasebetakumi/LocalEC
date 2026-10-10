import Svg, { Circle, Path } from 'react-native-svg';

type Shape = { d: string } | { cx: number; cy: number; r: number; fill?: boolean };

/** design/ の SVG をそのまま使う（viewBox 0 0 24 24、線画） */
const ICONS = {
  tag: [{ d: 'M3.5 12.5V3.5h9l8.5 8.5-9 9z M8 8h.01' }],
  calendar: [{ d: 'M4 6h16v15H4z M4 10.5h16 M8.5 3v4 M15.5 3v4' }],
  ticket: [{ d: 'M5.5 3h13v18l-3.2-2-3.3 2-3.3-2-3.2 2z M9 8.5h6 M9 12.5h6' }],
  person: [
    { d: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z M4.5 21c0-4.2 3.4-6.2 7.5-6.2s7.5 2 7.5 6.2' },
  ],
  bell: [{ d: 'M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z M10 21h4' }],
  back: [{ d: 'M15 5l-7 7 7 7' }],
  clock: [{ cx: 12, cy: 12, r: 8.6 }, { d: 'M12 7.4V12l3.2 1.9' }],
  pin: [{ d: 'M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z' }, { cx: 12, cy: 10, r: 2.5 }],
  check: [{ cx: 12, cy: 12, r: 9.5 }, { d: 'M7.5 12.5l3 3 6-6.5' }],
  bag: [{ d: 'M5 9h14l-1 11H6z M9 9V7a3 3 0 0 1 6 0v2 M9.5 14c.8 1.4 4.2 1.4 5 0' }],
  mail: [{ d: 'M3 6h18v12H3z M3 7l9 6 9-6' }],
  close: [{ d: 'M6 6l12 12 M18 6L6 18' }],
  chevronDown: [{ d: 'M7 10l5 5 5-5' }],
  external: [
    { d: 'M14 4h6v6 M20 4l-9 9 M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5' },
  ],
  minus: [{ d: 'M6 12h12' }],
  plus: [{ d: 'M12 6v12 M6 12h12' }],
  checkMark: [{ d: 'M5 12.5l4.5 4.5L19 7.5' }],
  // 運営画面（design 04）
  list: [{ d: 'M4 6h16M4 12h16M4 18h10' }],
  calendarCheck: [
    {
      d: 'M8 3v3M16 3v3M4 8h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM9 14l2 2 4-4',
    },
  ],
  store: [
    {
      d: 'M3 10l2-5h14l2 5M3 10v10h18V10M3 10a3 3 0 0 0 6 0 3 3 0 0 0 6 0 3 3 0 0 0 6 0M10 20v-6h4v6',
    },
  ],
  menuProduct: [
    { d: 'M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0' },
  ],
  menuEvent: [
    {
      d: 'M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z',
    },
  ],
  menuJob: [
    {
      d: 'M2 7h20v13a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M2 13h20',
    },
  ],
  menuNotice: [
    {
      d: 'M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1zM17 9a4 4 0 0 1 0 6M19.5 6.5a8 8 0 0 1 0 11',
    },
  ],
  search: [{ cx: 11, cy: 11, r: 7 }, { d: 'M20 20l-3.5-3.5' }],
  more: [
    { cx: 5, cy: 12, r: 1.6, fill: true },
    { cx: 12, cy: 12, r: 1.6, fill: true },
    { cx: 19, cy: 12, r: 1.6, fill: true },
  ],
  phone: [
    {
      d: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2',
    },
  ],
  lock: [{ d: 'M6 11V8a6 6 0 0 1 12 0v3M5 11h14v10H5z' }],
  camera: [{ d: 'M4 8h3l2-3h6l2 3h3v11H4z' }, { cx: 12, cy: 13, r: 3.5 }],
  warning: [{ d: 'M12 3l10 18H2z M12 10v4 M12 17h.01' }],
} satisfies Record<string, Shape[]>;

export type IconName = keyof typeof ICONS;

type Props = {
  name: IconName;
  size?: number;
  color: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color, strokeWidth = 2 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {ICONS[name].map((shape, i) =>
        'd' in shape ? (
          <Path
            key={i}
            d={shape.d}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <Circle
            key={i}
            cx={shape.cx}
            cy={shape.cy}
            r={shape.r}
            stroke={'fill' in shape && shape.fill ? 'none' : color}
            fill={'fill' in shape && shape.fill ? color : 'none'}
            strokeWidth={strokeWidth}
          />
        ),
      )}
    </Svg>
  );
}
