/**
 * Pack ids dropped from the iconify catalog before either the build
 * or dev path sees them. The icon editor restyles monotone glyphs
 * for use as favicons; packs that bake in color, encode trademarks,
 * or animate don't fit that workflow and bloat the asset bundle
 * (~67% of `@iconify/json`'s raw catalog by size).
 */
export const EXCLUDED_PACKS: ReadonlySet<string> = new Set([
  // Emoji.
  'fluent-emoji',
  'fluent-emoji-flat',
  'fluent-emoji-high-contrast',
  'noto',
  'noto-v1',
  'twemoji',
  'openmoji',
  'emojione',
  'emojione-v1',
  'emojione-monotone',
  'fxemoji',
  'streamline-emojis',

  // Flags.
  'flag',
  'flagpack',
  'circle-flags',
  'cif',

  // Animated.
  'svg-spinners',

  // Brand / trademarked logos (monotone).
  'simple-icons',
  'arcticons',
  'cbi',
  'cib',
  'devicon-plain',
  'token',
  'cryptocurrency',
  'streamline-logos',
  'file-icons',
  'fa-brands',
  'fa6-brands',
  'fa7-brands',
  'bxl',
  'nonicons',
  'brandico',
  'entypo-social',

  // Hardcoded color — UI / multicolor.
  'icon-park',
  'fluent-color',
  'meteocons',
  'glyphs-poly',
  'marketeq',
  'flat-color-icons',
  'flat-ui',
  'streamline-color',
  'streamline-freehand-color',
  'streamline-plump-color',
  'streamline-ultimate-color',
  'streamline-flex-color',
  'streamline-kameleon-color',
  'streamline-stickies-color',
  'streamline-sharp-color',
  'streamline-cyber-color',

  // Hardcoded color — brand / programming palette.
  'logos',
  'token-branded',
  'devicon',
  'vscode-icons',
  'skill-icons',
  'material-icon-theme',
  'cryptocurrency-color',
  'catppuccin',
  'unjs',
  'gcp',
]);

/** Strip excluded packs from a parsed `collections.json` payload. */
export const withoutExcludedPacks = <T>(
  collections: Record<string, T>,
): Record<string, T> => {
  const filtered: Record<string, T> = {};
  for (const [id, value] of Object.entries(collections)) {
    if (!EXCLUDED_PACKS.has(id)) filtered[id] = value;
  }
  return filtered;
};
