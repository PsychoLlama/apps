/**
 * Internal context shared between `RadioGroupRoot` and `RadioGroupItem`.
 *
 * Not exported from `@lib/ui` — consumers own the `value` signal in their
 * own scope and don't need a hook to read it back. Items pull visual
 * config (size/variant/color) plus group-level wiring (name, value,
 * disabled, required) from this context so each item only needs to
 * declare its own `value` and optional `disabled`.
 */

import { createContext, useContext, type Accessor } from 'solid-js';
import type { RadioColor, RadioSize, RadioVariant } from './radio';

export interface RadioGroupContextValue {
  /** Stable `name` for every input. Auto-generated if the consumer omits it. */
  name: string;
  size: Accessor<RadioSize>;
  variant: Accessor<RadioVariant>;
  color: Accessor<RadioColor>;
  value: Accessor<string | null>;
  disabled: Accessor<boolean>;
  required: Accessor<boolean>;
  onValueChange: (value: string) => void;
  /**
   * Counter that bumps on every change event from any item. Items
   * subscribe to this in a `createEffect` so they can re-apply their
   * `checked` property even when `value` didn't change — which happens
   * when the parent ignores `onValueChange`. Native radio behavior
   * silently flips both the clicked input on and the previously-checked
   * sibling off; only the clicked input fires `change`, so reactivity
   * alone can't restore the sibling. Bumping this signal force-runs
   * the per-item effect for the whole group.
   */
  reconcileTick: Accessor<number>;
  bumpReconcile: () => void;
}

export const RadioGroupContext = createContext<RadioGroupContextValue>();

export const useRadioGroupContext = (): RadioGroupContextValue => {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error('<RadioGroupItem> rendered outside of <RadioGroupRoot>.');
  }
  return ctx;
};
