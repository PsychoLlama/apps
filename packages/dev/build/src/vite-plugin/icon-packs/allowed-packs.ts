/**
 * Pack ids the icon editor will surface from the iconify catalog.
 * Allowlist by design: `@iconify/json` ships ~225 packs, but only
 * monotone, statically-rendered glyphs make sense as favicon source
 * material. Emoji, flag, animated, hardcoded-color, and trademarked
 * packs are dropped here; this is also the gate that blocks new packs
 * from sneaking in unreviewed when `@iconify/json` is bumped.
 *
 * Adding a pack? Confirm it's monotone (or filterable to monotone),
 * uses `currentColor`, doesn't ship SMIL animations wholesale, and
 * isn't gated by trademark. Group additions under the existing
 * iconify category headings so future audits stay legible.
 */
export const ALLOWED_PACKS: ReadonlySet<string> = new Set([
  // Archive / Unmaintained.
  'dashicons',
  'el',
  'entypo',
  'et',
  'eva',
  'fa',
  'fa-regular',
  'fa-solid',
  'fa6-regular',
  'fa6-solid',
  'fluent-mdl2',
  'fontisto',
  'foundation',
  'gala',
  'grommet-icons',
  'heroicons-outline',
  'heroicons-solid',
  'icomoon-free',
  'icons8',
  'iwwa',
  'la',
  'oi',
  'raphael',
  'simple-line-icons',
  'subway',
  'vaadin',
  'wpf',

  // Flags / Maps. Country flags are color-baked or trademarked; only
  // the geographic / cartography packs survive.
  'geo',
  'gis',
  'map',

  // Material.
  'ic',
  'material-symbols',
  'material-symbols-light',
  'mdi',
  'mdi-light',

  // Programming. Most programming packs are brand logos; codicon is
  // the only generic IDE-glyph pack worth keeping.
  'codicon',

  // Thematic.
  'academicons',
  'covid',
  'fad',
  'game-icons',
  'healthicons',
  'medical-icon',
  'wi',

  // UI 16px / 32px.
  'ant-design',
  'bi',
  'bytesize',
  'carbon',
  'charm',
  'cil',
  'ep',
  'famicons',
  'formkit',
  'gravity-ui',
  'ion',
  'lsicon',
  'nimbus',
  'quill',
  'rivet-icons',
  'roentgen',
  'streamline-block',
  'streamline-pixel',

  // UI 24px.
  'akar-icons',
  'basil',
  'bitcoin-icons',
  'boxicons',
  'bx',
  'bxs',
  'ci',
  'circum',
  'cuida',
  'duo-icons',
  'eos-icons',
  'fe',
  'flowbite',
  'gg',
  'gridicons',
  'guidance',
  'hugeicons',
  'humbleicons',
  'icon-park-outline',
  'icon-park-solid',
  'icon-park-twotone',
  'iconamoon',
  'iconoir',
  'jam',
  'lets-icons',
  'lineicons',
  'lucide',
  'lucide-lab',
  'mage',
  'majesticons',
  'meteor-icons',
  'mi',
  'mingcute',
  'mynaui',
  'pixel',
  'pixelarticons',
  'prime',
  'proicons',
  'ri',
  'si',
  'solar',
  'stash',
  'streamline-cyber',
  'streamline-flex',
  'streamline-freehand',
  'streamline-plump',
  'streamline-sharp',
  'streamline-ultimate',
  'tabler',
  'tdesign',
  'typcn',
  'uil',
  'uim',
  'uis',
  'uit',
  'weui',
  'wordpress',

  // UI Other / Mixed Grid.
  'clarity',
  'codex',
  'dinkie-icons',
  'ei',
  'f7',
  'fa7-regular',
  'fa7-solid',
  'fluent',
  'garden',
  'glyphs',
  'heroicons',
  'ix',
  'maki',
  'memory',
  'nrk',
  'octicon',
  'ooui',
  'oui',
  'pajamas',
  'pepicons-pencil',
  'pepicons-pop',
  'pepicons-print',
  'ph',
  'picon',
  'qlementine-icons',
  'radix-icons',
  'sidekickicons',
  'streamline',
  'system-uicons',
  'teenyicons',
  'temaki',
  'uiw',
  'zondicons',

  // Uncategorized in iconify, but qualify on merit.
  'bpmn',
  'feather',
  'fontelico',
  'il',
  'ls',
  'mono-icons',
  'pepicons',
  'ps',
  'si-glyph',
  'topcoat',
  'vs',
  'websymbol',
  'whh',
  'zmdi',
]);

/** Strip non-allowlisted packs from a parsed `collections.json` payload. */
export const withOnlyAllowedPacks = <T>(
  collections: Record<string, T>,
): Record<string, T> => {
  const filtered: Record<string, T> = {};
  for (const [id, value] of Object.entries(collections)) {
    if (ALLOWED_PACKS.has(id)) filtered[id] = value;
  }
  return filtered;
};
