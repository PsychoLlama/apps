/**
 * Behavior tests for ContextMenu: what opens it, where it lands, and
 * what closes it. Navigation, typeahead, and choosing items are the
 * shared menu's, covered by DropdownMenu's tests. A real browser, since
 * placement is measured and the exit waits on real motion.
 */

import { createSignal } from 'solid-js';
import { render, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Button from '../../button/button';
import ContextMenu from '../context-menu';
import { ContextMenuItem } from '../parts';
import * as fixture from './context-menu.test.browser.css';

/** Options for {@link setup}. */
interface SetupOptions {
  /** Leaves the area to the browser's own menu. */
  disabled?: boolean;
}

/**
 * A menu over an area holding a button, before a second button that
 * sits outside it. The state is the test's own, so every change takes
 * effect.
 */
const setup = (options: SetupOptions = {}) => {
  const onOpenChange = vi.fn<(open: boolean) => void>();
  const onEdit = vi.fn<(event: Event) => void>();
  const [open, setOpen] = createSignal(false);

  render(() => (
    <>
      <ContextMenu
        display="block"
        testId="menu"
        disabled={options.disabled}
        open={open()}
        onOpenChange={(next) => {
          onOpenChange(next);
          setOpen(next);
        }}
        content={
          <>
            <ContextMenuItem testId="edit" onSelect={onEdit}>
              Edit
            </ContextMenuItem>
            <ContextMenuItem testId="duplicate">Duplicate</ContextMenuItem>
          </>
        }
      >
        <section class={fixture.area}>
          <Button as="button" testId="inside">
            Inside
          </Button>
        </section>
      </ContextMenu>
      <Button as="button" testId="outside" class={fixture.outside}>
        Outside
      </Button>
    </>
  ));

  return {
    area: screen.getByTestId('menu-area'),
    inside: screen.getByTestId('inside'),
    outside: screen.getByTestId('outside'),
    window: () => screen.queryByTestId('menu'),
    surface: () => screen.queryByTestId('menu-surface'),
    item: (testId: string) => screen.getByTestId(testId),
    onOpenChange,
    onEdit,
  };
};

/** A point inside the area, in px from its top-left corner. */
interface Offset {
  x: number;
  y: number;
}

/** Dispatch a `contextmenu` at an offset into the area. */
const contextMenuAt = (area: HTMLElement, at: Offset) => {
  const rect = area.getBoundingClientRect();
  const event = new MouseEvent('contextmenu', {
    bubbles: true,
    cancelable: true,
    clientX: rect.left + at.x,
    clientY: rect.top + at.y,
  });

  area.dispatchEvent(event);
  return event;
};

/** Dispatch a pointer event from a touch at an offset into the area. */
const touch = (area: HTMLElement, type: string, at: Offset) => {
  const rect = area.getBoundingClientRect();
  area.dispatchEvent(
    new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      pointerType: 'touch',
      clientX: rect.left + at.x,
      clientY: rect.top + at.y,
    }),
  );
};

/** Right-click at an offset into an element. */
const rightClick = (target: HTMLElement, at: Offset) =>
  userEvent.click(target, { button: 'right', position: at });

/** Wait for the surface to take focus. */
const opened = () =>
  waitFor(() => expect(screen.getByTestId('menu-surface')).toHaveFocus());

/** Wait out the exit, until the window leaves the page. */
const closed = () =>
  waitFor(() => expect(screen.queryByTestId('menu')).toBeNull());

/** Wait out the enter motion, which moves the surface while it plays. */
const settled = () =>
  Promise.all(document.getAnimations().map((animation) => animation.finished));

/** Where the surface sits, in px from the area's top-left corner. */
const surfaceOffset = (area: HTMLElement) => {
  const surface = screen.getByTestId('menu-surface').getBoundingClientRect();
  const rect = area.getBoundingClientRect();

  return { x: surface.left - rect.left, y: surface.top - rect.top };
};

describe('ContextMenu', () => {
  // --- Opening ---

  it('starts closed', () => {
    const { window } = setup();

    expect(window()).toBeNull();
  });

  it('opens on a right click, focusing the menu', async () => {
    const { area, surface, onOpenChange } = setup();

    await rightClick(area, { x: 40, y: 40 });
    await opened();

    expect(onOpenChange).toHaveBeenLastCalledWith(true);
    expect(screen.getByRole('menu')).toBe(surface());
  });

  it('suppresses the native menu', () => {
    const { area } = setup();

    expect(contextMenuAt(area, { x: 10, y: 10 }).defaultPrevented).toBe(true);
  });

  it('opens beside the point, lifting the first item under it', async () => {
    const { area } = setup();

    contextMenuAt(area, { x: 40, y: 60 });
    await opened();

    // 2px out, and 8px up at size 2.
    await waitFor(() => {
      const offset = surfaceOffset(area);
      expect(offset.x).toBeCloseTo(42, 0);
      expect(offset.y).toBeCloseTo(52, 0);
    });
  });

  it('closes on a right click elsewhere in the area, reopening on the next', async () => {
    const { area, onOpenChange } = setup();

    await rightClick(area, { x: 20, y: 20 });
    await opened();
    onOpenChange.mockClear();

    await rightClick(area, { x: 200, y: 200 });
    expect(onOpenChange.mock.calls).toEqual([[false]]);
    await closed();

    await rightClick(area, { x: 120, y: 100 });
    await opened();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);

    await settled();
    expect(surfaceOffset(area).x).toBeCloseTo(122, 0);
    expect(surfaceOffset(area).y).toBeCloseTo(92, 0);
  });

  it('closes on a long press elsewhere in the area', async () => {
    const { area, onOpenChange } = setup();

    contextMenuAt(area, { x: 20, y: 20 });
    await opened();
    onOpenChange.mockClear();

    touch(area, 'pointerdown', { x: 200, y: 200 });
    await closed();

    expect(onOpenChange.mock.calls).toEqual([[false]]);
  });

  it('ignores a right click inside the open menu', async () => {
    const { area, item, onOpenChange } = setup();

    contextMenuAt(area, { x: 40, y: 40 });
    await opened();
    await settled();
    const before = surfaceOffset(area);
    onOpenChange.mockClear();

    const event = new MouseEvent('contextmenu', {
      bubbles: true,
      cancelable: true,
    });
    item('edit').dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(surfaceOffset(area)).toEqual(before);
  });

  it('opens on a long press', async () => {
    const { area, onOpenChange } = setup();

    touch(area, 'pointerdown', { x: 40, y: 40 });
    expect(onOpenChange).not.toHaveBeenCalled();

    await opened();
    expect(onOpenChange).toHaveBeenLastCalledWith(true);
  });

  it('cancels a long press that moves or lifts', async () => {
    for (const type of ['pointermove', 'pointerup', 'pointercancel']) {
      const { area, onOpenChange } = setup();

      touch(area, 'pointerdown', { x: 40, y: 40 });
      touch(area, type, { x: 40, y: 40 });
      await new Promise((resolve) => setTimeout(resolve, 900));

      expect(onOpenChange).not.toHaveBeenCalled();
      document.body.replaceChildren();
    }
  });

  it('leaves a disabled area to the browser', async () => {
    const { area, onOpenChange } = setup({ disabled: true });

    expect(contextMenuAt(area, { x: 10, y: 10 }).defaultPrevented).toBe(false);

    touch(area, 'pointerdown', { x: 40, y: 40 });
    await new Promise((resolve) => setTimeout(resolve, 900));

    expect(onOpenChange).not.toHaveBeenCalled();
  });

  // --- Closing ---

  it('closes on choosing an item, returning focus', async () => {
    const { area, inside, item, onEdit, onOpenChange } = setup();

    inside.focus();
    contextMenuAt(area, { x: 100, y: 100 });
    await opened();
    await userEvent.click(item('edit'));

    expect(onEdit).toHaveBeenCalledOnce();
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(inside).toHaveFocus();
    await closed();
  });

  it('closes on Escape, returning focus', async () => {
    const { area, inside, onOpenChange } = setup();

    inside.focus();
    contextMenuAt(area, { x: 100, y: 100 });
    await opened();
    await userEvent.keyboard('{Escape}');

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(inside).toHaveFocus();
    await closed();
  });

  it('closes on a press elsewhere in the area', async () => {
    const { area, onOpenChange } = setup();

    contextMenuAt(area, { x: 20, y: 20 });
    await opened();
    await userEvent.click(area, { position: { x: 300, y: 300 } });

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    await closed();
  });

  it('closes on a press outside, leaving focus there', async () => {
    const { area, inside, outside, onOpenChange } = setup();

    inside.focus();
    contextMenuAt(area, { x: 20, y: 20 });
    await opened();
    await userEvent.click(outside);

    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    expect(outside).toHaveFocus();
    await closed();
  });
});
