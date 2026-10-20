import { onCleanup, type Accessor } from 'solid-js';
import { assert } from '@lib/assert';
import type { Mode } from '../mode';
import type { Plan } from '../plan';
import { useController } from './context';
import { acquire, reduce, type Reduce } from './plan-resource';

/**
 * Read a synchronous plan's output, holding the plan for the component's
 * lifetime. It computes during render, on the server and the client
 * alike, so pre-rendered HTML and hydration agree without a handoff, and
 * nothing suspends. The plan is released on cleanup. Failures throw to
 * the nearest `ErrorBoundary`, whether in computing or in cleanup.
 *
 * Takes only `sync` plans: anything that has to wait belongs in
 * `useClientResource`. The server runs these tasks too, so one that reads
 * browser-only state fails the build, not hydration.
 *
 * Reads through the output's kind, like `useClientResource`.
 */
export const useValue = <Output>(
  plan: Plan<[], [Output], 'sync'>,
): Accessor<Reduce<Output>> => {
  const controller = useController();
  const [handle, release] = acquire(plan);

  // TODO: Server renders share the default controller, so cached state
  // carries from one render into the next, and nothing releases it:
  // cleanup doesn't reliably run on the server. Give each server render
  // its own controller.
  onCleanup(release);

  // The type vouches for this, unless a task's type lies. Then nothing
  // reads the deferred result, so drop its eventual failure.
  const computed = controller.compute<[Output], Mode>(handle);
  if (computed.type === 'async') computed.value.catch(() => {});
  assert(computed.type === 'sync', 'useValue takes synchronous plans.');
  const [output] = computed.value;

  // The graph is untyped at runtime; the plan's signature vouches.
  return () => reduce(output) as Reduce<Output>;
};
