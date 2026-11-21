import type { Item } from '@crate/beam';

/**
 * How long a pause has to be before what follows it reads as a separate
 * sitting, in milliseconds.
 */
export const RUN_GAP = 15 * 60 * 1000;

/** Items one device shared in one sitting. */
export interface FeedRun {
  /** The device that shared them. */
  readonly author: string;

  /**
   * Whether this is an item the app wrote for itself. One of those is
   * always a sitting of its own: nobody shared it.
   */
  readonly system: boolean;

  /** When the first of them was shared, in epoch milliseconds. */
  readonly startedAt: number;

  /** The items, oldest first. Never empty. */
  readonly items: readonly Item[];
}

/** Everything shared on one day. */
export interface FeedDay {
  /** Local midnight at the start of the day, in epoch milliseconds. */
  readonly day: number;

  /** The day's sittings, oldest first. Never empty. */
  readonly runs: readonly FeedRun[];
}

/** Local midnight at the start of the day `epochMilliseconds` falls on. */
export const dayOf = (epochMilliseconds: number): number =>
  new Date(epochMilliseconds).setHours(0, 0, 0, 0);

/**
 * A feed as it's read: by day, and within a day by sitting. A sitting
 * ends when another device shares something, when nothing is shared for
 * {@link RUN_GAP}, or either side of an item the app wrote for itself.
 *
 * Takes the items oldest first and keeps that order throughout.
 */
export const timeline = (items: readonly Item[]): FeedDay[] => {
  const days: {
    day: number;
    runs: {
      author: string;
      system: boolean;
      startedAt: number;
      items: Item[];
    }[];
  }[] = [];
  let last: Item | undefined;

  for (const item of items) {
    const day = dayOf(item.createdAt);
    let today = days.at(-1);

    if (!today || today.day !== day) {
      today = { day, runs: [] };
      days.push(today);
      last = undefined;
    }

    const run = today.runs.at(-1);
    const follows =
      run &&
      last &&
      !last.system &&
      !item.system &&
      last.author === item.author &&
      item.createdAt - last.createdAt < RUN_GAP;

    if (follows) run.items.push(item);
    else {
      today.runs.push({
        author: item.author,
        system: Boolean(item.system),
        startedAt: item.createdAt,
        items: [item],
      });
    }

    last = item;
  }

  return days;
};
