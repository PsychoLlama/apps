import { invoke, type Action, type AnyAction } from './action';
import type { Registry } from './internal';
import type { StoreRef } from './store';

// `invoke` wants a fully-typed Action; we have `AnyAction` (brand-only).
// The brand is the identity layer — the runtime value is still the real
// action tuple, so cast at the boundary.
type LooseAction = Action<readonly StoreRef<object>[], unknown>;

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
 */
export type Effect<Input, Output> = readonly [
  fn: (input: Input) => Output,
  onStart: AnyAction<Input> | undefined,
  onSuccess: AnyAction<Awaited<Output>> | undefined,
  onFailure: AnyAction<Error> | undefined,
];

/**
 * Define an effect that wraps a side-effecting callback with lifecycle
 * actions. Every handler field is optional. Without `onFailure`, any
 * thrown error or rejected promise bubbles up from {@link perform}.
 */
export function defineEffect<Input, Output>(
  fn: (input: Input) => Output,
  handlers: EffectHandlers<Input, Output> = {},
): Effect<Input, Output> {
  return [fn, handlers.onStart, handlers.onSuccess, handlers.onFailure];
}

type PerformReturn<Output> =
  Output extends Promise<unknown> ? Promise<void> : void;

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(String(error));

/**
 * Perform an effect against a registry. Synchronous effects return `void`;
 * effects whose callback returns a `Promise` return `Promise<void>`.
 * `onStart` runs before the callback; `onSuccess` or `onFailure` runs
 * after. Errors re-throw when no `onFailure` is declared.
 */
export function perform<Input, Output>(
  registry: Registry,
  effect: Effect<Input, Output>,
  input: Input,
): PerformReturn<Output> {
  const [fn, onStart, onSuccess, onFailure] = effect;

  if (onStart) invoke(registry, onStart as unknown as LooseAction, input);

  const succeed = (value: Awaited<Output>): void => {
    if (onSuccess) invoke(registry, onSuccess as unknown as LooseAction, value);
  };

  const fail = (error: unknown): void => {
    const err = toError(error);
    if (onFailure) {
      invoke(registry, onFailure as unknown as LooseAction, err);
      return;
    }
    throw err;
  };

  let result: Output;
  try {
    result = fn(input);
  } catch (error) {
    fail(error);
    return undefined as PerformReturn<Output>;
  }

  if (result instanceof Promise) {
    return result.then(succeed, fail) as PerformReturn<Output>;
  }

  succeed(result as Awaited<Output>);
  return undefined as PerformReturn<Output>;
}
