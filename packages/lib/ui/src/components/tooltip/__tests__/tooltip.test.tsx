/**
 * Behavior tests for Tooltip: what opens it, what closes it, and what
 * it tells assistive tech. Runs in jsdom — none of this needs layout.
 */

import { createSignal, Show } from 'solid-js';
import { cleanup, fireEvent, render, screen } from '@solidjs/testing-library';
import Button from '../../button/button';
import Tooltip, { type TooltipProps } from '../tooltip';
import * as css from '../tooltip.css';

type Overrides = Partial<Omit<TooltipProps, 'children'>>;

/**
 * Render a tooltip around a button. The window's `data-state` is the
 * handle for "is it open" — it's always in the DOM, and CSS shows it
 * from that attribute; the trigger's test id is for driving it.
 */
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
    window: () => screen.queryByTestId(name),
    surface: () => screen.queryByTestId(`${name}-surface`),
    tooltip: () => screen.queryByTestId(`${name}-text`),
  };
};

afterEach(cleanup);

describe('Tooltip', () => {
  it('starts closed', () => {
    const { trigger, window } = setup();

    expect(window()).toHaveAttribute('data-state', 'closed');
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('opens at once on focus and closes on blur', () => {
    const { trigger, window } = setup();

    fireEvent.focusIn(trigger);
    expect(window()).toHaveAttribute('data-state', 'instant-open');
    expect(window()).toHaveTextContent('Add to library');

    fireEvent.focusOut(trigger);
    expect(window()).toHaveAttribute('data-state', 'closed');
  });

  // --- Accessibility ---

  it('describes the trigger by the tooltip while open', () => {
    const { trigger, tooltip } = setup();

    fireEvent.focusIn(trigger);
    const label = tooltip();
    expect(label).toHaveRole('tooltip');
    expect(label).toHaveTextContent('Add to library');
    expect(label).not.toHaveAttribute('aria-label');
    expect(trigger).toHaveAttribute('aria-describedby', label?.id);
    expect(trigger).toHaveAccessibleDescription('Add to library');

    fireEvent.focusOut(trigger);
    expect(trigger).not.toHaveAttribute('aria-describedby');
  });

  it('lets a trigger compose a description of its own', () => {
    render(() => (
      <Tooltip display="inline" content="Add to library" testId="tooltip">
        {(trigger) => (
          <Button
            as="button"
            testId="trigger"
            {...trigger}
            aria-describedby={['hint', trigger['aria-describedby']]
              .filter(Boolean)
              .join(' ')}
          >
            Add
          </Button>
        )}
      </Tooltip>
    ));
    const trigger = screen.getByTestId('trigger');

    fireEvent.focusIn(trigger);
    const id = screen.getByTestId('tooltip-text').id;
    expect(trigger).toHaveAttribute('aria-describedby', `hint ${id}`);

    fireEvent.focusOut(trigger);
    expect(trigger).toHaveAttribute('aria-describedby', 'hint');
  });

  it('reads aria-label in place of the content', () => {
    const { trigger, tooltip } = setup({
      content: '⌘K',
      'aria-label': 'Command palette',
    });

    fireEvent.focusIn(trigger);
    expect(tooltip()).toHaveTextContent('⌘K');
    expect(tooltip()).toHaveAccessibleName('Command palette');
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

    const window = screen.getByTestId('tooltip');

    fireEvent.focusIn(screen.getByTestId('before'));
    expect(window).toHaveAttribute('data-state', 'instant-open');
    fireEvent.focusOut(screen.getByTestId('before'));
    expect(window).toHaveAttribute('data-state', 'closed');

    setSwapped(true);
    fireEvent.focusIn(screen.getByTestId('after'));
    expect(window).toHaveAttribute('data-state', 'instant-open');
    expect(screen.getByTestId('after')).toHaveAttribute('aria-describedby');
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
