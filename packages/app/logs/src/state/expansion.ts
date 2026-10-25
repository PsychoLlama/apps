import { defineCommand, defineStore } from '@lib/state';

/** Which log entries are open, by log id. */
export interface ExpansionState {
  /** Open entries. Absent means closed. */
  open: Record<number, true>;
}

/**
 * Which entries show their attribute table. Kept here rather than only on
 * the `<details>` element so a closed entry renders no table at all:
 * attributes are flattened and formatted only once someone opens them.
 */
export const $expansion = defineStore<ExpansionState>(() => ({ open: {} }));

/** An entry opened or closed. */
export const $entryToggled = defineCommand(
  [$expansion],
  (expansion) => (id: number, open: boolean) => {
    if (open) expansion.open[id] = true;
    else delete expansion.open[id];
  },
);
