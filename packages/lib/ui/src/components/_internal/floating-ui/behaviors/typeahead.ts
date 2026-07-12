import { onCleanup } from 'solid-js';

/**
 * Typeahead for menus and listboxes: buffer keystrokes for a beat and
 * jump the highlight to the first match.
 *
 * @see https://github.com/radix-ui/primitives/blob/main/packages/react/menu/src/menu.tsx
 * (`getNextMatch` / `handleTypeaheadSearch`)
 *
 * Deviations from Radix: none in behavior — the matcher is a direct
 * port. Repeating one character cycles through items sharing that
 * initial; the search wraps around from the current item and excludes
 * it unless the query has grown past one character.
 */

/**
 * Find the label the buffered `search` should land on, or `undefined`
 * when nothing matches. Pure — the stateful wrapper below owns time.
 */
export const getNextMatch = (
  labels: readonly string[],
  search: string,
  current: string | undefined,
): string | undefined => {
  // "aaa" means the user is cycling items that start with "a", not
  // searching for a literal triple-a.
  const repeated =
    search.length > 1 && [...search].every((char) => char === search[0]);
  const normalized = repeated ? (search[0] ?? '') : search;

  // Wrap the candidate list around the current item so matching walks
  // forward from the highlight, and skip the highlight itself on
  // single-character queries so repeats always advance.
  const startIndex = current ? labels.indexOf(current) : -1;
  let wrapped = [
    ...labels.slice(startIndex + 1),
    ...labels.slice(0, startIndex + 1),
  ];
  if (normalized.length === 1) {
    wrapped = wrapped.filter((label) => label !== current);
  }

  return wrapped.find((label) =>
    label.toLowerCase().startsWith(normalized.toLowerCase()),
  );
};

/** A live typeahead buffer bound to a component's lifetime. */
export interface Typeahead {
  /**
   * Feed one printable key and get the label to highlight, if any.
   * The buffer resets after a second of silence.
   */
  search: (
    key: string,
    labels: readonly string[],
    current: string | undefined,
  ) => string | undefined;
  /** Whether a search is currently buffering — Space selects when the
   * buffer is idle but types when it isn't. */
  searching: () => boolean;
  /** Drop the buffer immediately. */
  reset: () => void;
}

/** How long the buffer survives between keystrokes, in ms. */
const TYPEAHEAD_TIMEOUT = 1000;

/**
 * Create a typeahead buffer. Timer state cleans up with the owning
 * component.
 */
export const createTypeahead = (): Typeahead => {
  let buffer = '';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const reset = () => {
    buffer = '';
    clearTimeout(timer);
  };

  onCleanup(reset);

  return {
    reset,
    searching: () => buffer.length > 0,
    search: (key, labels, current) => {
      buffer += key;
      clearTimeout(timer);
      timer = setTimeout(reset, TYPEAHEAD_TIMEOUT);

      return getNextMatch(labels, buffer, current);
    },
  };
};
