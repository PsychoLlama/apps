import { batch } from 'solid-js';
import type { Registry } from './internal';
import { getMutable, type StoreRef } from './store';

type StateOf<R> = R extends StoreRef<infer T> ? T : never;

type DraftsOf<Refs extends readonly StoreRef<object>[]> = {
  [K in keyof Refs]: StateOf<Refs[K]>;
};

/**
 * Carries Input contravariantly without the variadic-tuple mismatch that
 * `[...DraftsOf<Stores>, Input]` produces when `Stores` is widened. Purely
 * a type-level brand — never accessed at runtime.
 */
interface InputBrand<Input> {
  readonly __input?: (x: Input) => void;
}

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
] &
  InputBrand<Input>;

/**
 * Type-erased `Action` keyed only on its Input. Lets effect handler slots
 * accept any `Action<*, Input>` regardless of the store tuple's shape.
 */
export type AnyAction<Input> = readonly unknown[] & InputBrand<Input>;

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

  const drafts: object[] = [];
  for (const ref of stores) {
    drafts.push(getMutable(registry, ref));
  }

  batch(() => {
    (handler as (...args: unknown[]) => void)(...drafts, input);
  });
}
