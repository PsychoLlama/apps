/**
 * Placeholder embedded in the virtual module's source. Rewritten to
 * the index asset's hashed URL inside `generateBundle`.
 */
export const INDEX_URL_PLACEHOLDER = '__ICON_PACKS_INDEX_URL__';

// Per-emit placeholders use a numeric tail to avoid colliding with
// Rollup refIds, which can contain `$` and `_` characters Rollup
// reserves but our placeholder format would otherwise truncate.
const REF_PLACEHOLDER_PREFIX = '__ICON_PACKS_REF_';
const REF_PLACEHOLDER_SUFFIX = '__';

/** Test-visible: lets callers detect whether a payload carries any refs. */
export const REF_PLACEHOLDER_MARKER = REF_PLACEHOLDER_PREFIX;

/**
 * Allocates opaque placeholder strings for Rollup `refId`s emitted
 * during `load`, then rewrites each placeholder to the corresponding
 * hashed URL in `generateBundle`. Counter-keyed substitution dodges
 * the question of which characters Rollup permits in refIds — we
 * never have to escape them for a regex.
 */
export interface PlaceholderTable {
  /** Allocate a placeholder string bound to `refId`. */
  allocate: (refId: string) => string;
  /**
   * Replace every allocated placeholder in `text` with the URL
   * `resolveUrl(refId)` returns. No-op when no placeholder prefix
   * appears in the text.
   */
  replaceRefs: (text: string, resolveUrl: (refId: string) => string) => string;
}

export const createPlaceholderTable = (): PlaceholderTable => {
  const refByPlaceholder = new Map<string, string>();
  let nextId = 0;

  const allocate = (refId: string): string => {
    const placeholder = `${REF_PLACEHOLDER_PREFIX}${nextId}${REF_PLACEHOLDER_SUFFIX}`;
    nextId += 1;
    refByPlaceholder.set(placeholder, refId);
    return placeholder;
  };

  const replaceRefs = (
    text: string,
    resolveUrl: (refId: string) => string,
  ): string => {
    if (!text.includes(REF_PLACEHOLDER_PREFIX)) return text;
    let result = text;
    for (const [placeholder, refId] of refByPlaceholder) {
      if (!result.includes(placeholder)) continue;
      result = result.replaceAll(placeholder, resolveUrl(refId));
    }
    return result;
  };

  return { allocate, replaceRefs };
};
