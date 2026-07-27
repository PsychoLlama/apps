/**
 * Internal context shared between `SegmentedControlRoot` and
 * `SegmentedControlItem`.
 *
 * Mirrors the `RadioCards` context — items pull the group wiring
 * (name, value, disabled, required) so each item only declares its own
 * `value` and optional overrides. Nothing visual travels through here:
 * size, variant, and radius resolve to classes and CSS vars on the
 * root, and the items read them off the cascade.
 */

import { createContext, useContext, type Accessor } from 'solid-js';

export interface SegmentedControlContextValue {
  /** Shared `name` applied to every input. */
  name: string;
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

export const SegmentedControlContext =
  createContext<SegmentedControlContextValue>();

export const useSegmentedControlContext = (): SegmentedControlContextValue => {
  const ctx = useContext(SegmentedControlContext);
  if (!ctx) {
    throw new Error(
      '<SegmentedControlItem> rendered outside of <SegmentedControlRoot>.',
    );
  }
  return ctx;
};
