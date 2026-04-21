import { batch } from 'solid-js';
import { produce, type SetStoreFunction } from 'solid-js/store';
import type { Registry } from './internal';
import { getSetter, type StoreRef } from './store';

type StateOf<R> = R extends StoreRef<infer T> ? T : never;

type DraftsOf<Refs extends readonly StoreRef<object>[]> = {
  [K in keyof Refs]: StateOf<Refs[K]>;
};

/**
 * Binds a tuple of stores to a handler. Tuple layout (stores then handler)
 * keeps field positions minifiable. Create via {@link defineAction}.
 */
export type Action<
  Stores extends readonly StoreRef<object>[],
  Input,
> = readonly [
  stores: Stores,
  handler: (...args: [...DraftsOf<Stores>, Input]) => void,
];

/**
 * Define an action over one or more stores. The handler receives writable
 * drafts for each store in order, plus the input as the last argument. Must
 * be synchronous.
 */
export function defineAction<
  const Stores extends readonly [StoreRef<object>, ...StoreRef<object>[]],
  Input = undefined,
>(
  stores: Stores,
  handler: (...args: [...DraftsOf<Stores>, Input]) => void,
): Action<Stores, Input> {
  return [stores, handler];
}

/**
 * Invoke an action against a registry. Multi-store updates batch into a
 * single reactive flush. All stores in the action must already be created.
 */
export function invoke<Stores extends readonly StoreRef<object>[], Input>(
  registry: Registry,
  action: Action<Stores, Input>,
  input: Input,
): void {
  const [stores, handler] = action;

  const setters: SetStoreFunction<object>[] = [];
  for (const ref of stores) {
    setters.push(getSetter(registry, ref));
  }

  const drafts: object[] = Array.from({ length: stores.length });

  const run = (depth: number): void => {
    if (depth === stores.length) {
      (handler as (...args: unknown[]) => void)(...drafts, input);
      return;
    }

    setters[depth](
      produce((draft: object) => {
        drafts[depth] = draft;
        run(depth + 1);
      }),
    );
  };

  batch(() => run(0));
}
