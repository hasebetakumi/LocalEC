import Svg, { Circle, Path } from 'react-native-svg';

type Shape = { d: string } | { cx: number; cy: number; r: number };

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
            stroke={color}
            strokeWidth={strokeWidth}
          />
        ),
      )}
    </Svg>
  );
}
