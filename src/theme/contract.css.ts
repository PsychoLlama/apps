import { createGlobalThemeContract } from '@vanilla-extract/css';

// createGlobalThemeContract requires explicit variable names — it doesn't
// auto-hash like createVar(). The map function converts the object path
// into a CSS variable name: vars.accent[9] → var(--accent-9).
const name = (_: string | null, path: string[]) => path.join('-');

function steps() {
  const s: Record<string, null> = {};
  for (let i = 1; i <= 12; i++) s[i] = null;
  return s;
}

function alphaSteps() {
  const s: Record<string, null> = {};
  for (let i = 1; i <= 12; i++) s[`a${i}`] = null;
  return s;
}

function colorScale() {
  return {
    ...steps(),
    ...alphaSteps(),
    contrast: null,
    surface: null,
    indicator: null,
    track: null,
  };
}

export const vars = createGlobalThemeContract(
  {
    scaling: null,

    accent: colorScale(),
    gray: colorScale(),
    black: alphaSteps(),
    white: alphaSteps(),

    space: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
    },

    fontSize: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
    },
    fontWeight: { light: null, regular: null, medium: null, bold: null },
    lineHeight: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
    },
    headingLineHeight: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
    },
    letterSpacing: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      7: null,
      8: null,
      9: null,
    },

    radius: {
      1: null,
      2: null,
      3: null,
      4: null,
      5: null,
      6: null,
      full: null,
      thumb: null,
    },
    shadow: { 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },

    color: {
      background: null,
      overlay: null,
      panelSolid: null,
      panelTranslucent: null,
      surface: null,
      transparent: null,
    },

    font: { default: null, code: null, em: null, heading: null },
  },
  name,
);
