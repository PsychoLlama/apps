import { screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import ErrorBoundaryFallback from '../error-boundary/error-boundary';
import { renderWithAppShell } from './test-utils';

const mount = (error: unknown, reset?: () => void) => {
  return renderWithAppShell(() => (
    <ErrorBoundaryFallback error={error} reset={reset} />
  ));
};

describe('ErrorBoundaryFallback', () => {
  it('renders the hero heading and supporting copy', () => {
    mount(new Error('boom'));

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Something went wrong',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText(/couldn't render/i)).toBeInTheDocument();
  });

  it('wires up both recovery actions with the expected semantics', () => {
    mount(new Error('boom'));

    expect(
      screen.getByRole('button', { name: /Reload page/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Go home/ })).toHaveAttribute(
      'href',
      '/',
    );
  });

  it('exposes the name, message, and stack of an Error instance', () => {
    const err = new TypeError(
      "Cannot read properties of undefined (reading 'x')",
    );
    err.stack = 'TypeError: x\n    at thing (file.ts:1:1)';

    mount(err);

    expect(screen.getByText('Type').nextElementSibling).toHaveTextContent(
      'TypeError',
    );
    expect(screen.getByText('Message').nextElementSibling).toHaveTextContent(
      "Cannot read properties of undefined (reading 'x')",
    );
    expect(screen.getByText('Stack').nextElementSibling).toHaveTextContent(
      /at thing \(file\.ts:1:1\)/,
    );
  });

  it('falls back to "Unknown error" when an Error carries no message', () => {
    mount(new Error());

    expect(screen.getByText('Unknown error')).toBeInTheDocument();
  });

  it('omits the stack block when the Error has no stack trace', () => {
    const err = new Error('boom');
    err.stack = undefined;

    const { container } = mount(err);

    expect(container.querySelector('pre')).not.toBeInTheDocument();
  });

  it('normalizes non-Error throws into a generic name with stringified value', () => {
    const { container } = mount('literal string');

    expect(screen.getByText('Type').nextElementSibling).toHaveTextContent(
      'Error',
    );
    expect(screen.getByText('Message').nextElementSibling).toHaveTextContent(
      'literal string',
    );
    expect(container.querySelector('pre')).not.toBeInTheDocument();
  });

  it('calls reset() when the user clicks "Go home"', async () => {
    const user = userEvent.setup();
    const reset = vi.fn();
    mount(new Error('boom'), reset);

    await user.click(screen.getByRole('link', { name: /Go home/ }));

    expect(reset).toHaveBeenCalledOnce();
  });

  it('tolerates a missing reset callback', async () => {
    const user = userEvent.setup();
    mount(new Error('boom'));

    await user.click(screen.getByRole('link', { name: /Go home/ }));
  });
});
