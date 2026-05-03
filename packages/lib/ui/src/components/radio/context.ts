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
}

export const RadioGroupContext = createContext<RadioGroupContextValue>();

export const useRadioGroupContext = (): RadioGroupContextValue => {
  const ctx = useContext(RadioGroupContext);
  if (!ctx) {
    throw new Error('<RadioGroupItem> rendered outside of <RadioGroupRoot>.');
  }
  return ctx;
};
