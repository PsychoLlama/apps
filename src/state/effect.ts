import { invoke, type Action, type AnyAction } from './action';
import type { Registry } from './internal';
import { collectArgs, type DeepReadonly, type StoreRef } from './store';

// `invoke` wants a fully-typed Action; we have `AnyAction` (brand-only).
// The brand is the identity layer — the runtime value is still the real
// action tuple, so cast at the boundary.
type LooseAction = Action<readonly StoreRef<object>[], unknown>;

type StateOf<R> = R extends StoreRef<infer T> ? T : never;

/** Readonly views for each store in the tuple, mirroring `createStore`'s return. */
type ReadsOf<Refs extends readonly StoreRef<object>[]> = {
  [K in keyof Refs]: DeepReadonly<StateOf<Refs[K]>>;
};

/** Optional lifecycle actions for a {@link defineEffect}. */
export interface EffectHandlers<Input, Output> {
  readonly onStart?: AnyAction<Input>;
  readonly onSuccess?: AnyAction<Awaited<Output>>;
  readonly onFailure?: AnyAction<Error>;
}

/**
 * Bundles a side-effect function with its lifecycle actions. Stored as a
 * tuple so the lifecycle slots occupy minifiable positions rather than
 * named keys in the bundle.
 *
 * The callback receives a readonly view for each declared store followed
 * by the input, so effects can pass straight through to their capability
 * without a re-reading wrapper.
 */
export type Effect<
  Stores extends readonly StoreRef<object>[],
  Input,
  Output,
> = readonly [
  stores: Stores,
  fn: (...args: [...ReadsOf<Stores>, Input]) => Output,
  onStart: AnyAction<Input> | undefined,
  onSuccess: AnyAction<Awaited<Output>> | undefined,
  onFailure: AnyAction<Error> | undefined,
];

/**
 * Define an effect that wraps a side-effecting callback with lifecycle
 * actions. The store tuple lists read dependencies; the callback receives
 * a readonly view per store plus the trailing input. Pass `[]` when the
 * callback reads no state.
 *
 * The no-input overload is picked when the callback's arity matches the
 * number of declared stores, fixing `Input` at `unknown` so call sites
 * stay zero-arg. The with-input overload infers `Input` from the trailing
 * callback parameter.
 */
export function defineEffect<
  const Stores extends readonly StoreRef<object>[],
  Output = void,
>(
  stores: Stores,
  fn: (...args: ReadsOf<Stores>) => Output,
  handlers?: EffectHandlers<unknown, Output>,
): Effect<Stores, unknown, Output>;
export function defineEffect<
  const Stores extends readonly StoreRef<object>[],
  Input,
  Output = void,
>(
  stores: Stores,
  fn: (...args: [...ReadsOf<Stores>, Input]) => Output,
  handlers?: EffectHandlers<Input, Output>,
): Effect<Stores, Input, Output>;
export function defineEffect<
  Stores extends readonly StoreRef<object>[],
  Input,
  Output,
>(
  stores: Stores,
  fn: (...args: [...ReadsOf<Stores>, Input]) => Output,
  handlers: EffectHandlers<Input, Output> = {},
): Effect<Stores, Input, Output> {
  return [stores, fn, handlers.onStart, handlers.onSuccess, handlers.onFailure];
}

/** Return type of {@link perform} based on whether the effect callback is async. */
export type PerformReturn<Output> =
  Output extends Promise<unknown> ? Promise<void> : void;

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

const handleFailure = (
  registry: Registry,
  onFailure: AnyAction<Error> | undefined,
  error: unknown,
): void => {
  const err = toError(error);
  if (onFailure) {
    invoke(registry, onFailure as unknown as LooseAction, err);
    return;
  }
  throw err;
};

/**
 * Perform an effect against a registry. Synchronous effects return `void`;
 * effects whose callback returns a `Promise` return `Promise<void>`.
 * `onStart` runs before the callback; `onSuccess` or `onFailure` runs
 * after. Errors re-throw when no `onFailure` is declared.
 */
export const perform = <
  Stores extends readonly StoreRef<object>[],
  Input,
  Output,
>(
  registry: Registry,
  effect: Effect<Stores, Input, Output>,
  input: Input,
): PerformReturn<Output> => {
  const [stores, fn, onStart, onSuccess, onFailure] = effect;

  if (onStart) invoke(registry, onStart as unknown as LooseAction, input);

  const args = collectArgs(registry, stores, input);

  let result: Output;
  try {
    result = (fn as (...args: unknown[]) => Output)(...args);
  } catch (error) {
    handleFailure(registry, onFailure, error);
    return undefined as PerformReturn<Output>;
  }

  if (result instanceof Promise) {
    return result.then(
      (value: Awaited<Output>) => {
        if (onSuccess) {
          invoke(registry, onSuccess as unknown as LooseAction, value);
        }
      },
      (error: unknown) => handleFailure(registry, onFailure, error),
    ) as PerformReturn<Output>;
  }

  if (onSuccess) {
    invoke(
      registry,
      onSuccess as unknown as LooseAction,
      result as Awaited<Output>,
    );
  }
  return undefined as PerformReturn<Output>;
};
