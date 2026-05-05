import { render, screen, within } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import { RadioCardsItem, RadioCardsRoot } from '../radio-cards';

const noop = () => {};

describe('RadioCards', () => {
  // --- DOM shape ---

  it('renders a <div role="radiogroup">', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        value={null}
        onValueChange={noop}
      />
    ));
    const group = screen.getByTestId('group');
    expect(group.tagName).toBe('DIV');
    expect(group).toHaveAttribute('role', 'radiogroup');
  });

  it('wraps each item in a <label> with the input as a child', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        value={null}
        onValueChange={noop}
      >
        <RadioCardsItem testId="basic" value="basic">
          Basic
        </RadioCardsItem>
      </RadioCardsRoot>
    ));
    const input = screen.getByTestId('basic');
    expect(input.tagName).toBe('INPUT');
    expect(input.parentElement?.tagName).toBe('LABEL');
    expect(input.parentElement).toHaveTextContent('Basic');
  });

  // --- Group wiring ---

  it('forwards `name` to every item', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        value={null}
        onValueChange={noop}
      >
        <RadioCardsItem testId="ra" value="a" />
        <RadioCardsItem testId="rb" value="b" />
      </RadioCardsRoot>
    ));
    expect(screen.getByTestId('ra')).toHaveAttribute('name', 'plan');
    expect(screen.getByTestId('rb')).toHaveAttribute('name', 'plan');
  });

  it('checks only the item whose value matches the group value', () => {
    render(() => (
      <RadioCardsRoot testId="group" name="plan" value="b" onValueChange={noop}>
        <RadioCardsItem testId="ra" value="a" />
        <RadioCardsItem testId="rb" value="b" />
        <RadioCardsItem testId="rc" value="c" />
      </RadioCardsRoot>
    ));
    expect(screen.getByTestId('ra')).not.toBeChecked();
    expect(screen.getByTestId('rb')).toBeChecked();
    expect(screen.getByTestId('rc')).not.toBeChecked();
  });

  it('renders no item checked when value is null', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        value={null}
        onValueChange={noop}
      >
        <RadioCardsItem testId="ra" value="a" />
        <RadioCardsItem testId="rb" value="b" />
      </RadioCardsRoot>
    ));
    expect(screen.getByTestId('ra')).not.toBeChecked();
    expect(screen.getByTestId('rb')).not.toBeChecked();
  });

  // --- Selection ---

  it('fires onValueChange when the user clicks the card', async () => {
    const handler = vi.fn();
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        value={null}
        onValueChange={handler}
      >
        <RadioCardsItem testId="ra" value="a">
          A
        </RadioCardsItem>
        <RadioCardsItem testId="rb" value="b">
          B
        </RadioCardsItem>
      </RadioCardsRoot>
    ));

    // Click the visible card body, not the hidden input — the label
    // proxies the click to the input.
    await userEvent.click(screen.getByText('B'));
    expect(handler).toHaveBeenCalledWith('b');
  });

  it('reflects the new value through the group prop', async () => {
    const Harness = () => {
      const [value, setValue] = createSignal<string | null>(null);
      return (
        <RadioCardsRoot
          testId="group"
          name="plan"
          value={value()}
          onValueChange={setValue}
        >
          <RadioCardsItem testId="ra" value="a">
            A
          </RadioCardsItem>
          <RadioCardsItem testId="rb" value="b">
            B
          </RadioCardsItem>
        </RadioCardsRoot>
      );
    };
    render(() => <Harness />);

    await userEvent.click(screen.getByText('B'));
    expect(screen.getByTestId('rb')).toBeChecked();
    expect(screen.getByTestId('ra')).not.toBeChecked();

    await userEvent.click(screen.getByText('A'));
    expect(screen.getByTestId('ra')).toBeChecked();
    expect(screen.getByTestId('rb')).not.toBeChecked();
  });

  it('reverts the visual state when the parent ignores the change', async () => {
    render(() => (
      <RadioCardsRoot testId="group" name="plan" value="a" onValueChange={noop}>
        <RadioCardsItem testId="ra" value="a">
          A
        </RadioCardsItem>
        <RadioCardsItem testId="rb" value="b">
          B
        </RadioCardsItem>
      </RadioCardsRoot>
    ));

    await userEvent.click(screen.getByText('B'));
    expect(screen.getByTestId('ra')).toBeChecked();
    expect(screen.getByTestId('rb')).not.toBeChecked();
  });

  // --- Disabled state ---

  it('disables every item when the group is disabled', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        disabled
        value={null}
        onValueChange={noop}
      >
        <RadioCardsItem testId="ra" value="a" />
        <RadioCardsItem testId="rb" value="b" />
      </RadioCardsRoot>
    ));
    expect(screen.getByTestId('ra')).toBeDisabled();
    expect(screen.getByTestId('rb')).toBeDisabled();
  });

  it('exposes data-disabled on the group when disabled', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        disabled
        value={null}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).toHaveAttribute('data-disabled', '');
    expect(screen.getByTestId('group')).not.toHaveAttribute('aria-disabled');
  });

  it('omits data-disabled on the group when enabled', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        value={null}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).not.toHaveAttribute('data-disabled');
  });

  it('lets a single item be disabled while others stay enabled', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        value={null}
        onValueChange={noop}
      >
        <RadioCardsItem testId="ra" value="a" />
        <RadioCardsItem testId="rb" value="b" disabled />
      </RadioCardsRoot>
    ));
    expect(screen.getByTestId('ra')).not.toBeDisabled();
    expect(screen.getByTestId('rb')).toBeDisabled();
  });

  // --- Required ---

  it('exposes aria-required on the group when required', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        required
        value={null}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).toHaveAttribute(
      'aria-required',
      'true',
    );
  });

  it('marks every item as required when the group is required', () => {
    render(() => (
      <RadioCardsRoot
        testId="group"
        name="plan"
        required
        value={null}
        onValueChange={noop}
      >
        <RadioCardsItem testId="ra" value="a" />
        <RadioCardsItem testId="rb" value="b" />
      </RadioCardsRoot>
    ));
    expect(screen.getByTestId('ra')).toBeRequired();
    expect(screen.getByTestId('rb')).toBeRequired();
  });

  // --- Form integration ---

  it('submits the checked value under the group name', () => {
    render(() => (
      <form data-testid="form">
        <RadioCardsRoot
          testId="group"
          name="plan"
          value="basic"
          onValueChange={noop}
        >
          <RadioCardsItem testId="ra" value="basic" />
          <RadioCardsItem testId="rb" value="pro" />
        </RadioCardsRoot>
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).get('plan')).toBe('basic');
  });

  it('does not clobber a same-name group in a sibling form', async () => {
    render(() => (
      <>
        <form data-testid="form-one">
          <RadioCardsRoot
            testId="group-one"
            name="plan"
            value="basic"
            onValueChange={noop}
          >
            <RadioCardsItem testId="one-basic" value="basic">
              Basic
            </RadioCardsItem>
            <RadioCardsItem testId="one-pro" value="pro">
              Pro
            </RadioCardsItem>
          </RadioCardsRoot>
        </form>
        <form data-testid="form-two">
          <RadioCardsRoot
            testId="group-two"
            name="plan"
            value="pro"
            onValueChange={noop}
          >
            <RadioCardsItem testId="two-basic" value="basic">
              Basic
            </RadioCardsItem>
            <RadioCardsItem testId="two-pro" value="pro">
              Pro
            </RadioCardsItem>
          </RadioCardsRoot>
        </form>
      </>
    ));

    // Click an item in group one (via its visible label — the hidden
    // input is clipped). The reconciliation must scope to group one
    // and leave group two's checked state alone.
    const formOne = screen.getByTestId('form-one');
    await userEvent.click(within(formOne).getByText('Pro'));
    expect(screen.getByTestId('two-pro')).toBeChecked();
    expect(screen.getByTestId('two-basic')).not.toBeChecked();
  });

  // --- Keyboard ---

  it('does not submit a wrapping form when Enter is pressed on an item', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(() => (
      <form data-testid="form" onSubmit={onSubmit}>
        <RadioCardsRoot
          testId="group"
          name="plan"
          value="a"
          onValueChange={noop}
        >
          <RadioCardsItem testId="ra" value="a" />
          <RadioCardsItem testId="rb" value="b" />
        </RadioCardsRoot>
        <button type="submit">Go</button>
      </form>
    ));

    screen.getByTestId('ra').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('lets onKeyDown consumers see Enter before suppression runs', async () => {
    const handler = vi.fn();
    render(() => (
      <RadioCardsRoot testId="group" name="plan" value="a" onValueChange={noop}>
        <RadioCardsItem testId="ra" value="a" onKeyDown={handler} />
      </RadioCardsRoot>
    ));

    screen.getByTestId('ra').focus();
    await userEvent.keyboard('{Enter}');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // --- Throws outside the root ---

  it('throws when an item is rendered outside RadioCardsRoot', () => {
    expect(() =>
      render(() => <RadioCardsItem testId="lone" value="a" />),
    ).toThrow(/outside of <RadioCardsRoot>/);
  });
});
