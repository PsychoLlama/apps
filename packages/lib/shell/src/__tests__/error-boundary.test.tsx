import { MetaProvider } from '@solidjs/meta';
import { MemoryRouter, Route } from '@solidjs/router';
import { render } from 'solid-js/web';
import ErrorBoundaryFallback from '../error-boundary';

interface Mounted {
  container: HTMLDivElement;
  cleanup: () => void;
}

const mount = (error: unknown, reset?: () => void): Mounted => {
  const container = document.createElement('div');
  document.body.appendChild(container);

  const dispose = render(
    () => (
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
    ),
    container,
  );

  return {
    container,
    cleanup: () => {
      dispose();
      container.remove();
    },
  };
};

describe('ErrorBoundaryFallback', () => {
  let mounted: Mounted | null = null;

  afterEach(() => {
    mounted?.cleanup();
    mounted = null;
    vi.restoreAllMocks();
  });

  it('renders the hero heading and supporting copy', () => {
    mounted = mount(new Error('boom'));

    const heading = mounted.container.querySelector('h1');
    expect(heading?.textContent).toBe('Something went wrong');
    expect(mounted.container.textContent).toContain("couldn't render");
  });

  it('wires up both recovery actions with the expected semantics', () => {
    mounted = mount(new Error('boom'));

    const reload = mounted.container.querySelector<HTMLButtonElement>(
      '[data-testid="recover-reload"]',
    );
    const home = mounted.container.querySelector<HTMLAnchorElement>(
      '[data-testid="recover-home"]',
    );

    expect(reload?.tagName).toBe('BUTTON');
    expect(home?.tagName).toBe('A');
    expect(home?.getAttribute('href')).toBe('/');
  });

  it('exposes the name, message, and stack of an Error instance', () => {
    const err = new TypeError(
      "Cannot read properties of undefined (reading 'x')",
    );
    err.stack = 'TypeError: x\n    at thing (file.ts:1:1)';

    mounted = mount(err);

    expect(mounted.container.textContent).toContain('TypeError');
    expect(mounted.container.textContent).toContain(
      "Cannot read properties of undefined (reading 'x')",
    );
    expect(mounted.container.querySelector('pre')?.textContent).toContain(
      'at thing (file.ts:1:1)',
    );
  });

  it('falls back to "Unknown error" when an Error carries no message', () => {
    mounted = mount(new Error());

    expect(mounted.container.textContent).toContain('Unknown error');
  });

  it('omits the stack block when the Error has no stack trace', () => {
    const err = new Error('boom');
    err.stack = undefined;

    mounted = mount(err);

    expect(mounted.container.querySelector('pre')).toBeNull();
  });

  it('normalizes non-Error throws into a generic name with stringified value', () => {
    mounted = mount('literal string');

    expect(mounted.container.textContent).toContain('Error');
    expect(mounted.container.textContent).toContain('literal string');
    expect(mounted.container.querySelector('pre')).toBeNull();
  });

  const clickHome = (container: HTMLElement) => {
    const home = container.querySelector<HTMLAnchorElement>(
      '[data-testid="recover-home"]',
    );
    home?.dispatchEvent(
      new MouseEvent('click', { bubbles: true, cancelable: true }),
    );
  };

  it('calls reset() when the user clicks "Go home"', () => {
    const reset = vi.fn();
    mounted = mount(new Error('boom'), reset);

    clickHome(mounted.container);

    expect(reset).toHaveBeenCalledOnce();
  });

  it('tolerates a missing reset callback', () => {
    mounted = mount(new Error('boom'));

    expect(() => {
      clickHome(mounted!.container);
    }).not.toThrow();
  });

  it('requests a full page reload when the user clicks "Reload page"', () => {
    const reload = vi.fn();
    const originalLocation = window.location;
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...originalLocation, reload },
    });

    try {
      mounted = mount(new Error('boom'));
      mounted.container
        .querySelector<HTMLButtonElement>('[data-testid="recover-reload"]')
        ?.click();
      expect(reload).toHaveBeenCalledOnce();
    } finally {
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: originalLocation,
      });
    }
  });
});
