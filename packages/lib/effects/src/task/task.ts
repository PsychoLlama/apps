import type { Accessor } from 'solid-js';
import type { Reactive, Resource } from './output';

/**
 * A task is a plain function. Its parameters are positional inputs from
 * upstream nodes; its return value (possibly a promise, possibly a
 * resource or reactive) is the node's single output.
 *
 * The default `Inputs = never` makes bare `Task` the top of all tasks:
 * every concrete task is assignable to it, and nothing can call it without
 * first knowing its real inputs.
 */
export type Task<
  Inputs extends readonly unknown[] = never,
  Output = unknown,
> = (...inputs: Inputs) => Output;

/** What a downstream task actually receives from a task's return value. */
export type Yield<Returned> = Unwrap<Awaited<Returned>>;

type Unwrap<Value> =
  Value extends Resource<infer Inner>
    ? Inner
    : Value extends Reactive<infer Inner>
      ? Accessor<Inner>
      : Value;
