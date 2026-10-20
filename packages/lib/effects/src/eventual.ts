import type { Mode } from './mode';

/** A value that's already here. */
export interface Sync<T> {
  readonly type: 'sync';
  readonly value: T;
}

/** A value that lands later. */
export interface Async<T> {
  readonly type: 'async';
  readonly value: Promise<T>;
}

/**
 * A value now or later, told apart at runtime by `type`. A `sync` mode
 * narrows it to a value that's already here.
 */
export type Eventual<T, M extends Mode = Mode> = M extends 'sync'
  ? Sync<T>
  : Sync<T> | Async<T>;

/** Wrap a value that's already here. */
export const now = <T>(value: T): Sync<T> => ({ type: 'sync', value });

/** Wrap a value that lands later. */
export const later = <T>(value: Promise<T>): Async<T> => ({
  type: 'async',
  value,
});

const isPromiseLike = (value: unknown): value is PromiseLike<unknown> =>
  (typeof value === 'object' || typeof value === 'function') &&
  value !== null &&
  'then' in value &&
  typeof value.then === 'function';

/** Wrap a value that may be a promise, telling which by its shape. */
export const from = <T>(value: T | PromiseLike<T>): Eventual<T> =>
  isPromiseLike(value) ? later(Promise.resolve(value)) : now(value);

/** The value as a promise, whichever way it lands. */
export const toPromise = <T>(eventual: Eventual<T>): Promise<T> =>
  eventual.type === 'sync' ? Promise.resolve(eventual.value) : eventual.value;

/**
 * Run `next` on the value: right away if it's here, once it lands if not.
 * A throw from `next` throws now, or rejects later.
 */
export const chain = <T, U>(
  eventual: Eventual<T>,
  next: (value: T) => Eventual<U>,
): Eventual<U> =>
  eventual.type === 'sync'
    ? next(eventual.value)
    : later(eventual.value.then((value) => toPromise(next(value))));

/** Every value, here once they all are. Rejects if any rejects. */
export const all = <T>(eventuals: readonly Eventual<T>[]): Eventual<T[]> =>
  eventuals.every((eventual) => eventual.type === 'sync')
    ? now(eventuals.map((eventual) => eventual.value))
    : later(Promise.all(eventuals.map(toPromise)));

/**
 * Run `step` over each item in order, each waiting for the last. Stays
 * synchronous until a step isn't.
 */
export const sequence = <T, U>(
  items: readonly T[],
  step: (item: T) => Eventual<U>,
): Eventual<U[]> => {
  const results: U[] = [];

  const resume = (start: number): Eventual<U[]> => {
    for (let index = start; index < items.length; index += 1) {
      const result = step(items[index]);
      if (result.type === 'async') {
        return later(
          result.value.then((value) => {
            results.push(value);
            return toPromise(resume(index + 1));
          }),
        );
      }

      results.push(result.value);
    }

    return now(results);
  };

  return resume(0);
};

/** Run `cleanup` once `run` settles, whichever way, like `finally`. */
export const lastly = <T>(
  run: () => Eventual<T>,
  cleanup: () => void,
): Eventual<T> => {
  let result: Eventual<T>;
  try {
    result = run();
  } catch (error) {
    cleanup();
    throw error;
  }

  if (result.type === 'sync') {
    cleanup();
    return result;
  }

  return later(result.value.finally(cleanup));
};

/** Hand a failure from `run` to `handle` instead, like `catch`. */
export const rescue = <T>(
  run: () => Eventual<T>,
  handle: (error: unknown) => void,
): Eventual<T | undefined> => {
  try {
    const result = run();
    if (result.type === 'sync') return result;

    return later(
      result.value.catch((error: unknown) => {
        handle(error);
        return undefined;
      }),
    );
  } catch (error) {
    handle(error);
    return now(undefined);
  }
};
