/**
 * Internal context shared between `CheckboxCardsRoot` and
 * `CheckboxCardsItem`.
 *
 * Mirrors the `RadioCards` context — items pull visual config (size,
 * variant, color) plus the shared multi-select wiring
 * (`MultiSelectState`) so each item only declares its own `value`
 * and optional `disabled`.
 */

import { assert } from '@lib/assert';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { MultiSelectState } from '../_internal/checkbox-multi-select';
import type {
  CheckboxCardsColor,
  CheckboxCardsSize,
  CheckboxCardsVariant,
} from './checkbox-cards';

export interface CheckboxCardsContextValue extends MultiSelectState {
  size: Accessor<CheckboxCardsSize>;
  variant: Accessor<CheckboxCardsVariant>;
  color: Accessor<CheckboxCardsColor>;
}

export const CheckboxCardsContext = createContext<CheckboxCardsContextValue>();

export const useCheckboxCardsContext = (): CheckboxCardsContextValue => {
  const ctx = useContext(CheckboxCardsContext);
  assert(ctx, '<CheckboxCardsItem> rendered outside of <CheckboxCardsRoot>.');
  return ctx;
};
