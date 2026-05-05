/**
 * Internal context shared between `RadioCardsRoot` and `RadioCardsItem`.
 *
 * Mirrors the `RadioGroup` context — items pull visual config (size,
 * variant, color) plus group wiring (name, value, disabled, required)
 * so each item only declares its own `value` and optional `disabled`.
 * Kept separate from `RadioGroup`'s context because the size / variant
 * scales differ; sharing would force one component to widen for the
 * other's needs.
 */

import { createContext, useContext, type Accessor } from 'solid-js';
import type {
  RadioCardsColor,
  RadioCardsSize,
  RadioCardsVariant,
} from './radio-cards';

export interface RadioCardsContextValue {
  /** Shared `name` applied to every input. */
  name: string;
  size: Accessor<RadioCardsSize>;
  variant: Accessor<RadioCardsVariant>;
  color: Accessor<RadioCardsColor>;
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

export const RadioCardsContext = createContext<RadioCardsContextValue>();

export const useRadioCardsContext = (): RadioCardsContextValue => {
  const ctx = useContext(RadioCardsContext);
  if (!ctx) {
    throw new Error('<RadioCardsItem> rendered outside of <RadioCardsRoot>.');
  }
  return ctx;
};
