import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_IDS,
  COLOR_SCHEME_STORAGE_KEY,
  DEFAULT_THEME_ID,
  MOTION_ATTRIBUTE,
  MOTION_IDS,
  MOTION_STORAGE_KEY,
  THEME_ATTRIBUTE,
  THEME_COLOR_META_ID,
  THEME_COLORS,
  THEME_IDS,
  THEME_STORAGE_KEY,
  type Appearance,
  type ColorSchemeOption,
  type ThemeId,
} from './constants';

// The `<html>` attributes the prelude stamps before paint record each
// preference between page loads. State hydrates from them; effects
// write them.

/** Where a preference lives, and what it reads as when it isn't set. */
interface Preference<Value> {
  /** The `dataset` key on `<html>` carrying it. */
  readonly attribute: string;

  /** Every value the attribute may carry. */
  readonly ids: readonly Value[];

  /** The value when nothing is stored. Selecting it clears storage. */
  readonly fallback: Value;

  /** Where the prelude finds the preference on the next load. */
  readonly storageKey: string;
}

/** Each preference by name. */
export const PREFERENCES: {
  readonly [Key in keyof Appearance]: Preference<Appearance[Key]>;
} = {
  theme: {
    attribute: THEME_ATTRIBUTE,
    ids: THEME_IDS,
    fallback: DEFAULT_THEME_ID,
    storageKey: THEME_STORAGE_KEY,
  },
  colorScheme: {
    attribute: COLOR_SCHEME_ATTRIBUTE,
    ids: COLOR_SCHEME_IDS,
    fallback: 'system',
    storageKey: COLOR_SCHEME_STORAGE_KEY,
  },
  motion: {
    attribute: MOTION_ATTRIBUTE,
    ids: MOTION_IDS,
    fallback: 'system',
    storageKey: MOTION_STORAGE_KEY,
  },
};

const readPreference = <Key extends keyof Appearance>(
  key: Key,
): Appearance[Key] => {
  const { attribute, ids, fallback } = PREFERENCES[key];
  const value = document.documentElement.dataset[attribute];

  return ids.find((id) => id === value) ?? fallback;
};

/**
 * Read every preference stamped onto `<html>`. A missing or unrecognized
 * attribute reads as its fallback.
 */
export const readAppearance = (): Appearance => ({
  theme: readPreference('theme'),
  colorScheme: readPreference('colorScheme'),
  motion: readPreference('motion'),
});

/**
 * Mirror the active theme's page-background colors into the paired
 * `<meta name="theme-color">` tags. The prelude does the same on first
 * paint; this keeps the browser chrome in sync when the user swaps
 * themes or color-schemes at runtime.
 *
 * An explicit `scheme` override collapses both tags onto the same
 * color — without that, the OS-level `prefers-color-scheme` query
 * baked into each tag's `media` attribute decides which one wins, and
 * the address bar drifts out of sync with the app's forced scheme.
 */
export const syncThemeColorMeta = (
  id: ThemeId,
  scheme: ColorSchemeOption,
): void => {
  const colors = THEME_COLORS[id];
  const lightContent = scheme === 'dark' ? colors.dark : colors.light;
  const darkContent = scheme === 'light' ? colors.light : colors.dark;
  document
    .getElementById(THEME_COLOR_META_ID.light)
    ?.setAttribute('content', lightContent);
  document
    .getElementById(THEME_COLOR_META_ID.dark)
    ?.setAttribute('content', darkContent);
};
