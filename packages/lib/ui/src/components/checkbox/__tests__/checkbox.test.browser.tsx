import { render, screen } from '@solidjs/testing-library';
import { createSignal } from 'solid-js';
import { userEvent } from 'vitest/browser';
import Checkbox from '../checkbox';

const noop = () => {};

describe('Checkbox', () => {
  // --- DOM shape ---

  it('renders a native <input type="checkbox">', () => {
    render(() => (
      <Checkbox testId="cb" checked={false} onCheckedChange={noop} />
    ));
    const input = screen.getByTestId('cb');
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('type', 'checkbox');
  });

  it('wraps the input in a <label> when children are supplied', () => {
    render(() => (
      <Checkbox testId="cb" checked={false} onCheckedChange={noop}>
        Subscribe
      </Checkbox>
    ));
    const input = screen.getByTestId('cb');
    expect(input.parentElement?.tagName).toBe('LABEL');
    expect(input.parentElement).toHaveTextContent('Subscribe');
  });

  it('renders a bare input when no children are supplied', () => {
    render(() => (
      <Checkbox testId="cb" checked={false} onCheckedChange={noop} />
    ));
    expect(screen.getByTestId('cb').parentElement?.tagName).not.toBe('LABEL');
  });

  // --- Controlled state ---

  it('reflects checked={false} on the input', () => {
    render(() => (
      <Checkbox testId="cb" checked={false} onCheckedChange={noop} />
    ));
    expect(screen.getByTestId('cb')).not.toBeChecked();
  });

  it('reflects checked={true} on the input', () => {
    render(() => <Checkbox testId="cb" checked onCheckedChange={noop} />);
    expect(screen.getByTestId('cb')).toBeChecked();
  });

  it('exposes :indeterminate when checked is "indeterminate"', () => {
    render(() => (
      <Checkbox testId="cb" checked="indeterminate" onCheckedChange={noop} />
    ));
    const input = screen.getByTestId<HTMLInputElement>('cb');
    expect(input.indeterminate).toBe(true);
    expect(input.checked).toBe(false);
  });

  it('clears indeterminate when checked moves to true or false', () => {
    const Harness = () => {
      const [checked, setChecked] = createSignal<boolean | 'indeterminate'>(
        'indeterminate',
      );
      return (
        <>
          <Checkbox
            testId="cb"
            checked={checked()}
            onCheckedChange={setChecked}
          />
          <button data-testid="set-true" onClick={() => setChecked(true)} />
          <button data-testid="set-false" onClick={() => setChecked(false)} />
        </>
      );
    };
    render(() => <Harness />);
    const input = screen.getByTestId<HTMLInputElement>('cb');
    expect(input.indeterminate).toBe(true);

    screen.getByTestId('set-true').click();
    expect(input.indeterminate).toBe(false);
    expect(input.checked).toBe(true);

    screen.getByTestId('set-false').click();
    expect(input.indeterminate).toBe(false);
    expect(input.checked).toBe(false);
  });

  // --- Toggle ---

  it('fires onCheckedChange with the inverted value', async () => {
    const handler = vi.fn();
    render(() => (
      <Checkbox testId="cb" checked={false} onCheckedChange={handler} />
    ));
    await userEvent.click(screen.getByTestId('cb'));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('fires onCheckedChange with false when initially checked', async () => {
    const handler = vi.fn();
    render(() => <Checkbox testId="cb" checked onCheckedChange={handler} />);
    await userEvent.click(screen.getByTestId('cb'));
    expect(handler).toHaveBeenCalledWith(false);
  });

  it('emits true when toggling out of indeterminate', async () => {
    const handler = vi.fn();
    render(() => (
      <Checkbox testId="cb" checked="indeterminate" onCheckedChange={handler} />
    ));
    await userEvent.click(screen.getByTestId('cb'));
    expect(handler).toHaveBeenCalledWith(true);
  });

  it('reverts the visual state when the parent ignores the change', async () => {
    render(() => <Checkbox testId="cb" checked onCheckedChange={noop} />);
    await userEvent.click(screen.getByTestId('cb'));
    expect(screen.getByTestId('cb')).toBeChecked();
  });

  it('reverts to indeterminate when the parent ignores the change', async () => {
    render(() => (
      <Checkbox testId="cb" checked="indeterminate" onCheckedChange={noop} />
    ));
    await userEvent.click(screen.getByTestId('cb'));
    const input = screen.getByTestId<HTMLInputElement>('cb');
    expect(input.indeterminate).toBe(true);
    expect(input.checked).toBe(false);
  });

  // --- Disabled & required ---

  it('does not fire onCheckedChange when disabled', () => {
    const handler = vi.fn();
    render(() => (
      <Checkbox
        testId="cb"
        disabled
        checked={false}
        onCheckedChange={handler}
      />
    ));
    // Native `HTMLElement.click()` short-circuits on disabled form
    // controls per spec — exactly the behavior under test. Going
    // through `userEvent.click` instead would loop in Playwright's
    // actionability checks until the test timeout, racing it (15s
    // vs 15s) and intermittently failing on slow CI.
    const input = screen.getByTestId<HTMLInputElement>('cb');
    expect(input).toBeDisabled();
    input.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('marks the input as required when required is true', () => {
    render(() => (
      <Checkbox testId="cb" required checked={false} onCheckedChange={noop} />
    ));
    expect(screen.getByTestId('cb')).toBeRequired();
  });

  // --- Keyboard ---

  it('toggles via Space', async () => {
    const handler = vi.fn();
    render(() => (
      <Checkbox testId="cb" checked={false} onCheckedChange={handler} />
    ));
    screen.getByTestId('cb').focus();
    await userEvent.keyboard(' ');
    expect(handler).toHaveBeenLastCalledWith(true);
  });

  it('does not submit a wrapping form when Enter is pressed', async () => {
    const onSubmit = vi.fn((event: SubmitEvent) => event.preventDefault());
    render(() => (
      <form data-testid="form" onSubmit={onSubmit}>
        <Checkbox testId="cb" checked onCheckedChange={noop} />
        <button type="submit">Go</button>
      </form>
    ));

    screen.getByTestId('cb').focus();
    await userEvent.keyboard('{Enter}');
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it('lets onKeyDown consumers see Enter before suppression runs', async () => {
    const handler = vi.fn();
    render(() => (
      <Checkbox
        testId="cb"
        checked={false}
        onCheckedChange={noop}
        onKeyDown={handler}
      />
    ));
    screen.getByTestId('cb').focus();
    await userEvent.keyboard('{Enter}');
    expect(handler).toHaveBeenCalledTimes(1);
  });

  // --- Form integration ---

  it('submits its value under the input name when checked', () => {
    render(() => (
      <form data-testid="form">
        <Checkbox
          testId="cb"
          name="terms"
          value="accepted"
          checked
          onCheckedChange={noop}
        />
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).get('terms')).toBe('accepted');
  });

  it('omits the field from FormData when unchecked', () => {
    render(() => (
      <form data-testid="form">
        <Checkbox
          testId="cb"
          name="terms"
          checked={false}
          onCheckedChange={noop}
        />
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).get('terms')).toBeNull();
  });

  it('omits the field from FormData when indeterminate', () => {
    render(() => (
      <form data-testid="form">
        <Checkbox
          testId="cb"
          name="terms"
          checked="indeterminate"
          onCheckedChange={noop}
        />
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).get('terms')).toBeNull();
  });

  it('defaults the submitted value to "on"', () => {
    render(() => (
      <form data-testid="form">
        <Checkbox testId="cb" name="terms" checked onCheckedChange={noop} />
      </form>
    ));
    const form = screen.getByTestId<HTMLFormElement>('form');
    expect(new FormData(form).get('terms')).toBe('on');
  });
});
