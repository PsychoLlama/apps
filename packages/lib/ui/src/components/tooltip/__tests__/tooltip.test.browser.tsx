/**
 * Behavioral tests for Tooltip. Runs in a real browser via `@vitest/browser`
 * so hover/focus, the `@floating-ui/dom` positioning (which needs
 * `ResizeObserver` and real layout), and the body `Portal` all behave like
 * production. Tooltip has no jsdom-shape sibling — every assertion here leans
 * on real pointer/focus semantics that jsdom only approximates.
 */

import { render, screen, waitFor } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import { createSignal } from 'solid-js';
import Tooltip, { type TooltipProps } from '../tooltip';

const Harness = (props: Partial<TooltipProps>) => (
  <Tooltip content="Copy link" delayDuration={0} {...props}>
    <button type="button" data-testid="trigger">
      Trigger
    </button>
  </Tooltip>
);

const trigger = () => screen.getByTestId('trigger');

describe('Tooltip', () => {
  it('renders the trigger and no tooltip until provoked', () => {
    render(() => <Harness />);
    expect(trigger()).toBeInTheDocument();
    expect(screen.queryByRole('tooltip')).toBeNull();
  });

  it('opens on keyboard focus and wires aria-describedby', async () => {
    render(() => <Harness />);
    trigger().focus();

    const panel = await screen.findByRole('tooltip');
    expect(panel).toHaveTextContent('Copy link');
    expect(trigger()).toHaveAttribute('aria-describedby', panel.id);
  });

  it('marks a focus-driven open as instant', async () => {
    render(() => <Harness />);
    trigger().focus();

    const panel = await screen.findByRole('tooltip');
    expect(panel).toHaveAttribute('data-state', 'instant-open');
  });

  it('closes on blur', async () => {
    render(() => <Harness />);
    trigger().focus();
    await screen.findByRole('tooltip');

    trigger().blur();
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('opens on hover and closes when the pointer leaves', async () => {
    render(() => <Harness />);

    await userEvent.hover(trigger());
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Copy link');

    await userEvent.unhover(trigger());
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('dismisses on Escape', async () => {
    render(() => <Harness />);
    trigger().focus();
    await screen.findByRole('tooltip');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  });

  it('positions on the requested side', async () => {
    render(() => <Harness side="right" />);
    trigger().focus();

    const panel = await screen.findByRole('tooltip');
    await waitFor(() => expect(panel).toHaveAttribute('data-side', 'right'));
  });

  it('respects controlled open state', async () => {
    render(() => <Harness open content="Controlled" />);
    expect(await screen.findByRole('tooltip')).toHaveTextContent('Controlled');
  });

  it('notifies onOpenChange without mutating a controlled value', async () => {
    const onOpenChange = vi.fn();
    const [open] = createSignal(false);
    render(() => <Harness open={open()} onOpenChange={onOpenChange} />);

    trigger().focus();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(true));
    // Still closed — the consumer owns `open` and never flipped it.
    expect(screen.queryByRole('tooltip')).toBeNull();
  });
});
