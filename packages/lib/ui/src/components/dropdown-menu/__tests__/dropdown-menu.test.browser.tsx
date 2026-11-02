/**
 * Behavior tests for DropdownMenu: what it tells assistive tech, what
 * opens and closes it, how focus moves between items, and what choosing
 * one does. A real browser, since focus follows the pointer and the
 * exit waits on real motion.
 */

import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Button from '../../button/button';
import DropdownMenu from '../dropdown-menu';
import {
  DropdownMenuCheckboxItem,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  type DropdownMenuChecked,
} from '../parts';
import * as fixture from './dropdown-menu.test.browser.css';

/** Options for {@link setup}. */
interface SetupOptions {
  /** Whether choosing "Edit" keeps the menu open. */
  keepOpen?: boolean;

  /** Starting state of the "Show grid" checkbox item. */
  grid?: DropdownMenuChecked;
}

/**
 * A menu on a button, before a second button that sits outside it. The
 * state is the test's own, so every change takes effect.
 */
const setup = (options: SetupOptions = {}) => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  const onEdit = vi.fn<(event: Event) => void>((event) => {
    if (options.keepOpen) event.preventDefault();
  });
  const onGridChange = vi.fn<(checked: boolean) => void>();
  const onZoomChange = vi.fn<(value: string) => void>();
  const [open, setOpen] = createSignal(false);
  const [grid, setGrid] = createSignal<DropdownMenuChecked>(
    options.grid ?? false,
  );
  const [zoom, setZoom] = createSignal('fit');

  render(() => (
    <>
      <DropdownMenu
        display="block"
        testId="menu"
        open={open()}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
        content={
          <>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem testId="edit" onSelect={onEdit}>
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem testId="archive" disabled>
              Archive
            </DropdownMenuItem>
            <DropdownMenuItem testId="duplicate">Duplicate</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem
              testId="grid"
              checked={grid()}
              onCheckedChange={(next) => {
                onGridChange(next);
                setGrid(next);
              }}
            >
              Show grid
            </DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup
              value={zoom()}
              onValueChange={(next) => {
                onZoomChange(next);
                setZoom(next);
              }}
            >
              <DropdownMenuRadioItem testId="zoom-fit" value="fit">
                Fit
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem testId="zoom-100" value="100">
                Actual size
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuItem testId="delete" textValue="Remove">
              Delete
            </DropdownMenuItem>
          </>
        }
      >
        {(trigger) => (
          <Button as="button" testId="trigger" {...trigger}>
            Options
          </Button>
        )}
      </DropdownMenu>
      <Button as="button" testId="outside" class={fixture.outside}>
        Outside
      </Button>
    </>
  ));

  return {
    trigger: screen.getByTestId('trigger'),
    outside: screen.getByTestId('outside'),
    window: () => screen.queryByTestId('menu'),
    surface: () => screen.queryByTestId('menu-surface'),
    item: (testId: string) => screen.getByTestId(testId),
    onOpenChange,
    onEdit,
    onGridChange,
    onZoomChange,
  };
};

/** Open with a press and wait for the surface to take focus. */
const press = async (trigger: HTMLElement) => {
  await userEvent.click(trigger);
  await waitFor(() => expect(screen.getByTestId('menu-surface')).toHaveFocus());
};

/** Open from the keyboard and wait for the first item to take focus. */
const keyboard = async (trigger: HTMLElement, key = '{Enter}') => {
  trigger.focus();
  await userEvent.keyboard(key);
  await waitFor(() => expect(screen.getByTestId('edit')).toHaveFocus());
};

/** Wait out the exit, until the window leaves the page. */
const closed = () =>
  waitFor(() => expect(screen.queryByTestId('menu')).toBeNull());

describe('DropdownMenu', () => {
  // --- Accessibility ---

  it('starts closed, with nothing to control', () => {
    const { trigger, window } = setup();

    expect(window()).toBeNull();
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).not.toHaveAttribute('aria-controls');
  });

  it('opens a menu named by its trigger', async () => {
    const { trigger, surface } = setup();

    await press(trigger);

    const menu = screen.getByRole('menu', { name: 'Options' });
    expect(menu).toBe(surface());
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('aria-controls', menu.id);
  });

  it('exposes item roles and states', async () => {
    const { trigger, item } = setup({ grid: 'indeterminate' });

    await press(trigger);

    expect(item('edit')).toHaveAttribute('role', 'menuitem');
    expect(item('archive')).toHaveAttribute('aria-disabled', 'true');
    expect(item('grid')).toHaveAttribute('role', 'menuitemcheckbox');
    expect(item('grid')).toHaveAttribute('aria-checked', 'mixed');
    expect(item('zoom-fit')).toHaveAttribute('role', 'menuitemradio');
    expect(item('zoom-fit')).toHaveAttribute('aria-checked', 'true');
    expect(item('zoom-100')).toHaveAttribute('aria-checked', 'false');
  });

  // --- Trigger ---

  it('toggles from the trigger, returning focus to it', async () => {
    const { trigger, onOpenChange } = setup();

    await press(trigger);
    await userEvent.click(trigger);

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveFocus();
    await closed();
  });

  it('opens on Enter, Space, and ArrowDown, focusing the first item', async () => {
    for (const key of ['{Enter}', ' ', '{ArrowDown}']) {
      const { trigger, item } = setup();

      await keyboard(trigger, key);
      // The key that opened the menu doesn't choose the item.
      expect(item('edit')).toHaveFocus();

      await userEvent.keyboard('{Escape}');
      await closed();
      document.body.replaceChildren();
    }
  });

  // --- Keyboard ---

  it('steps between items, skipping disabled ones', async () => {
    const { trigger, item } = setup();

    await keyboard(trigger);
    await userEvent.keyboard('{ArrowDown}');
    expect(item('duplicate')).toHaveFocus();

    await userEvent.keyboard('{ArrowUp}');
    expect(item('edit')).toHaveFocus();
  });

  it('stops at either end', async () => {
    const { trigger, item } = setup();

    await keyboard(trigger);
    await userEvent.keyboard('{ArrowUp}');
    expect(item('edit')).toHaveFocus();

    await userEvent.keyboard('{End}{ArrowDown}');
    expect(item('delete')).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(item('edit')).toHaveFocus();
  });

  it('enters at either end from the surface', async () => {
    const { trigger, item } = setup();

    await press(trigger);
    await userEvent.keyboard('{ArrowUp}');
    expect(item('delete')).toHaveFocus();
  });

  it('keeps Tab inside', async () => {
    const { trigger, item, onOpenChange } = setup();

    await keyboard(trigger);
    onOpenChange.mockClear();
    await userEvent.keyboard('{Tab}');

    expect(item('edit')).toHaveFocus();
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('jumps to an item by typing its name', async () => {
    const { trigger, item } = setup();

    await press(trigger);
    await userEvent.keyboard('sh');
    expect(item('grid')).toHaveFocus();
  });

  it('matches typeahead against textValue', async () => {
    const { trigger, item } = setup();

    await press(trigger);
    await userEvent.keyboard('rem');
    expect(item('delete')).toHaveFocus();
  });

  it('skips disabled items in typeahead', async () => {
    const { trigger, item } = setup();

    await press(trigger);
    await userEvent.keyboard('a');
    expect(item('zoom-100')).toHaveFocus();
  });

  // --- Selection ---

  it('chooses an item on Enter, closing and returning focus', async () => {
    const { trigger, onEdit, onOpenChange } = setup();

    await keyboard(trigger);
    await userEvent.keyboard('{Enter}');

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveFocus();
    await closed();
  });

  it('chooses an item on click', async () => {
    const { trigger, item, onEdit, onOpenChange } = setup();

    await press(trigger);
    await userEvent.click(item('edit'));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
  });

  it('stays open when onSelect is cancelled', async () => {
    const { trigger, item, onEdit, onOpenChange } = setup({ keepOpen: true });

    await keyboard(trigger);
    onOpenChange.mockClear();
    await userEvent.keyboard(' ');

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(item('edit')).toHaveFocus();
  });

  it('ignores disabled items', async () => {
    const { trigger, item, onOpenChange } = setup();

    await press(trigger);
    onOpenChange.mockClear();
    // Forced: Playwright won't press an `aria-disabled` element.
    await userEvent.click(item('archive'), { force: true });

    expect(onOpenChange).not.toHaveBeenCalled();
    expect(item('archive')).not.toHaveFocus();
  });

  it('toggles a checkbox item', async () => {
    const { trigger, item, onGridChange } = setup();

    await press(trigger);
    await userEvent.click(item('grid'));
    expect(onGridChange).toHaveBeenLastCalledWith(true);

    await press(trigger);
    expect(item('grid')).toHaveAttribute('aria-checked', 'true');
  });

  it('turns an indeterminate checkbox item on', async () => {
    const { trigger, item, onGridChange } = setup({ grid: 'indeterminate' });

    await press(trigger);
    await userEvent.click(item('grid'));
    expect(onGridChange).toHaveBeenLastCalledWith(true);
  });

  it('chooses a radio item', async () => {
    const { trigger, item, onZoomChange } = setup();

    await press(trigger);
    await userEvent.click(item('zoom-100'));
    expect(onZoomChange).toHaveBeenLastCalledWith('100');

    await press(trigger);
    expect(item('zoom-100')).toHaveAttribute('aria-checked', 'true');
  });

  // --- Pointer ---

  it('focuses the item under the mouse', async () => {
    const { trigger, item, surface } = setup();

    await press(trigger);
    await userEvent.hover(item('duplicate'));
    expect(item('duplicate')).toHaveFocus();

    await userEvent.hover(item('archive'));
    expect(surface()).toHaveFocus();
  });

  it('chooses an item a press from the trigger is released over', async () => {
    const { trigger, item, onEdit } = setup();

    await press(trigger);
    // The press began on the trigger, so only the release reaches the item.
    item('edit').dispatchEvent(
      new PointerEvent('pointerup', { bubbles: true, pointerType: 'mouse' }),
    );

    expect(onEdit).toHaveBeenCalledOnce();
    await closed();
  });

  // --- Dismissal ---

  it('closes on Escape, returning focus to the trigger', async () => {
    const { trigger, onOpenChange } = setup();

    await keyboard(trigger);
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(trigger).toHaveFocus();
    await closed();
  });

  it('closes on a press outside, leaving focus there', async () => {
    const { trigger, outside, onOpenChange } = setup();

    await press(trigger);
    await userEvent.click(outside);

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(outside).toHaveFocus();
    await closed();
  });
});
