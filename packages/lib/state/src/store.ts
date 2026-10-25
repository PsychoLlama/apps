import { createMutable } from 'solid-js/store';
import { pipe, type Plan } from '@lib/effects';

declare const STORE: unique symbol;

/**
 * Readonly all the way down. Functions pass through untouched; arrays
 * become readonly arrays of readonly items.
 */
type DeepReadonly<T> = T extends (...args: never[]) => unknown
  ? T
  : T extends readonly (infer Item)[]
    ? readonly DeepReadonly<Item>[]
    : T extends object
      ? { readonly [Key in keyof T]: DeepReadonly<T[Key]> }
      : T;

/**
 * A reactive object, read-only to everyone but a commit. Read it like any
 * Solid store; write it from `defineCommand` or `defineExtension`.
 */
export type Store<State extends object> = DeepReadonly<State> & {
  // Phantom. Recovers the writable shape for commits, and keeps arbitrary
  // objects from passing as stores.
  readonly [STORE]: State;
};

/**
 * Define a store. `init` runs when the plan is first held and seeds the
 * state from whatever the earlier step yields. Each live plan owns one
 * store, and the state ends with it.
 */
export const defineStore = <State extends object, Input = void>(
  init: (input: Input) => State,
): Plan<Input, Store<State>, 'sync'> =>
  // Only the mode needs vouching: a generic `State` might be a promise as
  // far as TypeScript knows.
  pipe([
    // The proxy is both views: readers get it typed read-only, commits
    // write through the same object.
    (input: Input) => createMutable(init(input)) as Store<State>,
  ]) as Plan<Input, Store<State>, 'sync'>;
