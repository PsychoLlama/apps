import { createThemeContract, createGlobalTheme } from '@vanilla-extract/css';
import { gray, grayDark, red, redDark } from '@radix-ui/colors';

/**
 * 12-step color scales following the Radix color system.
 *
 * Steps 1-2: Backgrounds
 * Steps 3-5: Component backgrounds (normal, hover, active)
 * Steps 6-8: Borders (subtle, normal, hover)
 * Steps 9-10: Solid backgrounds (normal, hover)
 * Steps 11-12: Text (low contrast, high contrast)
 */
function scale() {
  return {
    1: '',
    2: '',
    3: '',
    4: '',
    5: '',
    6: '',
    7: '',
    8: '',
    9: '',
    10: '',
    11: '',
    12: '',
  };
}

/** Reshape a Radix color object (`{ gray1: '...' }`) into a scale (`{ 1: '...' }`). */
function radix(obj: Record<string, string>) {
  const entries = Object.values(obj);
  return Object.fromEntries(entries.map((v, i) => [i + 1, v])) as Record<
    1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12,
    string
  >;
}

export const color = createThemeContract({
  gray: scale(),
  red: scale(),

  // Semantic aliases
  background: '',
  surface: '',
  text: '',
  textMuted: '',
  border: '',
  borderSubtle: '',
  accent: '',
  accentText: '',
});

// Light theme
createGlobalTheme(':root', color, {
  gray: radix(gray),
  red: radix(red),

  background: '#ffffff',
  surface: gray.gray1,
  text: gray.gray12,
  textMuted: gray.gray11,
  border: gray.gray7,
  borderSubtle: gray.gray5,
  accent: red.red9,
  accentText: '#ffffff',
});

// Dark theme
createGlobalTheme('[data-theme="dark"]', color, {
  gray: radix(grayDark),
  red: radix(redDark),

  background: grayDark.gray1,
  surface: grayDark.gray2,
  text: grayDark.gray12,
  textMuted: grayDark.gray11,
  border: grayDark.gray7,
  borderSubtle: grayDark.gray5,
  accent: redDark.red9,
  accentText: '#ffffff',
});
