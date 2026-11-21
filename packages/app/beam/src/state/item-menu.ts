import { defineCell, defineCommand } from '@lib/state';

/** The item whose menu of actions is open, by id. One at a time. */
export const $itemMenu = defineCell<string | null>(() => null);

/**
 * An item's menu opened or closed. A close only counts for the menu
 * that's showing: opening one item's menu dismisses the last one's, and
 * that late close mustn't take the new menu with it.
 */
export const $itemMenuToggled = defineCommand(
  [$itemMenu],
  ([itemMenu, setItemMenu]) =>
    (itemId: string, open: boolean) => {
      if (open) setItemMenu(itemId);
      else if (itemMenu() === itemId) setItemMenu(null);
    },
);
