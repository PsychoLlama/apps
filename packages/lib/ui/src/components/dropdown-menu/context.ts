/**
 * Internal contexts shared between `DropdownMenu` and its parts. Not
 * exported from `@lib/ui`: callers own the state the parts read.
 */

import { assert } from '@lib/assert';
import { createContext, useContext, type Accessor } from 'solid-js';

/** What every part inside an open menu can reach. */
export interface DropdownMenuContextValue {
  /** Closes the menu, as a selection does. */
  close: () => void;

  /** The menu's surface, which holds focus when no item does. */
  surface: Accessor<HTMLElement | undefined>;

  /** Whether a typeahead search is in progress, which claims Space. */
  typingAhead: Accessor<boolean>;

  /**
   * Each item's props, keyed by its element, for the `textValue`
   * typeahead matches it by. Without one, it matches by text content.
   */
  textValues: WeakMap<Element, { readonly textValue?: string }>;
}

export const DropdownMenuContext = createContext<DropdownMenuContextValue>();

export const useDropdownMenuContext = (): DropdownMenuContextValue => {
  const ctx = useContext(DropdownMenuContext);
  assert(ctx, 'DropdownMenu part rendered outside of <DropdownMenu>.');
  return ctx;
};

/** The selection a radio group's items read and write. */
export interface DropdownMenuRadioContextValue {
  value: Accessor<string>;
  onValueChange: (value: string) => void;
}

export const DropdownMenuRadioContext =
  createContext<DropdownMenuRadioContextValue>();

export const useDropdownMenuRadioContext =
  (): DropdownMenuRadioContextValue => {
    const ctx = useContext(DropdownMenuRadioContext);
    assert(
      ctx,
      '<DropdownMenuRadioItem> rendered outside of <DropdownMenuRadioGroup>.',
    );
    return ctx;
  };
