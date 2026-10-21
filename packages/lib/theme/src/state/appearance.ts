import { defineCommand, defineStore } from '@lib/state';
import { PREFERENCES, type Appearance } from '../constants';

// A missing or unrecognized attribute reads as its fallback.
const hydrate = <Key extends keyof Appearance>(key: Key): Appearance[Key] => {
  const { attribute, ids, fallback } = PREFERENCES[key];
  const value = document.documentElement.dataset[attribute];

  return ids.find((id) => id === value) ?? fallback;
};

/**
 * Every appearance preference, hydrated from the `<html>` attributes the
 * prelude stamped. Client-only; it reads `document`.
 */
export const $appearance = defineStore<Appearance>(() => ({
  theme: hydrate('theme'),
  colorScheme: hydrate('colorScheme'),
  motion: hydrate('motion'),
}));

/** A preference changed. Effects write the DOM and storage. */
export const $appearanceChanged = defineCommand(
  [$appearance],
  (appearance) =>
    <Key extends keyof Appearance>(key: Key, value: Appearance[Key]) => {
      appearance[key] = value;
    },
);
