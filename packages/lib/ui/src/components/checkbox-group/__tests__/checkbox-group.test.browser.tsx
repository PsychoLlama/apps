import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import { CheckboxGroupItem, CheckboxGroupRoot } from '../checkbox-group';

const noop = () => {};

describe('CheckboxGroup', () => {
  // --- DOM shape ---

  it('renders a <div role="group">', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={[]}
        onValueChange={noop}
      />
    ));
    const group = screen.getByTestId('group');
    expect(group.tagName).toBe('DIV');
    expect(group).toHaveAttribute('role', 'group');
  });

  it('forwards aria attributes to the group', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        aria-label="Notify me via"
        value={[]}
        onValueChange={noop}
      />
    ));
    expect(
      screen.getByRole('group', { name: 'Notify me via' }),
    ).toBeInTheDocument();
  });

  it('wraps a labeled item in a <label>', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={[]}
        onValueChange={noop}
      >
        <CheckboxGroupItem testId="email" value="email">
          Email
        </CheckboxGroupItem>
      </CheckboxGroupRoot>
    ));
    const input = screen.getByTestId('email');
    expect(input).toHaveAttribute('type', 'checkbox');
    expect(input.parentElement?.tagName).toBe('LABEL');
    expect(screen.getByLabelText('Email')).toBe(input);
  });

  it('renders a bare input when the item has no children', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={[]}
        onValueChange={noop}
      >
        <CheckboxGroupItem testId="email" value="email" />
      </CheckboxGroupRoot>
    ));
    expect(screen.getByTestId('email').parentElement).toBe(
      screen.getByTestId('group'),
    );
  });

  // --- Group wiring ---

  it('forwards `name` and `value` to every item', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={[]}
        onValueChange={noop}
      >
        <CheckboxGroupItem testId="a" value="a" />
        <CheckboxGroupItem testId="b" value="b" />
      </CheckboxGroupRoot>
    ));
    expect(screen.getByTestId('a')).toHaveAttribute('name', 'channels');
    expect(screen.getByTestId('a')).toHaveAttribute('value', 'a');
    expect(screen.getByTestId('b')).toHaveAttribute('name', 'channels');
    expect(screen.getByTestId('b')).toHaveAttribute('value', 'b');
  });

  it('checks every item whose value is in the group value array', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={['a', 'c']}
        onValueChange={noop}
      >
        <CheckboxGroupItem testId="a" value="a" />
        <CheckboxGroupItem testId="b" value="b" />
        <CheckboxGroupItem testId="c" value="c" />
      </CheckboxGroupRoot>
    ));
    expect(screen.getByTestId('a')).toBeChecked();
    expect(screen.getByTestId('b')).not.toBeChecked();
    expect(screen.getByTestId('c')).toBeChecked();
  });

  // --- Toggle ---

  it('emits the next array when toggling items via their labels', async () => {
    const handler = vi.fn();
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={['a']}
        onValueChange={handler}
      >
        <CheckboxGroupItem testId="a" value="a">
          A
        </CheckboxGroupItem>
        <CheckboxGroupItem testId="b" value="b">
          B
        </CheckboxGroupItem>
      </CheckboxGroupRoot>
    ));

    await userEvent.click(screen.getByText('B'));
    expect(handler).toHaveBeenLastCalledWith(['a', 'b']);

    await userEvent.click(screen.getByText('A'));
    expect(handler).toHaveBeenLastCalledWith([]);
  });

  it('reflects the new value through the group prop', async () => {
    const Harness = () => {
      const [value, setValue] = createSignal<string[]>([]);
      return (
        <CheckboxGroupRoot
          testId="group"
          name="channels"
          value={value()}
          onValueChange={setValue}
        >
          <CheckboxGroupItem testId="a" value="a">
            A
          </CheckboxGroupItem>
          <CheckboxGroupItem testId="b" value="b">
            B
          </CheckboxGroupItem>
        </CheckboxGroupRoot>
      );
    };
    render(() => <Harness />);

    await userEvent.click(screen.getByText('A'));
    await userEvent.click(screen.getByText('B'));
    expect(screen.getByTestId('a')).toBeChecked();
    expect(screen.getByTestId('b')).toBeChecked();

    await userEvent.click(screen.getByText('A'));
    expect(screen.getByTestId('a')).not.toBeChecked();
    expect(screen.getByTestId('b')).toBeChecked();
  });

  it('reverts the visual state when the parent ignores the change', async () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={['a']}
        onValueChange={noop}
      >
        <CheckboxGroupItem testId="a" value="a">
          A
        </CheckboxGroupItem>
        <CheckboxGroupItem testId="b" value="b">
          B
        </CheckboxGroupItem>
      </CheckboxGroupRoot>
    ));

    await userEvent.click(screen.getByText('B'));
    expect(screen.getByTestId('a')).toBeChecked();
    expect(screen.getByTestId('b')).not.toBeChecked();
  });

  it('toggles via Space on the focused checkbox', async () => {
    const handler = vi.fn();
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={[]}
        onValueChange={handler}
      >
        <CheckboxGroupItem testId="a" value="a" />
      </CheckboxGroupRoot>
    ));
    screen.getByTestId('a').focus();
    await userEvent.keyboard(' ');
    expect(handler).toHaveBeenCalledWith(['a']);
  });

  // --- Disabled / required ---

  it('disables every item and marks the group when disabled', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        disabled
        value={[]}
        onValueChange={noop}
      >
        <CheckboxGroupItem testId="a" value="a" />
        <CheckboxGroupItem testId="b" value="b" />
      </CheckboxGroupRoot>
    ));
    expect(screen.getByTestId('a')).toBeDisabled();
    expect(screen.getByTestId('b')).toBeDisabled();
    expect(screen.getByTestId('group')).toHaveAttribute('data-disabled', '');
  });

  it('lets a single item be disabled while others stay enabled', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        value={[]}
        onValueChange={noop}
      >
        <CheckboxGroupItem testId="a" value="a" />
        <CheckboxGroupItem testId="b" value="b" disabled />
      </CheckboxGroupRoot>
    ));
    expect(screen.getByTestId('a')).not.toBeDisabled();
    expect(screen.getByTestId('b')).toBeDisabled();
    expect(screen.getByTestId('group')).not.toHaveAttribute('data-disabled');
  });

  it('lets an item override the group `required` value', () => {
    render(() => (
      <CheckboxGroupRoot
        testId="group"
        name="channels"
        required
        value={[]}
        onValueChange={noop}
      >
        <CheckboxGroupItem testId="a" value="a" />
        <CheckboxGroupItem testId="b" value="b" required={false} />
      </CheckboxGroupRoot>
    ));
    expect(screen.getByTestId('a')).toBeRequired();
    expect(screen.getByTestId('b')).not.toBeRequired();
  });

  // --- Form integration ---

  it('submits each checked value under the group name', () => {
    render(() => (
      <form data-testid="form">
        <CheckboxGroupRoot
          testId="group"
          name="channels"
          value={['email', 'sms']}
          onValueChange={noop}
        >
          <CheckboxGroupItem testId="email" value="email" />
          <CheckboxGroupItem testId="push" value="push" />
          <CheckboxGroupItem testId="sms" value="sms" />
        </CheckboxGroupRoot>
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).getAll('channels')).toEqual(['email', 'sms']);
  });
});
