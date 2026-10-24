import { defineCommand, defineStore } from '@lib/state';
import { PREFERENCES, type Preferences } from '../constants';

// A missing or unrecognized attribute reads as its fallback.
const hydrate = <Key extends keyof Preferences>(key: Key): Preferences[Key] => {
  const { attribute, ids, fallback } = PREFERENCES[key];
  const value = document.documentElement.dataset[attribute];

  return ids.find((id) => id === value) ?? fallback;
};

/**
 * Every preference, hydrated from the `<html>` attributes the
 * prelude stamped. Client-only; it reads `document`.
 */
export const $preferences = defineStore<Preferences>(() => ({
  theme: hydrate('theme'),
  colorScheme: hydrate('colorScheme'),
  motion: hydrate('motion'),
}));

/** A preference changed. Effects write the DOM and storage. */
export const $preferencesChanged = defineCommand(
  [$preferences],
  (preferences) =>
    <Key extends keyof Preferences>(key: Key, value: Preferences[Key]) => {
      preferences[key] = value;
    },
);
