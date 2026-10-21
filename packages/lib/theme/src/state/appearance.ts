import { pipe } from '@lib/effects';
import { defineCommand, defineStore } from '@lib/state/next';
import type { Appearance } from '../constants';
import { $hydrateAppearance } from '../dom';

/**
 * Every appearance preference, hydrated from the `<html>` attributes the
 * prelude stamped. Client-only; it reads `document`.
 */
export const $appearance = pipe([
  $hydrateAppearance,
  defineStore<Appearance, Appearance>((hydrated) => ({ ...hydrated })),
]);

/** A preference changed. Effects write the DOM and storage. */
export const $appearanceChanged = defineCommand(
  [$appearance],
  (appearance) =>
    <Key extends keyof Appearance>(key: Key, value: Appearance[Key]) => {
      appearance[key] = value;
    },
);
