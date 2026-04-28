/**
 * Tests for TextField. Runs in a real browser via `@vitest/browser` —
 * focus delegation depends on real `getBoundingClientRect()` and pointer
 * coordinates, and DOM-shape coverage rides along since we're already
 * paying the browser-spin-up cost.
 */

import { render, screen } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import TextField from '../text-field';

const waitFrame = () =>
  new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

const dispatchPointerDownAt = (
  target: HTMLElement,
  clientX: number,
  clientY: number,
) =>
  target.dispatchEvent(
    new PointerEvent('pointerdown', {
      bubbles: true,
      cancelable: true,
      button: 0,
      clientX,
      clientY,
    }),
  );

describe('TextField', () => {
  // --- DOM shape & forwarding ---

  it('renders an <input> inside a wrapping <div>', () => {
    render(() => <TextField testId="field" />);
    const wrapper = screen.getByTestId('field');
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.querySelector('input')).not.toBeNull();
  });

  it('forwards native <input> attributes', () => {
    render(() => (
      <TextField
        testId="field"
        placeholder="Email"
        name="email"
        type="email"
        value="hi@example.com"
      />
    ));
    const input = screen.getByTestId('field').querySelector('input')!;
    expect(input).toHaveAttribute('placeholder', 'Email');
    expect(input).toHaveAttribute('name', 'email');
    expect(input).toHaveAttribute('type', 'email');
    expect(input).toHaveValue('hi@example.com');
  });

  it('forwards ref to the inner <input>', () => {
    let captured: HTMLInputElement | undefined;
    render(() => <TextField testId="field" ref={(el) => (captured = el)} />);
    expect(captured).toBeInstanceOf(HTMLInputElement);
    expect(captured).toBe(screen.getByTestId('field').querySelector('input'));
  });

  it('renders left and right slot content when supplied', () => {
    render(() => (
      <TextField
        testId="field"
        left={<span data-testid="left-content">L</span>}
        right={<span data-testid="right-content">R</span>}
      />
    ));
    expect(screen.getByTestId('left-content')).toBeInTheDocument();
    expect(screen.getByTestId('right-content')).toBeInTheDocument();
  });

  it('omits slot wrappers when no slot content is supplied', () => {
    render(() => <TextField testId="field" />);
    const wrapper = screen.getByTestId('field');
    expect(wrapper.children).toHaveLength(1);
    expect(wrapper.children[0].tagName).toBe('INPUT');
  });

  it('reflects disabled on the input', () => {
    render(() => <TextField testId="field" disabled />);
    expect(screen.getByTestId('field').querySelector('input')).toBeDisabled();
  });

  it('reflects readOnly on the input', () => {
    render(() => <TextField testId="field" readOnly />);
    expect(screen.getByTestId('field').querySelector('input')).toHaveAttribute(
      'readonly',
    );
  });

  // --- Focus delegation ---

  it('clicking the wrapper left edge focuses input with cursor at start', async () => {
    render(() => (
      <TextField testId="field" value="hello world" left={<span>L</span>} />
    ));
    const wrapper = screen.getByTestId('field');
    const input = wrapper.querySelector('input')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 2, rect.top + rect.height / 2);
    await waitFrame();

    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(0);
  });

  it('clicking the wrapper right edge focuses input with cursor at end', async () => {
    render(() => <TextField testId="field" value="hello" />);
    const wrapper = screen.getByTestId('field');
    const input = wrapper.querySelector('input')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.right - 2, rect.top + rect.height / 2);
    await waitFrame();

    expect(input).toHaveFocus();
    expect(input.selectionStart).toBe(5);
    expect(input.selectionEnd).toBe(5);
  });

  it('clicking a button in the right slot keeps focus on the button', async () => {
    render(() => (
      <TextField
        testId="field"
        right={
          <button type="button" data-testid="action">
            X
          </button>
        }
      />
    ));
    const action = screen.getByTestId('action');
    const input = screen.getByTestId('field').querySelector('input')!;

    await userEvent.click(action);

    expect(action).toHaveFocus();
    expect(input).not.toHaveFocus();
  });

  it('does not delegate focus when the field is disabled', async () => {
    render(() => <TextField testId="field" disabled value="x" />);
    const wrapper = screen.getByTestId('field');
    const input = wrapper.querySelector('input')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 4, rect.top + rect.height / 2);
    await waitFrame();

    expect(input).not.toHaveFocus();
  });

  it('does not delegate focus when the field is readOnly', async () => {
    render(() => <TextField testId="field" readOnly value="x" />);
    const wrapper = screen.getByTestId('field');
    const input = wrapper.querySelector('input')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 4, rect.top + rect.height / 2);
    await waitFrame();

    expect(input).not.toHaveFocus();
  });

  // --- Keyboard focus ring ---

  it('keyboard-focusing the input matches the wrapper :has(:focus-visible) selector', async () => {
    render(() => (
      <>
        <button type="button" data-testid="before">
          before
        </button>
        <TextField testId="field" />
      </>
    ));
    screen.getByTestId('before').focus();
    await userEvent.keyboard('{Tab}');

    const wrapper = screen.getByTestId('field');
    const input = wrapper.querySelector('input')!;

    expect(input).toHaveFocus();
    // Confirms the selector chain the focus-ring rule depends on. Visual
    // verification of the resulting outline lives in Storybook QA.
    expect(wrapper.matches(':has(input:focus-visible)')).toBe(true);
  });
});
