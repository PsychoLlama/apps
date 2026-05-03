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
import type { RadioColor, RadioSize, RadioVariant } from './radio-group';

export interface RadioGroupContextValue {
  /** Shared `name` applied to every input. */
  name: string;
  size: Accessor<RadioSize>;
  variant: Accessor<RadioVariant>;
  color: Accessor<RadioColor>;
  value: Accessor<string | null>;
  disabled: Accessor<boolean>;
  required: Accessor<boolean>;
  /**
   * Bumps on every change event. Items' `checked` bindings subscribe
   * to it so Solid re-applies the controlled `checked` property on
   * every input after a click — necessary because native radio
   * behavior mutates two inputs (clicked + previously-checked sibling)
   * but only fires `change` on the clicked one. When the consumer
   * ignores `onValueChange`, `value` stays the same and Solid would
   * otherwise not re-fire the bindings, leaving the DOM diverged from
   * the controlled prop.
   */
  reconcileTick: Accessor<number>;
  /**
   * Records the user's selection. Calls the consumer's
   * `onValueChange` and bumps `reconcileTick` so every item's
   * `checked` binding re-runs.
   */
  notifyChange: (value: string) => void;
}

export const RadioGroupContext = createContext<RadioGroupContextValue>();

export const useRadioGroupContext = (): RadioGroupContextValue => {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error('<RadioGroupItem> rendered outside of <RadioGroupRoot>.');
  }
  return ctx;
};
