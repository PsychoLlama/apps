/**
 * Internal context shared between `CheckboxCardsRoot` and
 * `CheckboxCardsItem`.
 *
 * Mirrors the `RadioCards` context — items pull visual config (size,
 * variant, color) plus group wiring (name, value, disabled, required)
 * so each item only declares its own `value` and optional `disabled`.
 * The `value` here is a `string[]` because checkbox groups are
 * multi-select; otherwise the shape matches `RadioCards`.
 */

import { createContext, useContext, type Accessor } from 'solid-js';
import type {
  CheckboxCardsColor,
  CheckboxCardsSize,
  CheckboxCardsVariant,
} from './checkbox-cards';

export interface CheckboxCardsContextValue {
  /** Shared `name` applied to every input. */
  name: string;
  size: Accessor<CheckboxCardsSize>;
  variant: Accessor<CheckboxCardsVariant>;
  color: Accessor<CheckboxCardsColor>;
  value: Accessor<readonly string[]>;
  disabled: Accessor<boolean>;
  required: Accessor<boolean>;
  /**
   * Records the user's selection. The item passes the next array
   * (existing values plus or minus its own) and the root forwards it
   * to the consumer's `onValueChange`.
   */
  onValueChange: (value: string[]) => void;
}

export const CheckboxCardsContext = createContext<CheckboxCardsContextValue>();

export const useCheckboxCardsContext = (): CheckboxCardsContextValue => {
  const ctx = useContext(CheckboxCardsContext);
  if (!ctx) {
    throw new Error(
      '<CheckboxCardsItem> rendered outside of <CheckboxCardsRoot>.',
    );
  }
  return ctx;
};
