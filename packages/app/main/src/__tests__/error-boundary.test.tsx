import { MetaProvider } from '@solidjs/meta';
import { MemoryRouter, Route } from '@solidjs/router';
import { render, screen } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import ErrorBoundaryFallback from '../error-boundary/error-boundary';

const mount = (error: unknown, reset?: () => void) => {
  return render(() => (
    <MetaProvider>
      <MemoryRouter>
        <Route
          path="*"
          component={() => (
            <ErrorBoundaryFallback error={error} reset={reset} />
          )}
        />
      </MemoryRouter>
    </MetaProvider>
  ));
};

describe('ErrorBoundaryFallback', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the hero heading and supporting copy', () => {
    mount(new Error('boom'));

    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Something went wrong',
      }),
    ).toBeTruthy();
    expect(screen.getByText(/couldn't render/i)).toBeTruthy();
  });

  it('wires up both recovery actions with the expected semantics', () => {
    mount(new Error('boom'));

    expect(screen.getByRole('button', { name: /Reload page/ })).toBeTruthy();
    const home = screen.getByRole('link', { name: /Go home/ });
    expect(home.getAttribute('href')).toBe('/');
  });

  it('exposes the name, message, and stack of an Error instance', () => {
    const err = new TypeError(
      "Cannot read properties of undefined (reading 'x')",
    );
    err.stack = 'TypeError: x\n    at thing (file.ts:1:1)';

    const result = mount(err);

    expect(
      screen.getByRole('heading', { level: 2, name: 'TypeError' }),
    ).toBeTruthy();
    expect(
      screen.getByText("Cannot read properties of undefined (reading 'x')"),
    ).toBeTruthy();
    expect(result.container.querySelector('pre')?.textContent).toContain(
      'at thing (file.ts:1:1)',
    );
  });

  it('falls back to "Unknown error" when an Error carries no message', () => {
    mount(new Error());

    expect(screen.getByText('Unknown error')).toBeTruthy();
  });

  it('omits the stack block when the Error has no stack trace', () => {
    const err = new Error('boom');
    err.stack = undefined;

    const result = mount(err);

    expect(result.container.querySelector('pre')).toBeNull();
  });

  it('normalizes non-Error throws into a generic name with stringified value', () => {
    const result = mount('literal string');

    expect(
      screen.getByRole('heading', { level: 2, name: 'Error' }),
    ).toBeTruthy();
    expect(screen.getByText('literal string')).toBeTruthy();
    expect(result.container.querySelector('pre')).toBeNull();
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

  it('requests a full page reload when the user clicks "Reload page"', async () => {
    const user = userEvent.setup();
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });

    try {
      mount(new Error('boom'));
      await user.click(screen.getByRole('button', { name: /Reload page/ }));
      expect(reload).toHaveBeenCalledOnce();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
