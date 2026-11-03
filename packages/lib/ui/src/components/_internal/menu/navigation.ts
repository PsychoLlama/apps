/** Focus without scrolling: the menu floats, so there's nothing to reveal. */
export const NO_SCROLL: FocusOptions = { preventScroll: true };

/** Every kind of item the keyboard and typeahead visit. */
const ITEM_SELECTOR =
  '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"]';

/** The menu's enabled items, in document order. */
export const enabledItems = (surface: HTMLElement): HTMLElement[] =>
  Array.from(surface.querySelectorAll<HTMLElement>(ITEM_SELECTOR)).filter(
    (item) => item.getAttribute('aria-disabled') !== 'true',
  );

/** Keys that land on the first item when the surface holds focus. */
const FIRST_KEYS = ['ArrowDown', 'PageUp', 'Home'];

/** Keys that land on the last item when the surface holds focus. */
const LAST_KEYS = ['ArrowUp', 'PageDown', 'End'];

/** Every key that moves focus between items. */
export const NAVIGATION_KEYS: ReadonlySet<string> = new Set([
  ...FIRST_KEYS,
  ...LAST_KEYS,
]);

/**
 * The item a navigation key moves focus to, or `undefined` when the key
 * doesn't navigate or there's nowhere to go. From the surface itself,
 * the arrows enter at either end; from an item they step without
 * wrapping, and Home/End (or PageUp/PageDown) jump to the ends.
 */
export const navigationTarget = (
  items: readonly HTMLElement[],
  current: Element | null,
  key: string,
): HTMLElement | undefined => {
  const index = current ? items.indexOf(current as HTMLElement) : -1;

  if (index === -1) {
    if (FIRST_KEYS.includes(key)) return items.at(0);
    if (LAST_KEYS.includes(key)) return items.at(-1);
    return undefined;
  }

  switch (key) {
    case 'ArrowDown':
      return items[index + 1];
    case 'ArrowUp':
      return index > 0 ? items[index - 1] : undefined;
    case 'Home':
    case 'PageUp':
      return items.at(0);
    case 'End':
    case 'PageDown':
      return items.at(-1);
    default:
      return undefined;
  }
};

/**
 * Index of the next value a typeahead search lands on, or `undefined`
 * to stay put. Searches forward from the current match. A key pressed
 * over and over cycles through the values starting with it, and a
 * single key always moves on rather than matching where it already is.
 * Works by index, so items sharing a label are each reachable.
 */
export const nextTypeaheadMatch = (
  values: readonly string[],
  search: string,
  currentIndex = -1,
): number | undefined => {
  const repeated =
    search.length > 1 && Array.from(search).every((char) => char === search[0]);
  const normalized = (repeated ? search[0] : search).toLowerCase();
  const matches = (index: number) =>
    values[index].toLowerCase().startsWith(normalized);

  // A lone key looks past the current match; a longer search keeps it.
  const skipCurrent = normalized.length === 1;
  const start = Math.max(currentIndex, 0);

  for (let step = 0; step < values.length; step++) {
    const index = (start + step) % values.length;
    if (skipCurrent && index === currentIndex) continue;
    if (matches(index)) return index === currentIndex ? undefined : index;
  }

  return undefined;
};
