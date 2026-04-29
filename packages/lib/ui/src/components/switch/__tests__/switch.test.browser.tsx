import { render, screen } from '@solidjs/testing-library';
import { userEvent } from 'vitest/browser';
import Switch from '../switch';

describe('Switch', () => {
  // --- DOM shape & forwarding ---

  it('renders a <button role="switch">', () => {
    render(() => <Switch testId="sw" />);
    const button = screen.getByTestId('sw');
    expect(button.tagName).toBe('BUTTON');
    expect(button).toHaveAttribute('role', 'switch');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('forwards native button attributes', () => {
    render(() => <Switch testId="sw" aria-label="Wifi" disabled />);
    const button = screen.getByTestId('sw');
    expect(button).toHaveAttribute('aria-label', 'Wifi');
    expect(button).toBeDisabled();
  });

  it('renders a thumb child', () => {
    render(() => <Switch testId="sw" />);
    const button = screen.getByTestId('sw');
    expect(button.children).toHaveLength(1);
    expect(button.children[0].tagName).toBe('SPAN');
  });

  // --- State & ARIA ---

  it('starts unchecked by default', () => {
    render(() => <Switch testId="sw" />);
    expect(screen.getByTestId('sw')).toHaveAttribute('aria-checked', 'false');
  });

  it('respects defaultChecked', () => {
    render(() => <Switch testId="sw" defaultChecked />);
    expect(screen.getByTestId('sw')).toHaveAttribute('aria-checked', 'true');
  });

  it('toggles when clicked (uncontrolled)', async () => {
    render(() => <Switch testId="sw" />);
    const button = screen.getByTestId('sw');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-checked', 'true');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('forwards toggles to onCheckedChange in controlled mode', async () => {
    let last: boolean | undefined;
    render(() => (
      <Switch
        testId="sw"
        checked={false}
        onCheckedChange={(next) => (last = next)}
      />
    ));

    await userEvent.click(screen.getByTestId('sw'));
    expect(last).toBe(true);
  });

  it('does not update internal state when controlled and parent ignores onCheckedChange', async () => {
    render(() => <Switch testId="sw" checked={false} />);
    const button = screen.getByTestId('sw');

    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  it('fires onCheckedChange with the next state', async () => {
    const handler = vi.fn();
    render(() => <Switch testId="sw" onCheckedChange={handler} />);

    await userEvent.click(screen.getByTestId('sw'));
    expect(handler).toHaveBeenCalledWith(true);

    await userEvent.click(screen.getByTestId('sw'));
    expect(handler).toHaveBeenCalledWith(false);
  });

  it('lets onClick consumers suppress toggling via preventDefault', async () => {
    const onCheckedChange = vi.fn();
    render(() => (
      <Switch
        testId="sw"
        onClick={(event) => event.preventDefault()}
        onCheckedChange={onCheckedChange}
      />
    ));

    await userEvent.click(screen.getByTestId('sw'));
    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByTestId('sw')).toHaveAttribute('aria-checked', 'false');
  });

  it('does not toggle when disabled', async () => {
    const handler = vi.fn();
    render(() => <Switch testId="sw" disabled onCheckedChange={handler} />);

    await userEvent.click(screen.getByTestId('sw')).catch(() => {});
    expect(handler).not.toHaveBeenCalled();
    expect(screen.getByTestId('sw')).toHaveAttribute('aria-checked', 'false');
  });

  it('toggles via keyboard activation', async () => {
    render(() => <Switch testId="sw" />);
    const button = screen.getByTestId('sw');

    button.focus();
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-checked', 'true');

    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-checked', 'false');
  });

  // --- Form integration ---

  it('does not render the hidden input without a name', () => {
    render(() => (
      <form data-testid="form">
        <Switch testId="sw" defaultChecked />
      </form>
    ));
    const form = screen.getByTestId('form');
    expect(form.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('omits the hidden input when unchecked, even with a name', () => {
    render(() => (
      <form data-testid="form">
        <Switch testId="sw" name="wifi" />
      </form>
    ));
    const form = screen.getByTestId('form');
    expect(form.querySelector('input[type="hidden"]')).toBeNull();
  });

  it('renders the hidden input with name + value when checked', () => {
    render(() => (
      <form data-testid="form">
        <Switch testId="sw" name="wifi" defaultChecked />
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
        <Switch testId="sw" name="wifi" value="enabled" defaultChecked />
      </form>
    ));
    expect(
      screen.getByTestId('form').querySelector('input[type="hidden"]'),
    ).toHaveAttribute('value', 'enabled');
  });

  it('reflects toggling into FormData', async () => {
    render(() => (
      <form data-testid="form">
        <Switch testId="sw" name="wifi" />
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');

    expect(new FormData(form).get('wifi')).toBeNull();

    await userEvent.click(screen.getByTestId('sw'));
    expect(new FormData(form).get('wifi')).toBe('on');

    await userEvent.click(screen.getByTestId('sw'));
    expect(new FormData(form).get('wifi')).toBeNull();
  });
});
