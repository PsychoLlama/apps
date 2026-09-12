/**
 * Tests for what Tooltip renders and what it tells assistive tech.
 * Runs in jsdom, which doesn't evaluate the stylesheet — showing and
 * hiding is CSS, so that's in the browser tests.
 */

import { createSignal, Show } from 'solid-js';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import { assert } from '@lib/assert';
import Button from '../../button/button';
import Tooltip, { type TooltipProps } from '../tooltip';
import * as css from '../tooltip.css';

type Overrides = Partial<Omit<TooltipProps, 'children'>>;

/** Render a tooltip around a button. The window is always in the DOM. */
const setup = (overrides: Overrides = {}, name = 'tooltip') => {
  render(() => (
    <Tooltip
      display="inline"
      content="Add to library"
      testId={name}
      {...overrides}
    >
      {(trigger) => (
        <Button as="button" testId={`${name}-trigger`} {...trigger}>
          Add
        </Button>
      )}
    </Tooltip>
  ));

  return {
    trigger: screen.getByTestId(`${name}-trigger`),
    root: () => screen.getByTestId(`${name}-trigger`).parentElement,
    window: () => screen.queryByTestId(name),
    surface: () => screen.queryByTestId(`${name}-surface`),
    tooltip: () => screen.queryByTestId(`${name}-text`),
  };
};

afterEach(cleanup);

describe('Tooltip', () => {
  it('renders the window beside the trigger', () => {
    const { trigger, window } = setup();

    expect(window()).toHaveTextContent('Add to library');
    expect(window()?.parentElement).toBe(trigger.parentElement);
  });

  // --- Accessibility ---

  it('describes the trigger by the tooltip', () => {
    const { trigger, tooltip } = setup();

    const label = tooltip();
    expect(label).toHaveRole('tooltip');
    expect(label).toHaveTextContent('Add to library');
    expect(label).not.toHaveAttribute('aria-label');
    expect(trigger).toHaveAttribute('aria-describedby', label?.id);
    expect(trigger).toHaveAccessibleDescription('Add to library');
  });

  it('lets a trigger compose a description of its own', () => {
    render(() => (
      <Tooltip display="inline" content="Add to library" testId="tooltip">
        {(trigger) => (
          <Button
            as="button"
            testId="trigger"
            {...trigger}
            aria-describedby={`hint ${trigger['aria-describedby']}`}
          >
            Add
          </Button>
        )}
      </Tooltip>
    ));
    const trigger = screen.getByTestId('trigger');

    const id = screen.getByTestId('tooltip-text').id;
    expect(trigger).toHaveAttribute('aria-describedby', `hint ${id}`);
    expect(trigger).toHaveAccessibleDescription(/Add to library$/);
  });

  it('reads aria-label in place of the content', () => {
    const { trigger, tooltip } = setup({
      content: '⌘K',
      'aria-label': 'Command palette',
    });

    expect(tooltip()).toHaveTextContent('⌘K');
    expect(tooltip()).toHaveAccessibleName('Command palette');
    // Chrome carries the label through to the trigger's description.
    // jsdom's accname reads the spec's "if computing a name" literally
    // and gives the text instead, so that end isn't asserted here.
    expect(trigger).toHaveAttribute('aria-describedby', tooltip()?.id);
  });

  it('follows a trigger swapped out under it', () => {
    const [swapped, setSwapped] = createSignal(false);
    render(() => (
      <Tooltip display="inline" content="Add to library" testId="tooltip">
        {(trigger) => (
          <Show
            when={swapped()}
            fallback={
              <Button as="button" testId="before" {...trigger}>
                Add
              </Button>
            }
          >
            <Button as="button" testId="after" {...trigger}>
              Remove
            </Button>
          </Show>
        )}
      </Tooltip>
    ));

    const id = screen.getByTestId('tooltip-text').id;
    expect(screen.getByTestId('before')).toHaveAttribute(
      'aria-describedby',
      id,
    );

    setSwapped(true);
    expect(screen.getByTestId('after')).toHaveAttribute('aria-describedby', id);
  });

  // --- Dismissal ---
  //
  // Opening is the stylesheet's, reported by an animation on the root;
  // jsdom runs neither, so the report is dispatched by hand. jsdom has
  // no `AnimationEvent` either, and a plain event carrying the name is
  // all the component reads.

  const report = (target: HTMLElement, type: string, name = css.open) => {
    const event = new Event(type, { bubbles: true });
    Object.defineProperty(event, 'animationName', { value: name });
    fireEvent(target, event);
  };

  it('vetoes an open window on Escape, until it closes', () => {
    const { root, window } = setup();
    const wrapper = root();
    assert(wrapper, 'Root not rendered.');

    report(wrapper, 'animationstart');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(window()).toHaveAttribute('data-dismissed');

    report(wrapper, 'animationcancel');
    expect(window()).not.toHaveAttribute('data-dismissed');
  });

  it('ignores Escape while closed', () => {
    const { window } = setup();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(window()).not.toHaveAttribute('data-dismissed');
  });

  it('ignores reports from other animations', () => {
    const { window } = setup();
    const box = window();
    assert(box, 'Window not rendered.');

    // Dispatched inside the root, where anything else animating would
    // report from, and read there because animation events bubble.
    report(box, 'animationstart', 'other');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(box).not.toHaveAttribute('data-dismissed');
  });

  // --- Placement and styling ---

  it('forwards side and align to the window', () => {
    const { window } = setup({ side: 'right', align: 'end' });

    expect(window()).toHaveAttribute('data-side', 'right');
    expect(window()).toHaveAttribute('data-align', 'end');
  });

  it('forwards class and max width to the surface', () => {
    const { surface } = setup({
      class: 'custom',
      maxWidth: '200px',
    });

    expect(surface()).toHaveClass('custom');
    // The width rides in as the stylesheet's var; `var(--x)` → `--x`.
    expect(surface()).toHaveStyle(`${css.maxWidth.slice(4, -1)}: 200px`);
  });
});
