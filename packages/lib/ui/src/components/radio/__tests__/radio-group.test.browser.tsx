import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import { RadioGroupItem, RadioGroupRoot } from '../radio-group';

const noop = () => {};

describe('RadioGroup', () => {
  // --- DOM shape ---

  it('renders a <div role="radiogroup">', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={noop}
      />
    ));
    const group = screen.getByTestId('group');
    expect(group.tagName).toBe('DIV');
    expect(group).toHaveAttribute('role', 'radiogroup');
  });

  it('wraps the radio in a <label> when an item has children', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={noop}
      >
        <RadioGroupItem testId="apple" value="apple">
          Apple
        </RadioGroupItem>
      </RadioGroupRoot>
    ));
    const input = screen.getByTestId('apple');
    expect(input.tagName).toBe('INPUT');
    expect(input.parentElement?.tagName).toBe('LABEL');
    expect(input.parentElement).toHaveTextContent('Apple');
  });

  it('renders a bare input when an item has no children', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={noop}
      >
        <RadioGroupItem testId="apple" value="apple" />
      </RadioGroupRoot>
    ));
    const input = screen.getByTestId('apple');
    expect(input.tagName).toBe('INPUT');
    expect(input.parentElement?.tagName).toBe('DIV');
  });

  // --- Group wiring ---

  it('forwards `name` to every item', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={noop}
      >
        <RadioGroupItem testId="ra" value="a" />
        <RadioGroupItem testId="rb" value="b" />
      </RadioGroupRoot>
    ));
    expect(screen.getByTestId('ra')).toHaveAttribute('name', 'fruit');
    expect(screen.getByTestId('rb')).toHaveAttribute('name', 'fruit');
  });

  it('checks only the item whose value matches the group value', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value="b"
        onValueChange={noop}
      >
        <RadioGroupItem testId="ra" value="a" />
        <RadioGroupItem testId="rb" value="b" />
        <RadioGroupItem testId="rc" value="c" />
      </RadioGroupRoot>
    ));
    expect(screen.getByTestId('ra')).not.toBeChecked();
    expect(screen.getByTestId('rb')).toBeChecked();
    expect(screen.getByTestId('rc')).not.toBeChecked();
  });

  it('renders no item checked when value is null', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={noop}
      >
        <RadioGroupItem testId="ra" value="a" />
        <RadioGroupItem testId="rb" value="b" />
      </RadioGroupRoot>
    ));
    expect(screen.getByTestId('ra')).not.toBeChecked();
    expect(screen.getByTestId('rb')).not.toBeChecked();
  });

  // --- Selection ---

  it('fires onValueChange with the clicked item value', async () => {
    const handler = vi.fn();
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={handler}
      >
        <RadioGroupItem testId="ra" value="a" />
        <RadioGroupItem testId="rb" value="b" />
      </RadioGroupRoot>
    ));

    await userEvent.click(screen.getByTestId('rb'));
    expect(handler).toHaveBeenCalledWith('b');
  });

  it('reflects the new value through the group prop', async () => {
    const Harness = () => {
      const [value, setValue] = createSignal<string | null>(null);
      return (
        <RadioGroupRoot
          testId="group"
          name="fruit"
          value={value()}
          onValueChange={setValue}
        >
          <RadioGroupItem testId="ra" value="a" />
          <RadioGroupItem testId="rb" value="b" />
        </RadioGroupRoot>
      );
    };
    render(() => <Harness />);

    await userEvent.click(screen.getByTestId('rb'));
    expect(screen.getByTestId('rb')).toBeChecked();
    expect(screen.getByTestId('ra')).not.toBeChecked();

    await userEvent.click(screen.getByTestId('ra'));
    expect(screen.getByTestId('ra')).toBeChecked();
    expect(screen.getByTestId('rb')).not.toBeChecked();
  });

  it('reverts the visual state when the parent ignores the change', async () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value="a"
        onValueChange={noop}
      >
        <RadioGroupItem testId="ra" value="a" />
        <RadioGroupItem testId="rb" value="b" />
      </RadioGroupRoot>
    ));

    await userEvent.click(screen.getByTestId('rb'));
    expect(screen.getByTestId('ra')).toBeChecked();
    expect(screen.getByTestId('rb')).not.toBeChecked();
  });

  // --- Disabled state ---

  it('disables every item when the group is disabled', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        disabled
        value={null}
        onValueChange={noop}
      >
        <RadioGroupItem testId="ra" value="a" />
        <RadioGroupItem testId="rb" value="b" />
      </RadioGroupRoot>
    ));
    expect(screen.getByTestId('ra')).toBeDisabled();
    expect(screen.getByTestId('rb')).toBeDisabled();
  });

  it('exposes data-disabled on the group when disabled', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
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
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).not.toHaveAttribute('data-disabled');
  });

  it('lets a single item be disabled while others stay enabled', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={noop}
      >
        <RadioGroupItem testId="ra" value="a" />
        <RadioGroupItem testId="rb" value="b" disabled />
      </RadioGroupRoot>
    ));
    expect(screen.getByTestId('ra')).not.toBeDisabled();
    expect(screen.getByTestId('rb')).toBeDisabled();
  });

  // --- Required ---

  it('exposes aria-required on the group when required', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
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
      <RadioGroupRoot
        testId="group"
        name="fruit"
        required
        value={null}
        onValueChange={noop}
      >
        <RadioGroupItem testId="ra" value="a" />
        <RadioGroupItem testId="rb" value="b" />
      </RadioGroupRoot>
    ));
    expect(screen.getByTestId('ra')).toBeRequired();
    expect(screen.getByTestId('rb')).toBeRequired();
  });

  // --- Form integration ---

  it('submits the checked value under the group name', () => {
    render(() => (
      <form data-testid="form">
        <RadioGroupRoot
          testId="group"
          name="fruit"
          value="apple"
          onValueChange={noop}
        >
          <RadioGroupItem testId="ra" value="apple" />
          <RadioGroupItem testId="rb" value="banana" />
        </RadioGroupRoot>
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).get('fruit')).toBe('apple');
  });

  it('does not clobber a same-name group in a sibling form', async () => {
    render(() => (
      <>
        <form data-testid="form-one">
          <RadioGroupRoot
            testId="group-one"
            name="fruit"
            value="apple"
            onValueChange={noop}
          >
            <RadioGroupItem testId="one-apple" value="apple" />
            <RadioGroupItem testId="one-banana" value="banana" />
          </RadioGroupRoot>
        </form>
        <form data-testid="form-two">
          <RadioGroupRoot
            testId="group-two"
            name="fruit"
            value="banana"
            onValueChange={noop}
          >
            <RadioGroupItem testId="two-apple" value="apple" />
            <RadioGroupItem testId="two-banana" value="banana" />
          </RadioGroupRoot>
        </form>
      </>
    ));

    // Click an item in group one. The reconciliation must scope to
    // group one's root and leave group two's checked state alone.
    await userEvent.click(screen.getByTestId('one-banana'));
    expect(screen.getByTestId('two-banana')).toBeChecked();
    expect(screen.getByTestId('two-apple')).not.toBeChecked();
  });

  // --- Orientation ---

  it('defaults to vertical orientation', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value={null}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });

  it('forwards horizontal orientation', () => {
    render(() => (
      <RadioGroupRoot
        testId="group"
        name="fruit"
        orientation="horizontal"
        value={null}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).toHaveAttribute(
      'aria-orientation',
      'horizontal',
    );
  });

  // --- Keyboard ---

  it('does not submit a wrapping form when Enter is pressed on an item', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(() => (
      <form data-testid="form" onSubmit={onSubmit}>
        <RadioGroupRoot
          testId="group"
          name="fruit"
          value="a"
          onValueChange={noop}
        >
          <RadioGroupItem testId="ra" value="a" />
          <RadioGroupItem testId="rb" value="b" />
        </RadioGroupRoot>
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
      <RadioGroupRoot
        testId="group"
        name="fruit"
        value="a"
        onValueChange={noop}
      >
        <RadioGroupItem testId="ra" value="a" onKeyDown={handler} />
      </RadioGroupRoot>
    ));

    screen.getByTestId('ra').focus();
    await userEvent.keyboard('{Enter}');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // --- Throws outside the root ---

  it('throws when an item is rendered outside RadioGroupRoot', () => {
    expect(() =>
      render(() => <RadioGroupItem testId="lone" value="a" />),
    ).toThrow(/outside of <RadioGroupRoot>/);
  });
});
