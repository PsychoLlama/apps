import { createSignal, type JSX } from 'solid-js';
import { render, screen } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import TextField from '../text-field';

const mobile = {
  autocomplete: undefined,
  autocapitalize: undefined,
  enterkeyhint: undefined,
} as const;

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
    render(() => <TextField {...mobile} testId="field" />);
    const wrapper = screen.getByTestId('field');
    expect(wrapper.tagName).toBe('DIV');
    expect(wrapper.querySelector('input')).not.toBeNull();
  });

  it('forwards native <input> attributes', () => {
    render(() => (
      <TextField
        {...mobile}
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

  it('renders left and right slot content when supplied', () => {
    render(() => (
      <TextField
        {...mobile}
        testId="field"
        left={<span data-testid="left-content">L</span>}
        right={<span data-testid="right-content">R</span>}
      />
    ));
    expect(screen.getByTestId('left-content')).toBeInTheDocument();
    expect(screen.getByTestId('right-content')).toBeInTheDocument();
  });

  it('omits slot wrappers when no slot content is supplied', () => {
    render(() => <TextField {...mobile} testId="field" />);
    const wrapper = screen.getByTestId('field');
    expect(wrapper.querySelectorAll(':scope > span')).toHaveLength(0);
  });

  it('reactively swaps slot content when the prop is replaced', () => {
    const [icon, setIcon] = createSignal(<span data-testid="icon-a">A</span>);
    render(() => <TextField {...mobile} testId="field" left={icon()} />);

    expect(screen.getByTestId('icon-a')).toBeInTheDocument();

    setIcon(<span data-testid="icon-b">B</span>);

    expect(screen.queryByTestId('icon-a')).toBeNull();
    expect(screen.getByTestId('icon-b')).toBeInTheDocument();
  });

  it('reflects updates to reactive props inside slot content', () => {
    const [label, setLabel] = createSignal('first');
    render(() => (
      <TextField
        {...mobile}
        testId="field"
        right={<span data-testid="label">{label()}</span>}
      />
    ));

    expect(screen.getByTestId('label')).toHaveTextContent('first');

    setLabel('second');

    expect(screen.getByTestId('label')).toHaveTextContent('second');
  });

  it('renders a literal 0 in slot content', () => {
    render(() => <TextField {...mobile} testId="field" right={0} />);
    const wrapper = screen.getByTestId('field');
    const slots = wrapper.querySelectorAll(':scope > span');
    expect(slots).toHaveLength(1);
    expect(slots[0]).toHaveTextContent('0');
  });

  it('omits the slot wrapper when content is boolean false', () => {
    render(() => <TextField {...mobile} testId="field" left={false} />);
    expect(
      screen.getByTestId('field').querySelectorAll(':scope > span'),
    ).toHaveLength(0);
  });

  it('removes the slot wrapper when its content becomes nullish', () => {
    const [icon, setIcon] = createSignal<JSX.Element>(
      <span data-testid="icon">L</span>,
    );
    render(() => <TextField {...mobile} testId="field" left={icon()} />);
    const wrapper = screen.getByTestId('field');

    expect(wrapper.querySelectorAll(':scope > span')).toHaveLength(1);

    setIcon(null);

    expect(wrapper.querySelectorAll(':scope > span')).toHaveLength(0);
  });

  it('reflects disabled on the input', () => {
    render(() => <TextField {...mobile} testId="field" disabled />);
    expect(screen.getByTestId('field').querySelector('input')).toBeDisabled();
  });

  it('reflects readOnly on the input', () => {
    render(() => <TextField {...mobile} testId="field" readOnly />);
    expect(screen.getByTestId('field').querySelector('input')).toHaveAttribute(
      'readonly',
    );
  });

  // --- Focus delegation ---

  it('clicking the wrapper left edge focuses input with cursor at start', async () => {
    render(() => (
      <TextField
        {...mobile}
        testId="field"
        value="hello world"
        left={<span>L</span>}
      />
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
    render(() => <TextField {...mobile} testId="field" value="hello" />);
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
        {...mobile}
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
    render(() => <TextField {...mobile} testId="field" disabled value="x" />);
    const wrapper = screen.getByTestId('field');
    const input = wrapper.querySelector('input')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 4, rect.top + rect.height / 2);
    await waitFrame();

    expect(input).not.toHaveFocus();
  });

  it('does not delegate focus when the field is readOnly', async () => {
    render(() => <TextField {...mobile} testId="field" readOnly value="x" />);
    const wrapper = screen.getByTestId('field');
    const input = wrapper.querySelector('input')!;
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 4, rect.top + rect.height / 2);
    await waitFrame();

    expect(input).not.toHaveFocus();
  });

  it('fires consumer onPointerDown for clicks anywhere on the wrapper', () => {
    const handler = vi.fn();
    render(() => (
      <TextField
        {...mobile}
        testId="field"
        left={<span data-testid="icon">L</span>}
        onPointerDown={handler}
      />
    ));
    const wrapper = screen.getByTestId('field');
    const rect = wrapper.getBoundingClientRect();

    dispatchPointerDownAt(wrapper, rect.left + 2, rect.top + rect.height / 2);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('lets the consumer suppress delegation via preventDefault', async () => {
    render(() => (
      <TextField
        {...mobile}
        testId="field"
        onPointerDown={(event) => event.preventDefault()}
      />
    ));
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
        <TextField {...mobile} testId="field" />
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
