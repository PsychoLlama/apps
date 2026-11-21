import { defineCell, defineCommand } from '@lib/state';

/** How long an item says it was copied, in milliseconds. */
export const COPIED_FOR = 1500;

/** The item that was just copied, by id, while it's still saying so. */
export const $copied = defineCell<string | null>(() => null);

/**
 * An item was copied, or has said so for long enough. Being done only
 * counts for the item that's saying so: copying a second item takes over
 * from the first, and the first's time running out mustn't end it.
 */
export const $copyMarked = defineCommand(
  [$copied],
  ([copied, setCopied]) =>
    (itemId: string, shown: boolean) => {
      if (shown) setCopied(itemId);
      else if (copied() === itemId) setCopied(null);
    },
);
