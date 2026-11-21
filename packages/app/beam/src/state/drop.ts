import { defineCell, defineCommand } from '@lib/state';

/**
 * Whether something that could be shared is being dragged over the
 * page right now, from outside it.
 */
export const $dropping = defineCell(() => false);

/** A drag came over the page, or left it, or was let go. */
export const $dropHovered = defineCommand(
  [$dropping],
  ([, setDropping]) =>
    (over: boolean) => {
      setDropping(over);
    },
);

/** What a drag carries that this app would share. */
export interface Dropped {
  /** Files, in the order they were dragged. */
  readonly files: readonly File[];

  /** Text or a link, when there are no files. */
  readonly text: string | null;
}

/** The parts of a `DataTransfer` this reads. */
export interface DragPayload {
  /** The formats the drag offers. Readable before it's dropped. */
  readonly types: readonly string[];

  /** The files dropped. Empty until the drop. */
  readonly files: ArrayLike<File>;

  /** What the drag holds in a format, or nothing. */
  getData(format: string): string;
}

/**
 * Whether a drag carries anything worth sharing. Asked while it hovers,
 * when only the formats can be read and not what's in them.
 */
export const isShareable = (payload: Pick<DragPayload, 'types'>): boolean =>
  payload.types.includes('Files') ||
  payload.types.includes('text/uri-list') ||
  payload.types.includes('text/plain');

/**
 * What a drop carried. Files win: a file dragged from a browser comes
 * with its address as text too, and it's the file that was meant.
 *
 * A dragged link offers itself as a list of addresses, which may open
 * with comments. The first address is the link.
 */
export const droppedOf = (payload: DragPayload): Dropped => {
  const files = Array.from(payload.files);
  if (files.length > 0) return { files, text: null };

  const links = payload.getData('text/uri-list').split(/\r?\n/);
  const link = links.find((line) => line && !line.startsWith('#'));
  const text = link ?? payload.getData('text/plain');

  return { files, text: text.trim() ? text : null };
};
