/**
 * Internal context shared between `CheckboxGroupRoot` and
 * `CheckboxGroupItem`.
 *
 * Items pull visual config (size, variant, color) plus the shared
 * multi-select wiring (`MultiSelectState`) so each item only declares
 * its own `value` and optional `disabled`.
 */

import { assert } from '@lib/assert';
import { createContext, useContext, type Accessor } from 'solid-js';
import type { MultiSelectState } from '../_internal/checkbox-multi-select';
import type {
  CheckboxColor,
  CheckboxSize,
  CheckboxVariant,
} from '../checkbox/checkbox';

export interface CheckboxGroupContextValue extends MultiSelectState {
  size: Accessor<CheckboxSize>;
  variant: Accessor<CheckboxVariant>;
  color: Accessor<CheckboxColor>;
}

export const CheckboxGroupContext = createContext<CheckboxGroupContextValue>();

export const useCheckboxGroupContext = (): CheckboxGroupContextValue => {
  const ctx = useContext(CheckboxGroupContext);
  assert(ctx, '<CheckboxGroupItem> rendered outside of <CheckboxGroupRoot>.');
  return ctx;
};
