import { createTestController } from '@lib/effects/testing';
import {
  COLOR_SCHEME_ATTRIBUTE,
  COLOR_SCHEME_STORAGE_KEY,
} from '../../constants';
import { $colorScheme, $selectColorScheme } from '../color-scheme';

// MutationObserver records arrive in a microtask.
const flush = () => new Promise<void>((resolve) => queueMicrotask(resolve));

beforeEach(() => {
  delete document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
  localStorage.clear();
});

describe('$colorScheme', () => {
  it('starts from the attribute the prelude stamped', async () => {
    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'dark';
    await using effects = createTestController();

    const [colorScheme] = await effects.run($colorScheme);

    expect(colorScheme()).toBe('dark');
  });

  it("reads 'system' when there's no override", async () => {
    await using effects = createTestController();

    const [colorScheme] = await effects.run($colorScheme);

    expect(colorScheme()).toBe('system');
  });

  it('follows later changes to the attribute', async () => {
    await using effects = createTestController();
    const [colorScheme] = await effects.run($colorScheme);

    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'light';
    await flush();
    expect(colorScheme()).toBe('light');

    delete document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE];
    await flush();
    expect(colorScheme()).toBe('system');
  });

  it('stops following once released', async () => {
    const effects = createTestController();
    const [colorScheme] = await effects.run($colorScheme);
    await effects[Symbol.asyncDispose]();

    document.documentElement.dataset[COLOR_SCHEME_ATTRIBUTE] = 'dark';
    await flush();

    expect(colorScheme()).toBe('system');
  });
});

describe('$selectColorScheme', () => {
  it('writes the override through, echoing into $colorScheme', async () => {
    await using effects = createTestController();
    const [colorScheme] = await effects.run($colorScheme);
    const [selectColorScheme] = await effects.run($selectColorScheme);

    selectColorScheme('dark');
    await flush();

    expect(colorScheme()).toBe('dark');
    expect(localStorage.getItem(COLOR_SCHEME_STORAGE_KEY)).toBe('dark');
  });
});
