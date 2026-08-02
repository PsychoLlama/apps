/**
 * What a share may carry, and how to read what one turned out to be.
 *
 * The sibling of `labels.ts`: a pure text rule, applied at every edge the
 * text crosses. Above the features because the wire speaks it too — the
 * decoder bounds a body before it becomes anything, and the fold normalizes
 * it before it becomes a row.
 */

/**
 * The longest body a share may carry. The wire caps an inbound message at
 * 64 KiB, and JSON's worst case is six bytes per UTF-16 unit (a control
 * character escaped as `\uXXXX`), so this is the largest text that can't
 * overrun the transport whatever it contains.
 *
 * Generous for a link or a paragraph, and short of the size where "share
 * some text" turns into "transfer a file" — which is Phase 5's job.
 */
export const SHARE_MAX_LENGTH = 8192;

/**
 * Bring a share body down to what the log stores, or `null` if nothing
 * survives. The authority on what a share may be: the folds run every body
 * through it, incoming and outgoing alike.
 *
 * Unlike a name, a body may be several lines — text pasted out of a document
 * arrives with the shape it had — so newlines and tabs are kept and the rest
 * of the control characters go. The ends are trimmed, the length capped, and
 * the ends trimmed again, since a cut can land mid-whitespace.
 */
export const normalizeShare = (raw: string): string | null => {
  const body = raw
    .replace(/[^\P{Cc}\n\t]/gu, '')
    .trim()
    .slice(0, SHARE_MAX_LENGTH)
    .trim();

  return body.length > 0 ? body : null;
};

/**
 * The http(s) URL a share carries, or `null` if it isn't one. Only a body
 * that is *entirely* a URL counts — a sentence with a link in it is text,
 * and picking the link out of it would mean guessing where it ends.
 *
 * The scheme allowlist is the point rather than a tidiness rule. A body
 * arrives from the network, and `javascript:` or `data:` behind an Open
 * button is a way to run a peer's choice of code on this origin. Anything
 * that isn't ordinary web navigation stays text you can read.
 */
export const shareLink = (body: string): string | null => {
  if (/\s/.test(body)) return null;

  let url: URL;

  try {
    url = new URL(body);
  } catch {
    return null;
  }

  return url.protocol === 'http:' || url.protocol === 'https:'
    ? url.href
    : null;
};
