import { render, screen } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Radio from '../radio';

const noop = () => {};

describe('Radio', () => {
  // --- DOM shape & forwarding ---

  it('renders a native <input type="radio">', () => {
    render(() => <Radio testId="r" checked={false} onCheckedChange={noop} />);
    const input = screen.getByTestId('r');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'radio');
  });

  it('forwards native input attributes', () => {
    render(() => (
      <Radio
        testId="r"
        aria-label="Apple"
        name="fruit"
        value="apple"
        disabled
        checked={false}
        onCheckedChange={noop}
      />
    ));
    const input = screen.getByTestId('r');
    expect(input).toHaveAttribute('aria-label', 'Apple');
    expect(input).toHaveAttribute('name', 'fruit');
    expect(input).toHaveAttribute('value', 'apple');
    expect(input).toBeDisabled();
  });

  // --- State forwarding ---

  it('reflects checked={true}', () => {
    render(() => <Radio testId="r" checked onCheckedChange={noop} />);
    expect(screen.getByTestId('r')).toBeChecked();
  });

  it('reflects checked={false}', () => {
    render(() => <Radio testId="r" checked={false} onCheckedChange={noop} />);
    expect(screen.getByTestId('r')).not.toBeChecked();
  });

  it('fires onCheckedChange(true) when clicked unchecked', async () => {
    const handler = vi.fn();
    render(() => (
      <Radio testId="r" checked={false} onCheckedChange={handler} />
    ));

    await userEvent.click(screen.getByTestId('r'));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('does not fire onCheckedChange when re-clicked while already checked', async () => {
    const handler = vi.fn();
    render(() => <Radio testId="r" checked onCheckedChange={handler} />);

    await userEvent.click(screen.getByTestId('r'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('reverts to the controlled value when the parent ignores the change', async () => {
    render(() => <Radio testId="r" checked={false} onCheckedChange={noop} />);
    const input = screen.getByTestId<HTMLInputElement>('r');

    await userEvent.click(input);
    // Parent never updated state, so the controlled prop wins and the
    // input bounces back to unchecked.
    expect(input.checked).toBe(false);
  });

  it('passes the change event to the consumer onChange handler', async () => {
    const consumer = vi.fn();
    render(() => (
      <Radio
        testId="r"
        checked={false}
        onChange={consumer}
        onCheckedChange={noop}
      />
    ));

    await userEvent.click(screen.getByTestId('r'));
    expect(consumer).toHaveBeenCalledTimes(1);
  });

  it('does not fire onCheckedChange when disabled', async () => {
    const handler = vi.fn();
    render(() => (
      <Radio testId="r" disabled checked={false} onCheckedChange={handler} />
    ));

    await userEvent.click(screen.getByTestId('r')).catch(() => {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('fires onCheckedChange when activated via keyboard', async () => {
    const handler = vi.fn();
    render(() => (
      <Radio testId="r" checked={false} onCheckedChange={handler} />
    ));

    screen.getByTestId('r').focus();
    await userEvent.keyboard(' ');
    expect(handler).toHaveBeenCalledWith(true);
  });

  // --- Form integration ---

  it('submits its value when checked inside a form', () => {
    render(() => (
      <form data-testid="form">
        <Radio
          testId="r"
          name="fruit"
          value="apple"
          checked
          onCheckedChange={noop}
        />
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    const data = new FormData(form);
    expect(data.get('fruit')).toBe('apple');
  });

  it('omits its value from FormData when unchecked', () => {
    render(() => (
      <form data-testid="form">
        <Radio
          testId="r"
          name="fruit"
          value="apple"
          checked={false}
          onCheckedChange={noop}
        />
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).get('fruit')).toBeNull();
  });
});
