import { render, screen, within } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import { CheckboxCardsItem, CheckboxCardsRoot } from '../checkbox-cards';

const noop = () => {};

describe('CheckboxCards', () => {
  // --- DOM shape ---

  it('renders a <div role="group">', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={[]}
        onValueChange={noop}
      />
    ));
    const group = screen.getByTestId('group');
    expect(group.tagName).toBe('DIV');
    expect(group).toHaveAttribute('role', 'group');
  });

  it('wraps each item in a <label> containing the inner checkbox input', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={[]}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="basic" value="basic">
          Basic
        </CheckboxCardsItem>
      </CheckboxCardsRoot>
    ));
    const input = screen.getByTestId('basic');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input.parentElement?.tagName).toBe('LABEL');
    expect(input.parentElement).toHaveTextContent('Basic');
  });

  // --- Group wiring ---

  it('forwards `name` to every item', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={[]}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="a" />
        <CheckboxCardsItem testId="cb" value="b" />
      </CheckboxCardsRoot>
    ));
    expect(screen.getByTestId('ca')).toHaveAttribute('name', 'features');
    expect(screen.getByTestId('cb')).toHaveAttribute('name', 'features');
  });

  it('checks every item whose value is in the group value array', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={['a', 'c']}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="a" />
        <CheckboxCardsItem testId="cb" value="b" />
        <CheckboxCardsItem testId="cc" value="c" />
      </CheckboxCardsRoot>
    ));
    expect(screen.getByTestId('ca')).toBeChecked();
    expect(screen.getByTestId('cb')).not.toBeChecked();
    expect(screen.getByTestId('cc')).toBeChecked();
  });

  it('renders no item checked when value is empty', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={[]}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="a" />
        <CheckboxCardsItem testId="cb" value="b" />
      </CheckboxCardsRoot>
    ));
    expect(screen.getByTestId('ca')).not.toBeChecked();
    expect(screen.getByTestId('cb')).not.toBeChecked();
  });

  // --- Toggle ---

  it('emits the next array adding the value when clicking an unchecked card', async () => {
    const handler = vi.fn();
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={['a']}
        onValueChange={handler}
      >
        <CheckboxCardsItem testId="ca" value="a">
          A
        </CheckboxCardsItem>
        <CheckboxCardsItem testId="cb" value="b">
          B
        </CheckboxCardsItem>
      </CheckboxCardsRoot>
    ));

    // Click the visible card body, not the inner checkbox — the label
    // proxies the click to the wrapped input.
    await userEvent.click(screen.getByText('B'));
    expect(handler).toHaveBeenCalledWith(['a', 'b']);
  });

  it('emits the next array removing the value when clicking a checked card', async () => {
    const handler = vi.fn();
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={['a', 'b']}
        onValueChange={handler}
      >
        <CheckboxCardsItem testId="ca" value="a">
          A
        </CheckboxCardsItem>
        <CheckboxCardsItem testId="cb" value="b">
          B
        </CheckboxCardsItem>
      </CheckboxCardsRoot>
    ));

    await userEvent.click(screen.getByText('A'));
    expect(handler).toHaveBeenCalledWith(['b']);
  });

  it('reflects the new value through the group prop', async () => {
    const Harness = () => {
      const [value, setValue] = createSignal<string[]>([]);
      return (
        <CheckboxCardsRoot
          testId="group"
          name="features"
          value={value()}
          onValueChange={setValue}
        >
          <CheckboxCardsItem testId="ca" value="a">
            A
          </CheckboxCardsItem>
          <CheckboxCardsItem testId="cb" value="b">
            B
          </CheckboxCardsItem>
        </CheckboxCardsRoot>
      );
    };
    render(() => <Harness />);

    await userEvent.click(screen.getByText('A'));
    expect(screen.getByTestId('ca')).toBeChecked();
    expect(screen.getByTestId('cb')).not.toBeChecked();

    await userEvent.click(screen.getByText('B'));
    expect(screen.getByTestId('ca')).toBeChecked();
    expect(screen.getByTestId('cb')).toBeChecked();

    await userEvent.click(screen.getByText('A'));
    expect(screen.getByTestId('ca')).not.toBeChecked();
    expect(screen.getByTestId('cb')).toBeChecked();
  });

  it('reverts the visual state when the parent ignores the change', async () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={['a']}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="a">
          A
        </CheckboxCardsItem>
        <CheckboxCardsItem testId="cb" value="b">
          B
        </CheckboxCardsItem>
      </CheckboxCardsRoot>
    ));

    await userEvent.click(screen.getByText('B'));
    expect(screen.getByTestId('ca')).toBeChecked();
    expect(screen.getByTestId('cb')).not.toBeChecked();
  });

  // --- Disabled state ---

  it('disables every item when the group is disabled', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        disabled
        value={[]}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="a" />
        <CheckboxCardsItem testId="cb" value="b" />
      </CheckboxCardsRoot>
    ));
    expect(screen.getByTestId('ca')).toBeDisabled();
    expect(screen.getByTestId('cb')).toBeDisabled();
  });

  it('exposes data-disabled on the group when disabled', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        disabled
        value={[]}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).toHaveAttribute('data-disabled', '');
    expect(screen.getByTestId('group')).not.toHaveAttribute('aria-disabled');
  });

  it('omits data-disabled on the group when enabled', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={[]}
        onValueChange={noop}
      />
    ));
    expect(screen.getByTestId('group')).not.toHaveAttribute('data-disabled');
  });

  it('lets a single item be disabled while others stay enabled', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={[]}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="a" />
        <CheckboxCardsItem testId="cb" value="b" disabled />
      </CheckboxCardsRoot>
    ));
    expect(screen.getByTestId('ca')).not.toBeDisabled();
    expect(screen.getByTestId('cb')).toBeDisabled();
  });

  // --- Required ---

  it('marks every item as required when the group is required', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        required
        value={[]}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="a" />
        <CheckboxCardsItem testId="cb" value="b" />
      </CheckboxCardsRoot>
    ));
    expect(screen.getByTestId('ca')).toBeRequired();
    expect(screen.getByTestId('cb')).toBeRequired();
  });

  it('lets an item override the group `required` value', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        required
        value={[]}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="a" />
        <CheckboxCardsItem testId="cb" value="b" required={false} />
      </CheckboxCardsRoot>
    ));
    expect(screen.getByTestId('ca')).toBeRequired();
    expect(screen.getByTestId('cb')).not.toBeRequired();
  });

  // --- Form integration ---

  it('submits each checked value under the group name', () => {
    render(() => (
      <form data-testid="form">
        <CheckboxCardsRoot
          testId="group"
          name="features"
          value={['basic', 'pro']}
          onValueChange={noop}
        >
          <CheckboxCardsItem testId="ca" value="basic" />
          <CheckboxCardsItem testId="cb" value="pro" />
          <CheckboxCardsItem testId="cc" value="enterprise" />
        </CheckboxCardsRoot>
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).getAll('features')).toEqual(['basic', 'pro']);
  });

  it('omits unchecked items from FormData', () => {
    render(() => (
      <form data-testid="form">
        <CheckboxCardsRoot
          testId="group"
          name="features"
          value={[]}
          onValueChange={noop}
        >
          <CheckboxCardsItem testId="ca" value="basic" />
          <CheckboxCardsItem testId="cb" value="pro" />
        </CheckboxCardsRoot>
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).getAll('features')).toEqual([]);
  });

  it('does not clobber a same-name group in a sibling form', async () => {
    const oneHandler = vi.fn();
    const twoHandler = vi.fn();
    render(() => (
      <>
        <form data-testid="form-one">
          <CheckboxCardsRoot
            testId="group-one"
            name="features"
            value={['basic']}
            onValueChange={oneHandler}
          >
            <CheckboxCardsItem testId="one-basic" value="basic">
              Basic
            </CheckboxCardsItem>
            <CheckboxCardsItem testId="one-pro" value="pro">
              Pro
            </CheckboxCardsItem>
          </CheckboxCardsRoot>
        </form>
        <form data-testid="form-two">
          <CheckboxCardsRoot
            testId="group-two"
            name="features"
            value={['pro']}
            onValueChange={twoHandler}
          >
            <CheckboxCardsItem testId="two-basic" value="basic">
              Basic
            </CheckboxCardsItem>
            <CheckboxCardsItem testId="two-pro" value="pro">
              Pro
            </CheckboxCardsItem>
          </CheckboxCardsRoot>
        </form>
      </>
    ));

    // Toggling a card in one group must not change the other group's
    // checked state — checkboxes don't share radio's name-grouping
    // mutual exclusion, but a regression in our reconcile path would
    // still be worth catching.
    const formOne = screen.getByTestId('form-one');
    await userEvent.click(within(formOne).getByText('Pro'));
    expect(oneHandler).toHaveBeenCalledWith(['basic', 'pro']);
    expect(twoHandler).not.toHaveBeenCalled();
    expect(screen.getByTestId('two-basic')).not.toBeChecked();
    expect(screen.getByTestId('two-pro')).toBeChecked();
  });

  // --- Keyboard ---

  it('toggles via Space on the focused checkbox', async () => {
    const handler = vi.fn();
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        value={[]}
        onValueChange={handler}
      >
        <CheckboxCardsItem testId="ca" value="a" />
      </CheckboxCardsRoot>
    ));

    screen.getByTestId('ca').focus();
    await userEvent.keyboard(' ');
    expect(handler).toHaveBeenCalledWith(['a']);
  });

  it('does not submit a wrapping form when Enter is pressed on an item', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(() => (
      <form data-testid="form" onSubmit={onSubmit}>
        <CheckboxCardsRoot
          testId="group"
          name="features"
          value={['a']}
          onValueChange={noop}
        >
          <CheckboxCardsItem testId="ca" value="a" />
          <CheckboxCardsItem testId="cb" value="b" />
        </CheckboxCardsRoot>
        <button type="submit">Go</button>
      </form>
    ));

    screen.getByTestId('ca').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  // --- Skeleton ---

  it('makes the group inert while skeleton is on', () => {
    render(() => (
      <CheckboxCardsRoot
        testId="group"
        name="features"
        skeleton
        value={['basic']}
        onValueChange={noop}
      >
        <CheckboxCardsItem testId="ca" value="basic" />
      </CheckboxCardsRoot>
    ));
    const group = screen.getByTestId('group');
    expect(group).toHaveAttribute('inert');
    expect(group).toHaveAttribute('aria-hidden', 'true');
    expect(group).toHaveAttribute('tabindex', '-1');
  });

  // --- Throws outside the root ---

  it('throws when an item is rendered outside CheckboxCardsRoot', () => {
    expect(() =>
      render(() => <CheckboxCardsItem testId="lone" value="a" />),
    ).toThrow(/outside of <CheckboxCardsRoot>/);
  });
});
