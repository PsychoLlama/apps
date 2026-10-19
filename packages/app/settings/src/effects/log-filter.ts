import { createSignal } from 'solid-js';
import { pipe, reactive, type Reactive } from '@lib/effects';
import {
  getDefaultValue,
  readEnvironment,
  subscribe,
} from '@lib/runtime-config';
import { filter } from '@lib/observability/config';

/** The active environment's built-in log filter: what a reset reverts to. */
export const defaultLogFilter = getDefaultValue(filter).pattern;

const read = async (): Promise<string> => {
  const { pattern } = await readEnvironment(filter);
  return pattern;
};

// A change landing between the read and the subscription is missed. The
// gap is one OPFS read wide, and the next change corrects it.
const observe = (initial: string): Reactive<string> => {
  const [pattern, setPattern] = createSignal(initial);
  const unsubscribe = subscribe(filter, (next) => setPattern(next.pattern));

  return reactive(pattern, unsubscribe);
};

/**
 * The console log filter pattern for the active environment, with any
 * persisted OPFS override layered over the default. A one-off read; reach
 * for {@link observeLogFilter} to follow later changes.
 */
export const readLogFilter = pipe([read]);

/**
 * The console log filter pattern as a live accessor, starting from
 * {@link readLogFilter}. Changes from any browsing context land here, this
 * tab's own writes included. Releasing the flow drops the subscription.
 */
export const observeLogFilter = pipe([readLogFilter, observe]);
