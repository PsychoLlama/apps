/**
 * Tests for TextArea. Runs in a real browser via `@vitest/browser` —
 * focus delegation depends on real `getBoundingClientRect()` and
 * pointer coordinates. DOM-shape coverage rides along since we're
 * already paying the browser-spin-up cost.
 */

import { render, screen } from '@solidjs/testing-library';
import TextArea from '../text-area';

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

describe('TextArea', () => {
  // --- DOM shape & forwarding ---

  it('renders a <textarea> inside a wrapping <div>', () => {
    render(() => <TextArea testId="area" />);
    const wrapper = screen.getByTestId('area');
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.querySelector('textarea')).not.toBeNull();
  });

  it('forwards native <textarea> attributes', () => {
    render(() => (
      <TextArea
        testId="area"
        placeholder="Tell us"
        name="feedback"
        rows={5}
        value="hi"
      />
    ));
    const textarea = screen.getByTestId('area').querySelector('textarea')!;
    expect(textarea).toHaveAttribute('placeholder', 'Tell us');
    expect(textarea).toHaveAttribute('name', 'feedback');
    expect(textarea).toHaveAttribute('rows', '5');
    expect(textarea).toHaveValue('hi');
  });

  it('forwards ref to the inner <textarea>', () => {
    let captured: HTMLTextAreaElement | undefined;
    render(() => <TextArea testId="area" ref={(el) => (captured = el)} />);
    expect(captured).toBeInstanceOf(HTMLTextAreaElement);
    expect(captured).toBe(screen.getByTestId('area').querySelector('textarea'));
  });

  it('reflects disabled on the textarea', () => {
    render(() => <TextArea testId="area" disabled />);
    expect(screen.getByTestId('area').querySelector('textarea')).toBeDisabled();
  });

  it('reflects readOnly on the textarea', () => {
    render(() => <TextArea testId="area" readOnly />);
    expect(
      screen.getByTestId('area').querySelector('textarea'),
    ).toHaveAttribute('readonly');
  });

  it('applies a different class when resize differs', () => {
    render(() => <TextArea testId="default" />);
    render(() => <TextArea testId="vertical" resize="vertical" />);
    render(() => <TextArea testId="both" resize="both" />);

    const defaultClasses = screen.getByTestId('default').className;
    const verticalClasses = screen.getByTestId('vertical').className;
    const bothClasses = screen.getByTestId('both').className;

    expect(verticalClasses).not.toBe(defaultClasses);
    expect(bothClasses).not.toBe(verticalClasses);
  });

  // --- Focus delegation ---

  it('clicking the wrapper padding focuses the textarea with cursor at end', async () => {
    render(() => <TextArea testId="area" value="hello world" />);
    const wrapper = screen.getByTestId('area');
    const textarea = wrapper.querySelector('textarea')!;
    const rect = wrapper.getBoundingClientRect();

    // Click the bottom padding (away from the textarea body).
    dispatchPointerDownAt(wrapper, rect.left + 4, rect.bottom - 2);
    await waitFrame();

    expect(textarea).toHaveFocus();
    expect(textarea.selectionStart).toBe(textarea.value.length);
    expect(textarea.selectionEnd).toBe(textarea.value.length);
  });

  it('does not delegate focus when the textarea is disabled', async () => {
    render(() => <TextArea testId="area" disabled value="x" />);
    const wrapper = screen.getByTestId('area');
    const textarea = wrapper.querySelector('textarea')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 2, rect.bottom - 2);
    await waitFrame();

    expect(textarea).not.toHaveFocus();
  });

  it('does not delegate focus when the textarea is readOnly', async () => {
    render(() => <TextArea testId="area" readOnly value="x" />);
    const wrapper = screen.getByTestId('area');
    const textarea = wrapper.querySelector('textarea')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 2, rect.bottom - 2);
    await waitFrame();

    expect(textarea).not.toHaveFocus();
  });

  it('fires consumer onPointerDown for clicks anywhere on the wrapper', () => {
    const handler = vi.fn();
    render(() => <TextArea testId="area" onPointerDown={handler} />);
    const wrapper = screen.getByTestId('area');
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 2, rect.bottom - 2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('lets the consumer suppress delegation via preventDefault', async () => {
    render(() => (
      <TextArea
        testId="area"
        onPointerDown={(event) => event.preventDefault()}
      />
    ));
    const wrapper = screen.getByTestId('area');
    const textarea = wrapper.querySelector('textarea')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 2, rect.bottom - 2);
    await waitFrame();

    expect(textarea).not.toHaveFocus();
  });
});
