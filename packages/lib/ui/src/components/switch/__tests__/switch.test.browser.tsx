import { render, screen } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Switch from '../switch';

const noop = () => {};

describe('Switch', () => {
  // --- DOM shape & forwarding ---

  it('renders a <button role="switch">', () => {
    render(() => <Switch testId="sw" checked={false} onCheckedChange={noop} />);
    const button = screen.getByTestId('sw');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('role', 'switch');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('forwards native button attributes', () => {
    render(() => (
      <Switch
        testId="sw"
        aria-label="Wifi"
        disabled
        checked={false}
        onCheckedChange={noop}
      />
    ));
    const button = screen.getByTestId('sw');
    expect(button).toHaveAttribute('aria-label', 'Wifi');
    expect(button).toBeDisabled();
  });

  it('renders a thumb child', () => {
    render(() => <Switch testId="sw" checked={false} onCheckedChange={noop} />);
    const button = screen.getByTestId('sw');
    expect(button.children).toHaveLength(1);
    expect(button.children[0].tagName).toBe('SPAN');
  });

  // --- ARIA & state forwarding ---

  it('reflects checked={false} in aria-checked', () => {
    render(() => <Switch testId="sw" checked={false} onCheckedChange={noop} />);
    expect(screen.getByTestId('sw')).toHaveAttribute('aria-checked', 'false');
  });

  it('reflects checked={true} in aria-checked', () => {
    render(() => <Switch testId="sw" checked onCheckedChange={noop} />);
    expect(screen.getByTestId('sw')).toHaveAttribute('aria-checked', 'true');
  });

  it('does not change state on click — parent owns the value', async () => {
    render(() => <Switch testId="sw" checked={false} onCheckedChange={noop} />);
    const button = screen.getByTestId('sw');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('fires onCheckedChange with the inverted value', async () => {
    const handler = vi.fn();
    render(() => (
      <Switch testId="sw" checked={false} onCheckedChange={handler} />
    ));

    await userEvent.click(screen.getByTestId('sw'));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('fires onCheckedChange with the inverted value when initially checked', async () => {
    const handler = vi.fn();
    render(() => <Switch testId="sw" checked onCheckedChange={handler} />);

    await userEvent.click(screen.getByTestId('sw'));
    expect(handler).toHaveBeenCalledWith(false);
  });

  it('lets onClick consumers suppress toggling via preventDefault', async () => {
    const onCheckedChange = vi.fn();
    render(() => (
      <Switch
        testId="sw"
        checked={false}
        onClick={(event) => event.preventDefault()}
        onCheckedChange={onCheckedChange}
      />
    ));

    await userEvent.click(screen.getByTestId('sw'));
    expect(onCheckedChange).not.toHaveBeenCalled();
  });

  it('does not fire onCheckedChange when disabled', async () => {
    const handler = vi.fn();
    render(() => (
      <Switch testId="sw" disabled checked={false} onCheckedChange={handler} />
    ));

    await userEvent.click(screen.getByTestId('sw')).catch(() => {});
    expect(handler).not.toHaveBeenCalled();
  });

  it('toggles via keyboard activation', async () => {
    const handler = vi.fn();
    render(() => (
      <Switch testId="sw" checked={false} onCheckedChange={handler} />
    ));

    screen.getByTestId('sw').focus();
    await userEvent.keyboard(' ');
    expect(handler).toHaveBeenLastCalledWith(true);

    await userEvent.keyboard('{Enter}');
    expect(handler).toHaveBeenCalledTimes(2);
  });

  // --- Form integration ---

  it('does not render the hidden input without a name', () => {
    render(() => (
      <form data-testid="form">
        <Switch testId="sw" checked onCheckedChange={noop} />
      </form>
    ));
    const form = screen.getByTestId('form');
    expect(form.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('omits the hidden input when unchecked, even with a name', () => {
    render(() => (
      <form data-testid="form">
        <Switch
          testId="sw"
          name="wifi"
          checked={false}
          onCheckedChange={noop}
        />
      </form>
    ));
    const form = screen.getByTestId('form');
    expect(form.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('renders the hidden input with name + value when checked', () => {
    render(() => (
      <form data-testid="form">
        <Switch testId="sw" name="wifi" checked onCheckedChange={noop} />
      </form>
    ));
    const input = screen
      .getByTestId('form')
      .querySelector('input[type="hidden"]')!;
    expect(input).toHaveAttribute('name', 'wifi');
    expect(input).toHaveAttribute('value', 'on');
  });

  it('uses a custom value when provided', () => {
    render(() => (
      <form data-testid="form">
        <Switch
          testId="sw"
          name="wifi"
          value="enabled"
          checked
          onCheckedChange={noop}
        />
      </form>
    ));
    expect(
      screen.getByTestId('form').querySelector('input[type="hidden"]'),
    ).toHaveAttribute('value', 'enabled');
  });

  it('omits the hidden input when checked but disabled', () => {
    render(() => (
      <form data-testid="form">
        <Switch
          testId="sw"
          name="wifi"
          disabled
          checked
          onCheckedChange={noop}
        />
      </form>
    ));
    expect(
      screen.getByTestId('form').querySelector('input[type="hidden"]'),
    ).toBeNull();
  });

  it('forwards the form attribute to the hidden input', () => {
    render(() => (
      <>
        <form id="external" data-testid="external" />
        <Switch
          testId="sw"
          name="wifi"
          checked
          onCheckedChange={noop}
          form="external"
        />
      </>
    ));
    expect(screen.getByTestId('sw')).toHaveAttribute('form', 'external');
    const hidden = document.querySelector('input[type="hidden"][name="wifi"]')!;
    expect(hidden).toHaveAttribute('form', 'external');
  });
});
